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
voice_profiles = db["voice_profiles"]
user_preferences = db["user_preferences"]
feedback_collection = db["feedback"]
conferences_collection = db["conferences"]
messages_collection = db["messages"]

# Configure Google Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# ElevenLabs voice API configuration
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "sk_0e6a4b11b085079f89561266e6270d9816fb0c5e66a25570")
DEFAULT_VOICE_ID = os.getenv("DEFAULT_VOICE_ID", "SLVLJ4RCTvobsWx1j1Ds")  # Default voice ID
ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"



@app.route('/feedback', methods=['POST'])
@jwt_required()
def feedback():
    try:
        data = request.get_json()
        user_email = get_jwt_identity()
        conference_id = data.get("conference_id")
        rating = data.get("rating")  # "👍" or "👎"
        reason = data.get("reason", "")
        
        if not conference_id:
            return jsonify({"error": "Conference ID is required"}), 400
        
        # Verify conference belongs to user
        conference = conferences_collection.find_one({
            '_id': ObjectId(conference_id),
            'user_email': user_email
        })
        
        if not conference:
            return jsonify({'error': 'Conference not found'}), 404

        feedback_data = {
            "conference_id": conference_id,
            "user_email": user_email,
            "rating": rating,
            "reason": reason,
            "timestamp": datetime.now(timezone.utc)
        }

        feedback_collection.insert_one(feedback_data)
        return jsonify({"message": "Feedback recorded successfully"}), 201

    except Exception as e:
        print(f"Error in feedback endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/get_feedback/<conference_id>', methods=['GET'])
@jwt_required()
def get_feedback(conference_id):
    user_email = get_jwt_identity()
    
    # Verify conference belongs to user
    conference = conferences_collection.find_one({
        '_id': ObjectId(conference_id),
        'user_email': user_email
    })
    
    if not conference:
        return jsonify({'error': 'Conference not found'}), 404
    
    feedback_list = list(feedback_collection.find(
        {"conference_id": conference_id},
        {"_id": 0, "rating": 1, "reason": 1, "timestamp": 1}
    ).sort("timestamp", -1))
    
    return jsonify(feedback_list), 200



# API Endpoint to fetch food details
@app.route('/api/nutrition/get', methods=['GET'])
def get_food():
    try:
        food_id = request.args.get('food_id')
        token = get_access_token()
        
        params = {
            'method': 'food.get',
            'food_id': food_id,
            'format': 'json'
        }
        
        headers = {
            'Authorization': f'Bearer {token}'
        }
        
        API_BASE_URL = "https://platform.fatsecret.com/rest/server.api"
        response = requests.get(API_BASE_URL, params=params, headers=headers)
        return jsonify(response.json())
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route("/gemini_chat", methods=["POST"])
@jwt_required()
def gemini_chat():
    try:
        data = request.json
        user_input = data.get("message", "")
        output_mode = data.get("outputMode", "text")
        use_user_voice = data.get("useUserVoice", False)
        conference_id = data.get("conference_id")
        user_email = get_jwt_identity()

        if not user_input or not conference_id:
            return jsonify({"error": "Message and conference_id are required"}), 400

        # Verify conference belongs to user
        conference = conferences_collection.find_one({
            '_id': ObjectId(conference_id),
            'user_email': user_email
        })
        
        if not conference:
            return jsonify({"error": "Conference not found"}), 404

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
            "audioUrl": audio_url,
            "conference_id": conference_id
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
    



@app.route('/api/nutrition/search', methods=['GET'])
def search_food():
    try:
        query = request.args.get('query')
        token = get_access_token()
        
        params = {
            'method': 'foods.search',
            'search_expression': query,
            'format': 'json'
        }
        
        headers = {
            'Authorization': f'Bearer {token}'
        }
        
        API_BASE_URL = "https://platform.fatsecret.com/rest/server.api"
        response = requests.get(API_BASE_URL, params=params, headers=headers)
        return jsonify(response.json())
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500




@app.route('/api/nutrition/autocomplete', methods=['GET'])
def autocomplete_food():
    try:
        query = request.args.get('query')
        token = get_access_token()
        
        params = {
            'method': 'foods.autocomplete',
            'expression': query,
            'format': 'json'
        }
        
        headers = {
            'Authorization': f'Bearer {token}'
        }
        
        API_BASE_URL = "https://platform.fatsecret.com/rest/server.api"
        response = requests.get(API_BASE_URL, params=params, headers=headers)
        return jsonify(response.json())
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500




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
    
    # Get active conference for user
    active_conference = conferences_collection.find_one({
        'user_email': user_email,
        'is_active': True
    })
    
    if not active_conference:
        # Create a default conference if none exists
        conference = {
            'user_email': user_email,
            'topic': 'General Conversation',
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
            'is_active': True
        }
        result = conferences_collection.insert_one(conference)
        conference_id = str(result.inserted_id)
    else:
        conference_id = str(active_conference['_id'])
    
    result = messages_collection.insert_one({
        "email": user_email,
        "conference_id": conference_id,
        "content": message,
        "role": role,
        "timestamp": datetime.now(timezone.utc)
    })
    
    # Update conference updated_at
    conferences_collection.update_one(
        {'_id': ObjectId(conference_id)},
        {'$set': {'updated_at': datetime.now(timezone.utc)}}
    )
    
    return jsonify({
        "message": "Message stored successfully",
        "message_id": str(result.inserted_id),
        "conference_id": conference_id
    }), 201

@app.route('/get_chat_history/<conference_id>', methods=['GET'])
@jwt_required()
def get_chat_history(conference_id):
    user_email = get_jwt_identity()
    
    # Verify conference belongs to user
    conference = conferences_collection.find_one({
        '_id': ObjectId(conference_id),
        'user_email': user_email
    })
    
    if not conference:
        return jsonify({'error': 'Conference not found'}), 404
    
    # Get chat history for this conference
    history = list(messages_collection.find(
        {"email": user_email, "conference_id": conference_id},
        {"_id": 1, "content": 1, "role": 1, "timestamp": 1} 
    ).sort("timestamp", 1))

    for message in history:
        message["_id"] = str(message["_id"])
    
    return jsonify(history), 200

@app.route('/delete_message', methods=['DELETE'])
@jwt_required()
def delete_message():
    try:
        data = request.json
        message_id = data.get("message_id")
        conference_id = data.get("conference_id")
        user_email = get_jwt_identity()

        if not message_id or not conference_id:
            return jsonify({"error": "Message ID and Conference ID are required"}), 400

        # Validate ObjectId format before attempting to delete
        if not ObjectId.is_valid(message_id) or not ObjectId.is_valid(conference_id):
            return jsonify({"error": "Invalid ID format"}), 400

        # Verify conference belongs to user
        conference = conferences_collection.find_one({
            '_id': ObjectId(conference_id),
            'user_email': user_email
        })
        
        if not conference:
            return jsonify({"error": "Conference not found"}), 404

        # Try to delete the message
        result = messages_collection.delete_one({
            "_id": ObjectId(message_id),
            "email": user_email,
            "conference_id": conference_id
        })

        if result.deleted_count == 0:
            # Check if message exists but belongs to another user/conference
            message_exists = messages_collection.find_one({
                "_id": ObjectId(message_id),
                "conference_id": conference_id
            })
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



@app.route('/create_conference', methods=['POST'])
@jwt_required()
def create_conference():
    user_email = get_jwt_identity()
    data = request.get_json()
    topic = data.get('topic', 'New Conversation')
    
    conference = {
        'user_email': user_email,
        'topic': topic,
        'created_at': datetime.now(timezone.utc),
        'updated_at': datetime.now(timezone.utc),
        'is_active': True
    }
    
    result = conferences_collection.insert_one(conference)
    conference_id = str(result.inserted_id)
    
    # Set all other conferences as inactive
    conferences_collection.update_many(
        {'user_email': user_email, '_id': {'$ne': result.inserted_id}},
        {'$set': {'is_active': False}}
    )
    
    return jsonify({
        'message': 'Conference created successfully',
        'conference_id': conference_id
    }), 201

@app.route('/get_conferences', methods=['GET'])
@jwt_required()
def get_conferences():
    user_email = get_jwt_identity()
    
    conferences = list(conferences_collection.find(
        {'user_email': user_email},
        {'_id': 1, 'topic': 1, 'created_at': 1, 'updated_at': 1, 'is_active': 1}
    ).sort('updated_at', -1))
    
    for conf in conferences:
        conf['_id'] = str(conf['_id'])
        conf['message_count'] = messages_collection.count_documents({
            'conference_id': conf['_id']
        })
    
    return jsonify(conferences), 200





@app.route('/switch_conference/<conference_id>', methods=['POST'])
@jwt_required()
def switch_conference(conference_id):
    try:
        user_email = get_jwt_identity()
        
        # Validate conference belongs to user
        conference = conferences_collection.find_one({
            '_id': ObjectId(conference_id),
            'user_email': user_email
        })
        
        if not conference:
            return jsonify({'error': 'Conference not found'}), 404
        
        # Set all conferences as inactive
        conferences_collection.update_many(
            {'user_email': user_email},
            {'$set': {'is_active': False}}
        )
        
        # Set selected conference as active
        conferences_collection.update_one(
            {'_id': ObjectId(conference_id)},
            {'$set': {'is_active': True, 'updated_at': datetime.now(timezone.utc)}}
        )
        
        return jsonify({'message': 'Conference switched successfully'}), 200
    except Exception as e:
        print(f"Error switching conference: {str(e)}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)