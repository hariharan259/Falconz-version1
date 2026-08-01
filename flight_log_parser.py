import os
import math
from pymavlink import mavutil

MAX_SAMPLES = 1000

def parse_flight_log(file_path):
    if not os.path.exists(file_path):
        return {"status": "ERROR", "message": "File not found"}

    try:
        if os.path.getsize(file_path) == 0:
            return {"status": "ERROR", "message": "Empty file"}
            
        mlog = mavutil.mavlink_connection(file_path)
    except Exception as e:
        return {"status": "ERROR", "message": f"Parser init failed: {str(e)}"}

    channels_presence = {
        k: False for k in ["ATT", "BAT", "VIBE", "ERR", "GPS", "IMU", "NKF", "XKF", 
                           "POS", "CTUN", "NTUN", "MODE", "MSG", "EV", "EVT", "ARSP", 
                           "RCOU", "RCIN", "BARO", "MAG", "GPA", "GPA2"]
    }

    raw_data = {
        "ATT": [],
        "BAT": [],
        "VIBE": [],
        "GPS": [],
        "RCIN": [],
        "RCOU": [],
        "MODE": []
    }
    
    events = []
    
    # Metadata
    message_counts = {}
    start_time_us = None
    end_time_us = None
    firmware = "Unknown"
    vehicle_type = "Unknown"
    
    try:
        while True:
            m = mlog.recv_msg()
            if m is None:
                break
                
            mtype = m.get_type()
            message_counts[mtype] = message_counts.get(mtype, 0) + 1
            
            if mtype in channels_presence:
                channels_presence[mtype] = True
                
            # Time tracking
            timestamp = getattr(m, 'TimeUS', None)
            if timestamp is not None:
                if start_time_us is None:
                    start_time_us = timestamp
                end_time_us = timestamp
                
            if mtype == 'MSG':
                msg_text = getattr(m, 'Message', '')
                if 'ArduCopter' in msg_text or 'ArduPlane' in msg_text or 'ArduRover' in msg_text or 'ArduSub' in msg_text:
                    firmware = msg_text
                    vehicle_type = msg_text.split()[0] if msg_text else "Unknown"

            # Telemetry for charts and analysis
            if mtype == 'ATT':
                raw_data['ATT'].append({
                    "time": timestamp,
                    "roll": getattr(m, 'Roll', 0),
                    "pitch": getattr(m, 'Pitch', 0),
                    "yaw": getattr(m, 'Yaw', 0)
                })
            elif mtype == 'BAT':
                raw_data['BAT'].append({
                    "time": timestamp,
                    "volt": getattr(m, 'Volt', 0),
                    "curr": getattr(m, 'Curr', 0)
                })
            elif mtype == 'VIBE':
                raw_data['VIBE'].append({
                    "time": timestamp,
                    "vibeX": getattr(m, 'VibeX', 0),
                    "vibeY": getattr(m, 'VibeY', 0),
                    "vibeZ": getattr(m, 'VibeZ', 0)
                })
            elif mtype == 'ERR':
                subsys = getattr(m, 'Subsys', 0)
                ecode = getattr(m, 'ECode', 0)
                events.append({
                    "code": "FLIGHT_CONTROLLER_ERROR",
                    "severity": "CRITICAL",
                    "observed": True,
                    "evidence": f"ERR msg: Subsys {subsys}, ECode {ecode}",
                    "source": "OBSERVED_TELEMETRY",
                    "timestamp": timestamp
                })
            elif mtype == 'EV':
                ev_id = getattr(m, 'Id', 0)
                events.append({
                    "code": f"SYSTEM_EVENT_{ev_id}",
                    "severity": "INFO",
                    "observed": True,
                    "evidence": f"EV msg Id: {ev_id}",
                    "source": "OBSERVED_TELEMETRY",
                    "timestamp": timestamp
                })
            elif mtype == 'GPS':
                raw_data['GPS'].append({
                    "time": timestamp,
                    "status": getattr(m, 'Status', 0),
                    "hdop": getattr(m, 'HDop', 0),
                    "nsats": getattr(m, 'NSats', 0)
                })
            elif mtype == 'RCIN':
                raw_data['RCIN'].append({
                    "time": timestamp,
                    "c1": getattr(m, 'C1', 0),
                    "c2": getattr(m, 'C2', 0),
                    "c3": getattr(m, 'C3', 0),
                    "c4": getattr(m, 'C4', 0)
                })
            elif mtype == 'RCOU':
                raw_data['RCOU'].append({
                    "time": timestamp,
                    "c1": getattr(m, 'C1', 0),
                    "c2": getattr(m, 'C2', 0),
                    "c3": getattr(m, 'C3', 0),
                    "c4": getattr(m, 'C4', 0)
                })
            elif mtype == 'MODE':
                modenum = getattr(m, 'ModeNum', getattr(m, 'Mode', 0))
                raw_data['MODE'].append({
                    "time": timestamp,
                    "mode": modenum
                })
                
    except Exception as e:
        return {"status": "ERROR", "message": f"Parse failure during iteration: {str(e)}"}
        
    duration = 0
    if start_time_us and end_time_us:
        duration = (end_time_us - start_time_us) / 1000000.0
        
    def downsample(data_list, max_samples):
        if not data_list:
            return []
        n = len(data_list)
        if n <= max_samples:
            return data_list
        step = n / float(max_samples)
        return [data_list[int(i * step)] for i in range(max_samples)]
        
    sampled_channels = {}
    for ch in ['ATT', 'BAT', 'VIBE', 'GPS', 'RCIN', 'RCOU']:
        sampled = downsample(raw_data[ch], MAX_SAMPLES)
        sampled_channels[ch] = {
            "available": len(sampled) > 0,
            "samples": sampled
        }
        
    health_score = 100
    deductions = []
    
    summary = {
        "battery": "UNKNOWN",
        "vibration": "UNKNOWN",
        "attitude": "UNKNOWN",
        "gps": "UNKNOWN",
        "errors": "UNKNOWN",
        "rc": "UNKNOWN",
        "motors": "UNKNOWN",
        "ekf": "UNKNOWN"
    }
    
    # 1. Vibration Analysis
    if sampled_channels['VIBE']['available']:
        vibe_z_vals = [s['vibeZ'] for s in raw_data['VIBE']]
        max_z = max(vibe_z_vals)
        avg_z = sum(vibe_z_vals) / len(vibe_z_vals)
        summary['vibration'] = {"max_z": max_z, "avg_z": avg_z}
        if max_z > 30:
            events.append({
                "code": "VIBRATION_ELEVATED",
                "severity": "WARNING",
                "observed": True,
                "evidence": f"Peak VibeZ={max_z:.1f} > 30",
                "source": "DETERMINISTIC_CALCULATION",
                "timestamp": None
            })
            health_score -= 15
            deductions.append("-15 High Vibration (VibeZ > 30)")
            
    # 2. Battery Analysis
    if sampled_channels['BAT']['available']:
        volts = [s['volt'] for s in raw_data['BAT'] if s['volt'] > 0]
        currs = [s['curr'] for s in raw_data['BAT']]
        if volts:
            avg_v = sum(volts) / len(volts)
            min_v = min(volts)
            max_v = max(volts)
            avg_c = sum(currs) / len(currs) if currs else 0
            max_c = max(currs) if currs else 0
            
            summary['battery'] = {
                "avg_voltage": avg_v,
                "min_voltage": min_v,
                "max_voltage": max_v,
                "avg_current": avg_c,
                "peak_current": max_c
            }
            
            # Sag and Spike detection
            for s in raw_data['BAT']:
                if s['curr'] > (avg_c * 1.5) and s['volt'] < (avg_v * 0.9):
                    events.append({
                        "code": "VOLTAGE_SAG",
                        "severity": "WARNING",
                        "observed": True,
                        "evidence": f"Curr {s['curr']:.1f}A > 1.5x Avg & Volt {s['volt']:.1f}V < 0.9x Avg",
                        "source": "DETERMINISTIC_CALCULATION",
                        "timestamp": s['time']
                    })
                    health_score -= 10
                    deductions.append("-10 Voltage Sag Event")
                    break
            
            for s in raw_data['BAT']:
                if avg_c > 5 and s['curr'] > (avg_c * 2.0):
                    events.append({
                        "code": "CURRENT_SPIKE",
                        "severity": "WARNING",
                        "observed": True,
                        "evidence": f"Curr {s['curr']:.1f}A > 2.0x Avg ({avg_c:.1f}A)",
                        "source": "DETERMINISTIC_CALCULATION",
                        "timestamp": s['time']
                    })
                    health_score -= 5
                    deductions.append("-5 Current Spike")
                    break

    # 3. GPS Analysis
    if sampled_channels['GPS']['available']:
        hdops = [s['hdop'] for s in raw_data['GPS'] if s['hdop'] > 0]
        nsats = [s['nsats'] for s in raw_data['GPS']]
        if hdops and nsats:
            avg_hdop = sum(hdops) / len(hdops)
            max_hdop = max(hdops)
            avg_sats = sum(nsats) / len(nsats)
            min_sats = min(nsats)
            max_sats = max(nsats)
            
            summary['gps'] = {
                "avg_hdop": avg_hdop,
                "max_hdop": max_hdop,
                "avg_sats": avg_sats,
                "min_sats": min_sats,
                "max_sats": max_sats
            }
            
            if avg_hdop > 2.0 or max_hdop > 3.0:
                events.append({
                    "code": "GPS_DEGRADED",
                    "severity": "WARNING",
                    "observed": True,
                    "evidence": f"Avg HDOP {avg_hdop:.2f}, Max HDOP {max_hdop:.2f}",
                    "source": "DETERMINISTIC_CALCULATION",
                    "timestamp": None
                })
                health_score -= 5
                deductions.append("-5 Degraded GPS")
            
            # Detect Signal Loss
            for s in raw_data['GPS']:
                if s['nsats'] < 6:
                    events.append({
                        "code": "GPS_SIGNAL_LOSS",
                        "severity": "WARNING",
                        "observed": True,
                        "evidence": f"Sats dropped to {s['nsats']}",
                        "source": "DETERMINISTIC_CALCULATION",
                        "timestamp": s['time']
                    })
                    break

    # 4. RC Input Analysis
    if sampled_channels['RCIN']['available']:
        c1 = [s['c1'] for s in raw_data['RCIN']]
        c2 = [s['c2'] for s in raw_data['RCIN']]
        c3 = [s['c3'] for s in raw_data['RCIN']]
        c4 = [s['c4'] for s in raw_data['RCIN']]
        summary['rc'] = {
            "c1_avg": sum(c1)/len(c1) if c1 else 0,
            "c1_min": min(c1) if c1 else 0, "c1_max": max(c1) if c1 else 0,
            "c2_avg": sum(c2)/len(c2) if c2 else 0,
            "c2_min": min(c2) if c2 else 0, "c2_max": max(c2) if c2 else 0,
            "c3_avg": sum(c3)/len(c3) if c3 else 0,
            "c3_min": min(c3) if c3 else 0, "c3_max": max(c3) if c3 else 0,
            "c4_avg": sum(c4)/len(c4) if c4 else 0,
            "c4_min": min(c4) if c4 else 0, "c4_max": max(c4) if c4 else 0
        }

    # 5. Motor/ESC Output Analysis
    if sampled_channels['RCOU']['available']:
        c1 = [s['c1'] for s in raw_data['RCOU']]
        c2 = [s['c2'] for s in raw_data['RCOU']]
        c3 = [s['c3'] for s in raw_data['RCOU']]
        c4 = [s['c4'] for s in raw_data['RCOU']]
        summary['motors'] = {
            "c1_avg": sum(c1)/len(c1) if c1 else 0,
            "c1_min": min(c1) if c1 else 0, "c1_max": max(c1) if c1 else 0,
            "c2_avg": sum(c2)/len(c2) if c2 else 0,
            "c2_min": min(c2) if c2 else 0, "c2_max": max(c2) if c2 else 0,
            "c3_avg": sum(c3)/len(c3) if c3 else 0,
            "c3_min": min(c3) if c3 else 0, "c3_max": max(c3) if c3 else 0,
            "c4_avg": sum(c4)/len(c4) if c4 else 0,
            "c4_min": min(c4) if c4 else 0, "c4_max": max(c4) if c4 else 0
        }
        
    # 6. EKF/Navigation
    if channels_presence['NKF'] or channels_presence['XKF'] or channels_presence['POS']:
        summary['ekf'] = {
            "nkf_present": channels_presence['NKF'],
            "xkf_present": channels_presence['XKF'],
            "pos_present": channels_presence['POS']
        }
        
    # 7. Errors check
    err_events = [e for e in events if e['code'] == "FLIGHT_CONTROLLER_ERROR"]
    if err_events:
        summary['errors'] = f"{len(err_events)} FC Errors observed."
        penalty = min(30, len(err_events) * 5)
        health_score -= penalty
        deductions.append(f"-{penalty} FC Errors recorded")
    elif channels_presence["ERR"]:
        summary['errors'] = "No critical errors recorded."

    # Data Quality & Evidence Status
    known = [k for k, v in channels_presence.items() if v]
    unknown = [k for k, v in channels_presence.items() if not v]
    completeness = len(known) / len(channels_presence.keys()) * 100 if channels_presence else 0

    if completeness >= 85:
        evidence_status = "COMPLETE"
    elif completeness >= 65:
        evidence_status = "GOOD"
    elif completeness >= 40:
        evidence_status = "LIMITED"
    else:
        evidence_status = "INSUFFICIENT"

    health_score = max(0, health_score)

    return {
        "status": "SUCCESS",
        "filename": os.path.basename(file_path),
        "format": "ArduPilot DataFlash BIN",
        "metadata": {
            "durationSeconds": round(duration, 2),
            "firmware": firmware,
            "vehicleType": vehicle_type,
            "messageCounts": message_counts
        },
        "channels": sampled_channels,
        "flightModes": raw_data['MODE'],
        "summary": summary,
        "events": events,
        "healthScore": {
            "score": health_score,
            "grade": "GOOD" if health_score >= 90 else "CAUTION" if health_score >= 75 else "WARNING",
            "deductions": deductions,
            "evidenceStatus": evidence_status
        },
        "dataQuality": {
            "knownChannels": known,
            "unknownChannels": unknown,
            "completenessPercent": round(completeness, 1),
            "coverage": evidence_status
        }
    }

if __name__ == "__main__":
    import sys
    import json
    if len(sys.argv) > 1:
        res = parse_flight_log(sys.argv[1])
        res.pop("channels", None)
        print(json.dumps(res, indent=2))
