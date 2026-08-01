class GPSEngine {
    /**
     * Assesses the GPS quality deterministically based on available data.
     * @param {Object} gpsData - { hdop, satellites, fixType, latitude, longitude, altitude }
     * @returns {Object} { status: "OK"|"WARNING", quality: "GOOD"|"FAIR"|"POOR"|"UNKNOWN", warnings: [] }
     */
    static assessGPSQuality(gpsData) {
        const result = {
            status: 'OK',
            quality: 'UNKNOWN',
            warnings: []
        };

        if (!gpsData || gpsData.latitude === null || gpsData.longitude === null) {
            result.warnings.push("Missing core GPS coordinate data.");
            return result;
        }

        const hdop = parseFloat(gpsData.hdop);
        const sats = parseInt(gpsData.satellites, 10);
        
        let hdopQuality = "UNKNOWN";
        let satQuality = "UNKNOWN";

        if (!isNaN(hdop)) {
            if (hdop <= 1.0) hdopQuality = "GOOD";
            else if (hdop <= 2.0) hdopQuality = "FAIR";
            else {
                hdopQuality = "POOR";
                result.warnings.push(`High HDOP (${hdop}) indicates poor positional accuracy.`);
                result.status = 'WARNING';
            }
        } else {
            result.warnings.push("HDOP data is missing.");
        }

        if (!isNaN(sats)) {
            if (sats >= 12) satQuality = "GOOD";
            else if (sats >= 8) satQuality = "FAIR";
            else {
                satQuality = "POOR";
                result.warnings.push(`Low satellite count (${sats}). Navigation may be unreliable.`);
                result.status = 'WARNING';
            }
        } else {
            result.warnings.push("Satellite count is missing.");
        }

        // Aggregate
        if (hdopQuality === "GOOD" && satQuality === "GOOD") result.quality = "GOOD";
        else if (hdopQuality === "POOR" || satQuality === "POOR") result.quality = "POOR";
        else if (hdopQuality === "UNKNOWN" && satQuality === "UNKNOWN") result.quality = "UNKNOWN";
        else result.quality = "FAIR";

        if (gpsData.fixType && gpsData.fixType.toString() === '1') {
             result.warnings.push("Fix type indicates NO FIX despite data presence.");
             result.quality = "POOR";
             result.status = "WARNING";
        }

        return result;
    }
}

export default GPSEngine;
