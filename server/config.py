import os
from datetime import timedelta

# JWT Configuration
# Default value "super-secret-jwt-key" is for development.
# In production, set JWT_SECRET_KEY environment variable.
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "super-secret-jwt-key")

# JWT Access Token Expiration Time
# Default is 24 hours. Set JWT_ACCESS_TOKEN_EXPIRES_HOURS environment variable to change.
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES_HOURS", 24)))

# MongoDB Configuration
# Default is local MongoDB. Set MONGODB_URI environment variable for remote.
MONGO_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/")

# Database Name
# Default is 'excel_creator_db'. Set DB_NAME environment variable to change.
DB_NAME = os.environ.get("DB_NAME", "excel_creator_db")

# MongoDB Collection Names
# Default names are provided. Set respective environment variables to change.
TEMPLATES_COLLECTION = os.environ.get("TEMPLATES_COLLECTION", "templates")
USERS_COLLECTION = os.environ.get("USERS_COLLECTION", "users")
SUBMISSIONS_COLLECTION = os.environ.get("SUBMISSIONS_COLLECTION", "submissions")

# Email Configuration (for sending notifications)
# Set these environment variables for production email functionality.
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'your_email@gmail.com') # Replace with your actual sender email
SENDER_PASSWORD = os.environ.get('SENDER_PASSWORD', 'your_email_app_password') # Replace with your email's app password or actual password

# --- Feature Toggles for User Dashboard ---
# Set to True to allow regular users to download ALL approved data submitted by ANY user for the current day.
# Set to False (default) for regular users to only download their own approved data for the current day.
ENABLE_ALL_USERS_DAILY_DOWNLOAD = os.environ.get("ENABLE_ALL_USERS_DAILY_DOWNLOAD", "False").lower() == "true"

# Set to True to allow regular users to search ALL approved data from ALL users, across ALL time.
# Set to False (default) for regular users to only search their own approved data.
ENABLE_ALL_USERS_GLOBAL_SEARCH = os.environ.get("ENABLE_ALL_USERS_GLOBAL_SEARCH", "False").lower() == "true"
