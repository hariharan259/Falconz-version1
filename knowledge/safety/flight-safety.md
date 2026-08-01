---
id: flight-safety
title: Flight Safety and Pre-Flight Checks
category: FLIGHT_SAFETY
source: FalconZ Knowledge Base
sourceType: INTERNAL_REFERENCE
version: 1.0
---

# Flight Safety and Pre-Flight Checks

## Overview
Drone operations require rigorous safety protocols to protect people, property, and the aircraft itself. A theoretical engineering calculation does not guarantee a safe flight; it is only a starting point.

## Theoretical vs. Actual Performance
- **Theoretical Calculations:** Tools like the FalconZ Engineering Engine provide theoretical estimations for maximum thrust, hover throttle, and battery discharge rates. These are based on static calculations and ideal conditions.
- **Flight Stability:** A high Thrust-to-Weight Ratio (TWR) provides control authority, but actual flight stability is dependent on proper center of gravity (CG), functioning PID loops, structural rigidity, and vibration isolation.
- **Environmental Factors:** Air density, wind, temperature, and humidity directly affect aerodynamic thrust and battery chemical performance.

## Essential Pre-Flight Checklist
Before flying any drone, the pilot should verify:
1. **Physical Integrity:** Ensure all propellers are securely fastened, completely undamaged, and spinning in the correct direction. Check the frame for loose screws and the motors for bearing play.
2. **Electrical Safety:** Inspect battery voltage. Ensure all cells are balanced and fully charged. Verify there are no exposed wires or loose solder joints.
3. **Firmware & Sensors:** Connect to the flight controller (e.g., ArduPilot/Betaflight) and verify that the gyroscope, accelerometer, compass, and GPS are reporting healthy data. Check that calibrations are up to date.
4. **Control Link:** Verify RC link quality and failsafe behavior. Ensure the drone is programmed to Return to Launch (RTL) or safely land on signal loss.
5. **Operating Area:** Check airspace restrictions and ensure the area is clear of bystanders.

## Important Note on Theoretical Data
Never guarantee that a drone is safe to fly based only on theoretical calculations. Theoretical TWR represents a maximum thrust margin based on supplied inputs, but does not guarantee flight stability, control performance, thermal safety, electrical safety, battery capability, structural integrity, real-world thrust, or actual flight behavior.
