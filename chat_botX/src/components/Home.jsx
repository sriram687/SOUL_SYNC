import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, User, Shield, Clock, Heart, 
  MessageCircle, Star, Award, 
  BookOpen, Users, Coffee, Smile, ThumbsUp, Gift
} from "lucide-react";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";


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
  "Transform your thoughts, transform your life.",
  "Your mental health matters. Take care of yourself.",
  "Strength grows through struggles.",
];

const features = [
  {
    icon: Shield,
    title: "100% Confidential",
    description: "Your conversations are private and secure. We prioritize your privacy above all."
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Access support anytime, anywhere. Our AI companions are always here for you."
  },
  {
    icon: Heart,
    title: "Empathetic Support",
    description: "Experience compassionate, judgment-free conversations tailored to your needs."
  },
  {
    icon: MessageCircle,
    title: "Natural Conversations",
    description: "Engage in fluid, meaningful dialogues that feel genuine and understanding."
  }
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Working Professional",
    content: "MindCare has been a game-changer for my mental well-being. The AI companion is always there when I need someone to talk to.",
    rating: 5
  },
  {
    name: "David R.",
    role: "Student",
    content: "The therapist chatbot helped me develop better coping mechanisms for stress. It's like having a personal mental health coach.",
    rating: 5
  },
  {
    name: "Emily K.",
    role: "Healthcare Worker",
    content: "As someone working in healthcare, I appreciate having 24/7 access to mental health support. It's been invaluable during tough times.",
    rating: 5
  }
];

const statistics = [
  { icon: Users, value: "2", label: "Active Users" },
  { icon: MessageCircle, value: "Minimal", label: "Conversations" },
  { icon: ThumbsUp, value: "98%", label: "Satisfaction Rate" },
  { icon: Gift, value: "24/7", label: "Availability" }
];

const resources = [
  {
    icon: BookOpen,
    title: "Mental Health Articles",
    description: "Access our library of expert-written articles on various mental health topics."
  },
  {
    icon: Coffee,
    title: "Self-Care Guides",
    description: "Discover practical tips and techniques for maintaining mental wellness."
  },
  {
    icon: Smile,
    title: "Mood Tracking",
    description: "Track your emotional well-being and identify patterns over time."
  }
];

const HomePage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    setIsLoaded(true);
    const quoteInterval = setInterval(() => {
      setQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 4000);

    const testimonialInterval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => {
      clearInterval(quoteInterval);
      clearInterval(testimonialInterval);
    };
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
      className="min-h-screen w-screen flex flex-col items-center text-white bg-black"
    >
      {/* Header */}
      <header className="fixed top-0 w-full inset-x-0 z-50 flex justify-between items-center p-5 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-opacity-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Brain className="w-10 h-10 text-white" />
          <h2 className="text-2xl font-bold">Soul Sync</h2>
        </div>
        <nav className="flex ml-auto gap-7 text-lg">
          <a href="/about" className="hover:text-purple-300 transition-colors">About</a>
          <a href="/doctor" className="hover:text-purple-300 transition-colors">Find a Doctor</a>
          <a href="/resources" className="hover:text-purple-300  transition-colors">Resources</a>
          <a href="/calender" className="hover:text-purple-300  transition-colors">Calendar</a>
          <a href="/details" className="hover:text-purple-300 mr-8 transition-colors">Details</a>
          
        </nav>
      </header>

      {/* Hero Section */}
      <div className="mt-28 min-h-screen flex flex-col items-center justify-center w-full bg-gradient-to-b from-black to-purple-900">
        <div className="text-center max-w-4xl px-4">
          <AnimatePresence mode="wait">
            <motion.h1 
              key={quoteIndex}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.9 }}
              className="text-5xl font-bold leading-tight  bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 text-transparent bg-clip-text drop-shadow-lg mb-8"
            >
              {quotes[quoteIndex]}
            </motion.h1>
          </AnimatePresence>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-gray-300 mb-12"
          >
            Experience the future of mental health support with our AI-powered companions.
            Get instant, personalized help whenever you need it.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={() => handleStartChat("/register")}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
          >
            Chat with Woman specific AI
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={() => handleStartChat("/register")}
            className="px-8 py-4 bg-gradient-to-r mx-5 from-purple-500 to-pink-500 text-white text-lg font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
          >
            Chat with a Therapist
          </motion.button>
        </div>

        {/* Statistics Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 w-full max-w-6xl px-4"
        >
          {statistics.map((stat, index) => (
            <div key={index} className="text-center">
              <stat.icon className="w-8 h-8 mx-auto mb-4 text-pink-400" />
              <h3 className="text-3xl font-bold text-white mb-2">{stat.value}</h3>
              <p className="text-gray-400">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Features Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full py-20 bg-gradient-to-b from-purple-900 to-black"
      >
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 text-transparent bg-clip-text">
            Why Choose Our AI Companions?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gradient-to-br from-purple-900 to-pink-900 p-8 rounded-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                <feature.icon className="w-12 h-12 mb-6 text-pink-400" />
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Testimonials Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full py-20 bg-gradient-to-b from-black to-purple-900"
      >
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 text-transparent bg-clip-text">
            What Our Users Say
          </h2>
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-purple-900 to-pink-900 p-8 rounded-lg shadow-xl"
              >
                <div className="flex items-center mb-6">
                  <div className="mr-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{testimonials[activeTestimonial].name}</h3>
                    <p className="text-gray-400">{testimonials[activeTestimonial].role}</p>
                  </div>
                  <div className="ml-auto flex">
                    {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-300 text-lg italic">"{testimonials[activeTestimonial].content}"</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Resources Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full py-20 bg-gradient-to-b from-purple-900 to-black"
      >
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 text-transparent bg-clip-text">
            Mental Health Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {resources.map((resource, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gradient-to-br from-purple-900 to-pink-900 p-8 rounded-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer"
              >
                <resource.icon className="w-12 h-12 mb-6 text-pink-400" />
                <h3 className="text-xl font-semibold mb-4">{resource.title}</h3>
                <p className="text-gray-300">{resource.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Call to Action Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full py-20 bg-gradient-to-b from-black to-purple-900"
      >
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-8">Ready to Transform Your Mental Well-being?</h2>
          <p className="text-xl text-gray-300 mb-12">
            Join thousands of others who have already taken the first step towards better mental health.
            Our AI companions are ready to support you on your journey.
          </p>
          <button
            onClick={() => handleStartChat("/register")}
            className="px-12 py-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
          >
            Begin Your Healing Journey Now
          </button>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="w-full bg-gradient-to-r from-purple-900 to-pink-900 text-white py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 px-6">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Brain className="w-8 h-8" />
              <h2 className="text-2xl font-bold">MindCare</h2>
            </div>
            <p className="text-gray-300">
              Supporting mental health, one conversation at a time.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/about" className="text-gray-300 hover:text-white transition-colors">About Us</a></li>
              <li><a href="/features" className="text-gray-300 hover:text-white transition-colors">Features</a></li>
              <li><a href="/pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a></li>
              <li><a href="/blog" className="text-gray-300 hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="/help" className="text-gray-300 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="/terms" className="text-gray-300 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
            <div className="flex space-x-4 mb-6">
              <FaFacebook className="text-2xl cursor-pointer hover:text-purple-300 transition-transform transform hover:scale-110" />
              <FaTwitter className="text-2xl cursor-pointer hover:text-purple-300 transition-transform transform hover:scale-110" />
              <FaInstagram className="text-2xl cursor-pointer hover:text-purple-300 transition-transform transform hover:scale-110" />
              <FaLinkedin className="text-2xl cursor-pointer hover:text-purple-300 transition-transform transform hover:scale-110" />
            </div>
            <p className="text-gray-300">
              Subscribe to our newsletter for updates and mental health tips.
            </p>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-700 px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">
              &copy; {new Date().getFullYear()} MindCare. All rights reserved.
            </p>
            <div className="flex items-center mt-4 md:mt-0">
              <Award className="w-6 h-6 text-pink-400 mr-2" />
              <span className="text-sm">Award-winning mental health platform</span>
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default HomePage;