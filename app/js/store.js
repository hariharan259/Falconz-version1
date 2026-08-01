export default class Store {
    constructor() {
        this.STORAGE_KEY = 'falconz_v1_data';
        this.state = {
            drones: [],
            activeDroneId: null,
            settings: {},
            flightLogHistory: [],
            environmentalMissions: []
        };
        
        // State variables not persisted to localStorage
        this.activeFlightLog = null;
        
        // Listen for storage events to sync across tabs (optional, good practice)
        window.addEventListener('storage', (e) => {
            if (e.key === this.STORAGE_KEY) {
                this._loadFromStorage();
            }
        });
    }

    async init() {
        this._loadFromStorage();
        console.log("Store initialized with", this.state.drones.length, "drones.");
    }

    _loadFromStorage() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    // Schema recovery / validation
                    this.state.drones = Array.isArray(parsed.drones) ? parsed.drones : [];
                    this.state.activeDroneId = parsed.activeDroneId || null;
                    this.state.settings = parsed.settings || {};
                    this.state.flightLogHistory = Array.isArray(parsed.flightLogHistory) ? parsed.flightLogHistory : [];
                    this.state.environmentalMissions = Array.isArray(parsed.environmentalMissions) ? parsed.environmentalMissions : [];
                    
                    // Verify active drone exists
                    if (this.state.activeDroneId && !this.state.drones.find(d => d.id === this.state.activeDroneId)) {
                        this.state.activeDroneId = null;
                    }
                }
            }
        } catch (e) {
            console.error("Storage corrupted. Recovering gracefully.", e);
            // Don't crash, just start fresh if totally corrupted
            this.state = { drones: [], activeDroneId: null, settings: {}, flightLogHistory: [], environmentalMissions: [] };
        }
    }

    _saveToStorage() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
            
            // Dispatch custom event so app can react (e.g., active drone change)
            window.dispatchEvent(new CustomEvent('store-updated'));
        } catch (e) {
            console.error("Failed to save to localStorage.", e);
        }
    }

    getDrones() {
        return [...this.state.drones];
    }

    getActiveDrone() {
        if (!this.state.activeDroneId) return null;
        return this.state.drones.find(d => d.id === this.state.activeDroneId) || null;
    }

    setActiveDrone(id) {
        if (!id) {
            this.state.activeDroneId = null;
        } else if (this.state.drones.find(d => d.id === id)) {
            this.state.activeDroneId = id;
        }
        this._saveToStorage();
    }

    // Creates the drone with empty/unknown template if fields are missing
    _normalizeDroneData(droneData) {
        return {
            id: droneData.id || crypto.randomUUID(),
            name: droneData.name || "Unnamed Drone",
            type: droneData.type || "Other",
            
            basic: {
                frameSize: droneData.basic?.frameSize || "",
                manufacturer: droneData.basic?.manufacturer || "",
                model: droneData.basic?.model || "",
                serialNumber: droneData.basic?.serialNumber || "",
                notes: droneData.basic?.notes || ""
            },
            motors: {
                count: droneData.motors?.count !== undefined ? droneData.motors.count : null,
                brand: droneData.motors?.brand || "",
                model: droneData.motors?.model || "",
                kv: droneData.motors?.kv !== undefined ? droneData.motors.kv : null,
                statorSize: droneData.motors?.statorSize || "",
                maxThrustPerMotor: droneData.motors?.maxThrustPerMotor !== undefined ? droneData.motors.maxThrustPerMotor : null,
                maxThrustProvenance: droneData.motors?.maxThrustProvenance || "USER_PROVIDED",
                maxCurrent: droneData.motors?.maxCurrent !== undefined ? droneData.motors.maxCurrent : null
            },
            propeller: {
                diameter: droneData.propeller?.diameter !== undefined ? droneData.propeller.diameter : null,
                pitch: droneData.propeller?.pitch !== undefined ? droneData.propeller.pitch : null,
                bladeCount: droneData.propeller?.bladeCount !== undefined ? droneData.propeller.bladeCount : null,
                material: droneData.propeller?.material || "",
                direction: droneData.propeller?.direction || ""
            },
            esc: {
                brand: droneData.esc?.brand || "",
                model: droneData.esc?.model || "",
                count: droneData.esc?.count !== undefined ? droneData.esc.count : null,
                continuousCurrent: droneData.esc?.continuousCurrent !== undefined ? droneData.esc.continuousCurrent : null,
                peakCurrent: droneData.esc?.peakCurrent !== undefined ? droneData.esc.peakCurrent : null,
                protocol: droneData.esc?.protocol || ""
            },
            battery: {
                brand: droneData.battery?.brand || "",
                model: droneData.battery?.model || "",
                chemistry: droneData.battery?.chemistry || "",
                cellCount: droneData.battery?.cellCount !== undefined ? droneData.battery.cellCount : null,
                capacityMah: droneData.battery?.capacityMah !== undefined ? droneData.battery.capacityMah : null,
                cRating: droneData.battery?.cRating !== undefined ? droneData.battery.cRating : null
            },
            flightController: {
                brand: droneData.flightController?.brand || "",
                model: droneData.flightController?.model || "",
                firmware: droneData.flightController?.firmware || "",
                firmwareVersion: droneData.flightController?.firmwareVersion || "",
                processor: droneData.flightController?.processor || "",
                imu: droneData.flightController?.imu || "",
                barometer: droneData.flightController?.barometer || "",
                compass: droneData.flightController?.compass || "",
                gps: droneData.flightController?.gps || "",
                telemetry: droneData.flightController?.telemetry || ""
            },
            telemetry: {
                type: droneData.telemetry?.type || "",
                frequency: droneData.telemetry?.frequency || "",
                protocol: droneData.telemetry?.protocol || "",
                radioFrequency: droneData.telemetry?.radioFrequency || "",
                module: droneData.telemetry?.module || "",
                status: droneData.telemetry?.status || "Not Connected"
            },
            weight: {
                frameWeight: droneData.weight?.frameWeight !== undefined ? droneData.weight.frameWeight : null,
                batteryWeight: droneData.weight?.batteryWeight !== undefined ? droneData.weight.batteryWeight : null,
                electronicsWeight: droneData.weight?.electronicsWeight !== undefined ? droneData.weight.electronicsWeight : null,
                payloadWeight: droneData.weight?.payloadWeight !== undefined ? droneData.weight.payloadWeight : null,
                auw: droneData.weight?.auw !== undefined ? droneData.weight.auw : null
            },
            
            calibration: {
                accelerometer: droneData.calibration?.accelerometer || { status: 'NOT STARTED', steps: {} },
                gyroscope: droneData.calibration?.gyroscope || { status: 'NOT STARTED' },
                compass: droneData.calibration?.compass || { status: 'NOT STARTED', type: 'Unknown', count: 1, orientation: 'None' },
                rc: droneData.calibration?.rc || { status: 'NOT STARTED', channels: {} },
                esc: droneData.calibration?.esc || { status: 'NOT STARTED', protocol: 'Unknown', required: 'Unknown' }
            },
            
            pid: {
                roll: droneData.pid?.roll || { p: null, i: null, d: null, ff: null },
                pitch: droneData.pid?.pitch || { p: null, i: null, d: null, ff: null },
                yaw: droneData.pid?.yaw || { p: null, i: null, d: null, ff: null },
                rates: droneData.pid?.rates || { roll: null, pitch: null, yaw: null },
                expo: droneData.pid?.expo || { roll: null, pitch: null, yaw: null }
            },
            
            pidPresets: droneData.pidPresets || [],
            
            gps: droneData.gps || {
                status: "UNKNOWN", fixType: "UNKNOWN", satellites: null, hdop: null,
                latitude: null, longitude: null, altitude: null, groundSpeed: null,
                heading: null, source: "UNKNOWN", dataStatus: "UNKNOWN"
            },
            
            telemetryData: droneData.telemetryData || {
                status: "UNKNOWN", source: "UNKNOWN", timestamp: null,
                flight: { altitude: null, groundSpeed: null, heading: null, mode: "UNKNOWN", armed: null },
                attitude: { roll: null, pitch: null, yaw: null },
                battery: { voltage: null, current: null, percentage: null },
                radio: { throttle: null, roll: null, pitch: null, yaw: null, rssi: null },
                system: { flightController: "UNKNOWN", firmware: "UNKNOWN", failsafe: "UNKNOWN", linkStatus: "UNKNOWN" }
            },
            
            createdAt: droneData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    saveDrone(droneData) {
        const drone = this._normalizeDroneData(droneData);
        this.state.drones.push(drone);
        
        // Auto-select if first drone
        if (!this.state.activeDroneId) {
            this.state.activeDroneId = drone.id;
        }
        
        this._saveToStorage();
        return drone;
    }

    updateDrone(id, updates) {
        const index = this.state.drones.findIndex(d => d.id === id);
        if (index === -1) return false;
        
        // Merge updates carefully by applying normalization
        const existing = this.state.drones[index];
        const merged = { ...existing, ...updates, id: existing.id, createdAt: existing.createdAt };
        this.state.drones[index] = this._normalizeDroneData(merged);
        
        this._saveToStorage();
        return this.state.drones[index];
    }

    deleteDrone(id) {
        this.state.drones = this.state.drones.filter(d => d.id !== id);
        
        if (this.state.activeDroneId === id) {
            this.state.activeDroneId = this.state.drones.length > 0 ? this.state.drones[0].id : null;
        }
        
        this._saveToStorage();
    }

    duplicateDrone(id) {
        const existing = this.state.drones.find(d => d.id === id);
        if (!existing) return null;
        
        const duplicate = JSON.parse(JSON.stringify(existing));
        delete duplicate.id;
        duplicate.name = `${existing.name} Copy`;
        duplicate.createdAt = new Date().toISOString();
        
        return this.saveDrone(duplicate);
    }
    
    // Flight Log Methods
    getFlightLogHistory() {
        return this.state.flightLogHistory || [];
    }
    
    addFlightLogToHistory(logData) {
        const summary = {
            id: Date.now().toString(),
            filename: logData.filename,
            uploadedAt: new Date().toISOString(),
            duration: logData.metadata?.durationSeconds || 0,
            healthScore: logData.healthScore?.score || 0,
            status: logData.healthScore?.grade || 'UNKNOWN',
            evidenceStatus: logData.healthScore?.evidenceStatus || 'UNKNOWN',
            eventCount: (logData.events || []).length,
            summary: logData.summary || {}
        };
        
        if (!this.state.flightLogHistory) {
            this.state.flightLogHistory = [];
        }
        
        this.state.flightLogHistory.unshift(summary);
        
        if (this.state.flightLogHistory.length > 20) {
            this.state.flightLogHistory = this.state.flightLogHistory.slice(0, 20);
        }
        
        this._saveToStorage();
        return summary;
    }
    
    getActiveFlightLog() {
        return this.activeFlightLog;
    }
    
    setActiveFlightLog(logData) {
        this.activeFlightLog = logData;
    }

    // Environmental Missions Methods
    getEnvironmentalMissions() {
        return [...this.state.environmentalMissions];
    }

    saveMission(missionData) {
        if (!missionData.id) {
            missionData.id = crypto.randomUUID();
            missionData.createdAt = new Date().toISOString();
        }
        missionData.updatedAt = new Date().toISOString();
        this.state.environmentalMissions.push(missionData);
        this._saveToStorage();
        return missionData;
    }

    updateMission(id, updates) {
        const index = this.state.environmentalMissions.findIndex(m => m.id === id);
        if (index === -1) return false;
        const merged = { ...this.state.environmentalMissions[index], ...updates, updatedAt: new Date().toISOString() };
        this.state.environmentalMissions[index] = merged;
        this._saveToStorage();
        return merged;
    }
}
