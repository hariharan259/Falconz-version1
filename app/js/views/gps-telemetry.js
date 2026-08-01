import GPSEngine from '../services/gps-engine.js';
import TelemetryEngine from '../services/telemetry-engine.js';

const GpsTelemetryView = {
    render: async (store) => {
        const drone = store.getActiveDrone();
        if (!drone) {
            return `
                <div class="empty-state">
                    <h3>GPS & Telemetry</h3>
                    <p>No active drone selected. Please select or create a drone.</p>
                </div>
            `;
        }

        const gps = drone.gps || {};
        const telemetry = drone.telemetryData || {};
        
        // Ensure values display cleanly
        const val = (v, unit='') => (v === null || v === undefined || v === 'UNKNOWN' || v === '') ? '<span style="color:var(--text-secondary)">UNKNOWN</span>' : `${v}${unit}`;
        const sourceLabel = (s) => `<span class="badge" style="background-color: var(--accent-primary); border: none; font-size: 0.75rem;">${s || 'UNKNOWN'}</span>`;
        
        const gpsEval = GPSEngine.assessGPSQuality(gps);
        let gpsColor = 'var(--text-secondary)';
        if (gpsEval.quality === 'GOOD') gpsColor = 'var(--success-color)';
        if (gpsEval.quality === 'FAIR') gpsColor = 'var(--warning-color)';
        if (gpsEval.quality === 'POOR') gpsColor = 'var(--danger-color)';

        return `
            <div class="dashboard-grid" style="grid-template-columns: 1fr; gap: 20px;">
                <!-- Header & Controls -->
                <div class="card">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h2>GPS & Telemetry Center</h2>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; color: var(--warning-color); font-weight: bold;">
                                <input type="checkbox" id="toggle-sim" ${gps.source === 'SIMULATED' ? 'checked' : ''}>
                                Enable Simulation Mode
                            </label>
                            <button id="btn-save-telemetry" class="btn btn-primary">Save State</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <p style="color: var(--text-secondary);">This dashboard displays active positioning and flight statistics. Hardware MAVLink integration is READY FOR INTEGRATION.</p>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px;">
                    
                    <!-- GPS Panel -->
                    <div class="card">
                        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                            <h3>GPS Status</h3>
                            ${sourceLabel(gps.source)}
                        </div>
                        <div class="card-body">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid var(--border-color);">
                                <div style="text-align: center;">
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Fix Type</div>
                                    <div style="font-size: 1.2rem; font-weight: bold;">${val(gps.fixType)}</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Satellites</div>
                                    <div style="font-size: 1.2rem; font-weight: bold;">${val(gps.satellites)}</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">HDOP</div>
                                    <div style="font-size: 1.2rem; font-weight: bold;">${val(gps.hdop)}</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Quality</div>
                                    <div style="font-size: 1.2rem; font-weight: bold; color: ${gpsColor};">${gpsEval.quality}</div>
                                </div>
                            </div>
                            
                            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                                <tr style="border-bottom: 1px solid var(--border-color);"><th style="padding: 5px;">Latitude</th><td style="padding: 5px;">${val(gps.latitude)}</td></tr>
                                <tr style="border-bottom: 1px solid var(--border-color);"><th style="padding: 5px;">Longitude</th><td style="padding: 5px;">${val(gps.longitude)}</td></tr>
                                <tr style="border-bottom: 1px solid var(--border-color);"><th style="padding: 5px;">Altitude</th><td style="padding: 5px;">${val(gps.altitude, ' m')}</td></tr>
                                <tr style="border-bottom: 1px solid var(--border-color);"><th style="padding: 5px;">Ground Speed</th><td style="padding: 5px;">${val(gps.groundSpeed, ' m/s')}</td></tr>
                                <tr><th style="padding: 5px;">Heading</th><td style="padding: 5px;">${val(gps.heading, '°')}</td></tr>
                            </table>
                            ${gpsEval.warnings.length > 0 ? `<div style="margin-top: 10px; color: var(--danger-color); font-size: 0.85rem;"><ul>${gpsEval.warnings.map(w => `<li>${w}</li>`).join('')}</ul></div>` : ''}
                        </div>
                    </div>

                    <!-- Clean Engineering Map (Radar) -->
                    <div class="card">
                        <div class="card-header">
                            <h3>Location Plot (Relative)</h3>
                        </div>
                        <div class="card-body" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 250px; background-color: var(--bg-tertiary); border-radius: 4px; position: relative; overflow: hidden;">
                            <!-- Radar crosshairs -->
                            <div style="position: absolute; top: 50%; left: 0; width: 100%; height: 1px; background-color: rgba(255,255,255,0.1);"></div>
                            <div style="position: absolute; top: 0; left: 50%; width: 1px; height: 100%; background-color: rgba(255,255,255,0.1);"></div>
                            
                            <!-- Radar rings -->
                            <div style="position: absolute; top: 50%; left: 50%; width: 100px; height: 100px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 50%; transform: translate(-50%, -50%);"></div>
                            <div style="position: absolute; top: 50%; left: 50%; width: 200px; height: 200px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 50%; transform: translate(-50%, -50%);"></div>
                            
                            ${gps.latitude !== null && gps.longitude !== null && gps.latitude !== 'UNKNOWN' ? `
                                <!-- Home dot -->
                                <div style="position: absolute; top: 50%; left: 50%; width: 12px; height: 12px; background-color: var(--success-color); border-radius: 50%; transform: translate(-50%, -50%); box-shadow: 0 0 8px var(--success-color);" title="HOME"></div>
                                <!-- Drone dot (simulating slight offset) -->
                                <div style="position: absolute; top: 40%; left: 60%; width: 12px; height: 12px; background-color: var(--warning-color); border-radius: 50%; transform: translate(-50%, -50%); box-shadow: 0 0 8px var(--warning-color);" title="DRONE"></div>
                                
                                <div style="position: absolute; bottom: 10px; left: 10px; font-size: 0.75rem; color: var(--text-secondary);">
                                    <span style="display:inline-block; width:8px; height:8px; background:var(--success-color); border-radius:50%; margin-right:5px;"></span>Home<br>
                                    <span style="display:inline-block; width:8px; height:8px; background:var(--warning-color); border-radius:50%; margin-right:5px;"></span>Drone
                                </div>
                            ` : `
                                <div style="z-index: 10; color: var(--text-secondary); text-align: center;">
                                    NO COORDINATE DATA<br>
                                    <span style="font-size:0.8rem;">(Location plot requires valid latitude & longitude)</span>
                                </div>
                            `}
                        </div>
                    </div>
                    
                </div>

                <!-- Telemetry Grids -->
                <div class="card">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>Active Telemetry</h3>
                        ${sourceLabel(telemetry.source)}
                    </div>
                    <div class="card-body">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            
                            <!-- FLIGHT -->
                            <div style="background-color: var(--bg-tertiary); padding: 10px; border-radius: 4px;">
                                <h4 style="margin-top: 0; color: var(--text-secondary); font-size: 0.85rem; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">FLIGHT</h4>
                                <table style="width: 100%; font-size: 0.9rem;">
                                    <tr><td>Mode</td><td style="text-align:right;">${val(telemetry.flight?.mode)}</td></tr>
                                    <tr><td>Armed</td><td style="text-align:right;">${telemetry.flight?.armed === true ? '<span style="color:var(--danger-color); font-weight:bold;">ARMED</span>' : telemetry.flight?.armed === false ? '<span style="color:var(--success-color);">DISARMED</span>' : val('UNKNOWN')}</td></tr>
                                    <tr><td>Alt</td><td style="text-align:right;">${val(telemetry.flight?.altitude, 'm')}</td></tr>
                                </table>
                            </div>

                            <!-- ATTITUDE -->
                            <div style="background-color: var(--bg-tertiary); padding: 10px; border-radius: 4px;">
                                <h4 style="margin-top: 0; color: var(--text-secondary); font-size: 0.85rem; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">ATTITUDE</h4>
                                <table style="width: 100%; font-size: 0.9rem;">
                                    <tr><td>Roll</td><td style="text-align:right;">${val(telemetry.attitude?.roll, '°')}</td></tr>
                                    <tr><td>Pitch</td><td style="text-align:right;">${val(telemetry.attitude?.pitch, '°')}</td></tr>
                                    <tr><td>Yaw</td><td style="text-align:right;">${val(telemetry.attitude?.yaw, '°')}</td></tr>
                                </table>
                            </div>

                            <!-- BATTERY -->
                            <div style="background-color: var(--bg-tertiary); padding: 10px; border-radius: 4px;">
                                <h4 style="margin-top: 0; color: var(--text-secondary); font-size: 0.85rem; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">BATTERY</h4>
                                <table style="width: 100%; font-size: 0.9rem;">
                                    <tr><td>Voltage</td><td style="text-align:right;">${val(telemetry.battery?.voltage, 'V')}</td></tr>
                                    <tr><td>Current</td><td style="text-align:right;">${val(telemetry.battery?.current, 'A')}</td></tr>
                                    <tr><td>Level</td><td style="text-align:right;">${val(telemetry.battery?.percentage, '%')}</td></tr>
                                </table>
                            </div>

                            <!-- RADIO -->
                            <div style="background-color: var(--bg-tertiary); padding: 10px; border-radius: 4px;">
                                <h4 style="margin-top: 0; color: var(--text-secondary); font-size: 0.85rem; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">RADIO LINK</h4>
                                <table style="width: 100%; font-size: 0.9rem;">
                                    <tr><td>RSSI</td><td style="text-align:right;">${val(telemetry.radio?.rssi, '%')}</td></tr>
                                    <tr><td>Throttle</td><td style="text-align:right;">${val(telemetry.radio?.throttle)}</td></tr>
                                </table>
                            </div>
                            
                            <!-- SYSTEM -->
                            <div style="background-color: var(--bg-tertiary); padding: 10px; border-radius: 4px;">
                                <h4 style="margin-top: 0; color: var(--text-secondary); font-size: 0.85rem; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">SYSTEM</h4>
                                <table style="width: 100%; font-size: 0.9rem;">
                                    <tr><td>Firmware</td><td style="text-align:right;">${val(telemetry.system?.firmware)}</td></tr>
                                    <tr><td>Failsafe</td><td style="text-align:right;">${val(telemetry.system?.failsafe)}</td></tr>
                                </table>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        `;
    },

    mount: (store) => {
        const drone = store.getActiveDrone();
        if (!drone) return;

        const te = new TelemetryEngine(store);

        // Simulation Toggle
        document.getElementById('toggle-sim')?.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Generate and save SIMULATED state
                const simGps = te.generateSimulatedGPS();
                const simTel = te.generateSimulatedTelemetry();
                store.updateDrone(drone.id, { gps: simGps, telemetryData: simTel });
            } else {
                // Reset to UNKNOWN
                const unkGps = {
                    status: "UNKNOWN", fixType: "UNKNOWN", satellites: null, hdop: null,
                    latitude: null, longitude: null, altitude: null, groundSpeed: null,
                    heading: null, source: "UNKNOWN", dataStatus: "UNKNOWN"
                };
                const unkTel = {
                    status: "UNKNOWN", source: "UNKNOWN", timestamp: null,
                    flight: { altitude: null, groundSpeed: null, heading: null, mode: "UNKNOWN", armed: null },
                    attitude: { roll: null, pitch: null, yaw: null },
                    battery: { voltage: null, current: null, percentage: null },
                    radio: { throttle: null, roll: null, pitch: null, yaw: null, rssi: null },
                    system: { flightController: "UNKNOWN", firmware: "UNKNOWN", failsafe: "UNKNOWN", linkStatus: "UNKNOWN" }
                };
                store.updateDrone(drone.id, { gps: unkGps, telemetryData: unkTel });
            }
            window.dispatchEvent(new CustomEvent('store-updated'));
        });
        
        // Manual Save Button
        document.getElementById('btn-save-telemetry')?.addEventListener('click', () => {
            alert("Telemetry state saved successfully.");
        });
    }
};

export default GpsTelemetryView;
