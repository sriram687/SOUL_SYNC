import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Lock, Mail } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/login`, {
        email,
        password,
      });
      localStorage.setItem("token", response.data.access_token);
      navigate("/chat");
    } catch (err) {
      console.error("Login failed", err);
      alert("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-purple-600 via-pink-500 to-red-500">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center mb-8 space-x-2"
      >
        <Brain className="w-10 h-10 text-white" />
        <h1 className="text-4xl font-bold text-white">MindCare</h1>
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-96 border border-white/20"
      >
        <h2 className="text-3xl font-semibold mb-6 text-white text-center">Welcome Back</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-white/60 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-10 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/25 transition-all duration-300"
                placeholder="Enter your email"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-white/60 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-10 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/25 transition-all duration-300"
                placeholder="Enter your password"
              />
            </div>
          </motion.div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-white text-purple-600 py-3 rounded-lg font-semibold hover:bg-white/90 transition-all duration-300"
          >
            Sign In
          </motion.button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-8 text-white/80 text-center"
      >
        <p>Need help? Contact support@mindcare.com</p>
      </motion.div>
    </div>
  );
};

export default LoginPage;