import EngineeringEngine from '../services/engineering-engine.js';
import GPSEngine from '../services/gps-engine.js';
import TelemetryEngine from '../services/telemetry-engine.js';
import EnvironmentEngine from '../services/environment-engine.js';

const DashboardView = {
    render: async (store) => {
        const activeDrone = store.getActiveDrone();
        
        if (!activeDrone) {
            return `
                <div class="empty-state">
                    <h3>No Active Drone</h3>
                    <p>Welcome to FalconZ V1. Please create your first drone profile to begin engineering analysis and flight log review.</p>
                    <button class="btn btn-primary" onclick="document.querySelector('[data-route=\\'/drones\\']').click()">Create Drone</button>
                    <div style="margin-top: 30px; border-top: 1px solid var(--border-color); padding-top: 20px;">
                        <button id="btn-demo-mode" class="btn btn-secondary">Initialize Hackathon Demo</button>
                    </div>
                </div>
            `;
        }

        const formatUnknown = (val, suffix = '') => {
            if (val === null || val === undefined || val === '' || val === 'UNKNOWN') return '<span class="data-value unknown">UNKNOWN</span>';
            return `<span class="data-value">${val}${suffix}</span>`;
        };
        
        const formatEngValue = (obj, suffix = '') => {
            if (!obj || obj.value === 'UNKNOWN' || obj.value === null || obj.value === undefined) return '<span class="data-value unknown">UNKNOWN</span>';
            const badge = `<span class="drone-badge" style="font-size: 0.65rem; margin-left: 6px; padding: 2px 6px; background-color: var(--bg-tertiary);">${obj.status}</span>`;
            return `<div style="display:flex; align-items:center;"><span class="data-value">${obj.ratio || obj.value}${suffix}</span>${badge}</div>`;
        };

        const d = activeDrone;
        
        // 1. Engineering
        const eng = EngineeringEngine.analyzeConfiguration(d);
        const c = eng.calculations;
        
        // 2. Flight Log
        const flightLog = store.getActiveFlightLog();
        
        // 3. GPS / Telemetry
        const gpsEval = GPSEngine.assessGPSQuality(d.gps || {});
        let gpsColor = 'var(--text-secondary)';
        if (gpsEval.quality === 'GOOD') gpsColor = 'var(--success-color)';
        if (gpsEval.quality === 'FAIR') gpsColor = 'var(--warning-color)';
        if (gpsEval.quality === 'POOR') gpsColor = 'var(--danger-color)';

        // 4. PID
        const pid = d.pid || {};
        
        // 5. Environmental Mission
        const missions = store.getEnvironmentalMissions().filter(m => m.droneId === d.id);
        const activeMission = missions.length > 0 ? missions[missions.length - 1] : null;

        return `
            <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2>FALCONZ COMMAND CENTER</h2>
                    <p class="tagline">Unified Systems Overview</p>
                </div>
                <div>
                    <button id="btn-demo-mode" class="btn btn-secondary" style="font-size: 0.8rem; border-color: var(--warning-color); color: var(--warning-color);">RUN DEMO MODE</button>
                </div>
            </div>

            <div class="dashboard-grid">
                
                <!-- A. ACTIVE DRONE -->
                <div class="dashboard-card col-span-4">
                    <h3 class="card-title">A. ACTIVE DRONE</h3>
                    <div class="data-group">
                        <div class="data-label">Name</div>
                        <div class="data-value" style="font-weight: bold; color: var(--accent-primary);">${d.name}</div>
                    </div>
                    <div class="data-group">
                        <div class="data-label">Type</div>
                        <div class="data-value">${d.type}</div>
                    </div>
                    <div class="data-group">
                        <div class="data-label">Configuration Completeness</div>
                        <div class="data-value">${eng.summary.configurationCompleteness}%</div>
                    </div>
                </div>

                <!-- B. ENGINEERING HEALTH -->
                <div class="dashboard-card col-span-4">
                    <h3 class="card-title">B. ENGINEERING HEALTH</h3>
                    <div class="data-group">
                        <div class="data-label">Total Thrust</div>
                        ${formatEngValue(c.totalThrust, 'g')}
                    </div>
                    <div class="data-group">
                        <div class="data-label">Theoretical TWR</div>
                        ${formatEngValue(c.twr, '')}
                    </div>
                    <div class="data-group">
                        <div class="data-label">Hover Throttle Estimate</div>
                        ${formatEngValue(c.hoverThrottle, '%')}
                    </div>
                    <div class="data-group">
                        <div class="data-label">ESC Margin</div>
                        ${formatEngValue(c.escMargin, 'A')}
                    </div>
                </div>

                <!-- C. FLIGHT HEALTH -->
                <div class="dashboard-card col-span-4">
                    <h3 class="card-title">C. FLIGHT LOG HEALTH</h3>
                    ${flightLog ? `
                        <div class="data-group">
                            <div class="data-label">Health Score</div>
                            <div class="data-value" style="color: ${flightLog.healthScore.score >= 80 ? 'var(--success-color)' : flightLog.healthScore.score >= 50 ? 'var(--warning-color)' : 'var(--danger-color)'}; font-weight: bold; font-size: 1.2rem;">
                                ${flightLog.healthScore.score}/100 (${flightLog.healthScore.grade})
                            </div>
                        </div>
                        <div class="data-group">
                            <div class="data-label">Evidence Status</div>
                            <div class="data-value">${flightLog.healthScore.evidenceStatus}</div>
                        </div>
                        <div class="data-group">
                            <div class="data-label">Events Detected</div>
                            <div class="data-value">${flightLog.events.length}</div>
                        </div>
                    ` : `
                        <div style="color: var(--text-secondary); text-align: center; padding: 20px 0;">No flight log analyzed.</div>
                    `}
                </div>

                <!-- D. GPS / TELEMETRY -->
                <div class="dashboard-card col-span-4">
                    <h3 class="card-title">D. GPS / TELEMETRY</h3>
                    <div class="data-group">
                        <div class="data-label">Source</div>
                        <div class="data-value"><span class="badge" style="background-color: ${d.gps?.source === 'SIMULATED' ? 'var(--warning-color)' : 'var(--accent-primary)'}; color: #000; border: none;">${d.gps?.source || 'UNKNOWN'}</span></div>
                    </div>
                    <div class="data-group">
                        <div class="data-label">Quality</div>
                        <div class="data-value" style="color: ${gpsColor}; font-weight: bold;">${gpsEval.quality}</div>
                    </div>
                    <div class="data-group">
                        <div class="data-label">Satellites (HDOP)</div>
                        <div class="data-value">${formatUnknown(d.gps?.satellites)} (${formatUnknown(d.gps?.hdop)})</div>
                    </div>
                    <div class="data-group">
                        <div class="data-label">Coordinates</div>
                        <div class="data-value" style="font-size: 0.8rem;">${formatUnknown(d.gps?.latitude)}, ${formatUnknown(d.gps?.longitude)}</div>
                    </div>
                </div>

                <!-- E. PID STATUS -->
                <div class="dashboard-card col-span-4">
                    <h3 class="card-title">E. PID TUNING</h3>
                    <div class="data-group">
                        <div class="data-label">Calibration</div>
                        <div class="data-value">${d.calibration?.gyroscope?.status === 'USER VERIFIED' && d.calibration?.accelerometer?.status === 'USER VERIFIED' ? '<span style="color:var(--success-color)">VERIFIED</span>' : '<span style="color:var(--warning-color)">INCOMPLETE</span>'}</div>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <div style="flex: 1; text-align: center; background: var(--bg-tertiary); padding: 5px; border-radius: 4px;">
                            <div style="font-size: 0.7rem; color: var(--text-secondary);">Roll P</div>
                            <div style="font-weight: bold;">${formatUnknown(pid.roll?.p)}</div>
                        </div>
                        <div style="flex: 1; text-align: center; background: var(--bg-tertiary); padding: 5px; border-radius: 4px;">
                            <div style="font-size: 0.7rem; color: var(--text-secondary);">Pitch P</div>
                            <div style="font-weight: bold;">${formatUnknown(pid.pitch?.p)}</div>
                        </div>
                        <div style="flex: 1; text-align: center; background: var(--bg-tertiary); padding: 5px; border-radius: 4px;">
                            <div style="font-size: 0.7rem; color: var(--text-secondary);">Yaw P</div>
                            <div style="font-weight: bold;">${formatUnknown(pid.yaw?.p)}</div>
                        </div>
                    </div>
                </div>

                <!-- F. ENVIRONMENTAL MISSION -->
                <div class="dashboard-card col-span-4">
                    <h3 class="card-title">F. ENVIRONMENTAL MISSION</h3>
                    ${activeMission ? `
                        <div class="data-group">
                            <div class="data-label">Mission</div>
                            <div class="data-value" style="font-weight: bold;">${activeMission.name}</div>
                        </div>
                        <div class="data-group">
                            <div class="data-label">Status</div>
                            <div class="data-value">${activeMission.status}</div>
                        </div>
                        <div class="data-group">
                            <div class="data-label">Water Samples</div>
                            <div class="data-value">${activeMission.waterSamples.length}</div>
                        </div>
                        <div class="data-group">
                            <div class="data-label">Camera</div>
                            <div class="data-value">${activeMission.camera?.status || 'UNKNOWN'}</div>
                        </div>
                    ` : `
                        <div style="color: var(--text-secondary); text-align: center; padding: 20px 0;">No active mission.</div>
                    `}
                </div>
                
                <!-- G. FALCON AI -->
                <div class="dashboard-card col-span-12" style="background-color: rgba(0, 240, 255, 0.05); border: 1px solid var(--accent-primary);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 class="card-title" style="margin: 0; color: var(--accent-primary);">G. FALCON AI</h3>
                        <button class="btn btn-primary btn-sm" onclick="document.querySelector('[data-route=\\'/falcon-ai\\']').click()">Open AI Hub</button>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn btn-secondary btn-sm ai-quick" data-q="What is the complete health summary of this drone and environmental mission?">Unified Health Summary</button>
                        <button class="btn btn-secondary btn-sm ai-quick" data-q="Analyze my latest flight log.">Analyze Flight Log</button>
                        <button class="btn btn-secondary btn-sm ai-quick" data-q="What should I check before flight?">Pre-flight Checks</button>
                    </div>
                </div>

            </div>
        `;
    },

    mount: (store) => {
        // AI Quick Actions
        document.querySelectorAll('.ai-quick').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = e.target.getAttribute('data-q');
                // Store the query in a temporary global so falcon-ai.js can pick it up
                window.falconAiPendingQuery = query;
                document.querySelector('[data-route="/falcon-ai"]').click();
            });
        });

        // Demo Mode Integration
        document.getElementById('btn-demo-mode')?.addEventListener('click', () => {
            if (confirm("This will initialize a simulated Drone and Environmental Mission for demonstration purposes. Proceed?")) {
                // 1. Create Drone
                const demoDrone = store.saveDrone({
                    name: "Falcon Quad 01 (DEMO)",
                    type: "Quadcopter",
                    basic: { frameSize: "250", manufacturer: "FalconZ", model: "V1" },
                    weight: { auw: 750 },
                    motors: { count: 4, kv: 2400, maxThrustPerMotor: 1050, maxThrustProvenance: "MANUFACTURER_SPEC" },
                    battery: { cellCount: 4, capacityMah: 1500, cRating: 100 },
                    esc: { continuousCurrent: 35 },
                    pid: {
                        roll: { p: 45, i: 85, d: 35, ff: 90 },
                        pitch: { p: 47, i: 90, d: 38, ff: 95 },
                        yaw: { p: 45, i: 90, d: 0, ff: 90 }
                    },
                    calibration: {
                        accelerometer: { status: "USER VERIFIED" },
                        gyroscope: { status: "USER VERIFIED" }
                    }
                });
                
                // 2. Set Active
                store.setActiveDrone(demoDrone.id);
                
                // 3. Create Simulated GPS & Telemetry
                const te = new TelemetryEngine(store);
                const simGps = te.generateSimulatedGPS();
                const simTel = te.generateSimulatedTelemetry();
                store.updateDrone(demoDrone.id, { gps: simGps, telemetryData: simTel });

                // 4. Create Simulated Environmental Mission
                const demoMission = {
                    id: crypto.randomUUID(),
                    droneId: demoDrone.id,
                    name: "Lake Water Survey — Demo",
                    type: "WATER INSPECTION",
                    status: "ACTIVE",
                    startedAt: new Date().toISOString(),
                    waypoints: [],
                    observations: [{ id: "OBS-01", description: "Clear water observed", timestamp: new Date().toISOString() }],
                    waterSamples: [
                        { sampleId: "WS-001", status: "LAB RESULT AVAILABLE", labResult: "Negative for E. coli", timestamp: new Date().toISOString() },
                        { sampleId: "WS-002", status: "COLLECTED", labResult: "UNKNOWN", timestamp: new Date().toISOString() }
                    ],
                    sensorReadings: [
                        { model: "MQ-135", rawValue: 345, interpretation: "ENVIRONMENTAL SENSOR READING", timestamp: new Date().toISOString() }
                    ],
                    camera: { name: "Payload Cam", streamUrl: "rtsp://simulated.camera/stream", status: "CONFIGURED" },
                    timeline: [{ timestamp: new Date().toISOString(), type: 'MISSION_STARTED', source: 'SIMULATED', details: 'Demo initialized.' }]
                };
                store.saveMission(demoMission);

                alert("Demo initialized. Please navigate to the respective tabs to view populated data.");
                window.dispatchEvent(new CustomEvent('store-updated'));
            }
        });
    }
};

export default DashboardView;
