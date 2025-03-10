import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, LogOut, Smile, Brain, Trash2, Volume2, VolumeX } from 'lucide-react';
import { Link } from "react-router-dom";

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

  useEffect(() => {     
    const token = localStorage.getItem("token");
    console.log("JWT Token:", token); 
  
    if (!token) {
      alert("You are not logged in. Redirecting to login.");
      navigate("/login");
      return;
    }
  
    fetchChatHistory();
  
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
    }

    // Cleanup function
    return () => {
      if (speechSynthesisRef.current && speechSynthesisRef.current.speaking) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, [navigate]);
  
  const fetchChatHistory = async () => {
    const token = localStorage.getItem("token");
    
    console.log("fetch: ", token); // Print token in the terminal

    if (!token) {
      console.error("Token is missing from localStorage!");
      return;
    }

    try {
      const response = await axios.get("http://localhost:5000/get_chat_history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  const handleDeleteMessage = async (messageId, event) => {
    // Prevent event bubbling
    if (event) {
      event.stopPropagation();
    }
    
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in. Redirecting to login.");
      navigate("/login");
      return;
    }
  
    // Optimistic UI update - remove message immediately from UI
    setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    
    try {
      const response = await axios.delete("http://localhost:5000/delete_message", {
        headers: { Authorization: `Bearer ${token}` },
        data: { message_id: messageId },
      });
      
      console.log("Message deleted successfully:", response.data);
      
      // If the deletion was successful on the server, we've already updated the UI
    } catch (error) {
      console.error("Error deleting message:", error);
      
      // If deletion failed, restore the message by refetching chat history
      fetchChatHistory();
      
      // Show error to user
      alert(error.response?.data?.error || "Failed to delete message. Please try again.");
    }
  };

  const speakText = (text) => {
    // Check if speech synthesis is available and in voice mode
    if (speechSynthesisRef.current && outputMode === "voice") {
      // Cancel any ongoing speech
      if (speechSynthesisRef.current.speaking) {
        speechSynthesisRef.current.cancel();
      }
      
      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Optional: Set voice properties
      utterance.rate = 1.0; // Speed
      utterance.pitch = 1.0; // Pitch
      utterance.volume = 1.0; // Volume
      
      // Speak the text
      speechSynthesisRef.current.speak(utterance);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
  
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
      console.log("send: ", token);
      const response = await axios.post(
        "http://localhost:5000/gemini_chat",
        { 
          message: input,
          outputMode: outputMode // Send the current output mode to the backend
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const botResponse = response.data.response;

      await axios.post(
        "http://localhost:5000/store_message",
        { message: input, role: "user" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      await axios.post(
        "http://localhost:5000/store_message",
        { message: botResponse, role: "bot" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const newBotMessage = { role: "bot", content: botResponse };
      setMessages((prev) => [...prev, newBotMessage]);
      
      // If in voice mode, speak the response
      speakText(botResponse);
      
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = "I encountered an issue. Please try again later.";
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: errorMessage
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOutputMode = () => {
    // Toggle between text and voice mode
    const newMode = outputMode === "text" ? "voice" : "text";
    setOutputMode(newMode);
    
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
     axios.post("http://localhost:5000/logout", {}, {
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

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-purple-100 via-white to-purple-100 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-full h-full -left-48 -top-48 bg-purple-200/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute w-full h-full -right-48 -bottom-48 bg-pink-200/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CiAgPHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPgogIDxwYXRoIGQgPSJNMzAgMzBtLTIwIDBhMjAgMjAgMCAxIDAgNDAgMCAyMCAyMCAwIDEgMC00MCAwIiBzdHJva2U9InJnYmEoMTQ3LCA1MSwgMjM0LCAwLjEpIiBmaWxsPSJub25lIi8+Cjwvc3ZnPg==')] opacity-30" />
      </div>

      <div className="relative flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-white/80 backdrop-blur-xl border-r border-purple-100">
          {/* Logo */}
          <div className="p-6 border-b border-purple-100">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center gap-2 cursor-pointer">
                <Brain className="w-8 h-8 text-purple-600" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Soul Sync
                </h1>
              </Link>
            </div>
          </div>

          {/* Chat History */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-purple-900 mb-4">Chat History</h2>
            <div className="space-y-3">
              {messages.map((msg, index) => (
                <motion.div
                  key={msg._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-all border border-purple-100"
                >
                  <div className="flex justify-between items-center">
                    <p className="text-purple-700 text-sm truncate w-5/6">
                      {msg.content?.substring(0, 30)}...
                    </p>
                    {msg._id && (
                      <button
                        onClick={(e) => handleDeleteMessage(msg._id, e)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-all"
                        aria-label="Delete message"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              {messages.length === 0 && (
                <div className="text-center p-4 text-purple-400">
                  No messages yet
                </div>
              )}
            </div>
          </div>

          {/* Output Mode Toggle */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-purple-900 mb-4">Output Settings</h2>
            <button
              onClick={toggleOutputMode}
              className={`w-full flex items-center justify-center space-x-2 p-3 rounded-lg transition-all border ${
                outputMode === "voice" 
                  ? "bg-purple-200 text-purple-700 border-purple-300" 
                  : "bg-gray-100 text-gray-700 border-gray-200"
              }`}
            >
              {outputMode === "voice" ? (
                <>
                  <Volume2 size={18} />
                  <span>Voice Output Mode</span>
                </>
              ) : (
                <>
                  <VolumeX size={18} />
                  <span>Text Output Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Logout Button */}
          <div className="absolute bottom-0 left-0 w-80 p-6">
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
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                  <div
                    className={`max-w-full p-4 rounded-2xl backdrop-blur-lg ${
                      msg.role === "user"
                        ? "bg-purple-500 text-white"
                        : "bg-white text-purple-900 border border-purple-100"
                    }`}
                  >
                    {msg.content}
                    {msg.role === "bot" && outputMode === "voice" && (
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
            </AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white text-purple-900 border border-purple-100 p-4 rounded-2xl">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </motion.div>
            )}
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