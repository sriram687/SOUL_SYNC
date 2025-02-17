import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://127.0.0.1:5000/login", {
        email,
        password,
      });

      // Store the token in localStorage
      localStorage.setItem("token", response.data.access_token);

      // Navigate to Chat Page after successful login
      navigate("/chat");
    } catch (err) {
      console.error("Login failed", err);
      alert("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <h2 className="text-3xl font-semibold mb-4">Login</h2>
      <form className="bg-white p-6 rounded shadow-md w-80" onSubmit={handleLogin}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700">
            Email:
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter your email"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700">
            Password:
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter your password"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-800"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
