# FalconZ V1

**AI-Assisted Drone Engineering, Flight Diagnostics & Environmental Monitoring Platform**

FalconZ V1 is a professional engineering toolchain designed to help drone engineers architect custom multirotors, diagnose flight-log telemetry, configure PID loops, and manage ecological inspection workflows through a deterministic software layer augmented by a large language model (Gemini).

## 🚀 Features

- **Command Center Dashboard:** Unified view tracking TWR, Health Scores, PID status, and Environmental payloads simultaneously.
- **Deterministic Engineering Engine:** Instantly calculates AUW, Max Thrust, TWR, Hover Throttle, Battery Discharge limits, and ESC Margins.
- **Drone Manager:** Maintains an offline-first storage array (`localStorage`) for managing multiple drone profiles simultaneously.
- **Advanced Flight Diagnostics:** Native ArduPilot `.BIN` log parser. Flags RC/GPS drops, visualizes Battery/Vibration, and generates an algorithmic 0-100 Health Score.
- **PID Tuning Engine:** Custom interface for configuring Roll, Pitch, and Yaw matrices with native presets and Flight-Log vibration warnings.
- **GPS & Telemetry Tracker:** Offline map/radar projection simulating Live/Simulated telemetry coordinates and hardware health.
- **Environmental Mission Workflow:** Architecture for logging UNO Q integration, MQ-135 sensor events, and a manual Water Sampling (PLANNED -> COLLECTED -> LAB) chain.
- **Falcon AI (Powered by Gemini):** A contextual AI assistant that natively inherits the active drone’s exact configuration and flight logs before answering. Built with strict **Source Attribution** limits to prevent AI hallucination over mathematical bounds.
- **Engineering Knowledge Base:** Grounded internal RAG (Retrieval-Augmented Generation) ensuring Gemini leverages validated drone theory rather than general web knowledge.

---

## 🏗 Architecture & Technology Stack

**Frontend:**
- Vanilla JavaScript (ES6 Modules)
- Single Page Application (SPA) Router with HTML5 History API
- Pure CSS (No Tailwind/Bootstrap) for a clean, deterministic engineering aesthetic
- `localStorage` JSON abstraction layer for 100% offline persistence
- Chart.js for Telemetry/Flight Log visualizations

**Backend:**
- Python 3.9+
- Flask (API Gateway & Static File Server)
- PyMavlink (DFReader for ArduPilot DataFlash logs)
- Google GenAI SDK (Gemini Flash integration)

---

## 🛠 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/falconz.git
   cd falconz
   ```

2. **Set up Python Virtual Environment:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and insert your Gemini API Key:
   `GEMINI_API_KEY="your-api-key-here"`

4. **Run the Server:**
   ```bash
   python3 server.py
   ```
   Navigate to [http://127.0.0.1:5001](http://127.0.0.1:5001)

---

## ⚠️ Safety & UNKNOWN Handling

FalconZ operates under strict "No-Fabrication" engineering rules:
- **No default values:** If a parameter is missing, the system aggressively displays `UNKNOWN` rather than defaulting to `0` or `false`.
- **Hardware abstraction:** Simulated Telemetry and Hardware statuses are explicitly badged as `SIMULATED` or `READY FOR INTEGRATION`.
- **Data safety:** FalconZ clearly delineates between a raw MQ sensor analog reading and a certified lab result.

---

## 🎮 Hackathon Demo Mode

If you are evaluating this project at a hackathon, you can bypass the manual drone creation workflow:
1. Open the **Dashboard**.
2. Click **Initialize Hackathon Demo**.
3. A pre-configured `Falcon Quad 01 (DEMO)` will be loaded containing simulated telemetry, calculated thrust loops, and a pre-staged "Lake Water Survey" mission.

---

## 📖 Known Limitations (V1)
- **Flight Log Uploads:** True diagnostic scoring requires genuine `.BIN` files; Demo Mode explicitly avoids faking `.BIN` structures.
- **RTSP Streams:** Browser-native RTSP requires a proxy relay; the current Camera module assumes configuration intent rather than direct playback.
- **Hardware Polling:** Live MAVLink polling via serial is stubbed as `READY FOR INTEGRATION`.

## License
MIT License
