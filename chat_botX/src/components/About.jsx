import React from "react";
import { motion } from "framer-motion";
import missionImage from "../images/missionimage.jpg";
import valuesImage from "../images/valueimage.jpg";
import teamImage from "../images/teamimage.jpg";

const AboutPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center"
    >
      <header className="w-full bg-purple-600 text-white py-10 text-center">
        <h1 className="text-4xl font-bold">About MindCare</h1>
        <p className="text-lg mt-2">Your trusted space for mental well-being</p>
      </header>

      <section className="w-11/12 max-w-4xl my-12">
        <motion.div
          className="bg-white p-6 rounded-lg shadow-lg flex flex-col md:flex-row items-center gap-6"
          whileHover={{ scale: 1.02 }}
        >
          <img src={missionImage} alt="Mission" className="w-48 h-48 rounded-lg" />
          <div>
            <h2 className="text-2xl font-bold text-purple-700">Our Mission</h2>
            <p className="mt-2 text-gray-700">
              At MindCare, our mission is to provide a safe, compassionate, and inclusive
              space for mental health support. We strive to empower individuals to seek help
              without stigma and with confidence.
            </p>
          </div>
        </motion.div>
      </section>

      <section className="w-11/12 max-w-4xl my-12">
        <motion.div
          className="bg-white p-6 rounded-lg shadow-lg flex flex-col md:flex-row-reverse items-center gap-6"
          whileHover={{ scale: 1.02 }}
        >
          <img  src={valuesImage} alt="Values" className="w-48 h-48 rounded-lg" />
          <div>
            <h2 className="text-2xl font-bold text-purple-700">Our Values</h2>
            <p className="mt-2 text-gray-700">
              We believe in accessibility, empathy, and privacy. Our platform is designed to
              offer confidential and effective support tailored to each individual’s needs.
            </p>
          </div>
        </motion.div>
      </section>

      <section className="w-11/12 max-w-4xl my-12">
        <motion.div
          className="bg-white p-6 rounded-lg shadow-lg flex flex-col md:flex-row items-center gap-6"
          whileHover={{ scale: 1.02 }}
        >
          <img src={teamImage} alt="Team" className="w-48 h-48 rounded-lg" />
          <div>
            <h2 className="text-2xl font-bold text-purple-700">Meet Our Team</h2>
            <p className="mt-2 text-gray-700">
              Our dedicated team of mental health professionals, AI specialists, and
              volunteers work tirelessly to create a supportive and effective mental
              well-being platform.
            </p>
          </div>
        </motion.div>
      </section>

      <footer className="w-full bg-purple-600 text-white text-center py-6 mt-12">
        <p className="text-sm">© 2025 MindCare. All Rights Reserved.</p>
      </footer>
    </motion.div>
  );
};

export default AboutPage;
