import React, { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ChatPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("You are not logged in. Redirecting to login.");
      navigate("/login");
    } else {
      // Optionally, verify the token with the backend
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

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <h2 className="text-4xl font-semibold text-purple-700">
        Welcome to the Chat Page!
      </h2>
    </div>
  );
};

export default ChatPage;
