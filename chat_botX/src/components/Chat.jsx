import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { motion, AnimatePresence } from "framer-motion";
import { FaMicrophone, FaMicrophoneSlash, FaPaperPlane, FaSmile, FaSignOutAlt } from "react-icons/fa";

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
    <div className="flex h-screen bg-gradient-to-r from-purple-100 to-indigo-200 p-4">
      {/* Chat History */}
      <div className="w-1/4 bg-white/50 p-4 shadow-lg rounded-xl backdrop-blur-md overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-purple-900">Chat History</h2>
        <ul>
          {messages.map((msg, index) => (
            <motion.li key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }} className="p-2 border-b cursor-pointer hover:bg-purple-100 rounded-lg">
              {msg.content.substring(0, 20)}...
            </motion.li>
          ))}
        </ul>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-600 transition-all w-full"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>

      {/* Chat Window */}
      <div className="w-3/4 flex flex-col bg-white shadow-lg rounded-lg p-6 ml-4">
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className={`p-3 my-1 rounded-lg ${msg.role === "user" ? "bg-purple-300 text-right ml-20" : "bg-gray-200 text-left mr-20"}`}>
                {msg.content}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input Box */}
        <div className="flex mt-2 border-t p-3 items-center space-x-3 relative bg-white rounded-lg shadow-md">
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-xl p-2 hover:bg-purple-200 rounded-full transition-all">
            <FaSmile />
          </button>
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute bottom-12 left-10 z-10">
                <EmojiPicker onEmojiClick={handleEmojiSelect} />
              </motion.div>
            )}
          </AnimatePresence>

          <input type="text" className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSendMessage} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
            <FaPaperPlane />
          </motion.button>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onMouseDown={startRecording} onMouseUp={stopRecording} className={`p-3 rounded-full ${recording ? "bg-red-600" : "bg-gray-400"} text-white hover:bg-red-700 transition-all`}>
            {recording ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
