from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_jwt_extended import create_access_token, jwt_required, JWTManager, get_jwt_identity, get_jwt
import pandas as pd
import io
import json
from datetime import datetime, timedelta, timezone
import logging

# For MongoDB
from pymongo import MongoClient
from bson.objectid import ObjectId # To handle MongoDB's default _id
from werkzeug.security import generate_password_hash, check_password_hash
import os # For environment variables

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# --- JWT Configuration ---
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-jwt-key") # Change this in production!
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24) # Tokens valid for 24 hours
jwt = JWTManager(app)

# --- MongoDB Connection ---
MONGO_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/') 
client = MongoClient(MONGO_URI)
db = client.excel_creator_db # Your database name
templates_collection = db.templates # Collection for general templates
users_collection = db.users # Collection for users
daily_data_collection = db.daily_data # This will now store APPROVED daily data
pending_data_collection = db.pending_data # NEW: Collection for pending data requests

# --- JWT Callbacks (for user identity) ---
@jwt.user_identity_loader
def user_identity_callback(user):
    # Ensure user is a dict and has 'username'
    if isinstance(user, dict) and 'username' in user:
        return user['username']
    return None # Or raise an error if this state is unexpected

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    return users_collection.find_one({"username": identity})

# --- Add some default templates and a default user to MongoDB if collections are empty ---
def initialize_db():
    if templates_collection.count_documents({}) == 0:
        logger.info("Initializing default templates into MongoDB...")
        default_templates = [
            {
                'id': 'sales_report',
                'name': 'Sales Report',
                'description': 'Basic sales data template',
                'columns': ['Product', 'Quantity', 'Price', 'Total'],
                'sample_data': [
                    {'Product': 'Laptop', 'Quantity': 5, 'Price': 999.99, 'Total': 4999.95},
                    {'Product': 'Mouse', 'Quantity': 20, 'Price': 25.50, 'Total': 510.00}
                ]
            },
            {
                'id': 'inventory',
                'name': 'Inventory List',
                'description': 'Product inventory tracking',
                'columns': ['Item', 'SKU', 'Stock', 'Location'],
                'sample_data': [
                    {'Item': 'Widget A', 'SKU': 'WA001', 'Stock': 150, 'Location': 'Warehouse A'},
                    {'Item': 'Widget B', 'SKU': 'WB001', 'Stock': 75, 'Location': 'Warehouse B'}
                ]
            },
            {
                'id': 'employees',
                'name': 'Employee List',
                'description': 'Basic employee information',
                'columns': ['Name', 'Department', 'Position', 'Email'],
                'sample_data': [
                    {'Name': 'John Doe', 'Department': 'IT', 'Position': 'Developer', 'Email': 'john@company.com'},
                    {'Name': 'Jane Smith', 'Department': 'HR', 'Position': 'Manager', 'Email': 'jane@company.com'}
                ]
            }
        ]
        templates_collection.insert_many(default_templates)
        logger.info("Default templates initialized.")
    else:
        logger.info("Templates collection is not empty, skipping initialization.")

    if users_collection.count_documents({}) == 0:
        logger.info("Initializing default users into MongoDB...")
        # Password for admin is 'admin', for user is 'user'
        hashed_admin_password = generate_password_hash('admin')
        hashed_user_password = generate_password_hash('user')

        default_users = [
            {'username': 'admin', 'password': hashed_admin_password, 'role': 'admin'},
            {'username': 'user', 'password': hashed_user_password, 'role': 'user'}
        ]
        users_collection.insert_many(default_users)
        logger.info("Default users initialized.")
    else:
        logger.info("Users collection is not empty, skipping user initialization.")


# Call initialization on app startup
with app.app_context():
    initialize_db()


# --- CORS headers for all responses ---
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Credentials'] = 'true' # Important for JWT with credentials
    return response

@app.route('/', methods=['GET'])
def home():
    """Health check endpoint"""
    return jsonify({
        'message': 'Excel Creator API is running',
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

# --- Authentication Routes ---
@app.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200 

    username = request.json.get('username', None)
    password = request.json.get('password', None)

    if not username or not password:
        return jsonify({"msg": "Missing username or password"}), 400

    user = users_collection.find_one({"username": username})

    if user and check_password_hash(user['password'], password):
        access_token = create_access_token(identity=user)
        return jsonify(access_token=access_token, username=user['username'], role=user['role']), 200
    else:
        return jsonify({"msg": "Bad username or password"}), 401

@app.route('/register', methods=['POST'])
def register():
    username = request.json.get('username', None)
    password = request.json.get('password', None)
    role = request.json.get('role', 'user') # Default role is 'user'

    if not username or not password:
        return jsonify({"msg": "Missing username or password"}), 400

    if users_collection.find_one({"username": username}):
        return jsonify({"msg": "Username already exists"}), 409

    hashed_password = generate_password_hash(password)
    users_collection.insert_one({"username": username, "password": hashed_password, "role": role})

    return jsonify({"msg": "User registered successfully"}), 201

# --- Excel Creation & Template Routes (mostly unchanged, added JWT protection) ---
@app.route('/create-excel', methods=['POST'])
@jwt_required() 
def create_excel():
    """
    Create an Excel file from JSON data and return it as a downloadable file
    This is for direct creation, not tied to approval workflow
    """
    try:
        current_user_identity = get_jwt_identity() 
        logger.info(f"User {current_user_identity} requesting direct Excel creation.")

        json_data = request.get_json()
        
        if not json_data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        filename = json_data.get('filename', 'data')
        sheet_name = json_data.get('sheet_name', 'Sheet1')
        data = json_data.get('data', [])
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if not isinstance(data, list):
            return jsonify({'error': 'Data must be a list of objects'}), 400
        
        for i, item in enumerate(data):
            if not isinstance(item, dict):
                return jsonify({'error': f'Item at index {i} is not a valid object'}), 400
        
        df = pd.DataFrame(data)
        excel_buffer = io.BytesIO()
        
        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=sheet_name, index=False)
            
            workbook = writer.book
            worksheet = writer.sheets[sheet_name]
            
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                
                for cell in column:
                    try:
                        if cell.value is not None and len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
            
            from openpyxl.styles import Font, PatternFill, Border, Side
            
            header_font = Font(bold=True, color="FFFFFF")
            header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
            border = Border(
                left=Side(border_style="thin"),
                right=Side(border_style="thin"),
                top=Side(border_style="thin"),
                bottom=Side(border_style="thin")
            )
            
            for cell in worksheet[1]:
                cell.font = header_font
                cell.fill = header_fill
                cell.border = border
        
        excel_buffer.seek(0)
        safe_filename = f"{filename}.xlsx"
        
        logger.info(f"Created Excel file: {safe_filename} for user {current_user_identity} with {len(data)} rows")
        
        return send_file(
            excel_buffer,
            as_attachment=True,
            download_name=safe_filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        logger.error(f"Error creating Excel file for user {current_user_identity}: {str(e)}")
        return jsonify({'error': f'Failed to create Excel file: {str(e)}'}), 500

@app.route('/validate-data', methods=['POST'])
@jwt_required() 
def validate_data():
    """
    Validate JSON data structure without creating the Excel file
    """
    try:
        json_data = request.get_json()
        
        if not json_data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        data = json_data.get('data', [])
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if not isinstance(data, list):
            return jsonify({'error': 'Data must be a list of objects'}), 400
        
        columns = set()
        for i, item in enumerate(data):
            if not isinstance(item, dict):
                return jsonify({'error': f'Item at index {i} is not a valid object'}), 400
            columns.update(item.keys())
        
        df = pd.DataFrame(data)
        
        return jsonify({
            'valid': True,
            'row_count': len(data),
            'columns': list(columns),
            'preview': df.head().to_dict('records') if len(data) > 0 else []
        })
        
    except Exception as e:
        logger.error(f"Error validating data: {str(e)}")
        return jsonify({'error': f'Validation failed: {str(e)}'}), 500

@app.route('/templates', methods=['GET'])
@jwt_required() 
def get_templates():
    """
    Get available Excel templates from MongoDB
    """
    try:
        templates_cursor = templates_collection.find({}, {'_id': 0}) # Exclude _id
        templates = list(templates_cursor)
        return jsonify({'templates': templates})
    except Exception as e:
        logger.error(f"Error fetching templates from MongoDB: {str(e)}")
        return jsonify({'error': 'Failed to retrieve templates'}), 500

@app.route('/create-from-template/<template_id>', methods=['POST'])
@jwt_required() 
def create_from_template(template_id):
    """
    Create an Excel file from a predefined template stored in MongoDB
    """
    try:
        current_user_identity = get_jwt_identity()
        template = templates_collection.find_one({'id': template_id}, {'_id': 0})

        if not template:
            return jsonify({'error': 'Template not found'}), 404

        filename = template.get('name', 'template_data').lower().replace(' ', '_')
        sheet_name = template.get('sheet_name', template.get('name', 'Sheet1'))
        data = template.get('sample_data', []) # Use sample_data

        if not data:
            return jsonify({'error': 'Template has no sample data'}), 400

        df = pd.DataFrame(data)
        excel_buffer = io.BytesIO()

        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=sheet_name, index=False)

            workbook = writer.book
            worksheet = writer.sheets[sheet_name]

            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter

                for cell in column:
                    try:
                        if cell.value is not None and len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass

                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width

            from openpyxl.styles import Font, PatternFill, Border, Side
            
            header_font = Font(bold=True, color="FFFFFF")
            header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
            border = Border(
                left=Side(border_style="thin"),
                right=Side(border_style="thin"),
                top=Side(border_style="thin"),
                bottom=Side(border_style="thin")
            )
            
            for cell in worksheet[1]:
                cell.font = header_font
                cell.fill = header_fill
                cell.border = border

        excel_buffer.seek(0)
        safe_filename = f"{filename}.xlsx"

        logger.info(f"Created Excel file from template '{template_id}' for user {current_user_identity}: {safe_filename} with {len(data)} rows")

        return send_file(
            excel_buffer,
            as_attachment=True,
            download_name=safe_filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

    except Exception as e:
        logger.error(f"Error creating Excel file from template {template_id} for user {current_user_identity}: {str(e)}")
        return jsonify({'error': f'Failed to create Excel file from template: {str(e)}'}), 500

# --- Daily Data Submission & Approval Workflow Endpoints ---

@app.route('/dashboard/submit-data', methods=['POST'])
@jwt_required()
def submit_daily_data():
    """
    User endpoint to submit data for admin approval.
    Data is stored in pending_data_collection with status "pending".
    """
    current_user_identity = get_jwt_identity() 
    user = users_collection.find_one({"username": current_user_identity})

    if not user:
        return jsonify({"msg": "User not found."}), 404
    
    records = request.get_json()

    if not records or not isinstance(records, list) or not all(isinstance(rec, dict) for rec in records):
        return jsonify({"msg": "Invalid data format. Expected an array of objects."}), 400

    try:
        data_to_insert = {
            "user_id": str(user['_id']), 
            "username": current_user_identity,
            "submission_timestamp": datetime.now(timezone.utc),
            "records": records,
            "status": "pending" # Initial status is pending
        }

        # Insert the data into the pending collection
        pending_data_collection.insert_one(data_to_insert)
        logger.info(f"User {current_user_identity} submitted data for approval. Request ID: {data_to_insert['_id']}")
        return jsonify({"msg": "Data submitted for approval successfully!", "requestId": str(data_to_insert['_id'])}), 201

    except Exception as e:
        logger.error(f"Error submitting data for user {current_user_identity} for approval: {str(e)}")
        return jsonify({"msg": f"Failed to submit data for approval: {str(e)}"}), 500


@app.route('/dashboard/download-excel', methods=['GET'])
@jwt_required()
def download_daily_excel():
    """
    Downloads an Excel file of all APPROVED data submitted by the authenticated user for the current day.
    """
    current_user_identity = get_jwt_identity() 
    user = users_collection.find_one({"username": current_user_identity})

    if not user:
        return jsonify({"msg": "User not found."}), 404

    try:
        # Get today's date in UTC and format it for consistent querying
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Find APPROVED daily data for the current user and today's date
        daily_entry = daily_data_collection.find_one({
            "user_id": str(user['_id']),
            "date_key": today_start
        })

        if not daily_entry or not daily_entry.get('records'):
            return jsonify({"msg": "No approved data found for today to download."}), 404

        records_to_download = daily_entry['records']

        all_keys = set()
        for record in records_to_download:
            all_keys.update(record.keys())
        
        df = pd.DataFrame(records_to_download, columns=list(all_keys))

        excel_buffer = io.BytesIO()
        filename = f"{current_user_identity}_daily_report_{datetime.now().strftime('%Y%m%d')}.xlsx"

        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Daily Report', index=False)
            
            workbook = writer.book
            worksheet = writer.sheets['Daily Report']
            
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                
                for cell in column:
                    try:
                        if cell.value is not None and len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
            
            from openpyxl.styles import Font, PatternFill, Border, Side
            
            header_font = Font(bold=True, color="FFFFFF")
            header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
            border = Border(
                left=Side(border_style="thin"),
                right=Side(border_style="thin"),
                top=Side(border_style="thin"),
                bottom=Side(border_style="thin")
            )
            
            for cell in worksheet[1]:
                cell.font = header_font
                cell.fill = header_fill
                cell.border = border

        excel_buffer.seek(0)
        
        logger.info(f"Generated daily Excel report for user {current_user_identity}: {filename} with {len(records_to_download)} records.")

        return send_file(
            excel_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

    except Exception as e:
        logger.error(f"Error generating daily Excel report for user {current_user_identity}: {str(e)}")
        return jsonify({"msg": f"Failed to generate daily report: {str(e)}"}), 500

@app.route('/dashboard/search-approved-data', methods=['GET'])
@jwt_required()
def search_approved_data():
    """
    User endpoint to search their APPROVED daily data.
    Looks for the query_term in all string values of records.
    """
    current_user_identity = get_jwt_identity()
    user = users_collection.find_one({"username": current_user_identity})

    if not user:
        return jsonify({"msg": "User not found."}), 404
    
    query_term = request.args.get('query', '').lower()
    
    if not query_term:
        return jsonify({"msg": "Search query is required."}), 400

    try:
        # Find approved daily data for the current user across all days
        # We need to iterate through all entries to search all records.
        user_approved_entries = daily_data_collection.find({"user_id": str(user['_id'])})
        
        matching_records = []
        for entry in user_approved_entries:
            for record in entry.get('records', []):
                # Search within each key-value pair of the record
                for key, value in record.items():
                    if isinstance(value, str) and query_term in value.lower():
                        matching_records.append(record)
                        break # Found a match in this record, move to next record
        
        if not matching_records:
            return jsonify({"msg": "No matching approved data found."}), 404
        
        # Convert ObjectId to string for JSON serialization if needed, though not strictly
        # required as these are already sub-documents of daily_data_collection.
        # But for consistency, let's ensure all values are primitives for display.
        # For this context, records are already dicts, so no need for _id conversion here.

        return jsonify({"matching_records": matching_records}), 200

    except Exception as e:
        logger.error(f"Error searching approved data for user {current_user_identity}: {str(e)}")
        return jsonify({"msg": f"Failed to search approved data: {str(e)}"}), 500

# --- Admin Endpoints (updated for approval workflow) ---
@app.route('/admin/pending-requests', methods=['GET'])
@jwt_required()
def get_pending_requests():
    """
    Admin endpoint to fetch all pending data requests.
    Requires admin role.
    """
    current_user_identity = get_jwt_identity()
    user = users_collection.find_one({"username": current_user_identity})

    if not user or user.get('role') != 'admin':
        return jsonify({"msg": "Unauthorized: Admin access required."}), 403

    try:
        pending_requests = list(pending_data_collection.find({"status": "pending"}))
        
        # Convert ObjectId to string and datetime objects to ISO format
        for req in pending_requests:
            req['_id'] = str(req['_id'])
            if 'submission_timestamp' in req and isinstance(req['submission_timestamp'], datetime):
                req['submission_timestamp'] = req['submission_timestamp'].isoformat()
        
        return jsonify({"pending_requests": pending_requests}), 200
    except Exception as e:
        logger.error(f"Admin user {current_user_identity} failed to fetch pending requests: {str(e)}")
        return jsonify({"msg": f"Failed to retrieve pending requests: {str(e)}"}), 500


@app.route('/admin/approve-request/<request_id>', methods=['POST'])
@jwt_required()
def approve_request(request_id):
    """
    Admin endpoint to approve a pending data request.
    Moves data from pending to daily_data_collection.
    """
    current_user_identity = get_jwt_identity()
    admin_user = users_collection.find_one({"username": current_user_identity})

    if not admin_user or admin_user.get('role') != 'admin':
        return jsonify({"msg": "Unauthorized: Admin access required."}), 403

    try:
        # Find the pending request
        pending_request = pending_data_collection.find_one({"_id": ObjectId(request_id), "status": "pending"})

        if not pending_request:
            return jsonify({"msg": "Pending request not found or already processed."}), 404

        # Prepare data for insertion into daily_data_collection
        user_id_from_request = pending_request['user_id']
        username_from_request = pending_request['username']
        records_to_approve = pending_request['records']
        
        # Get today's date in UTC and format it for consistent querying
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

        # Check if data already exists for this user and today in daily_data_collection
        existing_daily_entry = daily_data_collection.find_one({
            "user_id": user_id_from_request,
            "date_key": today_start
        })

        if existing_daily_entry:
            # If entry exists, append new records
            daily_data_collection.update_one(
                {"_id": existing_daily_entry["_id"]},
                {"$push": {"records": {"$each": records_to_approve}}}
            )
            logger.info(f"Approved data appended to existing daily entry for user {username_from_request} on {today_start.date()}.")
        else:
            # If no entry for today, insert a new one
            new_daily_entry = {
                "user_id": user_id_from_request,
                "username": username_from_request,
                "timestamp": datetime.now(timezone.utc),
                "date_key": today_start,
                "records": records_to_approve
            }
            daily_data_collection.insert_one(new_daily_entry)
            logger.info(f"New daily entry created for user {username_from_request} on {today_start.date()} with approved data.")

        # Update the status of the request in pending_data_collection
        pending_data_collection.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": {
                "status": "approved",
                "approved_by": current_user_identity,
                "approval_timestamp": datetime.now(timezone.utc)
            }}
        )
        logger.info(f"Admin {current_user_identity} approved request {request_id} from user {username_from_request}.")
        return jsonify({"msg": "Request approved and data moved to daily collection."}), 200

    except Exception as e:
        logger.error(f"Admin {current_user_identity} failed to approve request {request_id}: {str(e)}")
        return jsonify({"msg": f"Failed to approve request: {str(e)}"}), 500


@app.route('/admin/reject-request/<request_id>', methods=['POST'])
@jwt_required()
def reject_request(request_id):
    """
    Admin endpoint to reject a pending data request.
    Updates status to "rejected" in pending_data_collection.
    """
    current_user_identity = get_jwt_identity()
    admin_user = users_collection.find_one({"username": current_user_identity})

    if not admin_user or admin_user.get('role') != 'admin':
        return jsonify({"msg": "Unauthorized: Admin access required."}), 403

    try:
        # Update the status of the request in pending_data_collection
        result = pending_data_collection.update_one(
            {"_id": ObjectId(request_id), "status": "pending"},
            {"$set": {
                "status": "rejected",
                "rejected_by": current_user_identity,
                "rejection_timestamp": datetime.now(timezone.utc)
            }}
        )

        if result.matched_count == 0:
            return jsonify({"msg": "Pending request not found or already processed."}), 404
        
        logger.info(f"Admin {current_user_identity} rejected request {request_id}.")
        return jsonify({"msg": "Request rejected."}), 200

    except Exception as e:
        logger.error(f"Admin {current_user_identity} failed to reject request {request_id}: {str(e)}")
        return jsonify({"msg": f"Failed to reject request: {str(e)}"}), 500


@app.route('/admin/daily-data', methods=['GET'])
@jwt_required()
def get_all_daily_data():
    """
    Admin endpoint to fetch all APPROVED daily data from all users.
    Requires admin role.
    """
    current_user_identity = get_jwt_identity()
    user = users_collection.find_one({"username": current_user_identity})

    if not user or user.get('role') != 'admin':
        return jsonify({"msg": "Unauthorized: Admin access required."}), 403

    try:
        # Fetch from daily_data_collection (which now holds approved data)
        all_daily_data = list(daily_data_collection.find({}))
        
        # Convert ObjectId to string for JSON serialization
        for entry in all_daily_data:
            entry['_id'] = str(entry['_id'])
            # Convert datetime objects to ISO format strings for JSON
            if 'timestamp' in entry and isinstance(entry['timestamp'], datetime):
                entry['timestamp'] = entry['timestamp'].isoformat()
            if 'date_key' in entry and isinstance(entry['date_key'], datetime):
                entry['date_key'] = entry['date_key'].isoformat().split('T')[0] # Just date part
        
        return jsonify({"daily_data": all_daily_data}), 200
    except Exception as e:
        logger.error(f"Admin user {current_user_identity} failed to fetch all daily data: {str(e)}")
        return jsonify({"msg": f"Failed to retrieve all daily data: {str(e)}"}), 500

@app.route('/admin/download-all-excel', methods=['GET'])
@jwt_required()
def download_all_daily_excel():
    """
    Admin endpoint to download all APPROVED daily data from all users as a single Excel file.
    Requires admin role.
    """
    current_user_identity = get_jwt_identity()
    user = users_collection.find_one({"username": current_user_identity})

    if not user or user.get('role') != 'admin':
        return jsonify({"msg": "Unauthorized: Admin access required."}), 403

    try:
        # Fetch from daily_data_collection (which now holds approved data)
        all_daily_entries = list(daily_data_collection.find({}))
        
        if not all_daily_entries:
            return jsonify({"msg": "No approved data available to download across all users."}), 404

        # Flatten the data: each submitted record from any user becomes a row
        flattened_records = []
        for entry in all_daily_entries:
            user_id = entry['user_id'] # This is already a string from daily_data_collection
            username = entry.get('username', 'N/A')
            timestamp = entry.get('timestamp', datetime.now(timezone.utc)).isoformat()
            date_key = entry.get('date_key', datetime.now(timezone.utc)).isoformat().split('T')[0]

            for record in entry.get('records', []):
                flattened_record = {
                    "Date": date_key,
                    "Username": username,
                    "User ID": user_id,
                    "Submission Timestamp": timestamp,
                    **record # Spread the actual submitted data
                }
                flattened_records.append(flattened_record)
        
        if not flattened_records:
            return jsonify({"msg": "No valid records to convert to Excel."}), 404

        # Create DataFrame from the flattened records
        df = pd.DataFrame(flattened_records)
        excel_buffer = io.BytesIO()
        
        filename = f"all_approved_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='All Approved Data', index=False)
            
            workbook = writer.book
            worksheet = writer.sheets['All Approved Data']
            
            # Apply styling and auto-adjust column widths
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                
                for cell in column:
                    try:
                        if cell.value is not None and len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
            
            from openpyxl.styles import Font, PatternFill, Border, Side
            
            header_font = Font(bold=True, color="FFFFFF")
            header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
            border = Border(
                left=Side(border_style="thin"),
                right=Side(border_style="thin"),
                top=Side(border_style="thin"),
                bottom=Side(border_style="thin")
            )
            
            for cell in worksheet[1]:
                cell.font = header_font
                cell.fill = header_fill
                cell.border = border

        excel_buffer.seek(0)
        
        logger.info(f"Admin user {current_user_identity} generated aggregated Excel report: {filename} with {len(flattened_records)} total records.")

        return send_file(
            excel_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

    except Exception as e:
        logger.error(f"Admin user {current_user_identity} failed to generate aggregated Excel report: {str(e)}")
        return jsonify({"msg": f"Failed to generate aggregated Excel report: {str(e)}"}), 500

@app.route('/admin/clear-approved-data', methods=['POST'])
@jwt_required()
def clear_approved_data():
    """
    Admin endpoint to clear all approved daily data from the database.
    Requires admin role.
    """
    current_user_identity = get_jwt_identity()
    admin_user = users_collection.find_one({"username": current_user_identity})

    if not admin_user or admin_user.get('role') != 'admin':
        return jsonify({"msg": "Unauthorized: Admin access required."}), 403

    try:
        # Delete all documents from the daily_data_collection
        result = daily_data_collection.delete_many({})
        logger.info(f"Admin {current_user_identity} cleared {result.deleted_count} documents from daily_data_collection.")
        return jsonify({"msg": f"Successfully cleared {result.deleted_count} approved data entries."}), 200
    except Exception as e:
        logger.error(f"Admin {current_user_identity} failed to clear approved data: {str(e)}")
        return jsonify({"msg": f"Failed to clear approved data: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True) # Run in debug mode for development
