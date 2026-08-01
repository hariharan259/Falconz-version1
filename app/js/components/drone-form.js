export default class DroneForm {
    constructor(store, onSave, onCancel) {
        this.store = store;
        this.onSave = onSave;
        this.onCancel = onCancel;
    }

    render(drone = null) {
        const isEdit = !!drone;
        const d = drone || this.store._normalizeDroneData({}); // get empty template

        return `
            <div class="drone-form-container">
                <div class="page-header">
                    <h2>${isEdit ? 'Edit Drone' : 'Create New Drone'}</h2>
                    <div class="actions-group">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-drone">Cancel</button>
                        <button type="button" class="btn btn-primary" id="btn-save-drone">Save Drone</button>
                    </div>
                </div>

                <form id="drone-config-form">
                    <input type="hidden" id="drone-id" value="${d.id}">

                    <div class="form-section">
                        <h4>Basic Information</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Drone Name</label>
                                <input type="text" class="form-control" id="drone-name" value="${d.name}" required>
                            </div>
                            <div class="form-group">
                                <label>Drone Type</label>
                                <select class="form-control" id="drone-type">
                                    ${['Quad', 'Tri', 'Hex', 'Octo', 'Helicopter', 'Other'].map(t => 
                                        `<option value="${t}" ${d.type === t ? 'selected' : ''}>${t}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Frame Size (mm)</label>
                                <input type="text" class="form-control" id="basic-frameSize" value="${d.basic.frameSize}">
                            </div>
                            <div class="form-group">
                                <label>Manufacturer</label>
                                <input type="text" class="form-control" id="basic-manufacturer" value="${d.basic.manufacturer}">
                            </div>
                            <div class="form-group">
                                <label>Model</label>
                                <input type="text" class="form-control" id="basic-model" value="${d.basic.model}">
                            </div>
                            <div class="form-group">
                                <label>Serial Number</label>
                                <input type="text" class="form-control" id="basic-serialNumber" value="${d.basic.serialNumber}">
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>Motors</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Motor Count</label>
                                <input type="number" class="form-control" id="motors-count" min="1" step="1" value="${d.motors.count !== null ? d.motors.count : ''}">
                            </div>
                            <div class="form-group">
                                <label>Brand</label>
                                <input type="text" class="form-control" id="motors-brand" value="${d.motors.brand}">
                            </div>
                            <div class="form-group">
                                <label>Model</label>
                                <input type="text" class="form-control" id="motors-model" value="${d.motors.model}">
                            </div>
                            <div class="form-group">
                                <label>KV Rating</label>
                                <input type="number" class="form-control" id="motors-kv" min="0" step="1" value="${d.motors.kv !== null ? d.motors.kv : ''}">
                            </div>
                            <div class="form-group">
                                <label>Stator Size (e.g., 2207)</label>
                                <input type="text" class="form-control" id="motors-statorSize" value="${d.motors.statorSize}">
                            </div>
                            <div class="form-group">
                                <label>Max Thrust per Motor (g)</label>
                                <input type="number" class="form-control" id="motors-maxThrustPerMotor" min="0" step="1" value="${d.motors.maxThrustPerMotor !== null ? d.motors.maxThrustPerMotor : ''}">
                            </div>
                            <div class="form-group">
                                <label>Thrust Provenance</label>
                                <select class="form-control" id="motors-maxThrustProvenance">
                                    <option value="USER_PROVIDED" ${d.motors.maxThrustProvenance !== 'MANUFACTURER_SPEC' ? 'selected' : ''}>User Provided / Estimate</option>
                                    <option value="MANUFACTURER_SPEC" ${d.motors.maxThrustProvenance === 'MANUFACTURER_SPEC' ? 'selected' : ''}>Manufacturer Spec</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Max Current (A)</label>
                                <input type="number" class="form-control" id="motors-maxCurrent" min="0" step="0.1" value="${d.motors.maxCurrent !== null ? d.motors.maxCurrent : ''}">
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>Propellers</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Diameter (inch)</label>
                                <input type="number" class="form-control" id="propeller-diameter" min="0" step="0.1" value="${d.propeller.diameter !== null ? d.propeller.diameter : ''}">
                            </div>
                            <div class="form-group">
                                <label>Pitch (inch)</label>
                                <input type="number" class="form-control" id="propeller-pitch" min="0" step="0.1" value="${d.propeller.pitch !== null ? d.propeller.pitch : ''}">
                            </div>
                            <div class="form-group">
                                <label>Blade Count</label>
                                <input type="number" class="form-control" id="propeller-bladeCount" min="1" step="1" value="${d.propeller.bladeCount !== null ? d.propeller.bladeCount : ''}">
                            </div>
                            <div class="form-group">
                                <label>Material</label>
                                <input type="text" class="form-control" id="propeller-material" value="${d.propeller.material}">
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>ESC (Electronic Speed Controller)</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Brand</label>
                                <input type="text" class="form-control" id="esc-brand" value="${d.esc.brand}">
                            </div>
                            <div class="form-group">
                                <label>Model</label>
                                <input type="text" class="form-control" id="esc-model" value="${d.esc.model}">
                            </div>
                            <div class="form-group">
                                <label>Count (e.g., 4 or 1 for 4-in-1)</label>
                                <input type="number" class="form-control" id="esc-count" min="1" step="1" value="${d.esc.count !== null ? d.esc.count : ''}">
                            </div>
                            <div class="form-group">
                                <label>Continuous Current (A)</label>
                                <input type="number" class="form-control" id="esc-continuousCurrent" min="0" step="1" value="${d.esc.continuousCurrent !== null ? d.esc.continuousCurrent : ''}">
                            </div>
                            <div class="form-group">
                                <label>Protocol</label>
                                <select class="form-control" id="esc-protocol">
                                    ${['', 'PWM', 'OneShot', 'MultiShot', 'DShot150', 'DShot300', 'DShot600', 'DShot1200', 'CAN', 'Other', 'Unknown'].map(p => 
                                        `<option value="${p}" ${d.esc.protocol === p ? 'selected' : ''}>${p || 'Select Protocol'}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>Battery</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Brand</label>
                                <input type="text" class="form-control" id="battery-brand" value="${d.battery.brand}">
                            </div>
                            <div class="form-group">
                                <label>Chemistry</label>
                                <select class="form-control" id="battery-chemistry">
                                    ${['', 'LiPo', 'Li-ion', 'LiFePO4', 'Other'].map(c => 
                                        `<option value="${c}" ${d.battery.chemistry === c ? 'selected' : ''}>${c || 'Select Chemistry'}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Cell Count (S)</label>
                                <input type="number" class="form-control" id="battery-cellCount" min="1" step="1" value="${d.battery.cellCount !== null ? d.battery.cellCount : ''}">
                            </div>
                            <div class="form-group">
                                <label>Capacity (mAh)</label>
                                <input type="number" class="form-control" id="battery-capacityMah" min="0" step="1" value="${d.battery.capacityMah !== null ? d.battery.capacityMah : ''}">
                            </div>
                            <div class="form-group">
                                <label>C Rating</label>
                                <input type="number" class="form-control" id="battery-cRating" min="0" step="1" value="${d.battery.cRating !== null ? d.battery.cRating : ''}">
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>Flight Controller</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Brand</label>
                                <input type="text" class="form-control" id="fc-brand" value="${d.flightController.brand}">
                            </div>
                            <div class="form-group">
                                <label>Model</label>
                                <input type="text" class="form-control" id="fc-model" value="${d.flightController.model}">
                            </div>
                            <div class="form-group">
                                <label>Firmware</label>
                                <input type="text" class="form-control" id="fc-firmware" value="${d.flightController.firmware}">
                            </div>
                            <div class="form-group">
                                <label>GPS</label>
                                <input type="text" class="form-control" id="fc-gps" value="${d.flightController.gps}">
                            </div>
                            <div class="form-group">
                                <label>Compass</label>
                                <input type="text" class="form-control" id="fc-compass" value="${d.flightController.compass}">
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>Telemetry</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Type</label>
                                <select class="form-control" id="telemetry-type">
                                    ${['', '3DR', 'MAVLink', 'ELRS', 'CRSF', 'Wi-Fi', 'Bluetooth', 'Other', 'Not Connected'].map(t => 
                                        `<option value="${t}" ${d.telemetry.type === t ? 'selected' : ''}>${t || 'Select Type'}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Protocol</label>
                                <input type="text" class="form-control" id="telemetry-protocol" value="${d.telemetry.protocol}">
                            </div>
                            <div class="form-group">
                                <label>Status</label>
                                <select class="form-control" id="telemetry-status">
                                    ${['Not Connected', 'Connected', 'Configured'].map(s => 
                                        `<option value="${s}" ${d.telemetry.status === s ? 'selected' : ''}>${s}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>Weight (All-Up Weight)</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>AUW (grams)</label>
                                <input type="number" class="form-control" id="weight-auw" min="0" step="1" value="${d.weight.auw !== null ? d.weight.auw : ''}">
                            </div>
                            <div class="form-group">
                                <label>Frame Weight (g)</label>
                                <input type="number" class="form-control" id="weight-frameWeight" min="0" step="1" value="${d.weight.frameWeight !== null ? d.weight.frameWeight : ''}">
                            </div>
                            <div class="form-group">
                                <label>Battery Weight (g)</label>
                                <input type="number" class="form-control" id="weight-batteryWeight" min="0" step="1" value="${d.weight.batteryWeight !== null ? d.weight.batteryWeight : ''}">
                            </div>
                        </div>
                    </div>

                </form>
            </div>
        `;
    }

    mount() {
        document.getElementById('btn-cancel-drone').addEventListener('click', () => {
            this.onCancel();
        });

        document.getElementById('btn-save-drone').addEventListener('click', () => {
            if (!document.getElementById('drone-config-form').checkValidity()) {
                document.getElementById('drone-config-form').reportValidity();
                return;
            }
            
            const parseNum = (val) => val === '' ? null : Number(val);
            
            const formData = {
                id: document.getElementById('drone-id').value,
                name: document.getElementById('drone-name').value,
                type: document.getElementById('drone-type').value,
                basic: {
                    frameSize: document.getElementById('basic-frameSize').value,
                    manufacturer: document.getElementById('basic-manufacturer').value,
                    model: document.getElementById('basic-model').value,
                    serialNumber: document.getElementById('basic-serialNumber').value
                },
                motors: {
                    count: parseNum(document.getElementById('motors-count').value),
                    brand: document.getElementById('motors-brand').value,
                    model: document.getElementById('motors-model').value,
                    kv: parseNum(document.getElementById('motors-kv').value),
                    statorSize: document.getElementById('motors-statorSize').value,
                    maxThrustPerMotor: parseNum(document.getElementById('motors-maxThrustPerMotor').value),
                    maxThrustProvenance: document.getElementById('motors-maxThrustProvenance').value,
                    maxCurrent: parseNum(document.getElementById('motors-maxCurrent').value)
                },
                propeller: {
                    diameter: parseNum(document.getElementById('propeller-diameter').value),
                    pitch: parseNum(document.getElementById('propeller-pitch').value),
                    bladeCount: parseNum(document.getElementById('propeller-bladeCount').value),
                    material: document.getElementById('propeller-material').value
                },
                esc: {
                    brand: document.getElementById('esc-brand').value,
                    model: document.getElementById('esc-model').value,
                    count: parseNum(document.getElementById('esc-count').value),
                    continuousCurrent: parseNum(document.getElementById('esc-continuousCurrent').value),
                    protocol: document.getElementById('esc-protocol').value
                },
                battery: {
                    brand: document.getElementById('battery-brand').value,
                    chemistry: document.getElementById('battery-chemistry').value,
                    cellCount: parseNum(document.getElementById('battery-cellCount').value),
                    capacityMah: parseNum(document.getElementById('battery-capacityMah').value),
                    cRating: parseNum(document.getElementById('battery-cRating').value)
                },
                flightController: {
                    brand: document.getElementById('fc-brand').value,
                    model: document.getElementById('fc-model').value,
                    firmware: document.getElementById('fc-firmware').value,
                    gps: document.getElementById('fc-gps').value,
                    compass: document.getElementById('fc-compass').value
                },
                telemetry: {
                    type: document.getElementById('telemetry-type').value,
                    protocol: document.getElementById('telemetry-protocol').value,
                    status: document.getElementById('telemetry-status').value
                },
                weight: {
                    auw: parseNum(document.getElementById('weight-auw').value),
                    frameWeight: parseNum(document.getElementById('weight-frameWeight').value),
                    batteryWeight: parseNum(document.getElementById('weight-batteryWeight').value)
                }
            };

            this.onSave(formData);
        });
    }
}
