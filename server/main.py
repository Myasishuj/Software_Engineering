from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import config
from auth import auth_bp
from user import user_bp

app = Flask(__name__)
CORS(app)

app.config['JWT_SECRET_KEY'] = config.JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = config.JWT_ACCESS_TOKEN_EXPIRES
jwt = JWTManager(app)

def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]

    class UserObject:
        def __init__(self, username, role):
            self.username = username
            self.role = role

    return UserObject(identity['username'], identity.get('role', 'user'))

app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)

@app.route('/', methods=['GET'])
def index():
    return jsonify(msg="Welcome to the Flask Auth API with MongoDB"), 200

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)