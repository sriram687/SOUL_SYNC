import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, LogOut, HelpCircle, User } from "lucide-react";
import { FaUserCircle } from "react-icons/fa";
import woman from "../images/woman.jpeg";
import therapist from "../images/therapist.jpg";

const quotes = [
  "Your Safe Space for Mental Health Support",
  "Healing Starts with a Conversation",
  "You're Not Alone. We're Here to Help",
  "Every Journey Begins with a Single Step",
  "Small progress is still progress. Keep moving forward.",
  "Your feelings are valid. Your struggles are real. Your future is bright.",
  "You are not alone. You are loved. You are enough.",
  "It's okay to not be okay, but it's not okay to stay that way.",
  "Every storm runs out of rain. Keep going.",
];

const HomePage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    const quoteInterval = setInterval(() => {
      setQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 4000);
    return () => clearInterval(quoteInterval);
  }, []);

  const handleStartChat = (route) => {
    const isLoggedIn = false;
    navigate(isLoggedIn ? route : "/register");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={isLoaded ? { opacity: 1, y: 0 } : {}}
      exit={{ opacity: 0, y: 50 }}
      className="h-screen w-screen flex flex-col items-center text-white bg-black"
    >
      {/* Header */}
      <header className="absolute top-0 w-full flex justify-between items-center p-5 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-opacity-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Brain className="w-10 h-10 text-white" />
          <h2 className="text-2xl font-bold">MindCare</h2>
        </div>
        <nav className="flex ml-auto gap-7 text-lg">
          <a href="/about" className="hover:text-purple-300">About</a>
          <a href="/doctor" className="hover:text-purple-300">Doctor near me</a>
          <a href="/tech" className="hover:text-purple-300">Tech</a>
        </nav>
        <div className="relative">
          <FaUserCircle
            className="w-15 h-10 cursor-pointer hover:text-purple-300"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          />
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-lg shadow-lg overflow-hidden">
              <button
                className="flex items-center w-full px-4 py-2 hover:bg-gray-200"
                onClick={() => console.log("Profile Clicked")}
              >
                <User className="mr-2 w-5 h-5" /> Username
              </button>
              <button
                className="flex items-center w-full px-4 py-2 hover:bg-gray-200"
                onClick={() => console.log("Get Help Clicked")}
              >
                <HelpCircle className="mr-2 w-5 h-5" /> Get Help
              </button>
              <button
                className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-gray-200"
                onClick={() => console.log("Logout Clicked")}
              >
                <LogOut className="mr-2 w-5 h-5" /> Logout
              </button>
            </div>
          )}
        </div>
      </header>



      {/* Quote Section - Moved Up */}
      <div className="mt-28 h-16 flex items-center justify-center w-11/12 text-center">
        <AnimatePresence mode="wait">
          <motion.h1 
            key={quoteIndex}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold leading-normal bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text drop-shadow-lg"
          >
            {quotes[quoteIndex]}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* Chatbot Sections - Increased Size & More Description */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-10 mt-40 w-11/12 max-w-5xl">
        {/* Women Chatbot Section */}
        <div className="flex flex-col items-center bg-white shadow-lg rounded-lg w-96 h-80 p-6 transition-transform transform hover:scale-105 hover:shadow-2xl">
          <img
            src={woman}
            alt="Women Chatbot"
            className="w-28 h-28 object-cover rounded-full mb-4"
          />
          <h3 className="text-2xl font-bold text-gray-800">Women Chatbot</h3>
          <p className="text-gray-600 text-sm text-center mt-3 px-4">
            A confidential AI companion offering **emotional support, guidance, and a safe space for women** to share their feelings and seek advice. Available 24/7 for assistance.
          </p>
          <button
            onClick={() => handleStartChat("/women-chat")}
            className="mt-5 inline-flex items-center justify-center px-6 py-3 text-lg font-medium text-white bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800"
          >
            Start Chat
          </button>
        </div>

        {/* Therapist Chatbot Section */}
        <div className="flex flex-col items-center bg-white shadow-lg rounded-lg w-96 h-80 p-6 transition-transform transform hover:scale-105 hover:shadow-2xl">
          <img
            src={therapist}
            alt="Therapist Chatbot"
            className="w-28 h-28 object-cover rounded-full mb-4"
          />
          <h3 className="text-2xl font-bold text-gray-800">Therapist Chatbot</h3>
          <p className="text-gray-600 text-sm text-center mt-3 px-4">
            An AI-powered **virtual therapist** providing professional guidance, **coping strategies, and personalized mental wellness support.** Connect instantly for a supportive conversation.
          </p>
          <button
            onClick={() => handleStartChat("/therapist-chat")}
            className="mt-5 inline-flex items-center justify-center px-6 py-3 text-lg font-medium text-white bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800"
          >
            Start Chat
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default HomePage;
