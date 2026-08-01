import PIDEngine from '../services/pid-engine.js';

const PRESETS = {
    BEGINNER: {
        roll: { p: 40, i: 40, d: 20, ff: 0 },
        pitch: { p: 40, i: 40, d: 20, ff: 0 },
        yaw: { p: 40, i: 40, d: 0, ff: 0 },
        rates: { roll: 300, pitch: 300, yaw: 300 },
        expo: { roll: 0.3, pitch: 0.3, yaw: 0.3 }
    },
    STABLE: {
        roll: { p: 45, i: 50, d: 25, ff: 50 },
        pitch: { p: 45, i: 50, d: 25, ff: 50 },
        yaw: { p: 45, i: 50, d: 0, ff: 50 },
        rates: { roll: 400, pitch: 400, yaw: 400 },
        expo: { roll: 0.2, pitch: 0.2, yaw: 0.2 }
    },
    BALANCED: {
        roll: { p: 50, i: 60, d: 30, ff: 90 },
        pitch: { p: 50, i: 60, d: 30, ff: 90 },
        yaw: { p: 50, i: 60, d: 0, ff: 90 },
        rates: { roll: 600, pitch: 600, yaw: 500 },
        expo: { roll: 0.15, pitch: 0.15, yaw: 0.15 }
    },
    AGILE: {
        roll: { p: 60, i: 70, d: 35, ff: 120 },
        pitch: { p: 60, i: 70, d: 35, ff: 120 },
        yaw: { p: 60, i: 70, d: 0, ff: 120 },
        rates: { roll: 800, pitch: 800, yaw: 700 },
        expo: { roll: 0.1, pitch: 0.1, yaw: 0.1 }
    }
};

const PidTuningView = {
    render: async (store) => {
        const drone = store.getActiveDrone();
        if (!drone) {
            return `
                <div class="empty-state">
                    <h3>PID Tuning</h3>
                    <p>No active drone selected. Please select or create a drone to configure PIDs.</p>
                </div>
            `;
        }

        const pid = drone.pid || {
            roll: { p: '', i: '', d: '', ff: '' },
            pitch: { p: '', i: '', d: '', ff: '' },
            yaw: { p: '', i: '', d: '', ff: '' },
            rates: { roll: '', pitch: '', yaw: '' },
            expo: { roll: '', pitch: '', yaw: '' }
        };
        
        const presets = drone.pidPresets || [];
        const presetOptions = [
            '<option value="">-- Load Preset --</option>',
            '<optgroup label="System Presets (STARTING POINT ONLY)">',
            '<option value="BEGINNER">BEGINNER</option>',
            '<option value="STABLE">STABLE</option>',
            '<option value="BALANCED">BALANCED</option>',
            '<option value="AGILE">AGILE</option>',
            '</optgroup>',
            presets.length > 0 ? '<optgroup label="Custom Presets">' : '',
            ...presets.map((p, idx) => `<option value="CUSTOM_${idx}">${p.name}</option>`),
            presets.length > 0 ? '</optgroup>' : ''
        ].join('');

        const engine = new PIDEngine(store);
        const validation = engine.validatePID(pid);
        
        let validationHtml = '';
        if (validation.warnings.length > 0 || validation.recommendations.length > 0 || validation.unknowns.length > 0) {
            validationHtml = `
                <div class="card" style="margin-top: 20px; border-left: 4px solid ${validation.status === 'WARNING' ? 'var(--warning-color)' : 'var(--text-secondary)'};">
                    <div class="card-body">
                        <h4 style="margin-top:0;">Validation: <span style="color: ${validation.status === 'WARNING' ? 'var(--warning-color)' : 'var(--text-secondary)'};">${validation.status}</span></h4>
                        ${validation.warnings.length > 0 ? `<div style="color: var(--warning-color); margin-bottom: 10px;"><strong>Warnings:</strong><ul>${validation.warnings.map(w => `<li>${w}</li>`).join('')}</ul></div>` : ''}
                        ${validation.recommendations.length > 0 ? `<div style="color: var(--success-color); margin-bottom: 10px;"><strong>Recommendations:</strong><ul>${validation.recommendations.map(r => `<li>${r}</li>`).join('')}</ul></div>` : ''}
                        ${validation.unknowns.length > 0 ? `<div style="color: var(--text-secondary);"><strong>Unknowns:</strong><ul>${validation.unknowns.map(u => `<li>${u}</li>`).join('')}</ul></div>` : ''}
                    </div>
                </div>
            `;
        } else {
            validationHtml = `
                <div class="card" style="margin-top: 20px; border-left: 4px solid var(--success-color);">
                    <div class="card-body">
                        <h4 style="margin-top:0; color: var(--success-color);">Validation: OK</h4>
                        <p>No critical syntax or range issues detected. Note: This does not guarantee flight stability.</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="dashboard-grid" style="grid-template-columns: 1fr; gap: 20px;">
                <div class="card">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h2>PID Tuning Engine</h2>
                        <div style="display: flex; gap: 10px;">
                            <select id="pid-preset-select" class="form-control" style="width: 250px;">
                                ${presetOptions}
                            </select>
                            <button id="btn-save-preset" class="btn btn-secondary">Save Custom</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <p style="color: var(--warning-color); font-weight: bold; margin-bottom: 10px;">⚠️ SAFETY WARNING: Incorrect PID tuning can cause flyaways or motor fires.</p>
                        <p style="color: var(--text-secondary);">System presets are merely STARTING POINTS. Ensure propellers are removed when bench testing.</p>
                        
                        <div style="overflow-x: auto; margin-top: 20px;">
                            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                                <thead>
                                    <tr style="border-bottom: 2px solid var(--border-color);">
                                        <th style="padding: 10px;">Axis</th>
                                        <th style="padding: 10px;">P (Proportional)</th>
                                        <th style="padding: 10px;">I (Integral)</th>
                                        <th style="padding: 10px;">D (Derivative)</th>
                                        <th style="padding: 10px;">FF (Feedforward)</th>
                                        <th style="padding: 10px;">Rate (deg/s)</th>
                                        <th style="padding: 10px;">Expo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${['roll', 'pitch', 'yaw'].map(axis => `
                                        <tr style="border-bottom: 1px solid var(--border-color);">
                                            <td style="padding: 10px;"><strong>${axis.toUpperCase()}</strong></td>
                                            <td style="padding: 10px;"><input type="number" class="form-control pid-val" data-axis="${axis}" data-field="p" value="${pid[axis]?.p ?? ''}" style="width:80px;"></td>
                                            <td style="padding: 10px;"><input type="number" class="form-control pid-val" data-axis="${axis}" data-field="i" value="${pid[axis]?.i ?? ''}" style="width:80px;"></td>
                                            <td style="padding: 10px;"><input type="number" class="form-control pid-val" data-axis="${axis}" data-field="d" value="${pid[axis]?.d ?? ''}" style="width:80px;"></td>
                                            <td style="padding: 10px;"><input type="number" class="form-control pid-val" data-axis="${axis}" data-field="ff" value="${pid[axis]?.ff ?? ''}" style="width:80px;"></td>
                                            <td style="padding: 10px;"><input type="number" class="form-control pid-val" data-axis="rates" data-field="${axis}" value="${pid.rates?.[axis] ?? ''}" style="width:80px;"></td>
                                            <td style="padding: 10px;"><input type="number" class="form-control pid-val" data-axis="expo" data-field="${axis}" value="${pid.expo?.[axis] ?? ''}" style="width:80px;" step="0.01"></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        
                        <div style="margin-top: 20px; display: flex; gap: 10px;">
                            <button id="btn-save-pids" class="btn btn-primary">Save PID Configuration</button>
                            <button id="btn-compare-pids" class="btn btn-secondary">Compare with Previous</button>
                        </div>
                        
                        ${validationHtml}
                    </div>
                </div>
                
                <div id="pid-compare-container" style="display:none;" class="card">
                    <div class="card-header">
                        <h3>PID Comparison (Before vs After)</h3>
                    </div>
                    <div class="card-body" id="pid-compare-body">
                        <!-- Chart/Comparison logic inserted here on mount -->
                    </div>
                </div>
            </div>
        `;
    },

    mount: (store) => {
        const drone = store.getActiveDrone();
        if (!drone) return;

        // Save Current Configuration
        document.getElementById('btn-save-pids')?.addEventListener('click', () => {
            const inputs = document.querySelectorAll('.pid-val');
            const newPid = {
                roll: {}, pitch: {}, yaw: {}, rates: {}, expo: {}
            };
            
            inputs.forEach(input => {
                const axis = input.getAttribute('data-axis');
                const field = input.getAttribute('data-field');
                const val = input.value;
                newPid[axis][field] = val === '' ? null : parseFloat(val);
            });
            
            // Stash old config for comparison if it exists and has some data
            if (drone.pid && Object.values(drone.pid.roll).some(v => v !== null)) {
                store.updateDrone(drone.id, { _previousPid: JSON.parse(JSON.stringify(drone.pid)) });
            }
            
            store.updateDrone(drone.id, { pid: newPid });
            window.dispatchEvent(new CustomEvent('store-updated'));
        });

        // Load Preset
        document.getElementById('pid-preset-select')?.addEventListener('change', (e) => {
            const val = e.target.value;
            if (!val) return;
            
            let preset = null;
            if (val.startsWith('CUSTOM_')) {
                const idx = parseInt(val.split('_')[1], 10);
                preset = (drone.pidPresets || [])[idx]?.data;
            } else {
                preset = PRESETS[val];
            }
            
            if (preset) {
                // Populate inputs
                const inputs = document.querySelectorAll('.pid-val');
                inputs.forEach(input => {
                    const axis = input.getAttribute('data-axis');
                    const field = input.getAttribute('data-field');
                    if (preset[axis] && preset[axis][field] !== undefined) {
                        input.value = preset[axis][field];
                    }
                });
            }
        });

        // Save Custom Preset
        document.getElementById('btn-save-preset')?.addEventListener('click', () => {
            const name = prompt("Enter a name for this custom preset:");
            if (!name) return;
            
            const inputs = document.querySelectorAll('.pid-val');
            const presetData = {
                roll: {}, pitch: {}, yaw: {}, rates: {}, expo: {}
            };
            inputs.forEach(input => {
                const axis = input.getAttribute('data-axis');
                const field = input.getAttribute('data-field');
                const val = input.value;
                presetData[axis][field] = val === '' ? null : parseFloat(val);
            });
            
            const presets = drone.pidPresets || [];
            presets.push({ name, data: presetData });
            store.updateDrone(drone.id, { pidPresets: presets });
            window.dispatchEvent(new CustomEvent('store-updated'));
        });
        
        // Compare with Previous
        document.getElementById('btn-compare-pids')?.addEventListener('click', () => {
            const container = document.getElementById('pid-compare-container');
            const body = document.getElementById('pid-compare-body');
            const prev = drone._previousPid;
            const current = drone.pid;
            
            if (!prev) {
                alert("No previous configuration saved for comparison.");
                return;
            }
            
            container.style.display = 'block';
            
            let html = `
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border-color);">
                            <th style="padding: 10px;">Parameter</th>
                            <th style="padding: 10px;">Before</th>
                            <th style="padding: 10px;">After</th>
                            <th style="padding: 10px;">Diff</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            ['roll', 'pitch', 'yaw'].forEach(axis => {
                ['p', 'i', 'd', 'ff'].forEach(field => {
                    const b = prev[axis]?.[field] ?? 0;
                    const a = current[axis]?.[field] ?? 0;
                    const diff = a - b;
                    let color = 'var(--text-primary)';
                    if (diff > 0) color = 'var(--warning-color)';
                    if (diff < 0) color = 'var(--success-color)';
                    
                    if (b !== a) {
                        html += `
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 5px;">${axis.toUpperCase()} ${field.toUpperCase()}</td>
                                <td style="padding: 5px;">${b}</td>
                                <td style="padding: 5px;">${a}</td>
                                <td style="padding: 5px; color: ${color};">${diff > 0 ? '+'+diff : diff}</td>
                            </tr>
                        `;
                    }
                });
            });
            
            html += `</tbody></table>`;
            
            // Check flight log health
            const log = store.getActiveFlightLog();
            if (log) {
                html += `
                    <div style="margin-top: 15px;">
                        <h4>Flight Log Health Context:</h4>
                        <p>Latest log health score: <strong>${log.healthScore?.score}</strong> (${log.healthScore?.grade})</p>
                        <p>Evidence Status: <strong>${log.healthScore?.evidenceStatus}</strong></p>
                    </div>
                `;
            } else {
                html += `
                    <div style="margin-top: 15px; color: var(--text-secondary);">
                        <p>No flight log context available for this comparison.</p>
                    </div>
                `;
            }
            
            body.innerHTML = html;
        });
    }
};

export default PidTuningView;
