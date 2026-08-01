class PIDEngine {
    constructor(store) {
        this.store = store;
    }

    validatePID(pidData) {
        const result = {
            status: 'OK',
            warnings: [],
            unknowns: [],
            recommendations: []
        };

        const axes = ['roll', 'pitch', 'yaw'];
        const fields = ['p', 'i', 'd', 'ff'];
        
        // 1. Missing Values & Negative Checks
        axes.forEach(axis => {
            if (!pidData[axis]) {
                result.unknowns.push(`Missing completely: ${axis} axis`);
                return;
            }

            fields.forEach(field => {
                const val = pidData[axis][field];
                if (val === null || val === undefined || val === '') {
                    result.unknowns.push(`${axis.toUpperCase()} ${field.toUpperCase()} is missing.`);
                } else {
                    const num = parseFloat(val);
                    if (isNaN(num)) {
                        result.warnings.push(`${axis.toUpperCase()} ${field.toUpperCase()} is not a valid number.`);
                        result.status = 'WARNING';
                    } else if (num < 0) {
                        result.warnings.push(`${axis.toUpperCase()} ${field.toUpperCase()} is negative. PID gains must generally be positive.`);
                        result.status = 'WARNING';
                    } else if (field === 'p' && num > 200) {
                        result.warnings.push(`${axis.toUpperCase()} P is unusually high (>200).`);
                        result.status = 'WARNING';
                    }
                }
            });
            
            // Missing Rates
            const rate = pidData.rates?.[axis];
            if (rate === null || rate === undefined || rate === '') {
                result.unknowns.push(`${axis.toUpperCase()} Rate is missing.`);
            } else if (parseFloat(rate) < 0) {
                result.warnings.push(`${axis.toUpperCase()} Rate is negative.`);
                result.status = 'WARNING';
            }
            
            // Missing Expo
            const expo = pidData.expo?.[axis];
            if (expo === null || expo === undefined || expo === '') {
                result.unknowns.push(`${axis.toUpperCase()} Expo is missing.`);
            }
        });

        // 2. Flight Log Integration (Phase 7 -> Phase 8)
        const log = this.store.getActiveFlightLog();
        if (log && log.events) {
            // Check for Vibration issue -> impacts D term
            const hasVibe = log.events.some(e => e.code === 'VIBRATION_ELEVATED');
            if (hasVibe) {
                result.warnings.push('Flight log indicates elevated vibration.');
                result.recommendations.push('Mechanical Issue Detected: Fix vibration sources (props, motors, frame) before increasing D-gains, or hot motors may result.');
                if (result.status === 'OK') result.status = 'WARNING';
            }
            
            // Check for GPS issues -> impacts Loiter/PosHold tuning
            const hasGPS = log.events.some(e => e.code === 'GPS_DEGRADED');
            if (hasGPS) {
                result.recommendations.push('Navigation Warning: High HDOP detected. Avoid tuning position-hold controllers until GPS shielding/placement is resolved.');
            }
        }

        if (result.warnings.length === 0 && result.unknowns.length > 0) {
            result.status = 'INCOMPLETE';
        }

        return result;
    }
}

export default PIDEngine;
