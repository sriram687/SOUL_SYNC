import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Slider from "react-slick";
import { Brain, LogOut, HelpCircle, User ,UserCheck} from "lucide-react";
import { FaUserCircle } from "react-icons/fa";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import calm from "../images/calm.jpg"; 

const HomePage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleStartChat = () => {
    const isLoggedIn = false;
    if (isLoggedIn) {
      navigate("/chat");
    } else {
      navigate("/register");
    }
  };

  const handleLogout = () => {
    console.log("User logged out");
  };

  const quoteSlides = [
    "You are not alone in your journey.",
    "Take it one day at a time. Healing is a process.",
    "Your feelings are valid. You deserve care and support."
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={isLoaded ? { opacity: 1, y: 0 } : {}}
      exit={{ opacity: 0, y: 50 }}
      className="h-screen w-screen bg-cover bg-center flex flex-col items-center justify-center text-white"
      style={{ backgroundImage: `url(${calm})`, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(80%) " }}
    >
      <header className="absolute top-0 w-full flex justify-between items-center p-5 bg-purple-600 bg-opacity-50 backdrop-blur-md ">
        <div className="flex items-center gap-3">
          <Brain className="w-10 h-10 text-white" />
          <h2 className="text-2xl font-bold">MindCare</h2>
        </div>
        <nav className="flex gap-6 text-lg">
          <a href="/about" className="hover:text-purple-300">About</a>
          <a href="/doctor" className="hover:text-purple-300">Doctor</a>
          <a href="/tech" className="hover:text-purple-300">Tech</a>
        </nav>
        <div className="relative">
          <FaUserCircle 
            className="w-15 h-10 cursor-pointer hover:text-purple-300"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          />
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-lg shadow-lg overflow-hidden">
              <button className="flex items-center w-full px-4 py-2 hover:bg-gray-200" onClick={() => console.log("Profile Clicked")}> 
                <User className="mr-2 w-5 h-5" /> Username
              </button>
              <button className="flex items-center w-full px-4 py-2 hover:bg-gray-200" onClick={() => console.log("Get Help Clicked")}> 
                <HelpCircle className="mr-2 w-5 h-5" /> Get Help
              </button>
              <button className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-gray-200" onClick={handleLogout}> 
                <LogOut className="mr-2 w-5 h-5" /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <h1 className="text-4xl font-bold mb-6 text-center drop-shadow-lg mt-20">
        Your Safe Space for Mental Health Support
      </h1>

      <Slider
        dots={true}
        infinite={true}
        autoplay={true}
        autoplaySpeed={3000}
        className="mb-6 w-11/12 mt-9 max-w-lg drop-shadow-lg"
      >
        {quoteSlides.map((quote, index) => (
          <div
            key={index}
            className="p-4 border-2 border-purple-500 rounded-lg bg-purple-500 hover:bg-purple-600 bg-opacity-20 backdrop-blur-md"
          >
            <p className="text-lg text-white text-center font-semibold drop-shadow-md">
              {quote}
            </p>
          </div>
        ))}
      </Slider>

      <div className="flex gap-6 mt-10">
        <button
          onClick={() => handleStartChat("/women-chat")}
          className="flex items-center justify-center bg-purple-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-purple-800 transition drop-shadow-lg"
        >
          <User className="mr-2 w-6 h-6" />
          Women Chatbot
        </button>

        <button
          onClick={() => handleStartChat("/therapist-chat")}
          className="flex items-center justify-center bg-purple-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-purple-800 transition drop-shadow-lg"
        >
          <UserCheck className="mr-2 w-6 h-6" />
          Therapist Chat
        </button>
      </div>

      <footer className="text-center mt-11">
        <p className="text-sm drop-shadow-lg">
          Need more help?{" "}
          <a href="/resources" className="underline text-purple-600">
            Visit our resources
          </a>
        </p>
      </footer>
    </motion.div>
  );
};

export default HomePage;
