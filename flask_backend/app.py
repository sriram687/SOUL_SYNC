from flask import Flask, request, jsonify
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from dotenv import load_dotenv
import os
from pymongo import MongoClient
import google.generativeai as genai
from datetime import datetime, timezone
from bson import ObjectId

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'default-secret-key')
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
user_preferences = db["user_preferences"]  # New collection for user preferences

# Configure Google Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

@app.route("/gemini_chat", methods=["POST"])
@jwt_required()
def gemini_chat():
    try:
        data = request.json
        user_input = data.get("message", "")
        output_mode = data.get("outputMode", "text")  # Get the output mode from the request
        user_email = get_jwt_identity()

        if not user_input:
            return jsonify({"error": "Empty message received"}), 400

        # Store user preference in database
        user_preferences.update_one(
            {"email": user_email},
            {"$set": {"outputMode": output_mode}},
            upsert=True
        )

        # Empathetic and supportive chatbot prompt with voice-friendly instructions if needed
        if output_mode == "voice":
            prompt = (
                "You are a supportive and empathetic chatbot designed to provide comfort, encouragement, "
                "and thoughtful responses to users, particularly women, on emotional and mental well-being topics. "
                "Your goal is to create a safe space for users to express themselves while offering appropriate guidance. "
                "Since your response will be read aloud by text-to-speech, use natural, conversational language "
                "with good pacing. Avoid complex sentences or unusual characters that might be difficult to pronounce. "
                "Respond concisely (within 50 words) while maintaining warmth and reassurance.\n\nUser: " + user_input
            )
        else:
            prompt = (
                "You are a supportive and empathetic chatbot designed to provide comfort, encouragement, "
                "and thoughtful responses to users, particularly women, on emotional and mental well-being topics. "
                "Your goal is to create a safe space for users to express themselves while offering appropriate guidance. "
                "Respond concisely (within 50 words) while maintaining warmth and reassurance.\n\nUser: " + user_input
            )

        responses = model.generate_content(prompt, stream=True)

        full_response = ""
        for response in responses:
            full_response += response.text

        # Limit response to 50 words
        short_response = " ".join(full_response.split()[:50])

        return jsonify({
            "response": short_response,
            "outputMode": output_mode
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get_user_preferences", methods=["GET"])
@jwt_required()
def get_user_preferences():
    user_email = get_jwt_identity()
    
    user_prefs = user_preferences.find_one({"email": user_email})
    
    if not user_prefs:
        # Default preferences
        return jsonify({
            "outputMode": "text"
        })
    
    # Remove MongoDB _id field for JSON serialization
    if "_id" in user_prefs:
        user_prefs.pop("_id")
    
    return jsonify(user_prefs)

@app.route("/update_user_preferences", methods=["POST"])
@jwt_required()
def update_user_preferences():
    user_email = get_jwt_identity()
    data = request.json
    
    # Update user preferences
    user_preferences.update_one(
        {"email": user_email},
        {"$set": data},
        upsert=True
    )
    
    return jsonify({"message": "Preferences updated successfully"})

# Keep all the existing routes from your original code...
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

@app.route('/store_message', methods=['POST'])
@jwt_required()
def store_message():
    data = request.get_json()
    user_email = get_jwt_identity()
    message = data.get("message")
    role = data.get("role")
    
    if not message or not role:
        return jsonify({"message": "Invalid data"}), 400
    
    result = chat_collection.insert_one({
        "email": user_email,
        "content": message,
        "role": role,
        "timestamp": datetime.now(timezone.utc)
    })
    
    # Return the inserted ID so the frontend can use it for deletion
    return jsonify({
        "message": "Message stored successfully",
        "message_id": str(result.inserted_id)
    }), 201

@app.route('/get_chat_history', methods=['GET'])
@jwt_required()
def get_chat_history():
    user_email = get_jwt_identity()
    print(f"Fetching chat history for user: {user_email}")
    # Get chat history sorted by timestamp
    history = list(chat_collection.find(
        {"email": user_email},
        {"_id": 1, "content": 1, "role": 1, "timestamp": 1} 
    ).sort("timestamp", 1))

    # Convert ObjectId to string for JSON serialization
    for message in history:
        message["_id"] = str(message["_id"])
    
    return jsonify(history), 200

@app.route('/delete_message', methods=['DELETE'])
@jwt_required()
def delete_message():
    try:
        data = request.json
        message_id = data.get("message_id")
        user_email = get_jwt_identity()

        if not message_id:
            return jsonify({"error": "Message ID is required"}), 400

        # Validate ObjectId format before attempting to delete
        if not ObjectId.is_valid(message_id):
            return jsonify({"error": "Invalid message ID format"}), 400

        # Try to delete the message
        result = chat_collection.delete_one({
            "_id": ObjectId(message_id),
            "email": user_email
        })

        if result.deleted_count == 0:
            # Check if message exists but belongs to another user
            message_exists = chat_collection.find_one({"_id": ObjectId(message_id)})
            if message_exists:
                return jsonify({"error": "Unauthorized to delete this message"}), 403
            else:
                return jsonify({"error": "Message not found"}), 404

        return jsonify({
            "message": "Message deleted successfully",
            "message_id": message_id
        }), 200

    except Exception as e:
        print(f"Error deleting message: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/health_check', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "API is running"
    }), 200

if __name__ == '__main__':
    app.run(debug=True)