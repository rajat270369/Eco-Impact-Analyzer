from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/calculate', methods=['POST'])
def calculate_impact_api():
    data = request.json
    
    # --- Your Logic Start ---
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
    # --- Your Logic End ---

    return jsonify({
        "air_pollution": round(air_pollution, 2),
        "solid_waste": round(solid_waste, 2),
        "co2_emissions": round(total_co2, 2),
        "impact_score": round(total_impact, 2)
    })