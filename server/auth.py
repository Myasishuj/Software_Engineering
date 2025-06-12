from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
import datetime
import config
from db import users_collection

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify(msg="Username and password are required"), 400

    if users_collection.find_one({'username': username}):
        return jsonify(msg="Username already exists"), 409

    role = data.get('role', 'user')
    hashed = generate_password_hash(password)
    users_collection.insert_one({
        'username': username,
        'password_hash': hashed,
        'role': role
    })
    return jsonify(msg="User registered successfully"), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify(msg="Username and password are required"), 400

    user = users_collection.find_one({'username': username})
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify(msg="Invalid username or password"), 401

    # Get the user's role (default to 'user' if not found)
    user_role = user.get('role', 'user')
    
    expires = datetime.timedelta(seconds=config.JWT_ACCESS_TOKEN_EXPIRES)
    identity = {'username': username, 'role': user_role}
    token = create_access_token(identity=identity, expires_delta=expires)
    
    # FIXED: Return the role along with the access token
    return jsonify(
        access_token=token,
        role=user_role,
        username=username
    ), 200