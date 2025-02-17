from flask import Flask, request, jsonify
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
from flask_cors import CORS  # Import CORS
from dotenv import load_dotenv
import os
from pymongo import MongoClient

# Load environment variables
load_dotenv()

app = Flask(__name__)  # Initialize app first
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')

# Enable CORS
CORS(app)

# Initialize bcrypt and JWT
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# MongoDB connection setup
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://sriram:Thehope123@cluster0.tovxt.mongodb.net/mental_health?retryWrites=true&w=majority")
client = MongoClient(MONGO_URI)
db = client["mental_health"]
users_collection = db["users"]  # MongoDB collection for storing users

@app.route('/', methods=['GET'])
def home():
    return "Welcome to the Mental Health Chatbot API!", 200

# Register Endpoint
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if users_collection.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    user = {"email": email, "password": hashed_password}

    # Insert user into MongoDB
    users_collection.insert_one(user)

    return jsonify({"message": "User registered successfully"}), 201

# Login Endpoint
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Find user in MongoDB
    user = users_collection.find_one({"email": email})
    if not user or not bcrypt.check_password_hash(user["password"], password):
        return jsonify({"message": "Invalid credentials"}), 401

    # Create access token
    access_token = create_access_token(identity=email)
    return jsonify(access_token=access_token), 200

# Protected Route (for testing)
@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    return jsonify({"message": "You have accessed a protected route"}), 200

if __name__ == '__main__':
    app.run(debug=True)
