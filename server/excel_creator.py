from flask import Flask, request, jsonify, make_response
from flask_cors import CORS # Keep this import for general configuration, though manual handling is primary for OPTIONS
import logging
from datetime import datetime # ADDED: Import datetime for use in home route

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Define the allowed origin for your frontend.
ALLOWED_ORIGIN = "http://localhost:5173"

# Initialize Flask-CORS with basic settings.
# The @app.before_request handler below will explicitly manage OPTIONS responses.
CORS(app) 

# --- ULTIMATE BRUTE FORCE CORS HANDLING FOR OPTIONS REQUESTS ---
# This function will be called BEFORE any other view function for every request.
# It explicitly handles OPTIONS requests to ensure a 200 OK response with correct CORS headers.
@app.before_request
def handle_options_preflight():
    if request.method == 'OPTIONS':
        # Diagnostic print to confirm this handler is being hit
        print(f"DEBUG: Intercepted OPTIONS request for path: {request.path}")
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Max-Age', '86400') # Cache preflight response for 24 hours
        return response, 200

# --- GENERIC OPTIONS ROUTE AS A FALLBACK ---
# This catches any OPTIONS requests that might somehow bypass @app.before_request
# (e.g., if there's a routing issue or Flask-CORS interaction).
@app.route('/<path:path>', methods=['OPTIONS'])
def catch_all_options(path):
    # This route should ideally not be hit if @app.before_request is working correctly for OPTIONS.
    # It's a redundant safeguard.
    print(f"DEBUG: Hit generic OPTIONS route for path: /{path}")
    response = make_response()
    response.headers.add('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Max-Age', '86400')
    return response, 200

# --- Simple test route for GET requests (no auth required for this diagnostic version) ---
@app.route('/test-cors', methods=['GET'])
def test_cors():
    print("DEBUG: Hit /test-cors GET endpoint.")
    return jsonify({"message": "CORS test successful! If you see this, preflight worked."}), 200

# --- Home route (no auth required for this diagnostic version) ---
@app.route('/', methods=['GET'])
def home():
    """Health check endpoint"""
    return jsonify({
        'message': 'Minimal Excel Creator API is running',
        'status': 'healthy',
        'timestamp': datetime.now().isoformat() # datetime import was missing
    })

if __name__ == '__main__':
    # We are explicitly NOT initializing MongoDB or JWT here
    # app.config['SECRET_KEY'] = '...'
    # initialize_db() # Temporarily removed

    app.run(debug=True, host='0.0.0.0') # Explicitly listen on all interfaces
