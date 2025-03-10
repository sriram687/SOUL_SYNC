import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Brain } from "lucide-react";
import { Award, BookOpen, Clock, PhoneCall, Mail, MapPin, Star, Heart, Shield, Users } from "lucide-react";

const doctors = [
  {
    name: "Dr. Aditi Sharma",
    specialty: "Clinical Psychologist",
    phone: "+91 9876543210",
    email: "aditi.sharma@email.com",
    location: "Mumbai, India",
    experience: "15+ years",
    education: "Ph.D. in Clinical Psychology, Harvard University",
    expertise: ["Anxiety Disorders", "Depression", "Trauma Recovery"],
    languages: ["English", "Hindi", "Marathi"],
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300"
  },
  {
    name: "Dr. Robert Williams",
    specialty: "Psychiatrist",
    phone: "+1 234-567-890",
    email: "robert.williams@email.com",
    location: "New York, USA",
    experience: "20+ years",
    education: "M.D. Psychiatry, Johns Hopkins University",
    expertise: ["Mood Disorders", "ADHD", "Addiction Recovery"],
    languages: ["English", "Spanish"],
    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300&h=300"
  },
  {
    name: "Dr. Meera Nair",
    specialty: "Mental Health Counselor",
    phone: "+91 8765432109",
    email: "meera.nair@email.com",
    location: "Bangalore, India",
    experience: "12+ years",
    education: "M.Phil. Clinical Psychology, NIMHANS",
    expertise: ["Relationship Counseling", "Stress Management", "Youth Mental Health"],
    languages: ["English", "Malayalam", "Kannada"],
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=300&h=300"
  },
];

const features = [
  {
    icon: Shield,
    title: "Confidential Care",
    description: "Your privacy is our top priority. All sessions and information are strictly confidential."
  },
  {
    icon: Users,
    title: "Personalized Approach",
    description: "Treatment plans tailored to your unique needs and circumstances."
  },
  {
    icon: Heart,
    title: "Compassionate Support",
    description: "Empathetic and non-judgmental environment for your healing journey."
  }
];

export default function DoctorAdvice() {
  const [showMore, setShowMore] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 p-6">
        <header className="fixed inset-x-0 top-0 w-full z-50 flex justify-between items-center p-5 bg-gradient-to-r from-purple-500 to-pink-500 backdrop-blur-md">
        <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
      <Brain className="w-10 h-10 text-white" />
  <h1 className="text-2xl font-bold">Soul Sync</h1>
</Link>
        </div>
      </header>
      <motion.div
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.h1
          className="text-5xl font-bold mt-16 text-white text-center mb-4"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Mental Health Professionals
        </motion.h1>
        
        <motion.p
          className="text-xl text-purple-200 text-center max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          Your journey to better mental health starts with the right professional guidance.
          Our experienced team of mental health experts is here to support you every step of the way.
        </motion.p>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <feature.icon className="w-12 h-12 mb-4 text-purple-300" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-purple-200">{feature.description}</p>
            </motion.div>
          ))}
        </div>
        
        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {doctors.map((doctor, index) => (
            <motion.div
              key={index}
              className={`bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden transition-all duration-300 ${
                selectedDoctor === index ? 'scale-105' : ''
              }`}
              whileHover={{ scale: 1.03 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <img
                src={doctor.image}
                alt={doctor.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-2">{doctor.name}</h2>
                <p className="text-purple-300 flex items-center gap-2 mb-4">
                  <Award size={18} />
                  {doctor.specialty}
                </p>
                
                <div className="space-y-3 text-purple-200">
                  <p className="flex items-center gap-2">
                    <Clock size={18} /> {doctor.experience}
                  </p>
                  <p className="flex items-center gap-2">
                    <BookOpen size={18} /> {doctor.education}
                  </p>
                  <p className="flex items-center gap-2">
                    <PhoneCall size={18} /> {doctor.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail size={18} /> {doctor.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin size={18} /> {doctor.location}
                  </p>
                </div>

                <div className="mt-4">
                  <h4 className="text-white font-semibold mb-2">Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {doctor.expertise.map((skill, i) => (
                      <span
                        key={i}
                        className="bg-purple-700/50 text-purple-200 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-white font-semibold mb-2">Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {doctor.languages.map((lang, i) => (
                      <span
                        key={i}
                        className="bg-pink-700/50 text-pink-200 px-3 py-1 rounded-full text-sm"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Information Section */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <button
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-8 py-3 rounded-full shadow-lg transition-all duration-300"
            onClick={() => setShowMore(!showMore)}
          >
            {showMore ? "Show Less" : "Learn More About Mental Health Care"}
          </button>
        </motion.div>

        {showMore && (
          <motion.div
            className="mt-12 bg-white/10 backdrop-blur-lg rounded-xl p-8 text-purple-200"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-3xl font-bold text-white mb-6">Understanding Mental Health Care</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold text-purple-300 mb-3">When to Seek Professional Help</h4>
                <p>
                  Mental health care is essential when you're experiencing persistent changes in mood,
                  behavior, or thinking patterns. Common signs include:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-2">
                  <li>Persistent feelings of sadness or anxiety</li>
                  <li>Changes in sleep or eating patterns</li>
                  <li>Difficulty concentrating or making decisions</li>
                  <li>Loss of interest in activities you once enjoyed</li>
                  <li>Overwhelming stress or worry</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-purple-300 mb-3">Our Approach to Treatment</h4>
                <p>
                  We believe in a holistic approach to mental health care that considers your unique
                  circumstances, cultural background, and personal goals. Our professionals use
                  evidence-based treatments while maintaining a compassionate and understanding environment.
                </p>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-purple-300 mb-3">What to Expect</h4>
                <p>
                  Your first session will focus on understanding your concerns and developing a
                  personalized treatment plan. We ensure a safe, confidential space where you can
                  express yourself freely and work towards your mental health goals.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}