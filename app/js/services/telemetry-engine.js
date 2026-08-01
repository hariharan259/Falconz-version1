class TelemetryEngine {
    constructor(store) {
        this.store = store;
        this.providers = {
            MANUAL: "Manual Data Entry",
            SIMULATED: "Simulation Mode",
            FLIGHT_LOG: "Parsed from .BIN",
            MAVLINK: "Live MAVLink Stream (READY FOR INTEGRATION)",
            UNKNOWN: "Unknown Source"
        };
    }

    /**
     * Determines the completeness and data quality of the current telemetry state.
     */
    assessTelemetryQuality(telemetryData) {
        const result = {
            quality: 'UNKNOWN', // COMPLETE, GOOD, LIMITED, INSUFFICIENT, UNKNOWN
            score: 0
        };

        if (!telemetryData || telemetryData.status === 'UNKNOWN') {
            return result;
        }

        let totalFields = 0;
        let populatedFields = 0;

        const checkGroup = (group) => {
            if (telemetryData[group]) {
                Object.values(telemetryData[group]).forEach(v => {
                    totalFields++;
                    if (v !== null && v !== undefined && v !== '' && v !== 'UNKNOWN') {
                        populatedFields++;
                    }
                });
            }
        };

        checkGroup('flight');
        checkGroup('attitude');
        checkGroup('battery');
        checkGroup('radio');
        checkGroup('system');

        if (totalFields === 0) return result;

        const ratio = populatedFields / totalFields;
        result.score = Math.round(ratio * 100);

        if (ratio >= 0.85) result.quality = 'COMPLETE';
        else if (ratio >= 0.65) result.quality = 'GOOD';
        else if (ratio >= 0.40) result.quality = 'LIMITED';
        else result.quality = 'INSUFFICIENT';

        return result;
    }

    /**
     * Generates a simulated telemetry object for testing UI layers.
     */
    generateSimulatedTelemetry() {
        return {
            status: "LIVE",
            source: "SIMULATED",
            timestamp: new Date().toISOString(),
            flight: {
                altitude: (Math.random() * 10 + 20).toFixed(2), // 20-30m
                groundSpeed: (Math.random() * 5 + 10).toFixed(2), // 10-15m/s
                heading: Math.floor(Math.random() * 360),
                mode: "AUTO",
                armed: true
            },
            attitude: {
                roll: (Math.random() * 10 - 5).toFixed(2),
                pitch: (Math.random() * 10 - 5).toFixed(2),
                yaw: Math.floor(Math.random() * 360)
            },
            battery: {
                voltage: (14.8 - Math.random() * 0.5).toFixed(2),
                current: (15 + Math.random() * 10).toFixed(2),
                percentage: Math.floor(60 + Math.random() * 30)
            },
            radio: {
                throttle: 1500,
                roll: 1500,
                pitch: 1500,
                yaw: 1500,
                rssi: Math.floor(70 + Math.random() * 20)
            },
            system: {
                flightController: "Simulated FC",
                firmware: "ArduCopter V4.5",
                failsafe: "NONE",
                linkStatus: "GOOD"
            }
        };
    }
    
    generateSimulatedGPS() {
        return {
            status: "LIVE",
            fixType: "3D",
            satellites: Math.floor(12 + Math.random() * 6),
            hdop: (0.7 + Math.random() * 0.5).toFixed(2),
            latitude: (37.7749 + (Math.random() * 0.001)).toFixed(6),
            longitude: (-122.4194 + (Math.random() * 0.001)).toFixed(6),
            altitude: (30 + Math.random() * 5).toFixed(2),
            groundSpeed: (12 + Math.random() * 3).toFixed(2),
            heading: Math.floor(Math.random() * 360),
            source: "SIMULATED",
            dataStatus: "LIVE"
        };
    }
}

export default TelemetryEngine;
