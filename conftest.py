import pytest
from unittest.mock import MagicMock, patch
from flask_jwt_extended import create_access_token
from bson.objectid import ObjectId 
from werkzeug.security import generate_password_hash

# Import the main module to access the create_app factory and global functions
import main 

# Helper to create mock user for default_user_map
def create_mock_user_for_map(username, role, email, password_hash=None, _id=None):
    if password_hash is None:
        password_hash = generate_password_hash('password123')
    if _id is None:
        _id = ObjectId()
    return {
        '_id': _id,
        'username': username,
        'role': role,
        'email': email,
        'password': password_hash
    }

# This fixture creates a fresh Flask app instance for each test.
# It also handles mocking the database collections.
@pytest.fixture
def app():
    # Define default test-specific configuration
    test_config = {
        'TESTING': True, # Important flag for Flask to know it's in test mode
        'JWT_SECRET_KEY': 'test-secret-key', 
        'JWT_ACCESS_TOKEN_EXPIRES': 3600,
        # Mock email settings to prevent actual emails during tests
        'SMTP_SERVER': 'mock_smtp_server',
        'SMTP_PORT': 587,
        'SENDER_EMAIL': 'mock@example.com',
        'SENDER_PASSWORD': 'mock_password',
        # Set feature toggles to their default (False) for most tests
        'ENABLE_ALL_USERS_DAILY_DOWNLOAD': False, 
        'ENABLE_ALL_USERS_GLOBAL_SEARCH': False, 
        # Use a dummy MongoDB URI for testing as it will be mocked
        'MONGO_URI': 'mongodb://localhost:27017/test_db',
        'DB_NAME': 'test_db',
        'TEMPLATES_COLLECTION': 'templates', 
        'USERS_COLLECTION': 'users',
        'SUBMISSIONS_COLLECTION': 'submissions'
    }
    
    # Create mocks for the database components
    mock_client_instance = MagicMock() 
    mock_db = MagicMock()
    mock_templates = MagicMock()
    mock_users = MagicMock()
    mock_submissions = MagicMock()

    # Configure the mock client instance to return mock db when subscripted (e.g., client['db_name'])
    mock_client_instance.__getitem__.side_effect = lambda key: mock_db if key == test_config['DB_NAME'] else None

    # Configure the mock db to return mock collections when subscripted (e.g., db['collection_name'])
    mock_db.__getitem__.side_effect = lambda key: {
        test_config['TEMPLATES_COLLECTION']: mock_templates,
        test_config['USERS_COLLECTION']: mock_users,
        test_config['SUBMISSIONS_COLLECTION']: mock_submissions
    }.get(key)

    # Patch MongoClient in main.py so that when it's called (instantiated),
    # it returns our mock_client_instance.
    with patch('main.MongoClient', return_value=mock_client_instance):
        # Call the create_app factory function to get the Flask app instance
        flask_app = main.create_app(test_config)
        
        # Ensure the app's db_collections now point to our mocks
        # This is important because routes access current_app.db_collections
        flask_app.db_collections = {
            "templates": mock_templates,
            "users": mock_users,
            "submissions": mock_submissions
        }
        
        yield flask_app # Provide the app instance to tests

        # Clean up mocks after each test
        mock_templates.reset_mock()
        mock_users.reset_mock()
        mock_submissions.reset_mock()


# This fixture provides a test client for the Flask app.
@pytest.fixture
def client(app): # Depends on the 'app' fixture to get the Flask app instance
    with app.test_client() as client:
        # Push an application context for the test client.
        # This is needed for functions like get_jwt_identity that rely on app context.
        with app.app_context():
            yield client


# This fixture provides access to the mocked database collections.
# It depends on the 'app' fixture to ensure the mocks are set up within the app context.
@pytest.fixture
def mock_db_collections(app):
    return app.db_collections # Return the mocked collections attached to the app


# This fixture mocks the `send_email_notification` function.
@pytest.fixture
def mock_send_email(monkeypatch):
    mock_email_func = MagicMock(return_value=True)
    # Patch the globally defined send_email_notification function in main.py
    monkeypatch.setattr(main, 'send_email_notification', mock_email_func)
    return mock_email_func

# This fixture creates fake JWT tokens for testing login/access.
@pytest.fixture
def auth_tokens(app, mock_db_collections): # Depends on the 'app' fixture to get the app context
    with app.app_context():
        # Define mock user objects for JWT lookups
        admin_user_id = ObjectId()
        user_user_id = ObjectId()
        
        admin_user_mock = create_mock_user_for_map("adminuser", "admin", "admin@example.com", _id=admin_user_id)
        user_user_mock = create_mock_user_for_map("testuser", "user", "testuser@example.com", _id=user_user_id)
        
        # Store default users in a dictionary on the mock for easy lookup
        mock_db_collections['users'].find_one.default_user_map = {
            "adminuser": admin_user_mock,
            "testuser": user_user_mock,
        }

        # Configure mock_users.find_one's side_effect to use the default_user_map
        # This ensures JWT user lookups work automatically
        def users_find_one_side_effect(query):
            username = query.get("username")
            return mock_db_collections['users'].find_one.default_user_map.get(username)

        mock_db_collections['users'].find_one.side_effect = users_find_one_side_effect

        # create_access_token needs an active Flask application context
        user_token = create_access_token(identity=user_user_mock)
        admin_token = create_access_token(identity=admin_user_mock)
        
    return {
        "user_token": user_token,
        "admin_token": admin_token,
        "admin_user_id": admin_user_id, # Provide user IDs for assertions
        "user_user_id": user_user_id
    }

