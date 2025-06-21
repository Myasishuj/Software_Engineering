from pymongo import MongoClient
import config

client = MongoClient(config.MONGO_URI)
db = client[config.DB_NAME]
users_collection = db[config.USERS_COLLECTION]
user_data_collection = db[config.USERS_COLLECTION]

# Optional health check
try:
    client.admin.command('ping')
    print("MongoDB connection successful!")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
