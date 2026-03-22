from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# This allows your Frontend (browser) to talk to this Backend
CORS(app)

@app.route('/calculate', methods=['POST'])
def calculate_impact_api():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # --- Your Logic ---
        diesel = float(data.get("diesel", 0))
        electricity = float(data.get("electricity", 0))
        concrete = float(data.get("concrete", 0))
        plastic = float(data.get("plastic", 0))

        diesel_co2 = diesel * 2.68
        electricity_co2 = electricity * 0.82
        concrete_co2 = concrete * 100

        total_co2 = diesel_co2 + electricity_co2 + concrete_co2
        waste_score = plastic * 1.5

        air_pollution = total_co2
        solid_waste = plastic
        total_impact = total_co2 + waste_score

        return jsonify({
            "air_pollution": round(air_pollution, 2),
            "solid_waste": round(solid_waste, 2),
            "co2_emissions": round(total_co2, 2),
            "impact_score": round(total_impact, 2)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # host 0.0.0.0 is best for WSL/Ubuntu to ensure the port is accessible
    app.run(debug=True, port=5000, host='0.0.0.0')