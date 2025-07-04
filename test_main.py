import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta, timezone
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash
import json

# --- Helper functions for tests ---

# Create a fake user object for testing
def create_mock_user(username, role, email, password_hash=None, _id=None):
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

# Create a fake submission object for testing
def create_mock_submission(user_id, username, status, records, submission_timestamp=None):
    if submission_timestamp is None:
        submission_timestamp = datetime.now(timezone.utc)
    return {
        '_id': ObjectId(),
        'user_id': str(user_id),
        'username': username,
        'submission_timestamp': submission_timestamp,
        'records': records,
        'status': status
    }

# --- Tests for Authentication Routes ---

# The 'client' fixture automatically gets the 'app' fixture's result
def test_home_route(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b"Excel Creator API is running" in response.data

def test_register_success(client, mock_db_collections):
    mock_users = mock_db_collections['users']
    # Temporarily set return_value for this specific call to ensure user is not found
    mock_users.find_one.return_value = None 

    new_user_data = {
        "username": "newuser",
        "password": "newpassword",
        "email": "newuser@example.com"
    }
    response = client.post('/register', json=new_user_data)
    
    assert response.status_code == 201
    assert b"User registered successfully" in response.data 
    mock_users.insert_one.assert_called_once() 
    # Reset return_value to allow side_effect from conftest to work for subsequent tests
    mock_users.find_one.return_value = MagicMock() # Resetting to a default MagicMock behavior

def test_register_user_exists(client, mock_db_collections):
    mock_users = mock_db_collections['users']
    # Temporarily set return_value for this specific call to simulate user existing
    mock_users.find_one.return_value = {"username": "existinguser"} 

    existing_user_data = {
        "username": "existinguser",
        "password": "somepassword"
    }
    response = client.post('/register', json=existing_user_data)
    
    assert response.status_code == 409
    assert b"Username already exists" in response.data
    mock_users.insert_one.assert_not_called() # Ensure insert_one was not called
    
    mock_users.find_one.return_value = MagicMock() # Reset


def test_login_success(client, mock_db_collections, auth_tokens):
    mock_users = mock_db_collections['users']
    # The user 'testuser' is pre-populated by auth_tokens fixture's default_user_map
    # Manually set the password hash for the mock user to match the test password
    mock_users.find_one.default_user_map["testuser"]["password"] = generate_password_hash('userpassword')

    login_data = {
        "username": "testuser",
        "password": "userpassword" 
    }
    response = client.post('/login', json=login_data)
    
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert "access_token" in response_data
    assert response_data['username'] == "testuser"
    assert response_data['role'] == "user"

def test_login_invalid_credentials(client, mock_db_collections):
    mock_users = mock_db_collections['users']
    # Pre-populate a user with a known password hash
    mock_users.find_one.default_user_map["testuser_invalid"] = create_mock_user("testuser_invalid", "user", "test_invalid@example.com", password_hash=generate_password_hash('correctpassword'))
    # Ensure find_one returns this specific user for the login attempt
    mock_users.find_one.return_value = mock_users.find_one.default_user_map["testuser_invalid"]

    login_data = {
        "username": "testuser_invalid",
        "password": "wrongpassword"
    }
    response = client.post('/login', json=login_data)
    
    assert response.status_code == 401
    assert b"Bad username or password" in response.data 

    mock_users.find_one.return_value = MagicMock() # Reset

def test_login_user_not_found(client, mock_db_collections):
    mock_users = mock_db_collections['users']
    # Ensure find_one returns None for a user not found
    mock_users.find_one.return_value = None
    
    login_data = {
        "username": "nonexistentuser",
        "password": "anypassword"
    }
    response = client.post('/login', json=login_data)
    
    assert response.status_code == 401
    assert b"Bad username or password" in response.data 

    mock_users.find_one.return_value = MagicMock() # Reset

# --- Tests for Excel Creation & Template Routes ---

def test_create_excel_success(client, mock_db_collections, auth_tokens):
    # User 'testuser' is automatically handled by auth_tokens fixture
    
    test_data = {
        "filename": "my_report",
        "sheet_name": "Sheet1",
        "data": [
            {"col1": "value1", "col2": 100},
            {"col1": "value2", "col2": 200}
        ]
    }
    
    response = client.post(
        '/create-excel',
        json=test_data,
        headers={'Authorization': f'Bearer {auth_tokens["user_token"]}'}
    )
    
    assert response.status_code == 200
    assert response.headers['Content-Type'] == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    assert 'attachment; filename=my_report.xlsx' in response.headers['Content-Disposition']

def test_create_excel_no_data(client, mock_db_collections, auth_tokens):
    # User 'testuser' is automatically handled by auth_tokens fixture
    
    test_data = {"data": []}
    response = client.post(
        '/create-excel',
        json=test_data,
        headers={'Authorization': f'Bearer {auth_tokens["user_token"]}'}
    )
    assert response.status_code == 400
    assert b"No data provided" in response.data 

def test_create_excel_unauthorized(client):
    response = client.post('/create-excel', json={})
    assert response.status_code == 401
    assert b"Missing Authorization Header" in response.data

def test_validate_data_success(client, mock_db_collections, auth_tokens):
    # User 'testuser' is automatically handled by auth_tokens fixture

    test_data = {
        "data": [
            {"name": "Item A", "value": 10},
            {"name": "Item B", "value": 20}
        ]
    }
    response = client.post(
        '/validate-data',
        json=test_data,
        headers={'Authorization': f'Bearer {auth_tokens["user_token"]}'}
    )
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert response_data['valid'] is True
    assert response_data['row_count'] == 2
    assert "name" in response_data['columns']
    assert "value" in response_data['columns']

def test_get_templates_success(client, mock_db_collections, auth_tokens):
    mock_templates = mock_db_collections['templates']
    # User 'testuser' is automatically handled by auth_tokens fixture

    mock_templates.find.return_value = [
        {'id': 'sales_report', 'name': 'Sales Report'},
        {'id': 'inventory', 'name': 'Inventory List'}
    ]
    
    response = client.get(
        '/templates',
        headers={'Authorization': f'Bearer {auth_tokens["user_token"]}'}
    )
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert len(response_data['templates']) == 2
    assert response_data['templates'][0]['id'] == 'sales_report'

def test_create_from_template_success(client, mock_db_collections, auth_tokens):
    mock_templates = mock_db_collections['templates']
    # User 'testuser' is automatically handled by auth_tokens fixture

    mock_templates.find_one.return_value = {
        'id': 'sales_report',
        'name': 'Sales Report',
        'sample_data': [{'Product': 'Test', 'Quantity': 1}]
    }

    response = client.post(
        '/create-from-template/sales_report',
        headers={'Authorization': f'Bearer {auth_tokens["user_token"]}'}
    )
    assert response.status_code == 200
    assert response.headers['Content-Type'] == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    assert 'attachment; filename=sales_report.xlsx' in response.headers['Content-Disposition']

def test_create_from_template_not_found(client, mock_db_collections, auth_tokens):
    mock_templates = mock_db_collections['templates']
    # User 'testuser' is automatically handled by auth_tokens fixture
    mock_templates.find_one.return_value = None

    response = client.post(
        '/create-from-template/nonexistent_template',
        headers={'Authorization': f'Bearer {auth_tokens["user_token"]}'}
    )
    assert response.status_code == 404
    assert b"Template not found" in response.data

# --- Tests for Daily Data Submission & Approval Workflow ---

def test_submit_daily_data_success(client, mock_db_collections, auth_tokens):
    mock_submissions = mock_db_collections['submissions']
    # User 'testuser' is automatically handled by auth_tokens fixture (user_user_id)
    
    submission_data = [{"item": "Laptop", "quantity": 1}]
    
    mock_insert_result = MagicMock()
    mock_insert_result.inserted_id = ObjectId() # Ensure inserted_id is set for the mock result
    mock_submissions.insert_one.return_value = mock_insert_result

    response = client.post(
        '/dashboard/submit-data',
        json=submission_data,
        headers={'Authorization': f'Bearer {auth_tokens["user_token"]}'}
    )
    assert response.status_code == 201
    assert b"Data submitted for approval successfully!" in response.data
    mock_submissions.insert_one.assert_called_once()
    assert mock_submissions.insert_one.call_args[0][0]['status'] == 'pending'
    assert mock_submissions.insert_one.call_args[0][0]['user_id'] == str(auth_tokens['user_user_id'])
    response_data = json.loads(response.data)
    assert response_data['requestId'] == str(mock_insert_result.inserted_id)


def test_submit_daily_data_invalid_format(client, mock_db_collections, auth_tokens):
    # User 'testuser' is automatically handled by auth_tokens fixture
    
    submission_data = {"item": "Laptop", "quantity": 1} # This is not a list of dicts
    
    response = client.post(
        '/dashboard/submit-data',
        json=submission_data,
        headers={'Authorization': f'Bearer {auth_tokens["user_token"]}'}
    )
    assert response.status_code == 400
    assert b"Invalid data format. Expected an array of objects." in response.data

def test_download_daily_excel_no_data(client, mock_db_collections, auth_tokens):
    mock_submissions = mock_db_collections['submissions']
    # User 'testuser' is automatically handled by auth_tokens fixture
    mock_submissions.find.return_value = []
    
    response = client.get(
        '/dashboard/download-excel',
        headers={'Authorization': f'Bearer {auth_tokens["user_token"]}'}
    )
    assert response.status_code == 404
    assert b"No approved data found for today to download." in response.data

def test_download_daily_excel_success_user_scoped(client, mock_db_collections, auth_tokens, monkeypatch):
    mock_submissions = mock_db_collections['submissions']
    
    # User 'testuser' is automatically handled by auth_tokens fixture (user_user_id)
    
    # Patch app.config directly for this test
    monkeypatch.setitem(client.application.config, 'ENABLE_ALL_USERS_DAILY_DOWNLOAD', False) 

    mock_submissions.find.return_value = [
        create_mock_submission(auth_tokens['user_user_id'], "testuser", "approved", [{"pid": "P001", "pname": "Item A", "quantity": 5}])
    ]
    
    response = client.get(
        '/dashboard/download-excel',
        headers={'Authorization': f'Bearer {auth_tokens["user_token"]}'}
    )
    
    assert response.status_code == 200
    assert response.headers['Content-Type'] == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    assert f'attachment; filename=testuser_daily_report_{datetime.now().strftime("%Y%m%d")}.xlsx' in response.headers['Content-Disposition']
    mock_submissions.find.assert_called_once()
    assert mock_submissions.find.call_args[0][0]["user_id"] == str(auth_tokens['user_user_id'])
    assert mock_submissions.find.call_args[0][0]["status"] == "approved"


def test_download_daily_excel_success_all_users_scoped(client, mock_db_collections, auth_tokens, monkeypatch):
    mock_submissions = mock_db_collections['submissions']
    
    # User 'adminuser' is automatically handled by auth_tokens fixture (admin_user_id)
    
    # Patch app.config directly for this test
    monkeypatch.setitem(client.application.config, 'ENABLE_ALL_USERS_DAILY_DOWNLOAD', True)

    mock_submissions.find.return_value = [
        create_mock_submission(ObjectId(), "testuser", "approved", [{"pid": "P001", "pname": "Item A", "quantity": 5}]),
        create_mock_submission(ObjectId(), "anotheruser", "approved", [{"pid": "P002", "pname": "Item B", "quantity": 10}])
    ]
    
    response = client.get(
        '/dashboard/download-excel',
        # Use admin token for global download
        headers={'Authorization': f'Bearer {auth_tokens["admin_token"]}'} 
    )
    
    assert response.status_code == 200
    assert response.headers['Content-Type'] == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    # Expecting the all_users_daily_report filename now
    assert f'attachment; filename=all_users_daily_report_{datetime.now().strftime("%Y%m%d")}.xlsx' in response.headers['Content-Disposition']
    mock_submissions.find.assert_called_once()
    # In global scope (admin + toggle true), user_id should NOT be in the query filter
    assert "user_id" not in mock_submissions.find.call_args[0][0] 
    assert mock_submissions.find.call_args[0][0]["status"] == "approved"

def test_search_approved_data_no_query(client, mock_db_collections, auth_tokens):
    # User 'testuser' is automatically handled by auth_tokens fixture
    
    response = client.get(
        '/dashboard/search-approved-data',
        headers={'Authorization': f'Bearer {auth_tokens["user_token"]}'}
    )
    assert response.status_code == 400
    assert b"Search query is required." in response.data

def test_search_approved_data_no_match(client, mock_db_collections, auth_tokens):
    mock_submissions = mock_db_collections['submissions']
    # User 'testuser' is automatically handled by auth_tokens fixture
    mock_submissions.find.return_value = []
    
    response = client.get(
        '/dashboard/search-approved-data?query=nomatch',
        headers={'Authorization': f'Bearer {auth_tokens["user_token"]}'}
    )
    assert response.status_code == 404
    assert b"No matching approved data found." in response.data

def test_search_approved_data_success_global(client, mock_db_collections, auth_tokens, monkeypatch):
    mock_submissions = mock_db_collections['submissions']
    
    # User 'adminuser' is automatically handled by auth_tokens fixture (admin_user_id)
    
    # Patch app.config directly for this test
    monkeypatch.setitem(client.application.config, 'ENABLE_ALL_USERS_GLOBAL_SEARCH', True)
    
    mock_submissions.find.return_value = [
        create_mock_submission(ObjectId(), "testuser", "approved", [{"pid": "PID123", "pname": "Laptop XYZ"}]),
        create_mock_submission(ObjectId(), "anotheruser", "approved", [{"pid": "ABC456", "pname": "Mouse ABC"}])
    ]
    
    response = client.get(
        '/dashboard/search-approved-data?query=laptop',
        # Use admin token for global search
        headers={'Authorization': f'Bearer {auth_tokens["admin_token"]}'}
    )
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert len(response_data['matching_records']) == 1
    assert response_data['matching_records'][0]['pname'] == 'Laptop XYZ'
    assert 'barcode_svg_base64' in response_data['matching_records'][0]
    assert 'encoded_barcode_value' in response_data['matching_records'][0]
    # In global scope (admin + toggle true), user_id should NOT be in the query filter
    assert "user_id" not in mock_submissions.find.call_args[0][0] 

def test_search_approved_data_success_user_scoped(client, mock_db_collections, auth_tokens, monkeypatch):
    mock_submissions = mock_db_collections['submissions']
    
    # User 'testuser' is automatically handled by auth_tokens fixture (user_user_id)
    
    # Patch app.config directly for this test
    monkeypatch.setitem(client.application.config, 'ENABLE_ALL_USERS_GLOBAL_SEARCH', False)
    
    mock_submissions.find.return_value = [
        create_mock_submission(auth_tokens['user_user_id'], "testuser", "approved", [{"pid": "PID123", "pname": "Laptop XYZ"}]),
        create_mock_submission(ObjectId(), "anotheruser", "approved", [{"pid": "ABC456", "pname": "Mouse ABC"}])
    ]
    
    response = client.get(
        '/dashboard/search-approved-data?query=laptop',
        headers={'Authorization': f'Bearer {auth_tokens["user_token"]}'}
    )
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert len(response_data['matching_records']) == 1
    assert response_data['matching_records'][0]['pname'] == 'Laptop XYZ'
    mock_submissions.find.assert_called_once()
    assert mock_submissions.find.call_args[0][0]["user_id"] == str(auth_tokens['user_user_id'])


def test_get_expiring_items_success(client, mock_db_collections, auth_tokens):
    mock_submissions = mock_db_collections['submissions']
    
    # User 'testuser' is automatically handled by auth_tokens fixture (user_user_id)
    
    tomorrow = datetime.now() + timedelta(days=1)
    yesterday = datetime.now() - timedelta(days=1)
    far_future = datetime.now() + timedelta(days=100)

    mock_submissions.find.return_value = [
        create_mock_submission(auth_tokens['user_user_id'], "testuser", "approved", [{"Item": "Expiring Soon", "expiry": tomorrow.strftime("%d-%m-%Y")}]),
        create_mock_submission(auth_tokens['user_user_id'], "testuser", "approved", [{"Item": "Expired Recently", "expiry": yesterday.strftime("%d-%m-%Y")}]),
        create_mock_submission(auth_tokens['user_user_id'], "testuser", "approved", [{"Item": "Not Expiring", "expiry": far_future.strftime("%d-%m-%Y")}])
    ]
    
    response = client.get(
        '/dashboard/expiring-items?days=7',
        headers={'Authorization': f'Bearer {auth_tokens["user_token"]}'}
    )
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert "expiring_items" in response_data
    assert len(response_data['expiring_items']) == 2
    expiring_items_sorted = sorted(response_data['expiring_items'], key=lambda x: x['Item'])
    assert expiring_items_sorted[0]['Item'] == 'Expired Recently'
    assert expiring_items_sorted[1]['Item'] == 'Expiring Soon'


# --- Tests for Admin Endpoints ---

def test_admin_pending_requests_success(client, mock_db_collections, auth_tokens):
    mock_submissions = mock_db_collections['submissions']
    # Admin user is automatically handled by auth_tokens fixture
    
    mock_submissions.find.return_value = [
        create_mock_submission(ObjectId(), "user1", "pending", [{"item": "Data 1"}]),
        create_mock_submission(ObjectId(), "user2", "pending", [{"item": "Data 2"}])
    ]
    
    response = client.get(
        '/admin/pending-requests',
        headers={'Authorization': f'Bearer {auth_tokens["admin_token"]}'}
    )
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert len(response_data['pending_requests']) == 2
    assert response_data['pending_requests'][0]['status'] == 'pending'

def test_admin_pending_requests_forbidden_for_user(client, mock_db_collections, auth_tokens):
    # User 'testuser' is automatically handled by auth_tokens fixture
    
    response = client.get(
        '/admin/pending-requests',
        headers={'Authorization': f'Bearer {auth_tokens["user_token"]}'}
    )
    assert response.status_code == 403
    assert b"Forbidden: Insufficient permissions." in response.data

def test_admin_approve_request_success(client, mock_db_collections, auth_tokens):
    mock_submissions = mock_db_collections['submissions']
    # Admin user is automatically handled by auth_tokens fixture
    
    request_id = str(ObjectId())
    
    mock_result = MagicMock()
    mock_result.matched_count = 1
    mock_submissions.update_one.return_value = mock_result
    
    response = client.post(
        f'/admin/approve-request/{request_id}',
        headers={'Authorization': f'Bearer {auth_tokens["admin_token"]}'}
    )
    assert response.status_code == 200
    assert b"Request approved!" in response.data
    mock_submissions.update_one.assert_called_once()
    assert mock_submissions.update_one.call_args[0][0]['_id'] == ObjectId(request_id)
    assert mock_submissions.update_one.call_args[0][1]['$set']['status'] == 'approved'

def test_admin_reject_request_success(client, mock_db_collections, auth_tokens):
    mock_submissions = mock_db_collections['submissions']
    # Admin user is automatically handled by auth_tokens fixture
    
    request_id = str(ObjectId()) 
    
    mock_result = MagicMock()
    mock_result.matched_count = 1
    mock_submissions.update_one.return_value = mock_result
    
    response = client.post(
        f'/admin/reject-request/{request_id}',
        headers={'Authorization': f'Bearer {auth_tokens["admin_token"]}'}
    )
    assert response.status_code == 200
    assert b"Request rejected." in response.data
    mock_submissions.update_one.assert_called_once()
    assert mock_submissions.update_one.call_args[0][0]['_id'] == ObjectId(request_id)
    assert mock_submissions.update_one.call_args[0][1]['$set']['status'] == 'rejected'

def test_admin_get_all_daily_data_success(client, mock_db_collections, auth_tokens):
    mock_submissions = mock_db_collections['submissions']
    # Admin user is automatically handled by auth_tokens fixture
    
    mock_submissions.find.return_value = [
        create_mock_submission(ObjectId(), "user1", "approved", [{"item": "Approved 1"}]),
        create_mock_submission(ObjectId(), "user2", "pending", [{"item": "Pending 1"}]),
        create_mock_submission(ObjectId(), "user3", "rejected", [{"item": "Rejected 1"}])
    ]
    
    response = client.get(
        '/admin/daily-data',
        headers={'Authorization': f'Bearer {auth_tokens["admin_token"]}'}
    )
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert len(response_data['daily_data']) == 3
    assert response_data['daily_data'][0]['status'] == 'approved'
    assert response_data['daily_data'][1]['status'] == 'pending'
    assert response_data['daily_data'][2]['status'] == 'rejected'

def test_admin_download_all_excel_success(client, mock_db_collections, auth_tokens):
    mock_submissions = mock_db_collections['submissions']
    # Admin user is automatically handled by auth_tokens fixture
    
    mock_submissions.find.return_value = [
        create_mock_submission(ObjectId(), "user1", "approved", [{"pid": "P001", "pname": "Product A"}]),
        create_mock_submission(ObjectId(), "user2", "approved", [{"pid": "P002", "pname": "Product B"}])
    ]
    
    response = client.get(
        '/admin/download-all-excel',
        headers={'Authorization': f'Bearer {auth_tokens["admin_token"]}'}
    )
    assert response.status_code == 200
    assert response.headers['Content-Type'] == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    expected_filename_prefix = f'attachment; filename=all_approved_data_{datetime.now().strftime("%Y%m%d")}'
    assert expected_filename_prefix in response.headers['Content-Disposition']

def test_admin_clear_all_data_success(client, mock_db_collections, auth_tokens):
    mock_submissions = mock_db_collections['submissions']
    # Admin user is automatically handled by auth_tokens fixture
    
    mock_result = MagicMock()
    mock_result.deleted_count = 5
    mock_submissions.delete_many.return_value = mock_result
    
    response = client.post(
        '/admin/clear-all-data',
        headers={'Authorization': f'Bearer {auth_tokens["admin_token"]}'}
    )
    assert response.status_code == 200
    assert b"Successfully cleared 5 data entries from all submissions." in response.data
    mock_submissions.delete_many.assert_called_once_with({})

def test_admin_send_expired_notifications_all_users_success(client, mock_db_collections, auth_tokens, mock_send_email):
    mock_users = mock_db_collections['users']
    mock_submissions = mock_db_collections['submissions']
    
    # Admin user is automatically handled by auth_tokens fixture
    # We need to mock mock_users.find for the 'all' users lookup
    user1_id = ObjectId()
    user2_id = ObjectId()
    mock_users.find.return_value = [
        create_mock_user("user1", "user", "user1@example.com", _id=user1_id),
        create_mock_user("user2", "user", "user2@example.com", _id=user2_id)
    ]

    today = datetime.now()
    # Mock submissions.find for each user's approved submissions
    mock_submissions.find.side_effect = [
        # For user1
        [create_mock_submission(user1_id, "user1", "approved", [{"Item": "Expired Milk", "expiry": (today - timedelta(days=5)).strftime("%d-%m-%Y")}, {"Item": "Upcoming Bread", "expiry": (today + timedelta(days=5)).strftime("%d-%m-%Y")}, {"Item": "Far Future", "expiry": (today + timedelta(days=100)).strftime("%d-%m-%Y")}]),
         create_mock_submission(user1_id, "user1", "approved", [{"Item": "Expired Item X", "expiry": (today - timedelta(days=1)).strftime("%d-%m-%Y")}])],
        # For user2
        [create_mock_submission(user2_id, "user2", "approved", [{"Item": "Expired Juice", "expiry": (today - timedelta(days=1)).strftime("%d-%m-%Y")}])]
    ]

    notification_data = {
        "target_username": "all",
        "days_threshold": 30
    }

    response = client.post(
        '/admin/send-expired-notifications',
        json=notification_data,
        headers={'Authorization': f'Bearer {auth_tokens["admin_token"]}'}
    )
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert "successful_sends" in response_data
    assert "failed_sends" in response_data
    assert "user1" in response_data['successful_sends']
    assert "user2" in response_data['successful_sends']
    assert mock_send_email.call_count == 2

def test_admin_send_expired_notifications_specific_user_success(client, mock_db_collections, auth_tokens, mock_send_email):
    mock_users = mock_db_collections['users']
    mock_submissions = mock_db_collections['submissions']
    
    # Admin user is automatically handled by auth_tokens fixture
    target_user_id = ObjectId()

    # We need to mock mock_users.find_one for the specific target user lookup in the route
    mock_users.find_one.side_effect = lambda query: \
        create_mock_user("user1", "user", "user1@example.com", _id=target_user_id) if query.get("username") == "user1" else \
        mock_users.find_one.default_user_map.get(query.get("username")) # Fallback for decorator's admin lookup

    today = datetime.now()
    mock_submissions.find.return_value = [
        create_mock_submission(target_user_id, "user1", "approved", [{"Item": "Expired Cheese", "expiry": (today - timedelta(days=10)).strftime("%d-%m-%Y")}])
    ]

    notification_data = {
        "target_username": "user1",
        "days_threshold": 30
    }

    response = client.post(
        '/admin/send-expired-notifications',
        json=notification_data,
        headers={'Authorization': f'Bearer {auth_tokens["admin_token"]}'}
    )
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert "user1" in response_data['successful_sends']
    assert mock_send_email.call_count == 1

def test_admin_search_user_submissions_success(client, mock_db_collections, auth_tokens):
    mock_submissions = mock_db_collections['submissions']
    # Admin user is automatically handled by auth_tokens fixture

    target_user_id = ObjectId()
    mock_submissions.find.return_value = [
        create_mock_submission(target_user_id, "targetuser", "pending", [{"item": "User Data 1"}]),
        create_mock_submission(target_user_id, "targetuser", "approved", [{"item": "User Data 2"}])
    ]

    response = client.get(
        '/admin/search-user-submissions?username=targetuser',
        headers={'Authorization': f'Bearer {auth_tokens["admin_token"]}'}
    )
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert "user_submissions" in response_data
    assert len(response_data['user_submissions']) == 2
    assert response_data['user_submissions'][0]['username'] == 'targetuser'
    assert response_data['user_submissions'][1]['username'] == 'targetuser'
    mock_submissions.find.assert_called_once_with({"username": "targetuser"})

def test_admin_search_user_submissions_no_user(client, mock_db_collections, auth_tokens):
    mock_submissions = mock_db_collections['submissions']
    # Admin user is automatically handled by auth_tokens fixture
    mock_submissions.find.return_value = []

    response = client.get(
        '/admin/search-user-submissions?username=nonexistentuser',
        headers={'Authorization': f'Bearer {auth_tokens["admin_token"]}'}
    )
    assert response.status_code == 404
    assert b"No submissions found for user 'nonexistentuser'." in response.data
    mock_submissions.find.assert_called_once_with({"username": "nonexistentuser"})
