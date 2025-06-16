# setup_users.py
from db import users_collection
from werkzeug.security import generate_password_hash

# Clear existing users (only for development)
users_collection.delete_many({})

# Insert some test users
users_collection.insert_many([
    {
        'username': 'admin',
        'password_hash': generate_password_hash('admin123')
    },
    {
        'username': 'owner',
        'password_hash': generate_password_hash('owner123')
    },
    {
        'username': 'tester',
        'password_hash': generate_password_hash('tester123')
    },
])

print("✅ Test users created.")
