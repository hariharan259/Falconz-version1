---
id: motor-fundamentals
title: Motor Fundamentals
category: MOTORS
source: FalconZ Knowledge Base
sourceType: INTERNAL_REFERENCE
version: 1.0
---

# Motor Fundamentals

## Overview
Brushless DC (BLDC) motors are the primary propulsion units for multirotor drones. They offer high efficiency, reliability, and excellent thrust-to-weight ratios compared to brushed motors.

## KV Rating (RPM per Volt)
The **KV rating** of a motor represents the theoretical RPM (Revolutions Per Minute) the motor will spin for every 1 volt of electricity applied to it under a completely no-load condition.
- A 1000KV motor supplied with 10V will theoretically spin at 10,000 RPM (with no propeller attached).
- KV is NOT a measure of power or torque.
- Lower KV motors are generally paired with larger propellers and higher voltage batteries. They produce more torque and are more efficient for heavy-lift drones.
- Higher KV motors are paired with smaller propellers and lower voltage batteries, spinning much faster, which is ideal for racing or acrobatic drones.

## RPM and Real-World Speed
**RPM (Revolutions Per Minute)** is the actual speed at which the motor is spinning.
While KV dictates the *theoretical maximum* speed under no load, adding a propeller introduces significant aerodynamic drag.
- Under load, a motor's actual RPM is usually only 70% to 85% of its theoretical KV * Voltage RPM.
- As the propeller size increases, the load increases, causing the motor to draw more current to maintain its RPM.

## Important Parameters
- **Voltage:** The operating voltage range the motor can safely handle (usually specified in terms of battery cell count, e.g., 3S-6S).
- **Current (Amps):** The maximum current the motor can draw before overheating or burning out the copper windings.
- **Maximum Power (Watts):** The absolute maximum electrical power the motor can dissipate (Power = Voltage x Current).
- **Propeller Compatibility:** The recommended range of propeller sizes and pitches suitable for the motor's KV and torque profile.

## Engineering Notes
Using a propeller that is too large for a given KV and voltage will cause the motor to demand excessive current from the ESC, leading to extreme heat buildup, reduced efficiency, and potential failure of the motor, ESC, or battery.

## Safety
Never exceed the manufacturer's maximum specified current or power ratings. Always test new motor/propeller combinations using a watt meter on a static thrust stand before attempting to fly. Do not assume motor peak current if the data is not provided by the manufacturer.
