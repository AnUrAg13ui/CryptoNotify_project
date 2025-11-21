# kestra/insert_test_record.py
from dotenv import load_dotenv
load_dotenv()

import os
from pymongo import MongoClient
from datetime import datetime

uri = "mongodb+srv://anuraggoutam133:HWaJsQnsOoDOrTPV@CryptoNotify.veuu6yq.mongodb.net/"
client = MongoClient(uri)
try:
    db = client.get_default_database()
except Exception:
    db = client['blockpulse']

collection = db['thresholds']

doc = {
    "blockchainId": "bitcoin",
    "userEmail": "anuraggoutamwork@gmail.com",
    "name": "Bitcoin",
    "symbol": "BTC",
    "lowThreshold": 100.0,
    "highThreshold": 200000.0,
    "notifications": True,
    "createdAt": datetime.utcnow().isoformat()
}

res = collection.insert_one(doc)
print("Inserted id:", res.inserted_id)
client.close()