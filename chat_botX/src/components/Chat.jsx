import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ChatBubbleLeftIcon, XMarkIcon } from "@heroicons/react/24/solid";

const ChatPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", content: "Hello! How can I assist you today?" },
  ]);
  
  
  const [input, setInput] = useState("");

  const navigate = useNavigate();
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("You are not logged in. Redirecting to login.");
      navigate("/login");
    } else {
      axios
        .get("http://127.0.0.1:5000/protected", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(() => {
          alert("Invalid token. Redirecting to login.");
          navigate("/login");
        });
    }
  }, [navigate]);

  // Function to handle user input
  const handleSendMessage = async () => {
    if (!input.trim()) return;
  
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
  
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: input }] }]
        }
        , // 🛠 Fix: No "role" field
        {
          headers: { "Content-Type": "application/json" }, // ✅ Ensure proper headers
        }
      );
  
      const botMessage = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I didn't understand.";
  
      setMessages((prev) => [...prev, { role: "bot", content: botMessage }]);
    } catch (error) {
      console.error("Error fetching response:", error);
      setMessages((prev) => [...prev, { role: "bot", content: "Error fetching response. Please try again." }]);
    }
  };
  

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end">
      {/* Chatbot Box */}
      {isOpen && (
        <div className="bg-white shadow-lg rounded-2xl w-80 p-4 mb-4 transition-transform transform scale-100">
          <div className="flex justify-between items-center pb-2 border-b">
            <h2 className="text-lg font-semibold">Chatbot</h2>
            <button onClick={() => setIsOpen(false)}>
              <XMarkIcon className="w-6 h-6 text-gray-600 hover:text-red-500" />
            </button>
          </div>

          <div className="h-60 overflow-y-auto p-2 text-gray-600">
            {messages.map((msg, index) => (
              <div key={index} className={`p-2 my-1 rounded-lg ${msg.role === "user" ? "bg-purple-200 text-right" : "bg-gray-100 text-left"}`}>
                {msg.content}
              </div>
            ))}
          </div>

          <div className="flex mt-2">
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
      )}

      {/* Floating Toggle Button */}
      <button onClick={() => setIsOpen(!isOpen)} className="p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all">
        <ChatBubbleLeftIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default ChatPage;
