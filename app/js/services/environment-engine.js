class EnvironmentEngine {
    constructor(store) {
        this.store = store;
    }

    /**
     * Determines mission data quality completeness
     */
    assessMissionDataQuality(mission) {
        const result = {
            quality: 'UNKNOWN',
            score: 0
        };

        if (!mission) return result;

        let totalScore = 0;
        let maxScore = 5; // Waypoints, Observations, Samples, Sensor, Camera

        if (mission.waypoints && mission.waypoints.length > 0) totalScore++;
        if (mission.observations && mission.observations.length > 0) totalScore++;
        if (mission.waterSamples && mission.waterSamples.length > 0) totalScore++;
        if (mission.sensorReadings && mission.sensorReadings.length > 0) totalScore++;
        if (mission.camera && mission.camera.status !== 'UNKNOWN') totalScore++;

        const ratio = totalScore / maxScore;
        result.score = Math.round(ratio * 100);

        if (ratio >= 0.8) result.quality = 'COMPLETE';
        else if (ratio >= 0.6) result.quality = 'GOOD';
        else if (ratio >= 0.2) result.quality = 'LIMITED';
        else if (totalScore > 0) result.quality = 'INSUFFICIENT';
        
        return result;
    }

    /**
     * Validates MQ Sensor rules deterministicly.
     * Prevents converting generic MQ data into false water quality claims.
     */
    validateSensorReading(reading) {
        if (!reading.model || reading.model === 'Unknown') {
            return {
                valid: false,
                interpretation: 'UNKNOWN',
                warning: 'Cannot interpret raw data without sensor calibration profile.'
            };
        }

        // Generic fallback for any provided model without direct lab cal
        return {
            valid: true,
            interpretation: 'ENVIRONMENTAL SENSOR READING',
            warning: 'FalconZ does not extrapolate MQ gas/analog data to pH/water quality without explicit lab curves.'
        };
    }

    /**
     * Validates Water Sample states
     */
    validateWaterSample(sample) {
        if (!sample) return { status: 'UNKNOWN' };

        if (sample.status === 'LAB RESULT AVAILABLE') {
            if (sample.labResult) {
                return { status: 'VALIDATED', message: 'Lab results documented.' };
            } else {
                return { status: 'WARNING', message: 'Status claims lab result available, but result field is empty.' };
            }
        }
        
        return { status: 'OK', message: `Sample is currently: ${sample.status}` };
    }
}

export default EnvironmentEngine;
