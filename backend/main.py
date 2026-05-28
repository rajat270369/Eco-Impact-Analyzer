from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import time
from collections import deque

app = Flask(__name__)
CORS(app)

# ==========================================
# 1. SHARED CONFIGURATIONS & MONITOR BUFFERS
# ==========================================

MAX_HISTORY = 50
telemetry_history = deque(maxlen=MAX_HISTORY)

# Baseline operational thresholds for site telemetry
THRESHOLDS = {
    "co2_rate": 150.0,        # kg/hour maximum optimal limits
    "particulate_pm10": 50.0, # micrograms/m³ limit
    "noise_level": 85.0,       # Decibels (dB) safety limit
}

# Initial state registry for monitored heavy machinery
device_registry = {
    "GEN-01": {"name": "Primary Diesel Generator", "status": "OPERATIONAL", "load": 0.72},
    "EXC-04": {"name": "Heavy Excavator Unit", "status": "OPERATIONAL", "load": 0.45},
    "MIX-02": {"name": "Concrete Batching Station", "status": "IDLE", "load": 0.0}
}


def generate_live_sensor_reading():
    """Simulates real-time sensor variations based on active hardware load coefficients."""
    active_machines = sum(1 for m in device_registry.values() if m["status"] == "OPERATIONAL")
    load_factor = sum(m["load"] for m in device_registry.values())
    
    co2_now = round((load_factor * 110.0) + random.uniform(-10, 10), 2)
    pm10_now = round((active_machines * 15.2) + random.uniform(-5, 8), 2)
    noise_now = round(65.0 + (load_factor * 22.0) + random.uniform(-3, 3), 1)
    
    alerts = []
    if co2_now > THRESHOLDS["co2_rate"]:
        alerts.append({"type": "CRITICAL", "parameter": "CO₂ Rate Emission Overload", "value": co2_now})
    if pm10_now > THRESHOLDS["particulate_pm10"]:
        alerts.append({"type": "WARNING", "parameter": "High Ambient Particulate Matter (PM10)", "value": pm10_now})
    if noise_now > THRESHOLDS["noise_level"]:
        alerts.append({"type": "DANGER", "parameter": "Acoustic Decibel Threshold Breached", "value": noise_now})

    return {
        "timestamp": time.strftime("%H:%M:%S"),
        "unix_epoch": time.time(),
        "metrics": {
            "co2_rate_kgh": max(0.0, co2_now),
            "particulate_pm10": max(0.0, pm10_now),
            "noise_db": max(0.0, noise_now)
        },
        "alerts": alerts,
        "active_load_coefficient": round(load_factor, 2)
    }


# Seed core ring buffer so history charts load with real historical context
for _ in range(20):
    telemetry_history.append(generate_live_sensor_reading())
    time.sleep(0.01)


# ==========================================
# 2. ANALYSIS CORE MODULE ENDPOINTS
# ==========================================

@app.route('/calculate', methods=['POST'])
def calculate_impact_api():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Raw Input Extraction
        diesel = float(data.get("diesel", 0))
        electricity = float(data.get("electricity", 0))
        concrete = float(data.get("concrete", 0))
        plastic = float(data.get("plastic", 0))

        # Diesel Breakdown Calculation
        diesel_energy_mj = diesel * 38.5 
        diesel_co2 = diesel * 2.68
        nox_emissions = diesel * 0.03     
        so2_emissions = diesel * 0.005    

        # Electricity Monitoring via Grid Intensity
        grid_factor = 0.82                
        elec_co2 = electricity * grid_factor

        # Material Mass Balance
        concrete_density = 2400           
        concrete_mass = concrete * concrete_density
        concrete_co2 = concrete * 100     

        # Aggregated Matrix Computations
        total_co2 = diesel_co2 + elec_co2 + concrete_co2
        total_waste = plastic             
        impact_score = total_co2 + (plastic * 1.5) + (nox_emissions * 10)

        return jsonify({
            "co2_emissions": round(total_co2, 2),
            "solid_waste": round(total_waste, 2),
            "impact_score": round(impact_score, 2),
            "monitoring_details": {
                "diesel_energy_mj": round(diesel_energy_mj, 2),
                "nox_levels": round(nox_emissions, 3),
                "so2_levels": round(so2_emissions, 3),
                "concrete_mass_kg": round(concrete_mass, 2),
                "grid_intensity_factor": grid_factor
            },
            "air_pollution": round(total_co2 + nox_emissions + so2_emissions, 2)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# 3. ENGINE MONITOR MODULE ENDPOINTS
# ==========================================

@app.route('/monitor/stream', methods=['GET'])
def get_live_telemetry():
    try:
        new_frame = generate_live_sensor_reading()
        telemetry_history.append(new_frame)
        return jsonify(new_frame)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/monitor/history', methods=['GET'])
def get_telemetry_history():
    return jsonify(list(telemetry_history))


@app.route('/monitor/devices', methods=['GET', 'POST'])
def manage_devices():
    try:
        if request.method == 'POST':
            data = request.json or {}
            device_id = data.get("device_id")
            
            if device_id in device_registry:
                if "status" in data:
                    device_registry[device_id]["status"] = data["status"]
                if "load" in data:
                    # Automatically zero load scales if a machine is toggled to an inactive state
                    device_registry[device_id]["load"] = float(data["load"]) if data["status"] == "OPERATIONAL" else 0.0
                return jsonify({"success": True, "updated_device": device_registry[device_id]})
            return jsonify({"error": "Device ID registration signature missing."}), 404
            
        return jsonify(device_registry)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/monitor/thresholds', methods=['GET'])
def get_thresholds():
    return jsonify(THRESHOLDS)


if __name__ == '__main__':
    # Unified execution container on single port deployment 
    app.run(debug=True, port=5000, host='0.0.0.0')