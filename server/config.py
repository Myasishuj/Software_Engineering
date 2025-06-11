import os
# JWT configuration
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "super-secret-jwt-key-replace-me")
JWT_ACCESS_TOKEN_EXPIRES = 3600  # in seconds

# MongoDB configuration
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.environ.get("Software_Engineering", "user_auth_db")
USERS_COLLECTION = os.environ.get("USERS_COLLECTION", "users")
