class EngineeringEngine {
    
    // Core Arithmetic Functions

    static isValid(num) {
        return num !== null && num !== undefined && typeof num === 'number' && !isNaN(num) && num > 0;
    }

    static calculateTotalThrust(motorCount, maxThrustPerMotor) {
        if (!this.isValid(motorCount) || !this.isValid(maxThrustPerMotor)) return null;
        return {
            value: motorCount * maxThrustPerMotor,
            status: "CALCULATED",
            formula: "motorCount × maxThrustPerMotor",
            inputs: [`${motorCount}`, `${maxThrustPerMotor}g`]
        };
    }

    static calculateTWR(totalThrust, auw) {
        if (!totalThrust || !this.isValid(auw)) return null;
        const value = totalThrust.value / auw;
        return {
            value: parseFloat(value.toFixed(2)),
            ratio: `${value.toFixed(2)}:1`,
            status: "CALCULATED",
            formula: "totalThrust / AUW",
            inputs: [`${totalThrust.value}g`, `${auw}g`]
        };
    }

    static calculateHoverThrust(auw, motorCount) {
        if (!this.isValid(auw) || !this.isValid(motorCount)) return null;
        const value = auw / motorCount;
        return {
            value: parseFloat(value.toFixed(1)),
            status: "CALCULATED",
            formula: "AUW / motorCount",
            inputs: [`${auw}g`, `${motorCount}`]
        };
    }

    static calculateHoverThrottle(hoverThrustPerMotor, maxThrustPerMotor) {
        if (!hoverThrustPerMotor || !this.isValid(maxThrustPerMotor)) return null;
        const value = (hoverThrustPerMotor.value / maxThrustPerMotor) * 100;
        return {
            value: parseFloat(value.toFixed(2)),
            status: "THEORETICAL ESTIMATE",
            formula: "(hoverThrustPerMotor / maxThrustPerMotor) × 100",
            inputs: [`${hoverThrustPerMotor.value}g`, `${maxThrustPerMotor}g`]
        };
    }

    static calculateBatteryVoltage(cellCount) {
        if (!this.isValid(cellCount)) return null;
        const value = cellCount * 3.7;
        return {
            value: parseFloat(value.toFixed(2)),
            status: "CALCULATED",
            formula: "cellCount × 3.7",
            inputs: [`${cellCount}S`]
        };
    }

    static calculateBatteryEnergy(cellCount, capacityMah) {
        if (!this.isValid(cellCount) || !this.isValid(capacityMah)) return null;
        const capacityAh = capacityMah / 1000;
        const voltage = cellCount * 3.7;
        const value = voltage * capacityAh;
        return {
            value: parseFloat(value.toFixed(2)),
            status: "CALCULATED",
            formula: "nominalVoltage × (capacityMah / 1000)",
            inputs: [`${voltage}V`, `${capacityAh}Ah`]
        };
    }

    static calculateBatteryDischargeCurrent(capacityMah, cRating) {
        if (!this.isValid(capacityMah) || !this.isValid(cRating)) return null;
        const capacityAh = capacityMah / 1000;
        const value = capacityAh * cRating;
        return {
            value: parseFloat(value.toFixed(2)),
            status: "THEORETICAL ESTIMATE",
            formula: "capacityAh × C-rating",
            inputs: [`${capacityAh}Ah`, `${cRating}C`]
        };
    }

    static calculatePower(voltage, current) {
        if (!voltage || !this.isValid(current)) return null;
        const value = voltage.value * current;
        return {
            value: parseFloat(value.toFixed(2)),
            status: "CALCULATED",
            formula: "voltage × current",
            inputs: [`${voltage.value}V`, `${current}A`]
        };
    }

    static calculateEscMargin(escCurrentRating, motorPeakCurrent) {
        if (!this.isValid(escCurrentRating) || !this.isValid(motorPeakCurrent)) return null;
        const margin = escCurrentRating - motorPeakCurrent;
        const marginPercent = (margin / motorPeakCurrent) * 100;
        return {
            value: parseFloat(margin.toFixed(2)),
            marginPercent: parseFloat(marginPercent.toFixed(2)),
            status: "CALCULATED",
            formula: "escCurrentRating - motorPeakCurrent",
            inputs: [`${escCurrentRating}A`, `${motorPeakCurrent}A`]
        };
    }

    static getProvenanceStatus(val, defaultStatus) {
        if (!this.isValid(val)) return "UNKNOWN";
        return defaultStatus || "USER_PROVIDED";
    }

    static analyzeConfiguration(drone) {
        const unknowns = [];
        const warnings = [];
        const knowns = [];
        
        // Helper to evaluate and track inputs
        const evalInput = (val, name, prov = null) => {
            if (this.isValid(val)) {
                knowns.push(name);
                return { value: val, status: this.getProvenanceStatus(val, prov) };
            }
            unknowns.push(name);
            return { value: "UNKNOWN", status: "UNKNOWN" };
        };

        const inputs = {
            auw: evalInput(drone.weight?.auw, "AUW"),
            motorCount: evalInput(drone.motors?.count, "Motor Count"),
            maxThrustPerMotor: evalInput(drone.motors?.maxThrustPerMotor, "Max Thrust / Motor", drone.motors?.maxThrustProvenance),
            motorKV: evalInput(drone.motors?.kv, "Motor KV"),
            motorPeakCurrent: evalInput(drone.motors?.maxCurrent, "Motor Peak Current"),
            propeller: (drone.propeller?.diameter && drone.propeller?.pitch) ? 
                { value: `${drone.propeller.diameter}x${drone.propeller.pitch}`, status: "USER_PROVIDED" } : 
                { value: "UNKNOWN", status: "UNKNOWN" },
            batteryCellCount: evalInput(drone.battery?.cellCount, "Battery Cell Count"),
            batteryCapacity: evalInput(drone.battery?.capacityMah, "Battery Capacity"),
            batteryCRating: evalInput(drone.battery?.cRating, "Battery C-Rating"),
            escCurrentRating: evalInput(drone.esc?.continuousCurrent, "ESC Current Rating")
        };

        if (inputs.propeller.value === "UNKNOWN") unknowns.push("Propeller Specs");
        else knowns.push("Propeller Specs");

        // Calculations
        const totalThrust = this.calculateTotalThrust(drone.motors?.count, drone.motors?.maxThrustPerMotor);
        const twr = this.calculateTWR(totalThrust, drone.weight?.auw);
        const hoverThrust = this.calculateHoverThrust(drone.weight?.auw, drone.motors?.count);
        const hoverThrottle = this.calculateHoverThrottle(hoverThrust, drone.motors?.maxThrustPerMotor);
        const batteryVoltage = this.calculateBatteryVoltage(drone.battery?.cellCount);
        const batteryEnergy = this.calculateBatteryEnergy(drone.battery?.cellCount, drone.battery?.capacityMah);
        const batteryDischarge = this.calculateBatteryDischargeCurrent(drone.battery?.capacityMah, drone.battery?.cRating);
        const power = this.calculatePower(batteryVoltage, drone.motors?.maxCurrent);
        const escMargin = this.calculateEscMargin(drone.esc?.continuousCurrent, drone.motors?.maxCurrent);

        const formatCalc = (calcObj, name) => {
            if (!calcObj) return { value: "UNKNOWN", status: "UNKNOWN" };
            knowns.push(name);
            return calcObj;
        };

        const calculations = {
            totalThrust: formatCalc(totalThrust, "Total Thrust"),
            twr: formatCalc(twr, "TWR"),
            hoverThrustPerMotor: formatCalc(hoverThrust, "Hover Thrust / Motor"),
            hoverThrottle: formatCalc(hoverThrottle, "Hover Throttle"),
            batteryVoltage: formatCalc(batteryVoltage, "Battery Voltage"),
            batteryEnergy: formatCalc(batteryEnergy, "Battery Energy"),
            batteryDischargeCurrent: formatCalc(batteryDischarge, "Battery Discharge Current"),
            power: formatCalc(power, "Power"),
            escMargin: formatCalc(escMargin, "ESC Margin")
        };

        // Validate Warnings
        if (calculations.twr.value !== "UNKNOWN" && calculations.twr.value < 1.0) {
            warnings.push("TWR is below 1:1. The drone mathematically cannot hover based on these inputs.");
        }
        if (calculations.escMargin.value !== "UNKNOWN" && calculations.escMargin.value < 0) {
            warnings.push("ESC Current Rating is lower than the Motor Peak Current. High risk of ESC failure.");
        }
        if (calculations.batteryDischargeCurrent.value !== "UNKNOWN" && calculations.totalThrust.value !== "UNKNOWN" && drone.motors?.maxCurrent) {
            const totalSysCurrent = drone.motors.maxCurrent * drone.motors.count;
            if (totalSysCurrent > calculations.batteryDischargeCurrent.value) {
                warnings.push("Total theoretical peak motor current exceeds the theoretical battery discharge rate. Battery damage or power loss may occur.");
            }
        }

        const totalFields = knowns.length + unknowns.length;
        const completeness = Math.round((knowns.length / totalFields) * 100) || 0;

        return {
            schemaVersion: "falconz-engineering-v1",
            droneId: drone.id,
            droneName: drone.name,
            inputs,
            calculations,
            summary: {
                status: completeness === 100 ? "COMPLETE" : "PARTIAL",
                configurationCompleteness: completeness,
                known: knowns,
                unknown: unknowns,
                warnings: warnings
            }
        };
    }
}

export default EngineeringEngine;
