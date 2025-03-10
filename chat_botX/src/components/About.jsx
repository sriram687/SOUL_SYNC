import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Users,Brain, Target, Award, Clock, Shield } from 'lucide-react';
import { Link } from "react-router-dom";

function App() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

 

  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description: "At MindCare, we're dedicated to revolutionizing mental health support through innovative technology and compassionate care. We believe everyone deserves access to quality mental health resources, regardless of their location or circumstances."
    },
    {
      icon: Shield,
      title: "Our Values",
      description: "Trust, empathy, and innovation form the cornerstone of our approach. We prioritize user privacy while delivering personalized support that adapts to individual needs. Our commitment to ethical practices ensures a safe space for all users."
    },
    {
      icon: Award,
      title: "Our Impact",
      description: "Since our inception, we've helped thousands of individuals on their mental health journey. Through continuous improvement and community feedback, we've developed a platform that truly makes a difference in people's lives."
    }
  ];

  return (

    
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-emerald-400 to-yellow-500">

<header className="fixed top-0 w-full z-50 flex justify-between items-center p-5 bg-green-600 backdrop-blur-md">
        <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
      <Brain className="w-10 h-10 text-white" />
  <h1 className="text-2xl font-bold">Soul Sync</h1>
</Link>
        </div>
      </header>
      {/* Hero Section */}
      <motion.header 
        className="relative h-screen flex items-center justify-center text-white overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent"></div>
        <div className="relative z-10 text-center px-4">
          <motion.h1 
            className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-teal-200"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Welcome to Soul Sync
          </motion.h1>
          <motion.p 
            className="text-xl mb-8 max-w-2xl mx-auto text-teal-50"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Empowering minds, transforming lives through innovative mental health support
          </motion.p>
        </div>
      </motion.header>

     

      {/* Values Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-xl p-8 text-white border border-white/20"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.3 }}
                whileHover={{ 
                  scale: 1.02,
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  boxShadow: "0 0 20px rgba(255, 255, 255, 0.1)"
                }}
              >
                <value.icon className="w-12 h-12 mb-4" />
                <h3 className="text-2xl font-bold mb-4">{value.title}</h3>
                <p className="leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gradient-to-b from-cyan-600/20 to-teal-600/20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.h2 
            className="text-4xl font-bold text-white text-center mb-12"
            {...fadeInUp}
          >
            Industry Experts
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Dr. Sarah Chen",
                role: "Chief Medical Officer",
                image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
              },
              {
                name: "Michael Roberts",
                role: "Chief Technology Officer",
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
              },
              {
                name: "Dr. Emily Thompson",
                role: "Head of Research",
                image: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
              }
            ].map((member, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-xl overflow-hidden border border-white/20"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 30px rgba(255, 255, 255, 0.2)"
                }}
              >
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                  <p className="text-white/80">{member.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-teal-900 to-cyan-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.p 
            className="text-lg"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            © 2025 Soul Sync. All Rights Reserved.
          </motion.p>
        </div>
      </footer>
    </div>
  );
}

export default App;