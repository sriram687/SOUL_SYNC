import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ChatPage = () => {
  const [messages, setMessages] = useState([
    { role: "bot", content: "Hello! How can I assist you today?" },
  ]);
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  
  const navigate = useNavigate();
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in. Redirecting to login.");
      navigate("/login");
    }
  }, [navigate]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        { contents: [{ parts: [{ text: input }] }] },
        { headers: { "Content-Type": "application/json" } }
      );
      const botMessage = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I didn't understand.";
      setMessages((prev) => [...prev, { role: "bot", content: botMessage }]);
      setChatHistory((prev) => [...prev, { id: prev.length + 1, preview: input }]);
    } catch (error) {
      console.error("Error fetching response:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/4 bg-purple-700 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Chat History</h2>
        <ul>
          {chatHistory.map((chat) => (
            <li key={chat.id} className="p-2 bg-purple-500 rounded my-2 cursor-pointer">
              {chat.preview}
            </li>
          ))}
        </ul>
      </div>
      
      {/* Chat Area */}
      <div className="w-3/4 flex flex-col justify-between p-6 bg-white shadow-lg rounded-lg">
        <div className="h-96 overflow-y-auto">
          {messages.map((msg, index) => (
            <div key={index} className={`p-3 my-2 rounded-lg ${msg.role === "user" ? "bg-purple-300 text-right" : "bg-gray-200 text-left"}`}>
              {msg.content}
            </div>
          ))}
        </div>
        
        <div className="flex mt-4">
          <input
            type="text"
            className="w-full border rounded-l-lg p-2 focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
          />
          <button onClick={handleSendMessage} className="bg-purple-600 text-white px-4 rounded-r-lg">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
