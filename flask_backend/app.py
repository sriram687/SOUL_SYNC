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
from bson.json_util import dumps
import requests
import subprocess
from io import BytesIO
import uuid
import tempfile
import cv2
import numpy as np
from push_counter import PushUpCounter  # Your CV class
import base64


# Load environment variables
load_dotenv()

# ENABLE PUSHUP FUNCTIONALITY
ENABLE_PUSHUP_FEATURES = True

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'default-secret-key')
CORS(app)
USDA_API_KEY = os.getenv('USDA_API_KEY')
BASE_URL = "https://api.nal.usda.gov/fdc/v1"
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
TOKEN_URL = os.getenv("TOKEN_URL", "https://oauth.fatsecret.com/connect/token")  # FatSecret OAuth2 token endpoint (override via .env)


sessions = {}
active_counters = {}


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
nutrition_diary = db["nutrition_diary"]



# Configure Google Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

# Configure separate Gemini model for pushup chatbot
PUSHUP_GEMINI_API_KEY = os.getenv("PUSHUP_GEMINI_API_KEY", os.getenv("GEMINI_API_KEY", "AIzaSyC72n_DrNfm1bnUTkJiZqh6Gd39j8-Nre8"))

# Dictionary to store pushup chatbot sessions
pushup_chatbot_sessions = {}

# ElevenLabs voice API configuration
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "sk_0e6a4b11b085079f89561266e6270d9816fb0c5e66a25570")
DEFAULT_VOICE_ID = os.getenv("DEFAULT_VOICE_ID", "SLVLJ4RCTvobsWx1j1Ds")  # Default voice ID
ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"


@app.before_request
def log_requests():
    if request.path.startswith('/api'):
        print(f"\n\nReceived {request.method} request to {request.path}")
        print("Headers:", dict(request.headers))
        if request.method == 'POST':
            if request.content_length > 0:
                print("Request contains data")
            else:
                print("Empty request body")



@app.route('/api/start_workout', methods=['POST'])
def start_workout():
    if not ENABLE_PUSHUP_FEATURES:
        return jsonify({
            'status': 'disabled',
            'message': 'Push-up functionality is disabled in this deployment'
        }), 503
        
    print('[start_workout] Received POST request')
    print('[start_workout] Request JSON:', request.json)
    try:
        user_id = request.json.get('user_id', 'default_user')
        session_id = str(uuid.uuid4())

        print('[start_workout] Initializing PushUpCounter for user:', user_id)
        # counter = PushUpCounter(user_id)

        print('[start_workout] Storing session:', session_id)
        # active_counters[session_id] = counter
        sessions[session_id] = {
            'user_id': user_id,
            'start_time': datetime.now().isoformat(),
            'status': 'active'
        }

        print('[start_workout] Session started successfully')
        return jsonify({
            'status': 'success',
            'message': 'Workout session started',
            'session_id': session_id
        })
    except Exception as e:
        print(f'[start_workout] Error: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': f'Failed to start workout: {str(e)}'
        }), 500

# Dictionary to store running push counter processes
running_counters = {}

@app.route('/api/start_direct_counter', methods=['POST'])
def start_direct_counter():
    if not ENABLE_PUSHUP_FEATURES:
        return jsonify({
            'status': 'disabled',
            'message': 'Push-up functionality is disabled in this deployment'
        }), 503
        
    """Start the push_counter.py script directly as a separate process"""
    try:
        user_id = request.json.get('user_id', 'default_user')

        # Start the push_counter.py script as a separate process
        import subprocess
        import sys
        import os
        import threading

        # Get the current directory
        current_dir = os.path.dirname(os.path.abspath(__file__))

        # Construct the path to push_counter.py
        script_path = os.path.join(current_dir, 'push_counter.py')

        # Start the process - use shell=True on Windows to open in a new window
        if os.name == 'nt':  # Windows
            process = subprocess.Popen([sys.executable, script_path],
                                      creationflags=subprocess.CREATE_NEW_CONSOLE)
        else:  # Linux/Mac
            process = subprocess.Popen([sys.executable, script_path],
                                      stdout=subprocess.PIPE,
                                      stderr=subprocess.PIPE,
                                      text=True)


        # Store the process ID and create a session ID
        process_id = process.pid
        session_id = str(uuid.uuid4())

        # Store the process in our dictionary
        running_counters[session_id] = {
            'process': process,
            'user_id': user_id,
            'start_time': datetime.now().isoformat(),
            'pid': process_id,
            'stats': {
                'reps_completed': 0,
                'incorrect_forms': 0,
                'calories_burned': 0,
                'form_accuracy': 100
            }
        }

        print(f'[start_direct_counter] Started push_counter.py with PID: {process_id}, Session ID: {session_id}')

        # Return success with the session ID
        return jsonify({
            'status': 'success',
            'message': 'Push counter started directly',
            'session_id': session_id,
            'process_id': process_id,
            'note': 'The push counter is now running in a separate window. Please check your taskbar.'
        })

    except Exception as e:
        print(f'[start_direct_counter] Error: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': f'Failed to start push counter: {str(e)}'
        }), 500

@app.route('/api/get_direct_counter_stats', methods=['GET'])
def get_direct_counter_stats():
    """Get stats from the running push_counter.py process"""
    try:
        session_id = request.args.get('session_id')

        if not session_id or session_id not in running_counters:
            return jsonify({
                'status': 'error',
                'message': 'Invalid or inactive session'
            }), 400

        # Get the process info
        process_info = running_counters[session_id]
        process = process_info['process']

        # Check if the process is still running
        if process.poll() is not None:
            # Process has terminated
            return jsonify({
                'status': 'error',
                'message': 'Push counter process has terminated'
            }), 400

        # Since we can't directly get stats from the process (it's running in a separate window),
        # we'll return placeholder stats that would normally be updated by some IPC mechanism
        # In a real implementation, you'd use a shared file, database, or other IPC method

        # For demo purposes, we'll simulate increasing reps over time
        start_time = datetime.fromisoformat(process_info['start_time'])
        elapsed_seconds = (datetime.now() - start_time).total_seconds()

        # Simulate a rep every 3 seconds
        simulated_reps = int(elapsed_seconds / 3)

        # Update the stats
        process_info['stats'] = {
            'reps_completed': simulated_reps,
            'incorrect_forms': int(simulated_reps * 0.2),  # 20% incorrect form
            'calories_burned': simulated_reps * 0.5,  # 0.5 calories per rep
            'form_accuracy': 80  # 80% accuracy
        }

        # Return the stats
        return jsonify({
            'status': 'success',
            'stats': process_info['stats'],
            'elapsed_time': int(elapsed_seconds)
        })

    except Exception as e:
        print(f'[get_direct_counter_stats] Error: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': f'Failed to get counter stats: {str(e)}'
        }), 500

@app.route('/api/stop_direct_counter', methods=['POST'])
def stop_direct_counter():
    """Stop the running push_counter.py process"""
    try:
        session_id = request.json.get('session_id')

        if not session_id or session_id not in running_counters:
            return jsonify({
                'status': 'error',
                'message': 'Invalid or inactive session'
            }), 400

        # Get the process info
        process_info = running_counters[session_id]
        process = process_info['process']

        # Try to terminate the process
        if process.poll() is None:  # Process is still running
            process.terminate()

            # Wait a bit for the process to terminate
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                # Force kill if it doesn't terminate gracefully
                process.kill()

        # Get the final stats
        final_stats = process_info['stats']

        # Remove the process from our dictionary
        del running_counters[session_id]

        # Return success with the final stats
        return jsonify({
            'status': 'success',
            'message': 'Push counter stopped',
            'final_stats': final_stats
        })

    except Exception as e:
        print(f'[stop_direct_counter] Error: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': f'Failed to stop push counter: {str(e)}'
        }), 500




@app.route('/api/process_frame', methods=['POST'])
def process_frame():
    if not ENABLE_PUSHUP_FEATURES:
        return jsonify({
            'status': 'disabled',
            'message': 'Push-up functionality is disabled in this deployment'
        }), 503
        
    print('[process_frame] Received POST request')
    try:
        # Validate session
        session_id = request.json.get('session_id')
        print('[process_frame] Session ID:', session_id)
        if not session_id or session_id not in active_counters:
            print('[process_frame] Error: Invalid or inactive session')
            return jsonify({'error': 'Invalid or inactive session'}), 400

        counter = active_counters[session_id]

        # Validate image data
        if 'image' not in request.json:
            print('[process_frame] Error: No image data provided')
            return jsonify({'error': 'No image data provided'}), 400

        try:
            print('[process_frame] Decoding image')
            header, data = request.json['image'].split(',', 1)
            if 'base64' not in header:
                print('[process_frame] Error: Invalid image format')
                return jsonify({'error': 'Invalid image format'}), 400

            nparr = np.frombuffer(base64.b64decode(data), np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None or frame.size == 0:
                print('[process_frame] Error: Failed to decode image')
                return jsonify({'error': 'Failed to decode image'}), 400
            print('[process_frame] Image decoded successfully')

        except Exception as e:
            print(f'[process_frame] Image processing error: {str(e)}')
            return jsonify({'error': f'Image processing error: {str(e)}'}), 400

        # Process frame
        try:
            with counter.mp_pose.Pose(
                min_detection_confidence=0.6,  # Lower threshold for better detection
                min_tracking_confidence=0.6,   # Lower threshold for better tracking
                model_complexity=1,            # Medium complexity for balance of speed and accuracy
                smooth_landmarks=True) as pose:  # Enable landmark smoothing

                print('[process_frame] Processing frame with MediaPipe')
                processed_frame = counter.process_frame(frame, pose)
                print('[process_frame] Frame processed successfully')

                # Encode processed image
                print('[process_frame] Encoding processed image')
                _, buffer = cv2.imencode('.jpg', processed_frame,
                                      [int(cv2.IMWRITE_JPEG_QUALITY), 80])
                processed_image = base64.b64encode(buffer).decode('utf-8')
                print('[process_frame] Image encoded successfully')

                stats = counter.get_session_stats()
                print('[process_frame] Stats:', stats)

                # Print detailed information for debugging
                print('[process_frame] Counter position:', counter.position)
                print('[process_frame] Form feedback:', counter.form_feedback)
                print('[process_frame] Rep status:', counter.rep_status)

                return jsonify({
                    'status': 'success',
                    'processed_image': f"data:image/jpeg;base64,{processed_image}",
                    'stats': {
                        'reps_completed': stats['reps_completed'],
                        'correct_reps': stats['reps_completed'] - stats['incorrect_forms'],
                        'calories_burned': float(stats['calories_burned']),
                        'form_accuracy': int(100 * (stats['reps_completed'] - stats['incorrect_forms']) /
                                          max(1, stats['reps_completed']))
                    },
                    'position': counter.position,
                    'form_feedback': counter.form_feedback,
                    'rep_status': counter.rep_status
                })

        except Exception as e:
            print(f'[process_frame] CV processing error: {str(e)}')
            return jsonify({
                'status': 'error',
                'message': f'CV processing failed: {str(e)}'
            }), 500

    except Exception as e:
        print(f'[process_frame] Unexpected error: {str(e)}')
        return jsonify({
            'status': 'error',
            'message': f'Unexpected error: {str(e)}'
        }), 500


@app.route('/api/workout_status', methods=['POST'])
def workout_status():
    """Get the current status of a workout session"""
    try:
        session_id = request.json.get('session_id')
        if not session_id or session_id not in active_counters:
            return jsonify({'error': 'Invalid or inactive session'}), 400

        # Get the counter for this session
        counter = active_counters[session_id]

        # Return the current status
        return jsonify({
            'status': 'success',
            'position': counter.position,
            'form_feedback': counter.form_feedback,
            'rep_status': counter.rep_status
        })
    except Exception as e:
        print(f"Error getting workout status: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to get workout status: {str(e)}'
        }), 500


# Pushup chatbot endpoints
@app.route('/api/pushup-chat/start', methods=['POST'])
def pushup_chat_start():
    """Start a new pushup chatbot session with avatar and voice support"""
    try:
        user_id = request.json.get("user_id")
        output_mode = request.json.get("outputMode", "text")  # Can be "text" or "voice"

        if not user_id:
            return jsonify({"error": "Missing user_id"}), 400

        # Configure Gemini with the pushup-specific API key
        pushup_genai = genai
        pushup_genai.configure(api_key=PUSHUP_GEMINI_API_KEY)
        pushup_model = pushup_genai.GenerativeModel('gemini-2.5-flash')

        # Welcome message
        welcome_message = "Hi there! I'm Fitness Buddy, your dedicated push-up assistant. I'm here to help you perfect your form, track your progress, and achieve your fitness goals. Whether you're a beginner or looking to advance your push-up routine, I've got your back! What would you like to know about push-ups today?"

        # Initialize chat history
        pushup_chatbot_sessions[user_id] = {
            "history": [
                {"role": "user", "parts": ["You are my fitness assistant focused on helping me with push-ups. Your name is Fitness Buddy. Be encouraging, motivational, and provide helpful tips about proper form, technique, and workout routines."]},
                {"role": "model", "parts": [welcome_message]}
            ],
            "model": pushup_model
        }

        # Default response data
        response_data = {
            "status": "success",
            "response": welcome_message,
            "avatar_url": "https://i.imgur.com/JR1lAYV.png"  # Default fitness avatar image
        }

        # Generate voice response if requested
        if output_mode == "voice":
            # Use a specific voice for fitness assistant
            fitness_voice_id = "EXAVITQu4vr4xnSDxMaL"  # Male fitness coach voice

            # Generate speech using ElevenLabs
            audio_content = generate_speech_with_elevenlabs(welcome_message, fitness_voice_id)

            if audio_content:
                # Save audio file
                audio_filename = f"fitness_response_{uuid.uuid4()}.mp3"
                audio_path = os.path.join(tempfile.gettempdir(), audio_filename)

                with open(audio_path, "wb") as f:
                    f.write(audio_content)

                # Add audio URL to response
                audio_url = f"/api/audio/{audio_filename}"
                response_data["audio_url"] = audio_url
                response_data["outputMode"] = "voice"
            else:
                print("Failed to generate speech, falling back to text mode")
                response_data["outputMode"] = "text"
        else:
            response_data["outputMode"] = "text"

        return jsonify(response_data)

    except Exception as e:
        print(f"Error starting pushup chat session: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to start chat session: {str(e)}"
        }), 500


@app.route('/api/pushup-chat/message', methods=['POST'])
def pushup_chat_message():
    """Send a message to the pushup chatbot with avatar and voice support"""
    try:
        user_id = request.json.get("user_id")
        message = request.json.get("message")
        output_mode = request.json.get("outputMode", "text")  # Can be "text" or "voice"

        if not user_id or not message:
            return jsonify({"error": "Missing user_id or message"}), 400

        # Check if session exists, if not create one
        if user_id not in pushup_chatbot_sessions:
            # Configure Gemini with the pushup-specific API key
            pushup_genai = genai
            pushup_genai.configure(api_key=PUSHUP_GEMINI_API_KEY)
            pushup_model = pushup_genai.GenerativeModel('gemini-2.5-flash')

            # Initialize chat history
            pushup_chatbot_sessions[user_id] = {
                "history": [
                    {"role": "user", "parts": ["You are my fitness assistant focused on helping me with push-ups. Your name is Fitness Buddy. Be encouraging, motivational, and provide helpful tips about proper form, technique, and workout routines."]},
                    {"role": "model", "parts": ["Hi there! I'm Fitness Buddy, your dedicated push-up assistant. I'm here to help you perfect your form, track your progress, and achieve your fitness goals. Whether you're a beginner or looking to advance your push-up routine, I've got your back! What would you like to know about push-ups today?"]}
                ],
                "model": pushup_model
            }

        # Get the chat session
        session = pushup_chatbot_sessions[user_id]
        pushup_model = session["model"]

        # Add user message to history
        session["history"].append({"role": "user", "parts": [message]})

        # Generate response
        chat = pushup_model.start_chat(history=session["history"])
        response = chat.send_message(message)

        # Add model response to history
        session["history"].append({"role": "model", "parts": [response.text]})

        # Default response data
        response_data = {
            "status": "success",
            "response": response.text,
            "avatar_url": "https://i.imgur.com/JR1lAYV.png"  # Default fitness avatar image
        }

        # Generate voice response if requested
        if output_mode == "voice":
            # Use a specific voice for fitness assistant
            fitness_voice_id = "EXAVITQu4vr4xnSDxMaL"  # Male fitness coach voice

            # Generate speech using ElevenLabs
            audio_content = generate_speech_with_elevenlabs(response.text, fitness_voice_id)

            if audio_content:
                # Save audio file
                audio_filename = f"fitness_response_{uuid.uuid4()}.mp3"
                audio_path = os.path.join(tempfile.gettempdir(), audio_filename)

                with open(audio_path, "wb") as f:
                    f.write(audio_content)

                # Add audio URL to response
                audio_url = f"/api/audio/{audio_filename}"
                response_data["audio_url"] = audio_url
                response_data["outputMode"] = "voice"
            else:
                print("Failed to generate speech, falling back to text mode")
                response_data["outputMode"] = "text"
        else:
            response_data["outputMode"] = "text"

        return jsonify(response_data)

    except Exception as e:
        print(f"Error processing pushup chat message: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to process message: {str(e)}"
        }), 500


@app.route('/api/pushup-chat/start-pushup', methods=['POST'])
def pushup_chat_start_pushup():
    """Start push-up tracking with the chatbot with avatar and voice support"""
    try:
        user_id = request.json.get("user_id", "default_user")
        output_mode = request.json.get("outputMode", "text")  # Can be "text" or "voice"

        # Check if session exists
        if user_id not in pushup_chatbot_sessions:
            return jsonify({"error": "Chat session not found"}), 400

        # Get the counter for the current workout session
        session_ids = [sid for sid, session in sessions.items()
                      if session.get('user_id') == user_id and session.get('status') == 'active']

        if not session_ids:
            return jsonify({"error": "No active workout session found"}), 400

        session_id = session_ids[0]
        counter = active_counters.get(session_id)

        if not counter:
            return jsonify({"error": "No active counter found"}), 400

        # Add message to chat history
        session = pushup_chatbot_sessions[user_id]
        session["history"].append({
            "role": "user",
            "parts": ["I'm starting my push-up workout now. Please track my form and count my reps."]
        })

        # Generate response
        chat = session["model"].start_chat(history=session["history"])
        response = chat.send_message("I'm starting my push-up workout now. Please track my form and count my reps.")

        # Add model response to history
        session["history"].append({"role": "model", "parts": [response.text]})

        # Default response data
        response_data = {
            "status": "success",
            "message": "Push-up tracking started",
            "response": response.text,
            "avatar_url": "https://i.imgur.com/JR1lAYV.png"  # Default fitness avatar image
        }

        # Generate voice response if requested
        if output_mode == "voice":
            # Use a specific voice for fitness assistant
            fitness_voice_id = "EXAVITQu4vr4xnSDxMaL"  # Male fitness coach voice

            # Generate speech using ElevenLabs
            audio_content = generate_speech_with_elevenlabs(response.text, fitness_voice_id)

            if audio_content:
                # Save audio file
                audio_filename = f"fitness_response_{uuid.uuid4()}.mp3"
                audio_path = os.path.join(tempfile.gettempdir(), audio_filename)

                with open(audio_path, "wb") as f:
                    f.write(audio_content)

                # Add audio URL to response
                audio_url = f"/api/audio/{audio_filename}"
                response_data["audio_url"] = audio_url
                response_data["outputMode"] = "voice"
            else:
                print("Failed to generate speech, falling back to text mode")
                response_data["outputMode"] = "text"
        else:
            response_data["outputMode"] = "text"

        return jsonify(response_data)

    except Exception as e:
        print(f"Error starting pushup tracking: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to start push-up tracking: {str(e)}"
        }), 500


@app.route('/api/pushup-chat/stop-pushup', methods=['POST'])
def pushup_chat_stop_pushup():
    """Stop push-up tracking with the chatbot with avatar and voice support"""
    try:
        user_id = request.json.get("user_id")
        output_mode = request.json.get("outputMode", "text")  # Can be "text" or "voice"

        if not user_id:
            return jsonify({"error": "Missing user_id"}), 400

        # Check if session exists
        if user_id not in pushup_chatbot_sessions:
            return jsonify({"error": "Chat session not found"}), 400

        # Get the counter for the current workout session
        session_ids = [sid for sid, session in sessions.items()
                      if session.get('user_id') == user_id and session.get('status') == 'active']

        if not session_ids:
            return jsonify({"error": "No active workout session found"}), 400

        session_id = session_ids[0]
        counter = active_counters.get(session_id)

        if not counter:
            return jsonify({"error": "No active counter found"}), 400

        # Get stats
        stats = counter.get_session_stats()

        # Add message to chat history with stats
        session = pushup_chatbot_sessions[user_id]
        session["history"].append({
            "role": "user",
            "parts": [f"I've finished my workout. I did {stats['reps_completed']} push-ups."]
        })

        # Generate response
        chat = session["model"].start_chat(history=session["history"])
        response = chat.send_message(
            f"I've finished my workout. I did {stats['reps_completed']} push-ups with {stats['incorrect_forms']} form issues. " +
            f"I burned approximately {float(stats['calories_burned']):.1f} calories. How did I do?"
        )

        # Add model response to history
        session["history"].append({"role": "model", "parts": [response.text]})

        # Default response data
        response_data = {
            "status": "success",
            "message": "Push-up tracking stopped",
            "response": response.text,
            "stats": stats,
            "avatar_url": "https://i.imgur.com/JR1lAYV.png"  # Default fitness avatar image
        }

        # Generate voice response if requested
        if output_mode == "voice":
            # Use a specific voice for fitness assistant
            fitness_voice_id = "EXAVITQu4vr4xnSDxMaL"  # Male fitness coach voice

            # Generate speech using ElevenLabs
            audio_content = generate_speech_with_elevenlabs(response.text, fitness_voice_id)

            if audio_content:
                # Save audio file
                audio_filename = f"fitness_response_{uuid.uuid4()}.mp3"
                audio_path = os.path.join(tempfile.gettempdir(), audio_filename)

                with open(audio_path, "wb") as f:
                    f.write(audio_content)

                # Add audio URL to response
                audio_url = f"/api/audio/{audio_filename}"
                response_data["audio_url"] = audio_url
                response_data["outputMode"] = "voice"
            else:
                print("Failed to generate speech, falling back to text mode")
                response_data["outputMode"] = "text"
        else:
            response_data["outputMode"] = "text"

        return jsonify(response_data)

    except Exception as e:
        print(f"Error stopping pushup tracking: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to stop push-up tracking: {str(e)}"
        }), 500


@app.route('/api/pushup-chat/session-stats', methods=['GET'])
def pushup_chat_session_stats():
    """Get stats for the current push-up session"""
    try:
        user_id = request.args.get("user_id")

        if not user_id:
            return jsonify({"error": "Missing user_id"}), 400

        # Get the counter for the current workout session
        session_ids = [sid for sid, session in sessions.items()
                      if session.get('user_id') == user_id and session.get('status') == 'active']

        if not session_ids:
            return jsonify({"error": "No active workout session found"}), 400

        session_id = session_ids[0]
        counter = active_counters.get(session_id)

        if not counter:
            return jsonify({"error": "No active counter found"}), 400

        # Get stats
        stats = counter.get_session_stats()

        return jsonify({
            "status": "success",
            "stats": stats
        })

    except Exception as e:
        print(f"Error getting session stats: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to get session stats: {str(e)}"
        }), 500


@app.route('/api/end_workout', methods=['POST'])
def end_workout():
    """End a workout session and return final stats"""
    try:
        session_id = request.json.get('session_id')
        if not session_id or session_id not in active_counters:
            return jsonify({'error': 'Invalid or inactive session'}), 400

        # Get the counter for this session
        counter = active_counters[session_id]

        # Get final stats
        stats = counter.get_session_stats()

        # Prepare final stats for frontend
        final_stats = {
            'total_reps': stats['reps_completed'],
            'correct_reps': stats['reps_completed'] - stats['incorrect_forms'],
            'calories_burned': float(stats['calories_burned']),
            'duration': int((datetime.now() - datetime.fromisoformat(
                sessions[session_id]['start_time'])).total_seconds()),
            'form_accuracy': int(100 * (stats['reps_completed'] - stats['incorrect_forms']) /
                                max(1, stats['reps_completed']))
        }

        # Update session status
        sessions[session_id]['status'] = 'completed'
        sessions[session_id]['end_time'] = datetime.now().isoformat()
        sessions[session_id]['stats'] = final_stats

        # Clean up resources
        del active_counters[session_id]

        return jsonify({
            'status': 'success',
            'message': 'Workout session ended',
            'final_stats': final_stats
        })
    except Exception as e:
        print(f"Error ending workout: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to end workout: {str(e)}'
        }), 500













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

#API endpoint to get food details
@app.route('/api/nutrition/get', methods=['GET'])
def get_food_details():
    fdc_id = request.args.get('fdc_id')
    if not fdc_id:
        return jsonify({"error": "fdc_id parameter is required"}), 400

    try:
        # Get food details - request FULL format and specific nutrients
        details_url = f"{BASE_URL}/food/{fdc_id}"
        params = {
            'api_key': USDA_API_KEY,
            'format': 'full',  # Changed from 'abridged' to 'full'
            'nutrients': [1008, 1003, 1004, 1005, 1093, 1087, 1089, 1106]  # Common nutrients
        }

        response = requests.get(details_url, params=params)
        response.raise_for_status()

        food_data = response.json()

        # Extract nutrients from different possible locations in the response
        food_nutrients = []

        # Try different locations where nutrients might be stored
        if 'foodNutrients' in food_data:
            food_nutrients = food_data['foodNutrients']
        elif 'inputFoods' in food_data and len(food_data['inputFoods']) > 0:
            if 'foodNutrients' in food_data['inputFoods'][0]:
                food_nutrients = food_data['inputFoods'][0]['foodNutrients']

        # Simplify the nutrient data
        processed_nutrients = []
        for nutrient in food_nutrients:
            processed_nutrients.append({
                'nutrientId': nutrient.get('nutrient', {}).get('id') or nutrient.get('nutrientId'),
                'nutrientName': nutrient.get('nutrient', {}).get('name') or nutrient.get('nutrientName'),
                'value': nutrient.get('amount') or nutrient.get('value'),
                'unitName': nutrient.get('nutrient', {}).get('unitName') or nutrient.get('unitName')
            })

        # Simplify the response
        simplified_data = {
            'fdcId': food_data.get('fdcId'),
            'description': food_data.get('description', ''),
            'brandOwner': food_data.get('brandOwner', ''),
            'dataType': food_data.get('dataType', ''),
            'foodNutrients': processed_nutrients
        }

        return jsonify(simplified_data)

    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500



# API Endpoint to food search details
@app.route('/api/nutrition/search', methods=['GET'])
def search_food():
    query = request.args.get('query')
    if not query:
        return jsonify({"error": "Query parameter is required"}), 400

    try:
        # Search for foods
        search_url = f"{BASE_URL}/foods/search"
        params = {
            'api_key': USDA_API_KEY,
            'query': query,
            'pageSize': 10,
            'dataType': ["Survey (FNDDS)", "Branded"]
        }

        response = requests.get(search_url, params=params)
        response.raise_for_status()

        foods = response.json().get('foods', [])
        simplified_foods = []

        for food in foods:
            simplified_foods.append({
                'fdcId': food['fdcId'],
                'description': food.get('description', ''),
                'dataType': food.get('dataType', ''),
                'brandOwner': food.get('brandOwner', ''),
                'score': food.get('score', 0)
            })

        return jsonify({"foods": simplified_foods})

    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500



@app.route('/api/nutrition/diary', methods=['POST'])
@jwt_required()
def add_diary_entry():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        entry = {
            "userId": user_id,
            "date": data["date"],
            "mealType": data["mealType"],
            "food": data["food"]
        }

        nutrition_diary.insert_one(entry)
        return jsonify({"message": "Entry added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/api/nutrition/diary', methods=['GET'])
@jwt_required()
def get_user_diary():
    user_id = get_jwt_identity()
    date = request.args.get('date')
    entries = list(nutrition_diary.find({
        "userId": user_id,
        "date": date
    }))
    return dumps(entries), 200





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
                 "You are a supportive and empathetic chatbot that responds like a caring friend. "
        "Your goal is to comfort, encourage, and gently guide users, especially women, "
        "who open up about emotional or mental well-being topics. "
        "Create a safe, understanding space using natural, conversational language suited for text-to-speech. "
        "Avoid exaggerated empathy or endearments like 'dear' or 'honey'. "
        "Respond extremely concisely (target: 1–2 sentences, max 15 words) while sounding calm, kind, and real.\n\n"
        "User: " + user_input

            )
        else:
            prompt = (
                "You are a supportive and empathetic chatbot that responds like a caring friend. "
            "Your goal is to comfort, encourage, and gently guide users, especially women, "
            "who open up about emotional or mental well-being topics. "
            "Avoid exaggerated empathy or endearments like 'dear' or 'honey'. "
            "Respond extremely concisely (target: 1–2 sentences, max 15 words) while sounding calm, kind, and real.\n\n"
            "User: " + user_input
            )

        responses = model.generate_content(prompt, stream=True, generation_config={"max_output_tokens": 100})

        full_response = ""
        for response in responses:
            full_response += response.text

        # Limit response to 100 words
        short_response = " ".join(full_response.split()[:100])

        # Backend ElevenLabs generation bypassed to reduce response latency.
        # The React frontend generates and plays the voice client-side.
        audio_url = None

        return jsonify({
            "response": short_response,
            "outputMode": output_mode,
            "audioUrl": audio_url,
            "conference_id": conference_id
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
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




@app.route('/api/nutrition/autocomplete', methods=['GET'])
def autocomplete_food():
    query = request.args.get('query')
    if not query or len(query) < 2:
        return jsonify({"suggestions": []})

    try:
        # Autocomplete endpoint
        autocomplete_url = f"{BASE_URL}/foods/search/suggest"
        params = {
            'api_key': USDA_API_KEY,
            'query': query,
            'dataType': ["Survey (FNDDS)", "Branded"]
        }

        response = requests.get(autocomplete_url, params=params)
        response.raise_for_status()

        suggestions = [item.get('name', '') for item in response.json()]
        return jsonify({"suggestions": suggestions})

    except requests.exceptions.RequestException:
        # Fallback to empty suggestions if API fails
        return jsonify({"suggestions": []})




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