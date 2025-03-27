from flask import Flask, request, jsonify, send_file
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from dotenv import load_dotenv
import os
from pymongo import MongoClient
import google.generativeai as genai
from datetime import datetime, timezone
from bson import ObjectId
import requests
from io import BytesIO
import uuid
import tempfile

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'default-secret-key')
CORS(app)
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
TOKEN_URL = "https://oauth.fatsecret.com/connect/token"


#Getting access token for FatSecret API
def get_access_token():
    data = {
        "grant_type": "client_credentials",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "scope": "basic"
    }
    response = requests.post(TOKEN_URL, data=data)
    if response.status_code == 200:
        print("API fetches successfully")
        return response.json().get("access_token")
    else:
        return None
    


# Initialize bcrypt and JWT
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# MongoDB connection setup
MONGO_URI = os.getenv("MONGO_URL")
client = MongoClient(MONGO_URI)
db = client["mental_health"]
users_collection = db["users"]
chat_collection = db["chat_history"]
user_preferences = db["user_preferences"]
voice_profiles = db["voice_profiles"]  # New collection for storing voice profiles

# Configure Google Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# ElevenLabs voice API configuration
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "sk_47fc2867130eea668e25be615fcb078035d1017785533f12")
DEFAULT_VOICE_ID = os.getenv("DEFAULT_VOICE_ID", "SLVLJ4RCTvobsWx1j1Ds")  # Default voice ID
ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"

# API Endpoint to fetch food details
@app.route("/api/nutrition", methods=["GET"])
def get_nutrition():
    food_query = request.args.get("food")
    if not food_query:
        return jsonify({"error": "Food query parameter is required"}), 400
    
    access_token = get_access_token()
    if not access_token:
        return jsonify({"error": "Failed to get access token"}), 500
    
    url = f"https://platform.fatsecret.com/rest/server.api"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {
        "method": "foods.search",
        "search_expression": food_query,
        "format": "json"
    }
    
    response = requests.get(url, headers=headers, params=params)
    return jsonify(response.json())



@app.route("/gemini_chat", methods=["POST"])
@jwt_required()
def gemini_chat():
    try:
        data = request.json
        user_input = data.get("message", "")
        output_mode = data.get("outputMode", "text")
        use_user_voice = data.get("useUserVoice", False)
        user_email = get_jwt_identity()

        if not user_input:
            return jsonify({"error": "Empty message received"}), 400

        # Store user preference in database
        user_preferences.update_one(
            {"email": user_email},
            {"$set": {"outputMode": output_mode, "useUserVoice": use_user_voice}},
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
                "Respond concisely (within 30 words) while maintaining warmth and reassurance.\n\nUser: " + user_input
            )

        responses = model.generate_content(prompt, stream=True)

        full_response = ""
        for response in responses:
            full_response += response.text

        # Limit response to 100 words
        short_response = " ".join(full_response.split()[:100])

        # If using voice output mode with user's voice, generate audio file
        audio_url = None
        if output_mode == "voice":
            # Get user's voice profile
            voice_profile = voice_profiles.find_one({"email": user_email})
            
            if use_user_voice and voice_profile and "voiceId" in voice_profile:
                # Generate speech using user's voice profile
                voice_id = voice_profile["voiceId"]
            else:
                # Use default voice
                voice_id = DEFAULT_VOICE_ID
                
            # Generate speech with ElevenLabs
            audio_data = generate_speech_with_elevenlabs(short_response, voice_id)
            
            if audio_data:
                # Save the audio file
                filename = f"{uuid.uuid4()}.mp3"
                file_path = os.path.join(tempfile.gettempdir(), filename)
                
                with open(file_path, "wb") as f:
                    f.write(audio_data)
                
                audio_url = f"/api/audio/{filename}"
        
        return jsonify({
            "response": short_response,
            "outputMode": output_mode,
            "audioUrl": audio_url
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_speech_with_elevenlabs(text, voice_id):
    """Generate speech using ElevenLabs API"""
    try:
        url = f"{ELEVENLABS_API_URL}/text-to-speech/{voice_id}"
        headers = {
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }
        payload = {
            "text": text,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            return response.content  # Return audio binary data
        else:
            print(f"ElevenLabs API error: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"Error generating speech: {str(e)}")
        return None

@app.route("/api/audio/<filename>", methods=["GET"])
def get_audio_file(filename):
    """Serve the generated audio file"""
    file_path = os.path.join(tempfile.gettempdir(), filename)
    if os.path.exists(file_path):
        return send_file(file_path, mimetype="audio/mpeg")
    else:
        return jsonify({"error": "Audio file not found"}), 404

@app.route("/upload_voice_sample", methods=["POST"])
@jwt_required()
def upload_voice_sample():
    """Upload user's voice sample to ElevenLabs and save the voice ID"""
    user_email = get_jwt_identity()
    
    if 'voiceSample' not in request.files:
        return jsonify({"error": "No voice sample provided"}), 400
        
    voice_sample = request.files['voiceSample']
    name = request.form.get('name', f"User_{user_email.split('@')[0]}")
    
    try:
        # Save the voice sample temporarily
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        voice_sample.save(temp_file.name)
        temp_file.close()
        
        # Upload to ElevenLabs and create voice
        with open(temp_file.name, 'rb') as f:
            files = {
                'files': (os.path.basename(temp_file.name), f, 'audio/mpeg')
            }
            data = {
                'name': name,
                'description': f"Voice profile for {user_email}"
            }
            
            response = requests.post(
                f"{ELEVENLABS_API_URL}/voices/add",
                headers={"xi-api-key": ELEVENLABS_API_KEY},
                data=data,
                files=files
            )
        
        # Clean up temporary file
        os.unlink(temp_file.name)
        
        if response.status_code != 200:
            return jsonify({"error": f"ElevenLabs API error: {response.text}"}), 500
            
        # Get the voice ID from the response
        voice_data = response.json()
        voice_id = voice_data.get("voice_id")
        
        if not voice_id:
            return jsonify({"error": "Failed to get voice ID from API"}), 500
            
        # Store the voice ID in the database
        voice_profiles.update_one(
            {"email": user_email},
            {"$set": {
                "voiceId": voice_id,
                "name": name,
                "createdAt": datetime.now(timezone.utc)
            }},
            upsert=True
        )
        
        return jsonify({
            "message": "Voice profile created successfully",
            "voiceId": voice_id,
            "name": name
        })
        
    except Exception as e:
        return jsonify({"error": f"Error creating voice profile: {str(e)}"}), 500

@app.route("/get_user_voice_profile", methods=["GET"])
@jwt_required()
def get_user_voice_profile():
    """Get the user's voice profile information"""
    user_email = get_jwt_identity()
    
    voice_profile = voice_profiles.find_one({"email": user_email})
    
    if not voice_profile:
        return jsonify({"message": "No voice profile found"}), 404
        
    return jsonify({
        "voiceId": voice_profile.get("voiceId"),
        "name": voice_profile.get("name"),
        "createdAt": voice_profile.get("createdAt")
    })

# Keep all other existing routes
@app.route("/get_user_preferences", methods=["GET"])
@jwt_required()
def get_user_preferences():
    user_email = get_jwt_identity()
    
    user_prefs = user_preferences.find_one({"email": user_email})
    
    if not user_prefs:
        # Default preferences
        return jsonify({
            "outputMode": "text",
            "useUserVoice": False
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