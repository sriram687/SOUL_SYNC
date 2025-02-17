import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { MessageCircle } from "lucide-react";
import calm from "../images/calm.jpg"; // Update path to match your structure

const HomePage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Ensures animation happens only after the component is fully loaded
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
      style={{
        backgroundImage: `url(${calm})`
      }}
    >
      <h1 className="text-4xl font-bold mb-6 text-center drop-shadow-lg">
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
            <p className="text-lg text-white-600 text-center font-semibold drop-shadow-md">
              {quote}
            </p>
          </div>
        ))}
      </Slider>

      <button
        onClick={handleStartChat}
        className="flex items-center justify-center mt-10 bg-purple-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-purple-800 transition drop-shadow-lg"
      >
        <MessageCircle className="mr-2 w-6 h-6" />
        Start Chat
      </button>

      <footer className="text-center mt-12">
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
