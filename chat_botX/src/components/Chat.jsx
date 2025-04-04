import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, LogOut, Smile, Brain, Trash2, Volume2, VolumeX, Save, Loader, UserRound, MessageCircle, X, GripVertical, Plus } from 'lucide-react';
import { Link } from "react-router-dom";
import Draggable from 'react-draggable';


// Import the ElevenLabs API functions
import { uploadVoiceClone, textToSpeech } from "../utils/elevenlabs";

const ChatPage = () => {
  const [messages, setMessages] = useState([
    { role: "bot", content: "Hello! How can I assist you today?" },
  ]);

  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [outputMode, setOutputMode] = useState("text"); // "text" or "voice"
  const speechSynthesisRef = useRef(null);
  const navigate = useNavigate();
  
  // Voice profile state
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [userVoiceProfile, setUserVoiceProfile] = useState(null);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [hasVoiceProfile, setHasVoiceProfile] = useState(false);
  const [voiceProfileInfo, setVoiceProfileInfo] = useState(null);
  
  // User preferences
  const [preferences, setPreferences] = useState({
    outputMode: "text",
    useUserVoice: false
  });

  // Add new state for voice settings visibility
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Add these state variables at the top with other state declarations
  const [rating, setRating] = useState("");
  const [reason, setReason] = useState("");
  const [feedbackList, setFeedbackList] = useState([]);

  // Add this line near your other state declarations
  const dragRef = useRef(null);

  // Add conference-related state
  const [activeConference, setActiveConference] = useState(null);
  const [conferences, setConferences] = useState([]);
  const [newTopic, setNewTopic] = useState('');

  // Add view mode state
  const [viewMode, setViewMode] = useState('conference'); // 'conference' or 'voice'

  // Generate speech from text using ElevenLabs API
  const generateVoiceResponse = async (text) => {
    const voiceId = localStorage.getItem('elevenLabsVoiceId');

    if (!voiceId) {
      alert("No voice cloned yet!");
      return;
    }

    try {
      const audioUrl = await textToSpeech(text, voiceId);
      
      // Play the audio
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('TTS generation failed:', error);
    }
  };

  useEffect(() => {     
    const token = localStorage.getItem("token");
    console.log("JWT Token:", token); 
  
    if (!token) {
      alert("You are not logged in. Redirecting to login.");
      navigate("/login");
      return;
    }
  
    fetchChatHistory();
    // fetchUserVoiceProfile();
    // fetchVoiceProfile();
  
    // Set up speech recognition
    if ("webkitSpeechRecognition" in window) {
      const speechRecognition = new window.webkitSpeechRecognition();
      speechRecognition.continuous = false;
      speechRecognition.interimResults = false;
      speechRecognition.lang = "en-US";
      speechRecognition.onstart = () => setRecording(true);
      speechRecognition.onend = () => setRecording(false);
      speechRecognition.onresult = (event) => setInput(event.results[0][0].transcript);
      setRecognition(speechRecognition);
    }

    // Set up speech synthesis
    if ("speechSynthesis" in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    }

    // Get saved output mode preference from localStorage
    const savedOutputMode = localStorage.getItem("outputMode");
    if (savedOutputMode) {
      setOutputMode(savedOutputMode);
      setPreferences(prev => ({...prev, outputMode: savedOutputMode}));
    }

    // Cleanup function
    return () => {
      if (speechSynthesisRef.current && speechSynthesisRef.current.speaking) {
        speechSynthesisRef.current.cancel();
      }
      
      // Clean up media recorder if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [navigate]);

  // Add this function with other function declarations
  const submitFeedback = async () => {
    if (!rating || !activeConference) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/feedback`,
        {
          conference_id: activeConference,
          rating,
          reason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.status === 201) {
        alert('Feedback submitted successfully!');
        setRating('');
        setReason('');
        fetchFeedback();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  const fetchFeedback = async () => {
    if (!activeConference) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/get_feedback/${activeConference}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedbackList(response.data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

    useEffect(() => {
    if (showFeedback && activeConference) {
      fetchFeedback();
    }
  }, [showFeedback, activeConference]);

  // // Fetch user voice profile from server
  // const fetchVoiceProfile = async () => {
  //   const token = localStorage.getItem("token");
  //   if (!token) return;
    
  //   try {
  //     const response = await axios.get("import.meta.env.VITE_BACKEND_URL/get_user_voice_profile", {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
      
  //     if (response.status === 200) {
  //       setHasVoiceProfile(true);
  //       setVoiceProfileInfo(response.data);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching voice profile:", error);
  //   }
  // };

  // const fetchUserVoiceProfile = async () => {
  //   const token = localStorage.getItem("token");
  //   if (!token) return;
    
  //   try {
  //     const response = await axios.get("import.meta.env.VITE_BACKEND_URL/get_user_voice_profile", {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
      
  //     if (response.data && response.data.voiceProfile) {
  //       setUserVoiceProfile(response.data.voiceProfile);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching user voice profile:", error);
  //   }
  // };
  
  // Record user voice using MediaRecorder API
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
        
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecordingBlob(audioBlob);
        
        // Release microphone access
        stream.getTracks().forEach(track => track.stop());
      };
      
      setVoiceRecording(true);
      mediaRecorder.start();
    } catch (error) {
      console.error("Error starting voice recording:", error);
      alert("Could not access your microphone. Please check your permissions.");
    }
  };
  
  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setVoiceRecording(false);
    }
  };
  
  // Clone voice using ElevenLabs API
  const saveAndCloneVoice = async () => {
    if (!recordingBlob) {
      alert("Please record a voice sample first.");
      return;
    }
  
    setIsLoading(true);
  
    try {
      // Upload the voice to ElevenLabs and get the voice_id
      const voiceId = await uploadVoiceClone(recordingBlob);
      console.log("Cloned Voice ID:", voiceId);
  
      // Save the voice_id in localStorage
      localStorage.setItem('elevenLabsVoiceId', voiceId);
      alert("Voice cloned successfully!");
    } catch (error) {
      console.error("Error cloning voice:", error);
      alert("Failed to clone voice.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // // Save voice profile to server
  // const saveVoiceProfile = async () => {
  //   const token = localStorage.getItem("token");
  //   if (!token) return;
    
  //   const formData = new FormData();
  //   formData.append('voiceSample', recordingBlob, 'voice-sample.mp3');
  //   formData.append('name', 'My Voice Profile');
    
  //   setIsLoading(true);
    
  //   try {
  //     const response = await axios.post(
  //       "import.meta.env.VITE_BACKEND_URL/upload_voice_profile",
  //       formData,
  //       { 
  //         headers: { 
  //           Authorization: `Bearer ${token}`,
  //           'Content-Type': 'multipart/form-data'
  //         } 
  //       }
  //     );
      
  //     if (response.data && response.data.voiceProfileId) {
  //       setUserVoiceProfile(response.data.voiceProfileId);
  //       alert("Voice profile saved successfully!");
  //       setRecordingBlob(null); // Clear the recording after successful upload
  //       fetchVoiceProfile(); // Refresh voice profile info
  //       setHasVoiceProfile(true);
  //     }
  //   } catch (error) {
  //     console.error("Error saving voice profile:", error);
  //     alert("Failed to save voice profile. Please try again later.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  


  // Fetch chat history from server
  const fetchChatHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token || !activeConference) return;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/get_chat_history/${activeConference}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  // Delete message from chat history
  const handleDeleteMessage = async (messageId, event) => {
    // Prevent event bubbling
    if (event) {
      event.stopPropagation();
    }
    
    const token = localStorage.getItem("token");
    if (!token || !activeConference) {
      alert("You are not logged in or no active conference. Redirecting to login.");
      navigate("/login");
      return;
    }
  
    // Optimistic UI update - remove message immediately from UI
    setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    
    try {
      const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/delete_message`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { 
          message_id: messageId,
          conference_id: activeConference 
        },
      });
      
      console.log("Message deleted successfully:", response.data);
      
    } catch (error) {
      console.error("Error deleting message:", error);
      
      // If deletion failed, restore the message by refetching chat history
      fetchChatHistory();
      
      // Show error to user
      alert(error.response?.data?.error || "Failed to delete message. Please try again.");
    }
  };

  // Update user preferences
  const updatePreferences = (newValues) => {
    setPreferences(prev => ({...prev, ...newValues}));
    
    // Update outputMode state if that's changing
    if (newValues.outputMode) {
      setOutputMode(newValues.outputMode);
      localStorage.setItem("outputMode", newValues.outputMode);
      
      // Cancel any ongoing speech when switching to text mode
      if (newValues.outputMode === "text" && speechSynthesisRef.current && speechSynthesisRef.current.speaking) {
        speechSynthesisRef.current.cancel();
      }
    }
  };

  // Speak text using ElevenLabs API or browser's speech synthesis
  const speakText = async (text) => {
    if (preferences.outputMode === "voice") {
      if (preferences.useUserVoice) {
        // Use cloned voice from ElevenLabs
        try {
          await generateVoiceResponse(text);
        } catch (error) {
          console.error("Error generating voice response:", error);
          alert("Failed to generate voice response. Please try again.");
        }
      } else {
        // Use browser's speech synthesis
        if (speechSynthesisRef.current) {
          if (speechSynthesisRef.current.speaking) {
            speechSynthesisRef.current.cancel();
          }
          
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          
          speechSynthesisRef.current.speak(utterance);
        }
      }
    }
  };

  // Send message to chat
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !activeConference) return;
  
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in. Redirecting to login.");
      navigate("/login");
      return;
    }
  
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
  
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/gemini_chat`,
        { 
          message: input,
          outputMode: preferences.outputMode,
          useUserVoice: preferences.useUserVoice && !!userVoiceProfile,
          conference_id: activeConference
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const botResponse = response.data.response;

      // Store messages with conference ID
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/store_message`,
        { 
          message: input, 
          role: "user",
          conference_id: activeConference
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/store_message`,
        { 
          message: botResponse, 
          role: "bot",
          conference_id: activeConference
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const newBotMessage = { role: "bot", content: botResponse };
      setMessages((prev) => [...prev, newBotMessage]);

      if (preferences.outputMode === "voice") {
        await generateVoiceResponse(botResponse);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = "I encountered an issue. Please try again later.";
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: errorMessage },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle between text and voice output modes
  const toggleOutputMode = () => {
    const newMode = outputMode === "text" ? "voice" : "text";
    setOutputMode(newMode);
    setPreferences(prev => ({...prev, outputMode: newMode}));
    
    // Save preference to localStorage
    localStorage.setItem("outputMode", newMode);
    
    // Cancel any ongoing speech when switching to text mode
    if (newMode === "text" && speechSynthesisRef.current && speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel();
    }
  };

  const handleLogout = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are already logged out.");
      navigate("/login");
      return;
    }

    try {
     axios.post(`${import.meta.env.VITE_BACKEND_URL}/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");

      alert("Logged out successfully.");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Error logging out. Please try again.");
    }
  };

  const handleEmojiSelect = (emoji) => {
    setInput((prev) => prev + emoji.emoji);
    setShowEmojiPicker(false);  
  };

  const startRecording = () => recognition && recognition.start();
  const stopRecording = () => recognition && recognition.stop();

  // Add this useEffect with other useEffect hooks
  useEffect(() => {
    fetchFeedback();
  }, []);

  // Add conference management functions
  const fetchConferences = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/get_conferences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConferences(response.data);
      
      // Find and set the active conference
      const active = response.data.find(conf => conf.is_active);
      if (active) {
        setActiveConference(active._id);
        fetchConferenceMessages(active._id);
      }
    } catch (error) {
      console.error('Error fetching conferences:', error);
    }
  };

  const fetchConferenceMessages = async (conferenceId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/get_chat_history/${conferenceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };



  const createNewConference = async () => {
    if (!newTopic.trim()) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/create_conference`,
        { topic: newTopic },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNewTopic('');
      fetchConferences();
    } catch (error) {
      console.error('Error creating conference:', error);
    }
  };

  const switchConference = async (conferenceId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/switch_conference/${conferenceId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActiveConference(conferenceId);
      fetchConferenceMessages(conferenceId);
    } catch (error) {
      console.error('Error switching conference:', error);
    }
  };

  // Update useEffect to fetch conferences on mount
  useEffect(() => {
    fetchConferences();
  }, []);

  return (
    <div className="relative h-screen bg-gradient-to-b from-purple-100 via-white to-purple-100 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-full h-full -left-48 -top-48 bg-purple-200/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute w-full h-full -right-48 -bottom-48 bg-pink-200/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CiAgPHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPgogIDxwYXRoIGQgPSJNMzAgMzBtLTIwIDBhMjAgMjAgMCAxIDAgNDAgMCAyMCAyMCAwIDEgMC00MCAwIiBzdHJva2U9InJnYmEoMTQ3LCA1MSwgMjM0LCAwLjEpIiBmaWxsPSJub25lIi8+Cjwvc3ZnPg==')] opacity-30" />
      </div>

      {/* Feedback Toggle Button */}
      <button
        onClick={() => setShowFeedback(!showFeedback)}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-lg"
        title={showFeedback ? "Close Feedback" : "Open Feedback"}
      >
        {showFeedback ? <MessageCircle size={24} /> : <Smile size={24} />}
      </button>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <Draggable
            handle=".drag-handle"
            bounds="body"
            defaultPosition={{ x: 0, y: 0 }}
            nodeRef={dragRef}
          >
            <motion.div
              ref={dragRef}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-16 right-4 z-50 w-80 bg-white rounded-lg shadow-xl border border-purple-100"
            >
              {/* Drag Handle */}
              <div className="drag-handle cursor-move p-2 border-b border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical size={16} className="text-purple-400" />
                  <h2 className="text-lg font-bold text-purple-900">Give Feedback</h2>
                </div>
                <button
                  onClick={() => setShowFeedback(false)}
                  className="text-purple-500 hover:text-purple-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4">
                <div className="flex space-x-3 mb-3">
                  <button
                    onClick={() => setRating("👍")}
                    className={`p-2 rounded transition-colors ${
                      rating === "👍" ? "bg-green-500 text-white" : "bg-purple-50 hover:bg-purple-100"
                    }`}
                  >
                    👍
                  </button>
                  <button
                    onClick={() => setRating("👎")}
                    className={`p-2 rounded transition-colors ${
                      rating === "👎" ? "bg-red-500 text-white" : "bg-purple-50 hover:bg-purple-100"
                    }`}
                  >
                    👎
                  </button>
                </div>
                <textarea
                  placeholder="Optional feedback..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 border border-purple-100 rounded focus:outline-none focus:ring-2 focus:ring-purple-200 mb-3"
                ></textarea>

                <button
                  onClick={submitFeedback}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Submit Feedback
                </button>

                <div className="mt-4 max-h-48 overflow-y-auto">
                  <h3 className="text-sm font-bold text-purple-900 mb-2">Recent Feedback</h3>
                  <div className="space-y-2">
                    {feedbackList.slice(0, 3).map((feedback, index) => (
                      <div key={index} className="p-2 border border-purple-100 rounded bg-purple-50">
                        <div className="flex items-center gap-2">
                          <span>{feedback.rating}</span>
                          <span className="text-sm text-purple-600">
                            {feedback.reason || "No reason provided"}
                          </span>
                        </div>
                        <div className="text-xs text-purple-500 mt-1">
                          {new Date(feedback.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </Draggable>
        )}
      </AnimatePresence>

      <div className="relative flex h-full overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white/80 backdrop-blur-xl border-r border-purple-100 flex flex-col overflow-hidden">
          {/* Logo and Toggle Button */}
          <div className="p-6 border-b border-purple-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 cursor-pointer">
                <Brain className="w-8 h-8 text-purple-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Soul Sync
                </h1>
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('conference')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'conference'
                      ? 'bg-purple-100 text-purple-600'
                      : 'text-purple-400 hover:bg-purple-50'
                  }`}
                  title="Conference Management"
                >
                  <MessageCircle size={20} />
                </button>
                <button
                  onClick={() => setViewMode('voice')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'voice'
                      ? 'bg-purple-100 text-purple-600'
                      : 'text-purple-400 hover:bg-purple-50'
                  }`}
                  title="Voice Settings"
                >
                  <Volume2 size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {viewMode === 'conference' ? (
                <motion.div
                  key="conference"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <div className="p-4 border-b border-purple-100">
                    <h2 className="text-lg font-semibold text-purple-900">Conversations</h2>
                    <div className="mt-3 flex">
                      <input
                        type="text"
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        placeholder="New topic..."
                        className="flex-1 p-2 border border-purple-200 rounded-l focus:outline-none focus:ring-1 focus:ring-purple-300"
                      />
                      <button
                        onClick={createNewConference}
                        className="bg-purple-600 text-white p-2 rounded-r hover:bg-purple-700 transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                    {conferences.map((conference) => (
                      <div
                        key={conference._id}
                        onClick={() => switchConference(conference._id)}
                        className={`p-3 border-b border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors flex justify-between items-center ${
                          activeConference === conference._id ? 'bg-purple-100' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MessageCircle size={16} className="text-purple-500" />
                          <div>
                            <p className="font-medium text-purple-900 truncate">{conference.topic}</p>
                            <p className="text-xs text-purple-500">
                              {new Date(conference.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                          {conference.message_count}
                        </span>
                      </div>
                    ))}
                    
                    {conferences.length === 0 && (
                      <div className="p-4 text-center text-purple-400">
                        No conversations yet
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="voice"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full p-6 overflow-y-auto"
                >
                  <h2 className="text-lg font-semibold text-purple-900 mb-4">Voice Settings</h2>
                  
                  {/* Voice Output Toggle */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-purple-700 mb-2">Output Mode</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updatePreferences({ outputMode: "text" })}
                        className={`flex-1 p-2 rounded-lg transition-all border ${
                          preferences.outputMode === "text"
                            ? "bg-purple-100 text-purple-700 border-purple-200"
                            : "bg-white text-purple-500 border-purple-100"
                        }`}
                      >
                        <span className="flex items-center justify-center">
                          <MessageCircle size={16} className="mr-1" />
                          Text
                        </span>
                      </button>
                      <button
                        onClick={() => updatePreferences({ outputMode: "voice" })}
                        className={`flex-1 p-2 rounded-lg transition-all border ${
                          preferences.outputMode === "voice"
                            ? "bg-purple-100 text-purple-700 border-purple-200"
                            : "bg-white text-purple-500 border-purple-100"
                        }`}
                      >
                        <span className="flex items-center justify-center">
                          <Volume2 size={16} className="mr-1" />
                          Voice
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Voice Profile Recording */}
                  {preferences.outputMode === "voice" && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-purple-700 mb-2">Voice Selection</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updatePreferences({ useUserVoice: false })}
                            className={`flex-1 p-2 rounded-lg transition-all border ${
                              !preferences.useUserVoice
                                ? "bg-purple-100 text-purple-700 border-purple-200"
                                : "bg-white text-purple-500 border-purple-100"
                            }`}
                          >
                            <span className="flex items-center justify-center">
                              <UserRound size={16} className="mr-1" />
                              Default Voice
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              const voiceId = localStorage.getItem('elevenLabsVoiceId');
                              if (!voiceId) {
                                alert("Please record and save your voice profile first!");
                                return;
                              }
                              updatePreferences({ useUserVoice: true });
                            }}
                            className={`flex-1 p-2 rounded-lg transition-all border ${
                              preferences.useUserVoice
                                ? "bg-purple-100 text-purple-700 border-purple-200"
                                : "bg-white text-purple-500 border-purple-100"
                            }`}
                          >
                            <span className="flex items-center justify-center">
                              <Mic size={16} className="mr-1" />
                              My Voice
                            </span>
                          </button>
                        </div>
                        {preferences.useUserVoice && !localStorage.getItem('elevenLabsVoiceId') && (
                          <p className="text-xs text-orange-500 mt-1">
                            Please record and save your voice profile first
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Voice Profile Recording */}
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-purple-700 mb-2">
                        {hasVoiceProfile ? "Update Voice Profile" : "Create Voice Profile"}
                      </h3>
                      
                      {hasVoiceProfile && voiceProfileInfo && (
                        <div className="mb-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <p className="text-sm text-purple-700">
                            <span className="font-medium">Current voice:</span> {voiceProfileInfo?.name || "My Voice"}
                          </p>
                          {voiceProfileInfo?.createdAt && (
                            <p className="text-xs text-purple-500 mt-1">
                              Created {new Date(voiceProfileInfo.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onMouseDown={startVoiceRecording}
                          onMouseUp={stopVoiceRecording}
                          onTouchStart={startVoiceRecording}
                          onTouchEnd={stopVoiceRecording}
                          className={`flex-1 p-3 rounded-lg transition-all border ${
                            voiceRecording
                              ? "bg-red-100 text-red-600 border-red-200"
                              : "bg-purple-50 text-purple-600 border-purple-100"
                          }`}
                        >
                          {voiceRecording ? (
                            <span className="flex items-center justify-center">
                              <MicOff size={18} className="mr-2" />
                              Release to Stop
                            </span>
                          ) : (
                            <span className="flex items-center justify-center">
                              <Mic size={18} className="mr-2" />
                              Hold to Record
                            </span>
                          )}
                        </button>
                      </div>
                    
                    {recordingBlob && (
                      <div className="mt-2">
                        <audio 
                          src={URL.createObjectURL(recordingBlob)} 
                          controls 
                          className="w-full h-8 mt-2"
                        />
                        <button
                          onClick={saveAndCloneVoice}
                          disabled={isLoading}
                          className="w-full mt-2 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-all"
                        >
                          {isLoading ? (
                            <span className="flex items-center justify-center">
                              <Loader size={16} className="mr-2 animate-spin" />
                              Saving...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center">
                              <Save size={16} className="mr-2" />
                              Save Voice Profile
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

             <div className="p-6 border-t border-purple-100 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 bg-red-50 hover:bg-red-100
               text-red-600 p-3 rounded-lg transition-all border border-red-200"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-full p-4 rounded-2xl backdrop-blur-lg ${
                      msg.role === "user"
                        ? "bg-purple-500 text-white"
                        : "bg-white text-purple-900 border border-purple-100"
                    }`}>
                      {msg.content}
                      {msg.role === "bot" && preferences.outputMode === "voice" && (
                        <button
                          onClick={() => speakText(msg.content)}
                          className="ml-2 p-1 text-purple-500 hover:text-purple-700 rounded-full hover:bg-purple-50"
                          aria-label="Speak message"
                        >
                          <Volume2 size={14} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-full p-4 rounded-2xl backdrop-blur-lg bg-white text-purple-900 border border-purple-100">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

       

          {/* Input Area */}
          <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-purple-100">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 rounded-full hover:bg-purple-50 transition-all text-purple-600"
                >
                  <Smile size={20} />
                </button>
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute bottom-12 left-0 z-50"
                    >
                      <EmojiPicker onEmojiClick={handleEmojiSelect} theme="light" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 bg-purple-50 text-purple-900 border border-purple-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-200 placeholder-purple-400"
                disabled={isLoading}
              />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={isLoading}
                className={`p-3 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-600 transition-all ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Send size={20}/>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                disabled={isLoading}
                className={`p-3 rounded-full transition-all ${
                  recording
                    ? "bg-red-100 hover:bg-red-200 text-red-600"
                    : "bg-purple-50 hover:bg-purple-100 text-purple-600"
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {recording ? <MicOff size={20} /> : <Mic size={20} />}
              </motion.button>

              {/* Voice Output Toggle Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleOutputMode}
                className={`p-3 rounded-full transition-all ${
                  outputMode === "voice"
                    ? "bg-purple-200 text-purple-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {outputMode === "voice" ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default ChatPage;
