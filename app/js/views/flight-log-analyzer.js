const FlightLogAnalyzerView = {
    render: async (store) => {
        const history = store.getFlightLogHistory() || [];
        const activeLog = store.getActiveFlightLog();
        
        let historyHtml = '<div style="color: var(--text-secondary); font-size: 0.9rem;">No flight logs analyzed yet.</div>';
        if (history.length > 0) {
            historyHtml = `
                <ul style="list-style: none; padding: 0; margin: 0;">
                    ${history.map(log => `
                        <li style="padding: 10px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                            <div>
                                <strong>${log.filename}</strong>
                                <div style="font-size: 0.8rem; color: var(--text-secondary);">${new Date(log.uploadedAt).toLocaleString()}</div>
                            </div>
                            <div style="text-align: right;">
                                <span class="badge" style="background-color: ${getGradeColor(log.status)}; color: white; border: none; margin-bottom: 4px; display: inline-block;">${log.status} ${log.healthScore}</span><br>
                                <span style="font-size: 0.75rem; color: var(--text-secondary);">Evidence: ${log.evidenceStatus}</span>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            `;
        }

        let mainContent = `
            <div class="card" style="margin-bottom: 20px;">
                <div class="card-header">
                    <h2>Upload Flight Log</h2>
                </div>
                <div class="card-body">
                    <form id="upload-form" style="display: flex; gap: 10px; align-items: center;">
                        <input type="file" id="bin-file" accept=".bin,.BIN" style="flex: 1; padding: 10px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px;" required>
                        <button type="submit" id="analyze-btn" class="btn btn-primary">Analyze Flight</button>
                    </form>
                    <div id="upload-status" style="margin-top: 10px; font-size: 0.9rem; color: var(--text-secondary);"></div>
                </div>
            </div>
            
            <div class="card" style="margin-bottom: 20px;">
                <div class="card-header">
                    <h2>Flight Log History</h2>
                </div>
                <div class="card-body" style="max-height: 250px; overflow-y: auto;">
                    ${historyHtml}
                </div>
            </div>
        `;

        if (activeLog) {
            mainContent += buildAnalysisHtml(activeLog);
        }

        return `
            <div class="dashboard-grid" style="grid-template-columns: 1fr; gap: 20px;">
                ${mainContent}
            </div>
        `;
    },

    mount: (store) => {
        const form = document.getElementById('upload-form');
        const statusEl = document.getElementById('upload-status');
        const analyzeBtn = document.getElementById('analyze-btn');

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const fileInput = document.getElementById('bin-file');
                const file = fileInput.files[0];
                
                if (!file) return;
                
                statusEl.textContent = "Uploading and parsing... This may take a few moments for large files.";
                statusEl.style.color = "var(--text-secondary)";
                analyzeBtn.disabled = true;

                const formData = new FormData();
                formData.append('file', file);

                try {
                    const response = await fetch('/api/flight-log/analyze', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (data.status === 'ERROR' || !response.ok) {
                        statusEl.textContent = `Error: ${data.message || 'Analysis failed'}`;
                        statusEl.style.color = "var(--danger-color)";
                    } else {
                        statusEl.textContent = "Analysis complete!";
                        statusEl.style.color = "var(--success-color)";
                        
                        store.setActiveFlightLog(data);
                        store.addFlightLogToHistory(data);
                        
                        window.dispatchEvent(new CustomEvent('store-updated'));
                    }
                } catch (err) {
                    statusEl.textContent = `Error: ${err.message}`;
                    statusEl.style.color = "var(--danger-color)";
                } finally {
                    analyzeBtn.disabled = false;
                }
            });
        }
        
        const activeLog = store.getActiveFlightLog();
        if (activeLog) {
            renderCharts(activeLog);
        }
    }
};

function getGradeColor(grade) {
    switch(grade) {
        case 'GOOD':
        case 'COMPLETE': return 'var(--success-color, #10b981)';
        case 'CAUTION':
        case 'LIMITED': return 'var(--warning-color, #f59e0b)';
        case 'WARNING': return '#f97316';
        case 'CRITICAL':
        case 'INSUFFICIENT': return 'var(--danger-color, #ef4444)';
        default: return 'var(--text-secondary, #9ca3af)';
    }
}

function renderModeTimeline(modes) {
    if (!modes || modes.length === 0) return '<p style="color:var(--text-secondary)">UNKNOWN - MODE telemetry not present.</p>';
    
    // Convert modes array to a simple table
    const getModeName = (modeNum) => {
        const modeMap = { 0: 'STABILIZE', 1: 'ACRO', 2: 'ALT_HOLD', 3: 'AUTO', 4: 'GUIDED', 5: 'LOITER', 6: 'RTL', 7: 'CIRCLE', 9: 'LAND' };
        return modeMap[modeNum] || `MODE_${modeNum}`;
    };

    let tableHtml = `
        <table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <th style="padding: 10px 5px;">Time (us)</th>
                    <th style="padding: 10px 5px;">Flight Mode</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    modes.forEach(m => {
        tableHtml += `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 8px 5px;">${m.time}</td>
                <td style="padding: 8px 5px;"><strong>${getModeName(m.mode)}</strong></td>
            </tr>
        `;
    });
    
    tableHtml += `</tbody></table>`;
    return tableHtml;
}

function buildAnalysisHtml(log) {
    const meta = log.metadata || {};
    const summary = log.summary || {};
    const health = log.healthScore || { score: 0, grade: 'UNKNOWN', evidenceStatus: 'UNKNOWN' };
    const dq = log.dataQuality || {};
    const events = log.events || [];
    
    const val = (v, suffix = '') => v === 'UNKNOWN' || v === undefined ? `<span style="color:var(--text-secondary)">UNKNOWN</span>` : `${Number(v).toFixed(2)}${suffix}`;

    // Diagnostic Summary Table Rows
    let diagRows = '';
    
    const buildRow = (title, status, evidence, interpretation) => `
        <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 10px;"><strong>${title}</strong></td>
            <td style="padding: 10px;"><span class="badge" style="background-color: ${getGradeColor(status)}; color: white; border: none;">${status}</span></td>
            <td style="padding: 10px; font-size: 0.85rem;">${evidence}</td>
            <td style="padding: 10px; font-size: 0.85rem;">${interpretation}</td>
        </tr>
    `;

    // Battery Diag
    if (summary.battery === 'UNKNOWN') {
        diagRows += buildRow('Battery', 'UNKNOWN', 'BAT telemetry missing', 'Insufficient data to diagnose battery health.');
    } else {
        const hasSag = events.some(e => e.code === 'VOLTAGE_SAG');
        const hasSpike = events.some(e => e.code === 'CURRENT_SPIKE');
        const batStatus = (hasSag || hasSpike) ? 'WARNING' : 'GOOD';
        const batEvidence = `Avg ${val(summary.battery.avg_voltage, 'V')}, Peak ${val(summary.battery.peak_current, 'A')}`;
        const batInterp = hasSag ? 'Voltage sag detected under load.' : hasSpike ? 'Current spikes detected.' : 'Battery operating within expected parameters.';
        diagRows += buildRow('Battery', batStatus, batEvidence, batInterp);
    }
    
    // GPS Diag
    if (summary.gps === 'UNKNOWN') {
        diagRows += buildRow('GPS', 'UNKNOWN', 'GPS telemetry missing', 'Insufficient data to diagnose navigation health.');
    } else {
        const hasDegradation = events.some(e => e.code === 'GPS_DEGRADED' || e.code === 'GPS_SIGNAL_LOSS');
        const gpsStatus = hasDegradation ? 'WARNING' : 'GOOD';
        const gpsEvidence = `Avg HDOP: ${val(summary.gps.avg_hdop)}, Avg Sats: ${val(summary.gps.avg_sats)}`;
        const gpsInterp = hasDegradation ? 'Signal degradation detected.' : 'Solid GPS lock maintained.';
        diagRows += buildRow('GPS', gpsStatus, gpsEvidence, gpsInterp);
    }
    
    // Vibe Diag
    if (summary.vibration === 'UNKNOWN') {
        diagRows += buildRow('Vibration', 'UNKNOWN', 'VIBE telemetry missing', 'Insufficient data to diagnose mechanical health.');
    } else {
        const hasHighVibe = events.some(e => e.code === 'VIBRATION_ELEVATED');
        const vibeStatus = hasHighVibe ? 'WARNING' : 'GOOD';
        const vibeEvidence = `Peak Z: ${val(summary.vibration.max_z)}`;
        const vibeInterp = hasHighVibe ? 'High vibration levels detected. Inspect props and motors.' : 'Vibrations within normal limits.';
        diagRows += buildRow('Vibration', vibeStatus, vibeEvidence, vibeInterp);
    }

    // EKF Diag
    if (summary.ekf === 'UNKNOWN') {
        diagRows += buildRow('Navigation (EKF)', 'UNKNOWN', 'NKF/XKF telemetry missing', 'EKF estimators unavailable.');
    } else {
        const ekfEvidence = `POS: ${summary.ekf.pos_present ? 'Yes' : 'No'}, XKF: ${summary.ekf.xkf_present ? 'Yes' : 'No'}`;
        diagRows += buildRow('Navigation (EKF)', summary.ekf.xkf_present ? 'GOOD' : 'LIMITED', ekfEvidence, 'EKF active.');
    }
    
    // RC Diag
    if (summary.rc === 'UNKNOWN') {
        diagRows += buildRow('RC Input', 'UNKNOWN', 'RCIN telemetry missing', 'Receiver commands unrecorded.');
    } else {
        diagRows += buildRow('RC Input', 'GOOD', `C3 Throttle Avg: ${val(summary.rc.c3_avg)}`, 'RC receiver commands active.');
    }

    return `
        <!-- Top Row: File Info, Health, Data Quality -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px;">
            <div class="card">
                <div class="card-header"><h3>FLIGHT OVERVIEW</h3></div>
                <div class="card-body">
                    <p><strong>Filename:</strong> ${log.filename}</p>
                    <p><strong>Format:</strong> ${log.format}</p>
                    <p><strong>Duration:</strong> ${meta.durationSeconds}s</p>
                    <p><strong>Firmware:</strong> ${meta.firmware}</p>
                    <p><strong>Vehicle:</strong> ${meta.vehicleType}</p>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header"><h3>FLIGHT HEALTH</h3></div>
                <div class="card-body" style="text-align: center;">
                    <div style="font-size: 3rem; font-weight: 700; color: ${getGradeColor(health.grade)};">${health.score} <span style="font-size: 1rem; color: var(--text-secondary);">/ 100</span></div>
                    <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 5px; color: ${getGradeColor(health.grade)};">${health.grade}</div>
                    <div style="font-size: 0.9rem; margin-bottom: 15px; color: var(--text-primary);">Evidence Status: <span style="font-weight: bold; color: ${getGradeColor(health.evidenceStatus)};">${health.evidenceStatus}</span></div>
                    <ul style="text-align: left; list-style: none; padding: 0; font-size: 0.85rem; color: var(--danger-color);">
                        ${(health.deductions || []).map(d => `<li>${d}</li>`).join('')}
                    </ul>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header"><h3>DATA QUALITY</h3></div>
                <div class="card-body">
                    <p><strong>Completeness:</strong> ${dq.completenessPercent}%</p>
                    <p><strong>Diagnostic Coverage:</strong> <span style="font-weight: bold; color: ${getGradeColor(dq.coverage)};">${dq.coverage}</span></p>
                    <p><strong>Available:</strong> <span style="color: var(--success-color); font-size: 0.85rem;">${(dq.knownChannels || []).join(', ')}</span></p>
                    <p><strong>Unavailable:</strong> <span style="color: var(--text-secondary); font-size: 0.85rem;">${(dq.unknownChannels || []).join(', ')}</span></p>
                </div>
            </div>
        </div>

        <!-- Diagnostic Summary -->
        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header"><h3>ENGINEERING DIAGNOSTIC SUMMARY</h3></div>
            <div class="card-body" style="overflow-x: auto;">
                <table style="width: 100%; text-align: left; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border-color);">
                            <th style="padding: 10px;">Subsystem</th>
                            <th style="padding: 10px;">Status</th>
                            <th style="padding: 10px;">Observed Evidence</th>
                            <th style="padding: 10px;">Engineering Interpretation</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${diagRows}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Detailed Analytics Grids -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px;">
            <div class="card">
                <div class="card-header"><h3>BATTERY</h3></div>
                <div class="card-body">
                    ${summary.battery === 'UNKNOWN' ? '<p style="color:var(--text-secondary)">UNKNOWN - BAT telemetry not present.</p>' : `
                        <p><strong>Avg Voltage:</strong> ${val(summary.battery?.avg_voltage, 'V')}</p>
                        <p><strong>Min Voltage:</strong> ${val(summary.battery?.min_voltage, 'V')}</p>
                        <p><strong>Max Voltage:</strong> ${val(summary.battery?.max_voltage, 'V')}</p>
                        <p><strong>Avg Current:</strong> ${val(summary.battery?.avg_current, 'A')}</p>
                        <p><strong>Peak Current:</strong> ${val(summary.battery?.peak_current, 'A')}</p>
                    `}
                </div>
            </div>
            
            <div class="card">
                <div class="card-header"><h3>GPS</h3></div>
                <div class="card-body">
                    ${summary.gps === 'UNKNOWN' ? '<p style="color:var(--text-secondary)">UNKNOWN - GPS telemetry not present.</p>' : `
                        <p><strong>Avg HDOP:</strong> ${val(summary.gps?.avg_hdop)}</p>
                        <p><strong>Max HDOP:</strong> ${val(summary.gps?.max_hdop)}</p>
                        <p><strong>Avg Sats:</strong> ${val(summary.gps?.avg_sats)}</p>
                        <p><strong>Min Sats:</strong> ${val(summary.gps?.min_sats)}</p>
                        <p><strong>Max Sats:</strong> ${val(summary.gps?.max_sats)}</p>
                    `}
                </div>
            </div>
            
            <div class="card">
                <div class="card-header"><h3>VIBRATION</h3></div>
                <div class="card-body">
                    ${summary.vibration === 'UNKNOWN' ? '<p style="color:var(--text-secondary)">UNKNOWN - VIBE telemetry not present.</p>' : `
                        <p><strong>Peak Vibe Z:</strong> ${val(summary.vibration?.max_z)}</p>
                        <p><strong>Avg Vibe Z:</strong> ${val(summary.vibration?.avg_z)}</p>
                    `}
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h3>RC INPUT</h3></div>
                <div class="card-body">
                    ${summary.rc === 'UNKNOWN' ? '<p style="color:var(--text-secondary)">UNKNOWN - RCIN telemetry not present.</p>' : `
                        <p><strong>Roll (Ch1):</strong> Min ${val(summary.rc?.c1_min)}, Max ${val(summary.rc?.c1_max)}</p>
                        <p><strong>Pitch (Ch2):</strong> Min ${val(summary.rc?.c2_min)}, Max ${val(summary.rc?.c2_max)}</p>
                        <p><strong>Throttle (Ch3):</strong> Min ${val(summary.rc?.c3_min)}, Max ${val(summary.rc?.c3_max)}</p>
                        <p><strong>Yaw (Ch4):</strong> Min ${val(summary.rc?.c4_min)}, Max ${val(summary.rc?.c4_max)}</p>
                    `}
                </div>
            </div>
        </div>
        
        <!-- Flight Modes & Events -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 20px;">
            <div class="card">
                <div class="card-header"><h3>FLIGHT MODES TIMELINE</h3></div>
                <div class="card-body">
                    ${renderModeTimeline(log.flightModes)}
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h3>EVENTS</h3></div>
                <div class="card-body">
                    ${events.length === 0 ? '<p style="color:var(--text-secondary)">No significant events detected.</p>' : `
                        <table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 0.9rem;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border-color);">
                                    <th style="padding: 5px;">Time</th>
                                    <th style="padding: 5px;">Event</th>
                                    <th style="padding: 5px;">Severity</th>
                                    <th style="padding: 5px;">Evidence</th>
                                    <th style="padding: 5px;">Source</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${events.map(e => `
                                    <tr style="border-bottom: 1px solid var(--border-color);">
                                        <td style="padding: 5px;">${e.timestamp || 'N/A'}</td>
                                        <td style="padding: 5px;"><strong>${e.code}</strong></td>
                                        <td style="padding: 5px;"><span class="badge" style="background-color: ${e.severity === 'HIGH' || e.severity === 'CRITICAL' ? 'var(--danger-color)' : e.severity === 'WARNING' || e.severity === 'MEDIUM' ? 'var(--warning-color)' : 'var(--text-secondary)'}; color: white; border: none;">${e.severity}</span></td>
                                        <td style="padding: 5px;">${e.evidence}</td>
                                        <td style="padding: 5px; font-size: 0.75rem; color: var(--text-secondary);">${e.source}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                </div>
            </div>
        </div>
        
        <!-- Charts -->
        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header"><h3>Battery Telemetry</h3></div>
            <div class="card-body" style="height: 300px;">
                ${log.channels?.BAT?.available ? '<canvas id="bat-chart"></canvas>' : '<p style="color:var(--text-secondary); text-align:center; padding-top: 50px;">UNKNOWN - BAT telemetry not present.</p>'}
            </div>
        </div>
        
        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header"><h3>Vibration Telemetry</h3></div>
            <div class="card-body" style="height: 300px;">
                ${log.channels?.VIBE?.available ? '<canvas id="vibe-chart"></canvas>' : '<p style="color:var(--text-secondary); text-align:center; padding-top: 50px;">UNKNOWN - VIBE telemetry not present.</p>'}
            </div>
        </div>
        
        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header"><h3>RC Input (Throttle)</h3></div>
            <div class="card-body" style="height: 300px;">
                ${log.channels?.RCIN?.available ? '<canvas id="rc-chart"></canvas>' : '<p style="color:var(--text-secondary); text-align:center; padding-top: 50px;">UNKNOWN - RCIN telemetry not present.</p>'}
            </div>
        </div>

        <div class="card" style="margin-bottom: 20px;">
            <div class="card-header"><h3>Motor Outputs</h3></div>
            <div class="card-body" style="height: 300px;">
                ${log.channels?.RCOU?.available ? '<canvas id="rcou-chart"></canvas>' : '<p style="color:var(--text-secondary); text-align:center; padding-top: 50px;">UNKNOWN - RCOU telemetry not present.</p>'}
            </div>
        </div>
    `;
}

function renderCharts(log) {
    if (!window.Chart) return;
    
    // Battery Chart
    if (log.channels?.BAT?.available && log.channels.BAT.samples) {
        const ctx = document.getElementById('bat-chart');
        if (ctx) {
            const data = log.channels.BAT.samples;
            const labels = data.map((_, i) => i);
            const volts = data.map(d => d.volt);
            const currs = data.map(d => d.curr);
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        { label: 'Voltage (V)', data: volts, borderColor: '#3b82f6', yAxisID: 'y', tension: 0.1, pointRadius: 0 },
                        { label: 'Current (A)', data: currs, borderColor: '#ef4444', yAxisID: 'y1', tension: 0.1, pointRadius: 0 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                    scales: {
                        y: { type: 'linear', display: true, position: 'left', title: {display: true, text: 'Voltage (V)'} },
                        y1: { type: 'linear', display: true, position: 'right', title: {display: true, text: 'Current (A)'}, grid: {drawOnChartArea: false} }
                    }
                }
            });
        }
    }
    
    // Vibration Chart
    if (log.channels?.VIBE?.available && log.channels.VIBE.samples) {
        const ctx = document.getElementById('vibe-chart');
        if (ctx) {
            const data = log.channels.VIBE.samples;
            const labels = data.map((_, i) => i);
            const vx = data.map(d => d.vibeX);
            const vy = data.map(d => d.vibeY);
            const vz = data.map(d => d.vibeZ);
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        { label: 'Vibe X', data: vx, borderColor: '#3b82f6', tension: 0.1, pointRadius: 0, borderWidth: 1 },
                        { label: 'Vibe Y', data: vy, borderColor: '#10b981', tension: 0.1, pointRadius: 0, borderWidth: 1 },
                        { label: 'Vibe Z', data: vz, borderColor: '#ef4444', tension: 0.1, pointRadius: 0, borderWidth: 1 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { title: {display: true, text: 'Vibration Level'} } } }
            });
        }
    }
    
    // RCIN Chart
    if (log.channels?.RCIN?.available && log.channels.RCIN.samples) {
        const ctx = document.getElementById('rc-chart');
        if (ctx) {
            const data = log.channels.RCIN.samples;
            const labels = data.map((_, i) => i);
            const c3 = data.map(d => d.c3); // Throttle
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        { label: 'Throttle (Ch3)', data: c3, borderColor: '#8b5cf6', tension: 0.1, pointRadius: 0, borderWidth: 1 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { title: {display: true, text: 'PWM Value'} } } }
            });
        }
    }
    
    // RCOU Chart
    if (log.channels?.RCOU?.available && log.channels.RCOU.samples) {
        const ctx = document.getElementById('rcou-chart');
        if (ctx) {
            const data = log.channels.RCOU.samples;
            const labels = data.map((_, i) => i);
            const c1 = data.map(d => d.c1);
            const c2 = data.map(d => d.c2);
            const c3 = data.map(d => d.c3);
            const c4 = data.map(d => d.c4);
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        { label: 'Motor 1', data: c1, borderColor: '#ef4444', tension: 0.1, pointRadius: 0, borderWidth: 1 },
                        { label: 'Motor 2', data: c2, borderColor: '#3b82f6', tension: 0.1, pointRadius: 0, borderWidth: 1 },
                        { label: 'Motor 3', data: c3, borderColor: '#10b981', tension: 0.1, pointRadius: 0, borderWidth: 1 },
                        { label: 'Motor 4', data: c4, borderColor: '#f59e0b', tension: 0.1, pointRadius: 0, borderWidth: 1 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { title: {display: true, text: 'PWM Value'} } } }
            });
        }
    }
}

export default FlightLogAnalyzerView;
