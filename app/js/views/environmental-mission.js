import EnvironmentEngine from '../services/environment-engine.js';

const EnvironmentalMissionView = {
    render: async (store) => {
        const drone = store.getActiveDrone();
        if (!drone) {
            return `
                <div class="empty-state">
                    <h3>Environmental Mission</h3>
                    <p>No active drone selected. Please select or create a drone.</p>
                </div>
            `;
        }

        const missions = store.getEnvironmentalMissions().filter(m => m.droneId === drone.id);
        const activeMission = missions.length > 0 ? missions[missions.length - 1] : null;

        if (!activeMission) {
            return `
                <div class="page-header">
                    <h2>Environmental Missions</h2>
                    <p class="tagline">Manage UNO Q payloads and ecological inspections</p>
                </div>
                <div class="card" style="max-width: 600px; margin: 0 auto; text-align: center; padding: 40px;">
                    <h3>No Active Missions for ${drone.name}</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">Start an environmental mission to track sensor telemetry, record water samples, and manage network cameras.</p>
                    <button id="btn-create-mission" class="btn btn-primary" style="padding: 10px 20px; font-size: 1.1rem;">Create New Mission</button>
                </div>
            `;
        }

        const envEngine = new EnvironmentEngine(store);
        const dataQuality = envEngine.assessMissionDataQuality(activeMission);
        let dqColor = 'var(--warning-color)';
        if (dataQuality.quality === 'COMPLETE' || dataQuality.quality === 'GOOD') dqColor = 'var(--success-color)';
        if (dataQuality.quality === 'INSUFFICIENT') dqColor = 'var(--danger-color)';

        return `
            <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2>${activeMission.name}</h2>
                    <p class="tagline">Type: ${activeMission.type} | Status: <span style="color: var(--accent-primary); font-weight: bold;">${activeMission.status}</span></p>
                </div>
                <div>
                    <button id="btn-add-observation" class="btn btn-secondary">Add Observation</button>
                    <button id="btn-add-sample" class="btn btn-secondary">Record Water Sample</button>
                    <button id="btn-end-mission" class="btn btn-primary" style="background-color: var(--danger-color); border-color: var(--danger-color);">End Mission</button>
                </div>
            </div>

            <div class="dashboard-grid">
                <!-- Data Quality & Statistics -->
                <div class="card" style="grid-column: span 1;">
                    <div class="card-header">
                        <h3>Mission Statistics</h3>
                    </div>
                    <div class="card-body">
                        <div style="margin-bottom: 20px;">
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">Data Quality</div>
                            <div style="font-size: 1.4rem; font-weight: bold; color: ${dqColor};">${dataQuality.quality}</div>
                        </div>
                        
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <tr style="border-bottom: 1px solid var(--border-color);"><th style="padding: 5px;">Waypoints</th><td style="padding: 5px;">${activeMission.waypoints.length}</td></tr>
                            <tr style="border-bottom: 1px solid var(--border-color);"><th style="padding: 5px;">Observations</th><td style="padding: 5px;">${activeMission.observations.length}</td></tr>
                            <tr style="border-bottom: 1px solid var(--border-color);"><th style="padding: 5px;">Water Samples</th><td style="padding: 5px;">${activeMission.waterSamples.length}</td></tr>
                            <tr><th style="padding: 5px;">MQ Sensor Records</th><td style="padding: 5px;">${activeMission.sensorReadings.length}</td></tr>
                        </table>
                    </div>
                </div>

                <!-- Hardware Architecture (UNO Q) -->
                <div class="card" style="grid-column: span 1;">
                    <div class="card-header">
                        <h3>Hardware Integration Status</h3>
                    </div>
                    <div class="card-body">
                        <ul style="list-style: none; padding-left: 0; margin: 0; font-size: 0.9rem;">
                            <li style="margin-bottom: 15px;">
                                <strong style="display:block;">UNO Q Gateway</strong>
                                <span class="badge" style="background-color: var(--warning-color); color: #000; border: none; font-size: 0.7rem; margin-top: 3px;">READY FOR INTEGRATION</span>
                            </li>
                            <li style="margin-bottom: 15px;">
                                <strong style="display:block;">GPS / Telemetry</strong>
                                <span class="badge" style="background-color: var(--warning-color); color: #000; border: none; font-size: 0.7rem; margin-top: 3px;">READY FOR INTEGRATION</span>
                            </li>
                            <li style="margin-bottom: 15px;">
                                <strong style="display:block;">Network Camera</strong>
                                <span class="badge" style="background-color: var(--success-color); color: #fff; border: none; font-size: 0.7rem; margin-top: 3px;">CONFIGURATION SUPPORTED</span>
                            </li>
                            <li>
                                <strong style="display:block;">MQ Environmental Sensor</strong>
                                <span class="badge" style="background-color: var(--success-color); color: #fff; border: none; font-size: 0.7rem; margin-top: 3px;">SENSOR INPUT SUPPORTED</span>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <!-- Water Sample Records -->
                <div class="card" style="grid-column: span 1;">
                    <div class="card-header">
                        <h3>Water Sample Workflow</h3>
                    </div>
                    <div class="card-body">
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px;">
                            <strong style="color: var(--danger-color);">SAFETY:</strong> FalconZ does not determine whether water is safe to drink or use. Do not provide health conclusions from an unknown environmental sensor.
                        </p>
                        ${activeMission.waterSamples.length === 0 ? '<p style="font-style: italic; color: var(--text-secondary);">No samples recorded.</p>' : `
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                ${activeMission.waterSamples.map(s => `
                                    <li style="background-color: var(--bg-tertiary); padding: 10px; border-radius: 4px; margin-bottom: 10px; font-size: 0.85rem;">
                                        <div style="font-weight: bold; margin-bottom: 5px;">Sample: ${s.sampleId}</div>
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                            <span style="color: var(--text-secondary);">Status:</span>
                                            <span style="color: ${s.status === 'LAB RESULT AVAILABLE' ? 'var(--success-color)' : 'var(--warning-color)'}; font-weight: bold;">${s.status}</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between;">
                                            <span style="color: var(--text-secondary);">Result:</span>
                                            <span>${s.labResult || 'UNKNOWN'}</span>
                                        </div>
                                    </li>
                                `).join('')}
                            </ul>
                        `}
                    </div>
                </div>

                <!-- Network Camera Preview -->
                <div class="card" style="grid-column: span 1;">
                    <div class="card-header">
                        <h3>Network Camera</h3>
                    </div>
                    <div class="card-body" style="text-align: center;">
                        ${activeMission.camera && activeMission.camera.streamUrl ? `
                            <div style="background-color: var(--bg-tertiary); padding: 30px; border-radius: 4px; border: 1px dashed var(--border-color); margin-bottom: 15px;">
                                <div style="font-size: 2rem; margin-bottom: 10px;">📷</div>
                                <div><strong>STREAM CONFIGURED</strong></div>
                                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 5px;">${activeMission.camera.streamUrl}</div>
                                <div style="font-size: 0.8rem; color: var(--warning-color); margin-top: 10px;">STREAM NOT AVAILABLE IN BROWSER</div>
                            </div>
                        ` : `
                            <div style="background-color: var(--bg-tertiary); padding: 30px; border-radius: 4px; border: 1px dashed var(--border-color); margin-bottom: 15px;">
                                <div style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;">📷</div>
                                <div style="color: var(--text-secondary);">No Camera Configured</div>
                            </div>
                        `}
                        <button id="btn-config-camera" class="btn btn-secondary btn-sm">Configure RTSP / HTTP Stream</button>
                    </div>
                </div>

                <!-- Mission Timeline -->
                <div class="card" style="grid-column: 1 / -1;">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>Mission Timeline</h3>
                        <button id="btn-add-mq" class="btn btn-secondary btn-sm">+ MQ Sensor Record</button>
                    </div>
                    <div class="card-body">
                        ${activeMission.timeline.length === 0 ? '<p style="color: var(--text-secondary);">No timeline events.</p>' : `
                            <ul style="list-style: none; padding-left: 20px; border-left: 2px solid var(--border-color);">
                                ${activeMission.timeline.map(t => `
                                    <li style="position: relative; margin-bottom: 15px;">
                                        <div style="position: absolute; left: -26px; top: 2px; width: 10px; height: 10px; border-radius: 50%; background-color: var(--accent-primary);"></div>
                                        <div style="font-size: 0.8rem; color: var(--text-secondary);">${new Date(t.timestamp).toLocaleTimeString()}</div>
                                        <div style="font-weight: bold; margin-top: 2px; margin-bottom: 2px;">${t.type}</div>
                                        <div style="font-size: 0.9rem;">${t.details}</div>
                                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 3px;">Source: ${t.source}</div>
                                    </li>
                                `).join('')}
                            </ul>
                        `}
                    </div>
                </div>

            </div>
        `;
    },

    mount: (store) => {
        const drone = store.getActiveDrone();
        if (!drone) return;

        const missions = store.getEnvironmentalMissions().filter(m => m.droneId === drone.id);
        const activeMission = missions.length > 0 ? missions[missions.length - 1] : null;

        // CREATE MISSION
        document.getElementById('btn-create-mission')?.addEventListener('click', () => {
            const missionName = prompt("Enter Mission Name (e.g., Water Body Inspection):");
            if (!missionName) return;

            const newMission = {
                id: crypto.randomUUID(),
                droneId: drone.id,
                name: missionName,
                type: 'WATER INSPECTION',
                status: 'ACTIVE',
                startedAt: new Date().toISOString(),
                waypoints: [],
                observations: [],
                waterSamples: [],
                sensorReadings: [],
                camera: { name: "UNKNOWN", streamUrl: "", status: "UNKNOWN" },
                timeline: [{
                    timestamp: new Date().toISOString(),
                    type: 'MISSION_STARTED',
                    source: 'USER PROVIDED',
                    details: 'Mission created successfully.'
                }]
            };

            store.saveMission(newMission);
            window.dispatchEvent(new CustomEvent('store-updated')); // Trigger re-render
        });

        if (!activeMission) return;

        // ADD OBSERVATION
        document.getElementById('btn-add-observation')?.addEventListener('click', () => {
            const desc = prompt("Enter observation description (e.g., Algae bloom detected):");
            if (!desc) return;
            
            activeMission.observations.push({
                id: `OBS-${Date.now()}`,
                description: desc,
                timestamp: new Date().toISOString()
            });

            activeMission.timeline.unshift({
                timestamp: new Date().toISOString(),
                type: 'OBSERVATION_CREATED',
                source: 'USER PROVIDED',
                details: desc
            });

            store.updateMission(activeMission.id, activeMission);
            window.dispatchEvent(new CustomEvent('store-updated'));
        });

        // ADD WATER SAMPLE
        document.getElementById('btn-add-sample')?.addEventListener('click', () => {
            const sampleId = prompt("Enter Water Sample ID (e.g., WS-001):");
            if (!sampleId) return;

            activeMission.waterSamples.push({
                sampleId,
                status: 'COLLECTED', // PLANNED, COLLECTED, STORED, SENT TO LAB, LAB RESULT AVAILABLE, UNKNOWN
                labResult: 'UNKNOWN',
                timestamp: new Date().toISOString()
            });

            activeMission.timeline.unshift({
                timestamp: new Date().toISOString(),
                type: 'WATER_SAMPLE_COLLECTED',
                source: 'USER PROVIDED',
                details: `Sample ${sampleId} documented as COLLECTED. Result: UNKNOWN.`
            });

            store.updateMission(activeMission.id, activeMission);
            window.dispatchEvent(new CustomEvent('store-updated'));
        });

        // ADD MQ SENSOR RECORD
        document.getElementById('btn-add-mq')?.addEventListener('click', () => {
            const rawValue = prompt("Enter raw sensor reading (e.g., 400 for MQ-135):");
            if (!rawValue) return;

            activeMission.sensorReadings.push({
                model: 'MQ-135',
                rawValue,
                interpretation: 'ENVIRONMENTAL SENSOR READING', // Strict rule: No fake water quality
                timestamp: new Date().toISOString()
            });

            activeMission.timeline.unshift({
                timestamp: new Date().toISOString(),
                type: 'SENSOR_READING',
                source: 'USER PROVIDED',
                details: `Raw value: ${rawValue} (Requires calibration curve to convert to ppm)`
            });

            store.updateMission(activeMission.id, activeMission);
            window.dispatchEvent(new CustomEvent('store-updated'));
        });

        // CONFIG CAMERA
        document.getElementById('btn-config-camera')?.addEventListener('click', () => {
            const url = prompt("Enter RTSP or HTTP stream URL:", activeMission.camera.streamUrl || "rtsp://192.168.1.100/stream");
            if (url) {
                activeMission.camera.streamUrl = url;
                activeMission.camera.status = "CONFIGURED";
                
                activeMission.timeline.unshift({
                    timestamp: new Date().toISOString(),
                    type: 'CAMERA_CONNECTED',
                    source: 'USER PROVIDED',
                    details: `Camera configured to: ${url}`
                });

                store.updateMission(activeMission.id, activeMission);
                window.dispatchEvent(new CustomEvent('store-updated'));
            }
        });

        // END MISSION
        document.getElementById('btn-end-mission')?.addEventListener('click', () => {
            if(confirm("Are you sure you want to end this mission?")) {
                activeMission.status = 'COMPLETED';
                activeMission.endedAt = new Date().toISOString();
                activeMission.timeline.unshift({
                    timestamp: new Date().toISOString(),
                    type: 'MISSION_COMPLETED',
                    source: 'SYSTEM',
                    details: 'Mission formally ended.'
                });
                store.updateMission(activeMission.id, activeMission);
                window.dispatchEvent(new CustomEvent('store-updated'));
            }
        });
    }
};

export default EnvironmentalMissionView;
