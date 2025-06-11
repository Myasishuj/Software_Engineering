from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from db import user_data_collection
import io
import pandas as pd
from flask_jwt_extended import jwt_required, get_jwt_identity, current_user

user_bp = Blueprint('user', __name__)

@user_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current = get_jwt_identity()
    return jsonify(logged_in_as=current), 200

@user_bp.route('/dashboard/submit-data', methods=['POST'])
@jwt_required()
def submit_data():
    if current_user.role not in ['user', 'admin']:
        return jsonify({"msg": "Unauthorized role to submit data"}), 403

    data_batch = request.get_json()
    if not isinstance(data_batch, list):
        return jsonify({"msg": "Data must be a list of records"}), 400
    if not data_batch:
        return jsonify({"msg": "No data provided to insert"}), 400

    records_to_insert = []
    for record in data_batch:
        if not isinstance(record, dict):
            return jsonify({"msg": "Each record must be a dictionary"}), 400
        record['username'] = current_user.username
        record['timestamp'] = datetime.utcnow()
        records_to_insert.append(record)

    try:
        user_data_collection.insert_many(records_to_insert)
        return jsonify({"msg": f"Successfully inserted {len(records_to_insert)} records."}), 201
    except Exception as e:
        return jsonify({"msg": f"Failed to insert data: {str(e)}"}), 500

        
@user_bp.route('/dashboard/download-excel', methods=['GET'])
@jwt_required()
def download_excel():
    today = date.today()
    start_of_day = datetime(today.year, today.month, today.day, 0, 0, 0)
    end_of_day = datetime(today.year, today.month, today.day, 23, 59, 59)

    if current_user.role == 'user':
        query = {
            "username": current_user.username,
            "timestamp": {"$gte": start_of_day, "$lte": end_of_day}
        }
    elif current_user.role == 'admin':
        query = {
            "timestamp": {"$gte": start_of_day, "$lte": end_of_day}
        }
    else:
        return jsonify({"msg": "Unauthorized role to download data"}), 403

    try:
        user_daily_data = list(user_data_collection.find(query, {"_id": 0}))

        if not user_daily_data:
            return jsonify({"msg": "No data available for today."}), 404

        df = pd.DataFrame(user_daily_data)
        if 'timestamp' in df.columns:
            df['timestamp'] = df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False, sheet_name='Daily Data')
        output.seek(0)

        filename = (
            f"{current_user.username}_daily_data_{today.strftime('%Y-%m-%d')}.xlsx"
            if current_user.role == 'user'
            else f"all_users_daily_data_{today.strftime('%Y-%m-%d')}.xlsx"
        )

        return send_file(
            output,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        return jsonify({"msg": f"Failed to generate Excel file: {str(e)}"}), 500
