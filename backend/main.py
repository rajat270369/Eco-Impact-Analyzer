from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/calculate', methods=['POST'])
def calculate_impact_api():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # --- 1. Raw Input Extraction ---
        diesel = float(data.get("diesel", 0))
        electricity = float(data.get("electricity", 0))
        concrete = float(data.get("concrete", 0))
        plastic = float(data.get("plastic", 0))

        # --- 2. Advanced Monitoring Logic ---
        
        # Diesel Breakdown: Energy conversion + fine-grained pollutants
        diesel_energy_mj = diesel * 38.5  # Energy density (MegaJoules)
        diesel_co2 = diesel * 2.68
        nox_emissions = diesel * 0.03     # Nitrogen Oxides (kg)
        so2_emissions = diesel * 0.005    # Sulfur Dioxide (kg)

        # Electricity Monitoring: Grid Intensity
        grid_factor = 0.82                # kg CO2/kWh (High carbon grid)
        elec_co2 = electricity * grid_factor

        # Material Mass Balance
        concrete_density = 2400           # kg/m³
        concrete_mass = concrete * concrete_density
        concrete_co2 = concrete * 100     # Production footprint

        # --- 3. Final Calculations ---
        total_co2 = diesel_co2 + elec_co2 + concrete_co2
        total_waste = plastic             # Physical kg of solid waste
        
        # Impact Score: Weighted sum of pollutants and waste
        impact_score = total_co2 + (plastic * 1.5) + (nox_emissions * 10)

        # --- 4. Return Data Packet ---
        return jsonify({
            # Standard Metrics
            "co2_emissions": round(total_co2, 2),
            "solid_waste": round(total_waste, 2),
            "impact_score": round(impact_score, 2),
            
            # Monitoring-Specific Details (For your System Log/Gauges)
            "monitoring_details": {
                "diesel_energy_mj": round(diesel_energy_mj, 2),
                "nox_levels": round(nox_emissions, 3),
                "so2_levels": round(so2_emissions, 3),
                "concrete_mass_kg": round(concrete_mass, 2),
                "grid_intensity_factor": grid_factor
            },
            
            # UI display categories
            "air_pollution": round(total_co2 + nox_emissions + so2_emissions, 2)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')