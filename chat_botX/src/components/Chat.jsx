import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, LogOut, Smile } from 'lucide-react';

const ChatPage = () => {
  const [messages, setMessages] = useState([
    { role: "bot", content: "Hello! How can I assist you today?" },
  ]);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const navigate = useNavigate();
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in. Redirecting to login.");
      navigate("/login");
    }

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

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
    
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          contents: [{ role: "user", parts: [{ text: input }] }],
        },
        { headers: { "Content-Type": "application/json" } }
      );
      
      const botMessage = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I didn't understand.";
      setMessages((prev) => [...prev, { role: "bot", content: botMessage }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", content: "Error fetching response. Please try again." }]);
    }
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      alert("You are already logged out.");
      navigate("/login");
      return;
    }

    try {
      await axios.post("http://localhost:5000/logout", {}, {
        headers: { Authorization: `Bearer ${refreshToken}` },
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
    <div className="flex h-screen bg-gradient-to-b from-black to-purple-900">
      {/* Chat History Sidebar */}
      <div className="w-1/4 bg-black/30 backdrop-blur-lg border-r border-purple-500/20">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-white/90 tracking-tight">Chat History</h2>
          <div className="space-y-3">
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-all border border-purple-500/20"
              >
                <p className="text-white/70 text-sm truncate">
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
            className="w-full flex items-center justify-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 p-3 rounded-lg transition-all border border-red-500/30"
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
                  className={`max-w-[70%] p-4 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-purple-500/30 text-white border border-purple-500/30"
                      : "bg-white/5 text-white/90 border border-white/10"
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-black/30 backdrop-blur-lg border-t border-purple-500/20">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 rounded-full hover:bg-white/5 transition-all text-white/70"
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
                    <EmojiPicker onEmojiClick={handleEmojiSelect} theme="dark" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 bg-white/5 text-white border border-purple-500/20 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-white/30"
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              className="p-3 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-all border border-purple-500/30"
            >
              <Send size={20} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              className={`p-3 rounded-full transition-all border ${
                recording
                  ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30"
                  : "bg-white/5 hover:bg-white/10 text-white/70 border-white/10"
              }`}
            >
              {recording ? <MicOff size={20} /> : <Mic size={20} />}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;