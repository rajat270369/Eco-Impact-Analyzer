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

        # Querying Open-Meteo Air Quality Grid (No-Auth API)
        api_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,us_aqi"
        
        response = requests.get(api_url, timeout=10)
        if response.status_code != 200:
            return jsonify({"error": "Failed to contact open-meteo environmental towers."}), 502
            
        result = response.json()
        current_data = result.get("current", {})

        # Value parsing extraction
        aqi = int(current_data.get("us_aqi", 0))
        pm10 = current_data.get("pm10", 0.0)
        pm25 = current_data.get("pm2_5", 0.0)
        co = current_data.get("carbon_monoxide", 0.0)
        no2 = current_data.get("nitrogen_dioxide", 0.0)

        # Custom localized alert parsing
        alerts = []
        if aqi > 150:
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
            "location_name": f"GPS Node ({round(float(lat), 3)}, {round(float(lon), 3)})",
            "aqi": aqi,
            "metrics": {
                "pm10": pm10,
                "pm25": pm25,
                "carbon_monoxide": co,
                "nitrogen_dioxide": no2
            },
            "alerts": alerts
        }

        # Save to historical memory buffer tracking array
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


if __name__ == '__main__':
    # Unified execution container on single port deployment 
    app.run(debug=True, port=5000, host='0.0.0.0')