import os
import logging
import tempfile
import os
from flask import Flask, jsonify, request, send_from_directory
from dotenv import load_dotenv
from backend.api.health import health_bp
from knowledge.knowledge_retriever import search_knowledge
from flight_log_parser import parse_flight_log
# Set up simple logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='app', static_url_path='')

# Register Blueprints
app.register_blueprint(health_bp, url_prefix='/api')

# --- Gemini Configuration ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

genai_client = None
if GEMINI_API_KEY and GEMINI_API_KEY.strip() and GEMINI_API_KEY.strip() != "your_gemini_api_key_here":
    try:
        from google import genai
        genai_client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info("[FALCON-AI] Gemini Client Initialized.")
    except Exception as e:
        logger.error(f"[FALCON-AI] Failed to initialize Gemini Client: {e}")

# Override the health blueprint response to include falcon_ai status
@app.route('/api/health')
def health_override():
    return jsonify({
        "status": "UP",
        "service": "FalconZ V1 API",
        "falcon_ai": "CONFIGURED" if genai_client else "NOT_CONFIGURED"
    })

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/knowledge/search', methods=['GET'])
def knowledge_search():
    query = request.args.get('q', '')
    results = search_knowledge(query)
    return jsonify({
        "success": True,
        "query": query,
        "matches": results
    })

@app.route('/api/flight-log/health', methods=['GET'])
def flight_log_health():
    return jsonify({"status": "OK"})

@app.route('/api/flight-log/analyze', methods=['POST'])
def analyze_flight_log_endpoint():
    if 'file' not in request.files:
        return jsonify({"status": "ERROR", "message": "No file part"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "ERROR", "message": "No selected file"}), 400
        
    if not (file.filename.lower().endswith('.bin')):
        return jsonify({"status": "ERROR", "message": "Unsupported file format. Only .BIN files are supported."}), 400
        
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, file.filename)
    
    try:
        file.save(temp_path)
        logger.info(f"[FLIGHT-LOG] Parsing file {file.filename}")
        
        # Analyze
        result = parse_flight_log(temp_path)
        
        # Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return jsonify(result)
    except Exception as e:
        logger.error(f"[FLIGHT-LOG] Parse error: {e}")
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({"status": "ERROR", "message": "Internal parser error"}), 500

@app.route('/api/falcon-ai', methods=['POST'])
def falcon_ai():
    logger.info("[FALCON-AI] Request received")
    
    data = request.json or {}
    query = data.get('query')
    
    if not query:
        return jsonify({
            "success": False,
            "error": "Query is required."
        }), 400
        
    if not genai_client:
        return jsonify({
            "success": False,
            "error": "Gemini API key is not configured.",
            "status": "CONFIGURATION_ERROR"
        }), 200 # Returning 200 so UI can display message cleanly

    drone = data.get('drone', {})
    engineering = data.get('engineering', {})
    knowledgeContext = data.get('knowledgeContext', {})
    flight_log = data.get('flightLog', {})
    environmental_mission = data.get('environmentalMission', {})
    telemetry_state = data.get('telemetryState', {})
    gps_state = data.get('gpsState', {})
    history = data.get('history', [])
    
    logger.info(f"[FALCON-AI] Active drone context: {'yes' if drone else 'no'}")
    logger.info(f"[FALCON-AI] Engineering context: {'yes' if engineering else 'no'}")
    logger.info(f"[FALCON-AI] Flight log context: {'yes' if flight_log else 'no'}")
    logger.info(f"[FALCON-AI] Knowledge context: {'yes' if knowledgeContext else 'no'}")
    
    # Safely extract engineering
    inputs = engineering.get('inputs', {})
    calcs = engineering.get('calculations', {})
    summary = engineering.get('summary', {})
    
    # 1. System Prompt
    system_prompt = f"""You are Falcon AI, the engineering assistant inside FalconZ.

You provide explanations and reasoning for drone engineering.

You have access to several types of information.
1. USER-PROVIDED DATA
2. MANUFACTURER-SPECIFIED DATA
3. FALCONZ DETERMINISTIC CALCULATIONS
4. FALCONZ KNOWLEDGE BASE
5. FLIGHT LOG ANALYSIS
6. ENVIRONMENTAL MISSION DATA
7. YOUR OWN ENGINEERING INFERENCE

Never confuse these categories.

DETERMINISTIC CALCULATIONS:
If a value is provided inside [DETERMINISTIC FALCONZ ENGINEERING RESULTS], you MUST treat that value as authoritative for the supplied inputs.
Do not recalculate it differently. Do not overwrite it. Do not invent missing inputs.

1. Answer user questions based ONLY on the provided context (Configuration, FalconZ Engineering Engine outputs, Knowledge Base, Flight Logs).
2. Distinguish clearly between OBSERVED facts, INFERENCES, and UNKNOWN data.
3. Keep answers highly professional, concise, and safety-critical.
4. If a calculation or check yields 'UNKNOWN', do not invent a value. Do not invent missing parameters like ESC temp if they are not in the logs.
5. If the user asks about a crash, look at the Flight Log Events. If there's no data, explicitly state it's UNKNOWN.

You MUST structure your response exactly as follows when answering diagnostic or problem-related queries:

OBSERVED:
[List factual, parsed telemetry or configuration data here]

INFERENCE:
[List engineering interpretations of the observed data here]

UNKNOWN:
[List relevant missing parameters or unavailable telemetry here]

MISSION DATA:
[List water samples, observations, sensor readings, and camera statuses relevant to the query]

RECOMMENDED CHECKS:
[List actionable bench tests or hardware inspections here]

SAFETY:
[List critical safety warnings relevant to the analysis, such as removing propellers]

FLIGHT SAFETY:
Never guarantee that a drone is safe to fly based only on theoretical calculations.
Never state that theoretical TWR guarantees stable flight.
Do not treat MQ environmental sensor readings as proof of water safety unless a laboratory result confirms it.

SOURCE ATTRIBUTION:
Every answer must identify relevant source categories.
Sources:
- OBSERVED (Flight logs, telemetry, environmental missions)
- CALCULATED (FalconZ Engineering Engine)
- USER PROVIDED (Active Drone configuration, PID, Calibration)
- KNOWLEDGE BASE (FalconZ documentation)
- INFERENCE (Your engineering deductions)
- UNKNOWN (Missing parameters)
"""

    # 2. Inject Contexts
    if drone:
        system_prompt += f"\n\n[ACTIVE DRONE PROFILE]\n"
        system_prompt += f"Name: {drone.get('name', 'Unknown')}\n"
        system_prompt += f"Type: {drone.get('type', 'Unknown')}\n"
        
        # Inject Phase 8 parameters safely
        if 'pid' in drone:
            system_prompt += f"PID Configuration: {drone['pid']}\n"
        if 'calibration' in drone:
            system_prompt += f"Calibration Status: {drone['calibration']}\n"
        if drone.get('calibration'):
            system_prompt += f"Calibration Status: {drone.get('calibration')}\n"
        if drone.get('pid'):
            system_prompt += f"PID Configuration: {drone.get('pid')}\n"
        
    if engineering and summary.get('configurationCompleteness') is not None:
        system_prompt += f"""
[DETERMINISTIC FALCONZ ENGINEERING RESULTS]
Configuration Completeness: {summary.get('configurationCompleteness')}%

User-provided / Manufacturer Specs:
- AUW: {inputs.get('auw', {}).get('value')} ({inputs.get('auw', {}).get('status')})
- Motor count: {inputs.get('motorCount', {}).get('value')} ({inputs.get('motorCount', {}).get('status')})
- Maximum thrust per motor: {inputs.get('maxThrustPerMotor', {}).get('value')} ({inputs.get('maxThrustPerMotor', {}).get('status')})
- Battery Cell Count: {inputs.get('batteryCellCount', {}).get('value')} ({inputs.get('batteryCellCount', {}).get('status')})
- Battery Capacity: {inputs.get('batteryCapacity', {}).get('value')} ({inputs.get('batteryCapacity', {}).get('status')})
- Battery C-Rating: {inputs.get('batteryCRating', {}).get('value')} ({inputs.get('batteryCRating', {}).get('status')})
- ESC Current Rating: {inputs.get('escCurrentRating', {}).get('value')} ({inputs.get('escCurrentRating', {}).get('status')})

Calculated by FalconZ:
- Total maximum thrust: {calcs.get('totalThrust', {}).get('value')}
- Theoretical TWR: {calcs.get('twr', {}).get('ratio', calcs.get('twr', {}).get('value'))}
- Theoretical hover thrust: {calcs.get('hoverThrustPerMotor', {}).get('value')}
- Linear theoretical hover throttle estimate: {calcs.get('hoverThrottle', {}).get('value')}%
- Nominal Voltage: {calcs.get('batteryVoltage', {}).get('value')}
- Energy: {calcs.get('batteryEnergy', {}).get('value')}
- Theoretical Max Discharge: {calcs.get('batteryDischargeCurrent', {}).get('value')}
- ESC Margin: {calcs.get('escMargin', {}).get('value')}

Unknowns: {', '.join(summary.get('unknown', [])) if summary.get('unknown') else 'None'}
Warnings: {', '.join(summary.get('warnings', [])) if summary.get('warnings') else 'None'}
"""

    if flight_log:
        system_prompt += f"\\n\\n[FLIGHT LOG ANALYSIS]\\n"
        system_prompt += f"Metadata: {flight_log.get('metadata', {})}\\n"
        system_prompt += f"Summary: {flight_log.get('summary', {})}\\n"
        system_prompt += f"Health Score: {flight_log.get('healthScore', {})}\\n"
        system_prompt += f"Data Quality: {flight_log.get('dataQuality', {})}\\n"
        system_prompt += f"Events: {flight_log.get('events', [])}\\n"
        
    if knowledgeContext:
        if isinstance(knowledgeContext, dict):
            # Format dict if passed as object
            system_prompt += f"\\n\\n[FALCONZ KNOWLEDGE CONTEXT]\\n"
            for k, v in knowledgeContext.items():
                system_prompt += f"{k}: {v}\\n"
        else:
            system_prompt += f"\\n\\n[FALCONZ KNOWLEDGE CONTEXT]\\n{knowledgeContext}\\n"

    if environmental_mission:
        system_prompt += f"\\n\\n[ENVIRONMENTAL MISSION]\\n"
        system_prompt += f"Name: {environmental_mission.get('name')}\\n"
        system_prompt += f"Status: {environmental_mission.get('status')}\\n"
        system_prompt += f"Observations: {environmental_mission.get('observations', [])}\\n"
        system_prompt += f"Water Samples: {environmental_mission.get('waterSamples', [])}\\n"
        system_prompt += f"Sensors: {environmental_mission.get('sensorReadings', [])}\\n"
        system_prompt += f"Camera: {environmental_mission.get('camera', {})}\\n"

    if gps_state or telemetry_state:
        system_prompt += f"\\n\\n[GPS & TELEMETRY]\\n"
        system_prompt += f"GPS: {gps_state}\\n"
        system_prompt += f"Telemetry: {telemetry_state}\\n"

    try:
        from google import genai
        logger.info("[FALCON-AI] Gemini request started")
        
        # Build contents array
        contents = []
        for msg in history:
            role = "user" if msg.get("role") == "user" else "model"
            contents.append(
                genai.types.Content(role=role, parts=[genai.types.Part.from_text(text=msg.get("content", ""))])
            )
            
        contents.append(
            genai.types.Content(role="user", parts=[genai.types.Part.from_text(text=query)])
        )

        response = genai_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=genai.types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.2
            )
        )
        
        reply_text = response.text if hasattr(response, 'text') and response.text else "No response generated."
        logger.info("[FALCON-AI] Gemini response received")
        return jsonify({
            "success": True,
            "reply": reply_text,
            "sources": ["FalconZ Deterministic Engine", "Gemini AI"]
        })
        
    except Exception as e:
        logger.error(f"[FALCON-AI] Gemini API Error: {e}")
        return jsonify({
            "success": False,
            "error": "Falcon AI request failed: Internal Server Error"
        }), 500

@app.errorhandler(404)
def not_found(e):
    if request.path.startswith('/api/'):
        return jsonify({"error": "Not Found", "message": "API endpoint does not exist."}), 404
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
