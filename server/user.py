from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

user_bp = Blueprint('user', __name__)

@user_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current = get_jwt_identity()
    # current is a dict with username and role
    return jsonify(logged_in_as=current), 200