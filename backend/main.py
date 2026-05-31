from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import time
from collections import deque

app = Flask(__name__)
CORS(app)

# ==========================================
# 1. SHARED CONFIGURATIONS & MONITOR BUFFERS
# ==========================================

MAX_HISTORY = 50
telemetry_history = deque(maxlen=MAX_HISTORY)

# Persistent cross-module memory layout to retain accurate calculation fields
LAST_ANALYZE_DATA = {
    "co2_emissions": 0.0,
    "solid_waste": 0.0,
    "impact_score": 0.0,
    "calculated_yet": False
}

# Baseline operational safety limits based on international guidelines (US-AQI & µg/m³)
THRESHOLDS = {
    "us_aqi": 100.0,           # Warning limit for sensitive groups
    "particulate_pm10": 50.0,   # High particulate dust warning threshold
    "particulate_pm25": 35.0    # Fine industrial soot warning threshold
}


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

        # SAVE TO CENTRAL REPOSITORY FOR THE STRATEGIZE MODULE
        LAST_ANALYZE_DATA["co2_emissions"] = round(total_co2, 2)
        LAST_ANALYZE_DATA["solid_waste"] = round(total_waste, 2)
        LAST_ANALYZE_DATA["impact_score"] = round(impact_score, 2)
        LAST_ANALYZE_DATA["calculated_yet"] = True

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
# 3. ENGINE MONITOR MODULE ENDPOINTS (LIVE API)
# ==========================================

@app.route('/monitor/real-data', methods=['POST'])
def get_real_environmental_data():
    try:
        data = request.json or {}
        lat = data.get("lat")
        lon = data.get("lon")

        if lat is None or lon is None:
            return jsonify({"error": "Latitude and Longitude are required coordinates."}), 400

        # Querying Open-Meteo Air Quality Grid
        api_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,us_aqi"
        
        response = requests.get(api_url, timeout=10)
        if response.status_code != 200:
            return jsonify({"error": "Failed to contact open-meteo environmental towers."}), 502
            
        result = response.json()
        current_data = result.get("current", {})

        # Value parsing extraction
        raw_aqi = int(current_data.get("us_aqi", 0))
        pm10 = current_data.get("pm10", 0.0)
        pm25 = current_data.get("pm2_5", 0.0)
        co = current_data.get("carbon_monoxide", 0.0)
        no2 = current_data.get("nitrogen_dioxide", 0.0)

        # TECHNICAL FIX: Clamp US-AQI to its official standard maximum index ceiling of 500
        aqi = min(raw_aqi, 500)

        # Custom localized alert parsing
        alerts = []
        if raw_aqi > 500:
            alerts.append({"type": "CRITICAL", "parameter": "HAZARDOUS // Beyond Index Cap", "value": raw_aqi})
        elif aqi > 150:
            alerts.append({"type": "CRITICAL", "parameter": "Unhealthy Air Quality Index Threshold", "value": aqi})
        elif aqi > THRESHOLDS["us_aqi"]:
            alerts.append({"type": "WARNING", "parameter": "Sensitive Groups At Risk", "value": aqi})
            
        if pm10 > THRESHOLDS["particulate_pm10"]:
            alerts.append({"type": "WARNING", "parameter": "High Coarse Particulate Matter (PM10)", "value": pm10})
            
        if pm25 > THRESHOLDS["particulate_pm25"]:
            alerts.append({"type": "WARNING", "parameter": "High Fine Particulate Matter (PM2.5)", "value": pm25})

        # Format standardized data frame
        data_frame = {
            "timestamp": time.strftime("%H:%M:%S"),
            "unix_epoch": time.time(),
            "location_name": f"Gurugram Sector Node ({round(float(lat), 3)}, {round(float(lon), 3)})",
            "aqi": aqi,
            "metrics": {
                "pm10": pm10,
                "pm25": pm25,
                "carbon_monoxide": co,
                "nitrogen_dioxide": no2
            },
            "alerts": alerts
        }

        telemetry_history.append(data_frame)
        return jsonify(data_frame)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/monitor/history', methods=['GET'])
def get_telemetry_history():
    """Returns past recorded frames logged during the current session profile."""
    return jsonify(list(telemetry_history))


@app.route('/monitor/thresholds', methods=['GET'])
def get_thresholds():
    """Exposes current trigger caps to help style warning colors in UI panels."""
    return jsonify(THRESHOLDS)


@app.route('/strategize/generate', methods=['POST'])
def generate_mitigation_strategy():
    try:
        data = request.json or {}
        origin = data.get("origin", "monitor")  # "monitor" or "analyze"
        aggressiveness = float(data.get("aggressiveness", 0.5)) # 0.0 to 1.0
        tactics = data.get("tactics", []) # list of active mitigation toggles

        playbook = []
        projected_reductions = {"aqi": 0, "pm10": 0, "pm25": 0, "co2": 0}

        # 1. COMBINED EVALUATE OVERLAYS (Enforces accurate data across BOTH engines)
        # Pull real telemetry from the live monitor engine history mapping
        if len(telemetry_history) > 0:
            latest = telemetry_history[-1]
            current_aqi = latest["aqi"]
            current_pm10 = latest["metrics"]["pm10"]
            current_pm25 = latest["metrics"]["pm25"]
            location_string = latest["location_name"]
        else:
            # Explicit empty response profile if the live monitoring engine has not run yet
            return jsonify({
                "timestamp": time.strftime("%H:%M:%S"),
                "origin_analyzed": origin.upper(),
                "playbook": [],
                "prognosis": {"initial_aqi": 0, "target_aqi": 0, "initial_pm10": 0, "target_pm10": 0, "initial_pm25": 0, "target_pm25": 0}
            })

        # Fetch structural variables calculated straight from the Analyze core module
        analyze_co2 = LAST_ANALYZE_DATA["co2_emissions"]
        analyze_waste = LAST_ANALYZE_DATA["solid_waste"]
        analyze_score = LAST_ANALYZE_DATA["impact_score"]
        has_analyzed = LAST_ANALYZE_DATA["calculated_yet"]

        # 2. RUN REAL OPTIMIZATION HEURISTICS
        # Inject dynamic analysis data alerts straight into the target playbook rules
        if has_analyzed and analyze_co2 > 150.0:
            playbook.append({
                "step": "01",
                "action": f"MITIGATE EMISSIONS ANOMALY AT SYSTEM ORIGIN ({analyze_co2} kg CO2)",
                "impact": f"Current structural calculations exceed baseline constraints. Localizing offsets to curb a global score of {analyze_score}."
            })
            projected_reductions["co2"] += analyze_co2 * (aggressiveness * 0.3)

        # Dynamic load-shedding logic based on user's throttle aggression slider
        if current_aqi > 100 or current_pm10 > 50:
            load_reduction_pct = int(aggressiveness * 60)
            if load_reduction_pct > 0:
                playbook.append({
                    "step": "02",
                    "action": f"THROTTLE HEAVY HARDWARE GRID LOAD BY {load_reduction_pct}%",
                    "impact": f"Reduces core exhaust velocity and volatile airborne dispersion parameters at {location_string}."
                })
                projected_reductions["pm10"] += current_pm10 * (aggressiveness * 0.4)
                projected_reductions["pm25"] += current_pm25 * (aggressiveness * 0.35)

        # Process active tactical deployment options
        if "suppression" in tactics and (current_pm10 > 50 or current_pm25 > 35):
            mist_interval = max(10, int(60 - (aggressiveness * 40)))
            playbook.append({
                "step": "03",
                "action": f"DEPLOY WATER MIST CANNONS ON {mist_interval}-MINUTE CYCLES",
                "impact": f"Accelerates coercive grounding of suspension particulates ({round(current_pm10, 1)} µg/m³ PM10 tracked)."
            })
            projected_reductions["pm10"] += current_pm10 * 0.45
            projected_reductions["pm25"] += current_pm25 * 0.25

        if "materials" in tactics:
            waste_context = f" targeting {analyze_waste} kg waste debris" if has_analyzed else ""
            playbook.append({
                "step": "04",
                "action": "HOT-SWAP TO ECO-MIX FLY-ASH CONCRETE & FOSSIL GRID OFFSETS",
                "impact": f"Shaves off industrial mass balance carbon coefficients{waste_context} by a calculated margin of 22%."
            })
            projected_reductions["co2"] += 22.0

        if "logistics" in tactics and current_aqi > 150:
            playbook.append({
                "step": "05",
                "action": "RESTRICT TRUCK LOGISTICS AND FREIGHT ARRIVALS TO OFF-PEAK HOURS",
                "impact": "Prevents compounding localized emissions inside critical atmospheric inversion boundaries."
            })
            projected_reductions["aqi"] += current_aqi * 0.15

        # 3. COMPILE DELTA PROGNOSIS REPORT
        # Calculate final index variations ensuring values stay within physical bounds
        final_pm10 = max(12.0, current_pm10 - projected_reductions["pm10"])
        final_pm25 = max(5.0, current_pm25 - projected_reductions["pm25"])
        
        # Simple back-calculated predictive AQI estimate for visualization
        total_pm_drop = (projected_reductions["pm10"] + projected_reductions["pm25"]) / 2
        final_aqi = max(25, int(current_aqi - total_pm_drop - projected_reductions["aqi"]))

        return jsonify({
            "timestamp": time.strftime("%H:%M:%S"),
            "origin_analyzed": origin.upper(),
            "playbook": playbook,
            "prognosis": {
                "initial_aqi": current_aqi,
                "target_aqi": final_aqi,
                "initial_pm10": round(current_pm10, 1),
                "target_pm10": round(final_pm10, 1),
                "initial_pm25": round(current_pm25, 1),
                "target_pm25": round(final_pm25, 1)
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # Unified execution container on single port deployment 
    app.run(debug=True, port=5000, host='0.0.0.0')