from flask import Flask, request, jsonify # type: ignore
from flask_bcrypt import Bcrypt # type: ignore
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity # type: ignore
from flask_cors import CORS # type: ignore
from dotenv import load_dotenv # type: ignore
import os
from pymongo import MongoClient # type: ignore
import google.generativeai as genai # type: ignore
from datetime import datetime, timezone

from flask_jwt_extended import create_access_token
from flask_bcrypt import check_password_hash


# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
CORS(app)


# Initialize bcrypt and JWT
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# MongoDB connection setup
MONGO_URI = os.getenv("MONGO_URI","mongodb+srv://sriram:Thehope123@cluster0.tovxt.mongodb.net/mental_health?retryWrites=true&w=majority")
client = MongoClient(MONGO_URI)
db = client["mental_health"]
users_collection = db["users"]
chat_collection = db["chat_history"]

# Configure Google Gemini
VITE_GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=VITE_GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    if users_collection.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    users_collection.insert_one({
        "email": email,
        "password": hashed_password,
        "created_at": datetime.now(timezone.utc)
    })

    return jsonify({"message": "User registered successfully"}), 201


@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"error": "User not found"}), 404

        if not bcrypt.check_password_hash(user["password"], password):
            return jsonify({"error": "Invalid password"}), 401

        access_token = create_access_token(identity=email)
        return jsonify({"access_token": access_token}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500




@app.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/send_message', methods=['POST'])
@jwt_required()
def send_message():
    try:
        data = request.get_json()
        user_input = data.get("message")
        user_email = get_jwt_identity()
        print(f"Received message from {user_email}: {user_input}")  # Debugging

        if not user_input:
            return jsonify({"error": "Message is required"}), 400

        # Generate response using Gemini
        response = model.generate_content(user_input)
        bot_response = response.text

        # Store the conversation in the database
        chat_collection.insert_one({
            "email": user_email,
            "message": user_input,
            "response": bot_response,
            "timestamp": datetime.now(timezone.utc)
        })

        return jsonify({
            "message": user_input,
            "response": bot_response
        }), 200

    except Exception as e:
        print(f"Error in send_message: {str(e)}")
        return jsonify({
            "error": "An error occurred while processing your request"
        }), 500

@app.route('/store_message', methods=['POST'])
@jwt_required()
def store_message():
    data = request.get_json()
    user_email = get_jwt_identity()
    message = data.get("message")
    role = data.get("role")
    
    if not message or not role:
        return jsonify({"message": "Invalid data"}), 400
    
    chat_collection.insert_one({
        "email": user_email,
        "content": message,
        "role": role,
        "timestamp": datetime.now(timezone.utc)
    })
    
    return jsonify({"message": "Message stored successfully"}), 201

@app.route('/get_chat_history', methods=['GET'])
@jwt_required()
def get_chat_history():
    user_email = get_jwt_identity()
    print(f"Fetching chat history for user: {user_email}")
    # Get chat history sorted by timestamp
    history = list(chat_collection.find(
        {"email": user_email},
        {"_id": 0, "email": 0, "timestamp": 0}
    ).sort("timestamp", 1))
    
    return jsonify(history), 200

@app.route('/health_check', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "API is running"
    }), 200

if __name__ == '__main__':
    app.run(debug=True)