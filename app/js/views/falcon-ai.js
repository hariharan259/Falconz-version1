import EngineeringEngine from '../services/engineering-engine.js';
import KnowledgeRetriever from '../services/knowledge-retriever.js';
import KnowledgeContext from '../services/knowledge-context.js';

const FalconAIView = {
    render: async (store) => {
        const activeDrone = store.getActiveDrone();
        const droneName = activeDrone ? activeDrone.name : "None";
        const engStatus = activeDrone ? "✓ Deterministic calculations loaded" : "Not loaded";
        
        let warningHtml = "";
        if (!activeDrone) {
            warningHtml = `
                <div class="alert alert-warning" style="background-color: var(--warning); color: #000; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
                    <strong>No active drone selected.</strong> Create or select a drone profile before requesting configuration-specific analysis.
                </div>
            `;
        }

        return `
            <div class="page-header">
                <h2>Falcon AI</h2>
                <p class="tagline">Engineering Intelligence Assistant</p>
            </div>
            
            <div class="falcon-ai-layout" style="display: flex; gap: 20px; height: 65vh;">
                <!-- Chat Container -->
                <div class="chat-container" style="flex: 3; background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; display: flex; flex-direction: column;">
                    ${warningHtml}
                    <div id="chat-messages" style="flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px;">
                        <div class="message ai-message" style="align-self: flex-start; background-color: var(--bg-tertiary); padding: 10px 15px; border-radius: 8px; max-width: 80%;">
                            Hello! I am Falcon AI. I can explain your deterministic engineering calculations. What would you like to know?
                        </div>
                    </div>
                    <div class="chat-input-area" style="padding: 15px; border-top: 1px solid var(--border-color); display: flex; gap: 10px;">
                        <input type="text" id="chat-input" class="form-control" style="flex: 1;" placeholder="Ask Falcon AI...">
                        <button id="btn-send" class="btn btn-primary">Send</button>
                    </div>
                    <div style="padding: 10px 15px; border-top: 1px solid var(--border-color); display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="btn btn-secondary btn-sm ai-quick" data-q="What is the complete health summary of this drone and environmental mission?">Unified Summary</button>
                        <button class="btn btn-secondary btn-sm ai-quick" data-q="Analyze my PID configuration.">Analyze PID</button>
                        <button class="btn btn-secondary btn-sm ai-quick" data-q="Summarize water samples.">Water Samples</button>
                        <button class="btn btn-secondary btn-sm ai-quick" data-q="Find UNKNOWN or missing data.">Find Unknowns</button>
                        <button class="btn btn-secondary btn-sm ai-quick" data-q="What should I check before flight?">Next Checks</button>
                    </div>
                </div>
                
                <!-- Context Panel -->
                <div class="context-panel" style="flex: 1; background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px;">
                    <h3 style="font-size: 0.9rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 15px;">FALCON AI CONTEXT</h3>
                    
                    <div style="margin-bottom: 15px;">
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">Active Drone:</div>
                        <div style="font-weight: bold;">${droneName}</div>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">Engineering:</div>
                        <div style="font-size: 0.85rem; color: ${activeDrone ? 'var(--success)' : 'var(--text-secondary)'};">${engStatus}</div>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">Flight Log:</div>
                        <div style="font-size: 0.85rem;">Not loaded</div>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">Knowledge:</div>
                        <div style="font-size: 0.85rem;">Not available</div>
                    </div>
                </div>
            </div>
        `;
    },

    mount: (store) => {
        const input = document.getElementById('chat-input');
        const btnSend = document.getElementById('btn-send');
        const messages = document.getElementById('chat-messages');
        
        let chatHistory = [];

        const addMessage = (text, isUser = false) => {
            const msg = document.createElement('div');
            msg.style.cssText = isUser 
                ? "align-self: flex-end; background-color: var(--accent-primary); color: white; padding: 10px 15px; border-radius: 8px; max-width: 80%; margin-bottom: 15px;" 
                : "align-self: flex-start; background-color: var(--bg-tertiary); padding: 10px 15px; border-radius: 8px; max-width: 80%; margin-bottom: 15px; white-space: pre-wrap;";
            msg.textContent = text;
            messages.appendChild(msg);
            messages.scrollTop = messages.scrollHeight;
        };

        const sendMessage = async () => {
            const text = input.value.trim();
            if (!text) return;

            addMessage(text, true);
            input.value = '';
            btnSend.disabled = true;

            const activeDrone = store.getActiveDrone();
            const engineeringContext = activeDrone ? EngineeringEngine.analyzeConfiguration(activeDrone) : null;
            
            // Get active flight log (if any)
            const activeFlightLog = store.getActiveFlightLog();
            // Create a safe, summarized copy so we don't send massive arrays to Gemini
            let flightLogContext = null;
            if (activeFlightLog) {
                flightLogContext = {
                    metadata: activeFlightLog.metadata,
                    summary: activeFlightLog.summary,
                    events: activeFlightLog.events,
                    healthScore: activeFlightLog.healthScore,
                    dataQuality: activeFlightLog.dataQuality
                };
            }
            // Environmental Mission and Telemetry Context
            let environmentalMissionContext = null;
            let gpsContext = null;
            let telemetryContext = null;
            
            if (activeDrone) {
                gpsContext = activeDrone.gps || null;
                telemetryContext = activeDrone.telemetryData || null;
                
                const missions = store.getEnvironmentalMissions().filter(m => m.droneId === activeDrone.id);
                if (missions.length > 0) {
                    environmentalMissionContext = missions[missions.length - 1]; // Active/latest mission
                }
            }

            // RAG Workflow
            let retrievedKnowledge = [];
            let knowledgeContextStr = null;
            try {
                retrievedKnowledge = await KnowledgeRetriever.search(text);
                knowledgeContextStr = KnowledgeContext.build(retrievedKnowledge);
            } catch (err) {
                console.error("Failed to retrieve knowledge:", err);
            }

            try {
                const response = await fetch('/api/falcon-ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: text,
                        drone: activeDrone,
                        engineering: engineeringContext,
                        knowledgeContext: knowledgeContextStr,
                        flightLog: flightLogContext,
                        environmentalMission: environmentalMissionContext,
                        gpsState: gpsContext,
                        telemetryState: telemetryContext,
                        history: chatHistory
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    console.error("Server response:", data);
                    addMessage(data.error || `Falcon AI request failed: HTTP ${response.status}`, false);
                    return;
                }
                
                if (data.status === 'CONFIGURATION_ERROR') {
                    addMessage(data.error || "Falcon AI is not configured yet. Add GEMINI_API_KEY to your .env file.\\n\\nFalconZ deterministic calculations are still available on the Engineering Dashboard.", false);
                    return;
                }

                if (data.success && data.reply) {
                    // Source Grounding UI
                    let sourcesHtml = `
                    <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid var(--border-color); font-size: 0.8rem; color: var(--text-secondary);">
                        <strong style="display: block; margin-bottom: 5px;">SOURCE GROUNDING</strong>
                        <ul style="list-style: none; padding-left: 0; margin: 0;">
                    `;
                    
                    if (activeDrone) {
                        sourcesHtml += `<li>✓ User Configuration</li>`;
                        sourcesHtml += `<li>✓ FalconZ Engineering Calculation</li>`;
                    }
                    
                    if (flightLogContext) {
                        sourcesHtml += `<li>✓ Flight Log + FalconZ Deterministic Analysis</li>`;
                    }
                    
                    if (environmentalMissionContext) {
                        sourcesHtml += `<li>✓ Environmental Mission Log</li>`;
                    }
                    
                    if (retrievedKnowledge.length > 0) {
                        sourcesHtml += `<li>✓ FalconZ Knowledge Base: ${retrievedKnowledge.map(doc => doc.title).join(', ')}</li>`;
                    }
                    
                    sourcesHtml += `<li>✓ Inference</li></ul></div>`;
                    
                    const replyWithSources = data.reply + sourcesHtml;
                    addMessage(replyWithSources, false);
                    
                    // Maintain rolling history of ~10 messages
                    chatHistory.push({ role: 'user', content: text });
                    chatHistory.push({ role: 'assistant', content: data.reply });
                    if (chatHistory.length > 20) {
                        chatHistory = chatHistory.slice(chatHistory.length - 20);
                    }
                } else {
                    console.error("Server response:", data);
                    addMessage(data.error || "Falcon AI is temporarily unavailable.", false);
                }

            } catch (err) {
                console.error("Network or parsing error:", err);
                addMessage("Falcon AI request failed: Network error", false);
            } finally {
                btnSend.disabled = false;
                input.focus();
            }
        };

        btnSend.addEventListener('click', sendMessage);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Quick Action Handlers
        document.querySelectorAll('.ai-quick').forEach(btn => {
            btn.addEventListener('click', (e) => {
                input.value = e.target.getAttribute('data-q');
                sendMessage();
            });
        });
        
        // Consume global pending query if navigated from Dashboard
        if (window.falconAiPendingQuery) {
            input.value = window.falconAiPendingQuery;
            window.falconAiPendingQuery = null; // Clear it
            setTimeout(() => { sendMessage(); }, 300);
        }
    }
};

export default FalconAIView;
