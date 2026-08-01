const CalibrationView = {
    render: async (store) => {
        const drone = store.getActiveDrone();
        if (!drone) {
            return `
                <div class="empty-state">
                    <h3>Calibration</h3>
                    <p>No active drone selected. Please select or create a drone to view calibration procedures.</p>
                </div>
            `;
        }

        const cal = drone.calibration || {};
        const acc = cal.accelerometer || { status: 'NOT STARTED', steps: {} };
        const gyro = cal.gyroscope || { status: 'NOT STARTED' };
        const comp = cal.compass || { status: 'NOT STARTED', type: 'Unknown', count: 1, orientation: 'None' };
        const rc = cal.rc || { status: 'NOT STARTED', channels: {} };
        const esc = cal.esc || { status: 'NOT STARTED', protocol: 'Unknown', required: 'Unknown' };

        const accSteps = ['Level', 'Nose Up', 'Nose Down', 'Left Side', 'Right Side', 'Upside Down'];
        const escProtocols = ['Unknown', 'PWM', 'OneShot', 'MultiShot', 'DShot'];

        return `
            <div class="dashboard-grid" style="grid-template-columns: 1fr; gap: 20px;">
                <div class="card">
                    <div class="card-header">
                        <h2>Calibration Center</h2>
                    </div>
                    <div class="card-body">
                        <p style="color: var(--warning-color); font-weight: bold; margin-bottom: 10px;">⚠️ SAFETY WARNING: Always remove propellers before performing any bench calibration.</p>
                        <p style="color: var(--text-secondary);">This utility guides you through standard calibration procedures and persists your verification. It does not communicate directly with the flight controller.</p>
                    </div>
                </div>

                <!-- Accelerometer Calibration -->
                <div class="card">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>Accelerometer Calibration</h3>
                        <span class="badge" style="background-color: ${getStatusColor(acc.status)}; border:none; color:white;">${acc.status}</span>
                    </div>
                    <div class="card-body">
                        <p><strong>Purpose:</strong> Ensures the flight controller understands true level for stability.</p>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 15px;">
                            ${accSteps.map(step => `
                                <div style="border: 1px solid var(--border-color); padding: 10px; border-radius: 4px;">
                                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                        <input type="checkbox" class="acc-step" data-step="${step}" ${acc.steps[step] ? 'checked' : ''}>
                                        ${step}
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                        <button id="btn-acc-complete" class="btn btn-primary" style="margin-top: 15px;">Mark Calibration Completed Manually</button>
                    </div>
                </div>

                <!-- Gyroscope Calibration -->
                <div class="card">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>Gyroscope Calibration</h3>
                        <span class="badge" style="background-color: ${getStatusColor(gyro.status)}; border:none; color:white;">${gyro.status}</span>
                    </div>
                    <div class="card-body">
                        <p><strong>Procedure:</strong> Place drone on a stable, level surface. Do not move during initialization.</p>
                        <ul style="list-style-type: none; padding-left: 0; margin-top: 10px;">
                            <li><label><input type="checkbox" class="gyro-chk"> Drone stationary</label></li>
                            <li><label><input type="checkbox" class="gyro-chk"> Props removed</label></li>
                            <li><label><input type="checkbox" class="gyro-chk"> Calibration initiated on FC</label></li>
                        </ul>
                        <button id="btn-gyro-complete" class="btn btn-primary" style="margin-top: 15px;">Mark Calibration Completed Manually</button>
                    </div>
                </div>

                <!-- Compass Calibration -->
                <div class="card">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>Compass Calibration</h3>
                        <span class="badge" style="background-color: ${getStatusColor(comp.status)}; border:none; color:white;">${comp.status}</span>
                    </div>
                    <div class="card-body">
                        <p><strong>Instructions:</strong> Keep away from metal/magnetic interference. Perform outdoors if possible. Follow FC orientation rotation.</p>
                        
                        <div class="form-group" style="margin-top: 15px;">
                            <label>Compass Type</label>
                            <select id="comp-type" class="form-control" style="width: 200px;">
                                <option value="Unknown" ${comp.type === 'Unknown' ? 'selected' : ''}>Unknown</option>
                                <option value="Internal" ${comp.type === 'Internal' ? 'selected' : ''}>Internal</option>
                                <option value="External" ${comp.type === 'External' ? 'selected' : ''}>External</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Compass Count</label>
                            <input type="number" id="comp-count" class="form-control" style="width: 200px;" value="${comp.count || 1}">
                        </div>

                        <div class="form-group">
                            <label>Primary Orientation</label>
                            <input type="text" id="comp-orientation" class="form-control" style="width: 200px;" value="${comp.orientation || 'None'}" placeholder="e.g. ROTATION_NONE">
                        </div>
                        
                        <button id="btn-comp-complete" class="btn btn-primary" style="margin-top: 15px;">Save Configuration & Mark Completed</button>
                    </div>
                </div>

                <!-- RC Calibration -->
                <div class="card">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>RC / Radio Calibration</h3>
                        <span class="badge" style="background-color: ${getStatusColor(rc.status)}; border:none; color:white;">${rc.status}</span>
                    </div>
                    <div class="card-body">
                        <p><strong>Configuration:</strong> Verify minimum, center, and maximum PWM ranges. Values must satisfy Min < Center < Max.</p>
                        
                        <div style="overflow-x: auto; margin-top: 15px;">
                            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                                <thead>
                                    <tr style="border-bottom: 2px solid var(--border-color);">
                                        <th style="padding: 5px;">Channel</th>
                                        <th style="padding: 5px;">Minimum</th>
                                        <th style="padding: 5px;">Center</th>
                                        <th style="padding: 5px;">Maximum</th>
                                        <th style="padding: 5px;">Deadband</th>
                                    </tr>
                                </thead>
                                <tbody id="rc-tbody">
                                    ${['Throttle', 'Roll', 'Pitch', 'Yaw', 'Aux 1', 'Aux 2', 'Aux 3', 'Aux 4'].map(ch => {
                                        const c = rc.channels[ch] || { min: '', center: '', max: '', deadband: '' };
                                        return `
                                            <tr style="border-bottom: 1px solid var(--border-color);">
                                                <td style="padding: 5px;"><strong>${ch}</strong></td>
                                                <td style="padding: 5px;"><input type="number" class="form-control rc-min" data-ch="${ch}" value="${c.min}" placeholder="USER PROVIDED"></td>
                                                <td style="padding: 5px;"><input type="number" class="form-control rc-center" data-ch="${ch}" value="${c.center}" placeholder="UNKNOWN"></td>
                                                <td style="padding: 5px;"><input type="number" class="form-control rc-max" data-ch="${ch}" value="${c.max}" placeholder="USER PROVIDED"></td>
                                                <td style="padding: 5px;"><input type="number" class="form-control rc-dead" data-ch="${ch}" value="${c.deadband}" placeholder="UNKNOWN"></td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div id="rc-errors" style="color: var(--danger-color); margin-top: 10px; font-size: 0.9rem;"></div>
                        <button id="btn-rc-complete" class="btn btn-primary" style="margin-top: 15px;">Validate & Save RC Config</button>
                    </div>
                </div>

                <!-- ESC Calibration -->
                <div class="card">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>ESC Calibration</h3>
                        <span class="badge" style="background-color: ${getStatusColor(esc.status)}; border:none; color:white;">${esc.status}</span>
                    </div>
                    <div class="card-body">
                        <p><strong>Purpose:</strong> Ensures all ESCs interpret throttle signals identically. DShot protocols do not require calibration.</p>
                        
                        <div class="form-group" style="margin-top: 15px;">
                            <label>ESC Protocol</label>
                            <select id="esc-protocol" class="form-control" style="width: 200px;">
                                ${escProtocols.map(p => `<option value="${p}" ${esc.protocol === p ? 'selected' : ''}>${p}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Calibration Required</label>
                            <select id="esc-required" class="form-control" style="width: 200px;">
                                <option value="Unknown" ${esc.required === 'Unknown' ? 'selected' : ''}>Unknown</option>
                                <option value="Yes" ${esc.required === 'Yes' ? 'selected' : ''}>Yes</option>
                                <option value="No" ${esc.required === 'No' ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                        
                        <button id="btn-esc-complete" class="btn btn-primary" style="margin-top: 15px;">Save & Mark Completed</button>
                    </div>
                </div>
            </div>
        `;
    },

    mount: (store) => {
        const drone = store.getActiveDrone();
        if (!drone) return;

        // Accelerometer
        document.getElementById('btn-acc-complete')?.addEventListener('click', () => {
            const steps = {};
            document.querySelectorAll('.acc-step').forEach(chk => {
                steps[chk.getAttribute('data-step')] = chk.checked;
            });
            const cal = drone.calibration || {};
            cal.accelerometer = { status: 'USER VERIFIED', steps };
            store.updateDrone(drone.id, { calibration: cal });
            window.dispatchEvent(new CustomEvent('store-updated'));
        });

        // Gyroscope
        document.getElementById('btn-gyro-complete')?.addEventListener('click', () => {
            const cal = drone.calibration || {};
            cal.gyroscope = { status: 'USER VERIFIED' };
            store.updateDrone(drone.id, { calibration: cal });
            window.dispatchEvent(new CustomEvent('store-updated'));
        });

        // Compass
        document.getElementById('btn-comp-complete')?.addEventListener('click', () => {
            const cal = drone.calibration || {};
            cal.compass = {
                status: 'USER VERIFIED',
                type: document.getElementById('comp-type').value,
                count: parseInt(document.getElementById('comp-count').value, 10) || 1,
                orientation: document.getElementById('comp-orientation').value
            };
            store.updateDrone(drone.id, { calibration: cal });
            window.dispatchEvent(new CustomEvent('store-updated'));
        });

        // RC
        document.getElementById('btn-rc-complete')?.addEventListener('click', () => {
            const cal = drone.calibration || {};
            cal.rc = cal.rc || { channels: {} };
            
            const errorDiv = document.getElementById('rc-errors');
            let hasError = false;
            errorDiv.innerHTML = '';

            const channels = {};
            const tbody = document.getElementById('rc-tbody');
            if (tbody) {
                const rows = tbody.querySelectorAll('tr');
                rows.forEach(row => {
                    const ch = row.querySelector('.rc-min').getAttribute('data-ch');
                    const min = parseFloat(row.querySelector('.rc-min').value);
                    const center = parseFloat(row.querySelector('.rc-center').value);
                    const max = parseFloat(row.querySelector('.rc-max').value);
                    const deadband = parseFloat(row.querySelector('.rc-dead').value);
                    
                    if (!isNaN(min) && !isNaN(center) && !isNaN(max)) {
                        if (!(min < center && center < max)) {
                            errorDiv.innerHTML += `<div>Invalid range for ${ch}: must be Min &lt; Center &lt; Max</div>`;
                            hasError = true;
                        }
                    }
                    
                    channels[ch] = {
                        min: isNaN(min) ? '' : min,
                        center: isNaN(center) ? '' : center,
                        max: isNaN(max) ? '' : max,
                        deadband: isNaN(deadband) ? '' : deadband
                    };
                });
            }

            if (!hasError) {
                cal.rc.channels = channels;
                cal.rc.status = 'USER VERIFIED';
                store.updateDrone(drone.id, { calibration: cal });
                window.dispatchEvent(new CustomEvent('store-updated'));
            }
        });

        // ESC
        document.getElementById('btn-esc-complete')?.addEventListener('click', () => {
            const cal = drone.calibration || {};
            cal.esc = {
                status: 'USER VERIFIED',
                protocol: document.getElementById('esc-protocol').value,
                required: document.getElementById('esc-required').value
            };
            store.updateDrone(drone.id, { calibration: cal });
            window.dispatchEvent(new CustomEvent('store-updated'));
        });
        
        // Protocol change listener for ESC
        document.getElementById('esc-protocol')?.addEventListener('change', (e) => {
            const req = document.getElementById('esc-required');
            if (e.target.value === 'DShot') {
                req.value = 'No';
            } else if (e.target.value !== 'Unknown') {
                req.value = 'Yes';
            }
        });
    }
};

function getStatusColor(status) {
    if (status === 'USER VERIFIED') return 'var(--success-color, #10b981)';
    if (status === 'IN PROGRESS') return 'var(--warning-color, #f59e0b)';
    return 'var(--text-secondary, #9ca3af)'; // NOT STARTED or UNKNOWN
}

export default CalibrationView;
