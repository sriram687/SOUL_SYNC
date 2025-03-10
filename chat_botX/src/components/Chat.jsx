import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, LogOut, Smile, Brain } from 'lucide-react';
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
  const navigate = useNavigate();
  

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("JWT Token:", token); // Print token in the terminal
  
    if (!token) {
      alert("You are not logged in. Redirecting to login.");
      navigate("/login");
      return;
    }
  
    fetchChatHistory();
  
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
  }, [navigate]);
  

const fetchChatHistory = async () => {
  const token = localStorage.getItem("token");
  
  console.log("JWT Token Retrieved:", token); // Debugging

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
      const response = await axios.post(
        "http://localhost:5000/send_message",
        { message: input },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      await axios.post(
        "http://localhost:5000/store_message",
        { message: input, role: "user" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const botResponse = response.data.response;
  
      await axios.post(
        "http://localhost:5000/store_message",
        { message: botResponse, role: "bot" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setMessages((prev) => [...prev, { role: "bot", content: botResponse }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "I apologize, but I'm having trouble processing your request right now. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
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
        <div className="absolute w-[500px] h-[500px] -left-48 -top-48 bg-purple-200/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute w-[500px] h-[500px] -right-48 -bottom-48 bg-pink-200/40 rounded-full blur-3xl animate-pulse" />
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
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-3 rounded-lg bg-purple-50 hover:bg-purple-100 cursor-pointer transition-all border border-purple-100"
                >
                  <p className="text-purple-700 text-sm truncate">
                    {msg.content.substring(0, 30)}...
                  </p>
                </motion.div>
              ))}
            </div>
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
                    className={`max-w-[70%] p-4 rounded-2xl backdrop-blur-lg ${
                      msg.role === "user"
                        ? "bg-purple-500 text-white"
                        : "bg-white text-purple-900 border border-purple-100"
                    }`}
                  >
                    {msg.content}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;