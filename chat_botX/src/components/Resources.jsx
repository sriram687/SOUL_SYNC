import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { Heart, Phone, BookOpen, Users, ExternalLink, ArrowRight, Mail, Calendar, Award, BookMarked, Brain, Headphones, Coffee, Sparkles, MessageCircle, Clock } from 'lucide-react';

function App() {
  const [activeSection, setActiveSection] = useState(null);

  return (
   
    
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500">
      <header className="fixed top-0 w-full z-50 flex justify-between items-center p-5 bg-gradient-to-r from-purple-500 to-pink-500 backdrop-blur-md">
        <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
      <Brain className="w-10 h-10 text-white" />
  <h1 className="text-2xl font-bold">Soul Sync</h1>
</Link>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 mt-16 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16 transform transition-all duration-500 hover:scale-105">
          <h1 className="text-5xl font-bold text-white mb-6 animate-fade-in">
            Mental Health Resources
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Your journey to better mental health starts here. Find support, guidance, and resources tailored to your needs.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {[
            { icon: Users, value: '50,000+', label: 'People Helped' },
            { icon: MessageCircle, value: '24/7', label: 'Support Available' },
            { icon: Award, value: '98%', label: 'Success Rate' },
            { icon: Clock, value: '1M+', label: 'Support Hours' }
          ].map((stat, index) => (
            <div key={index} className="bg-white/30 backdrop-blur-sm rounded-xl p-6 text-center text-white transform transition-all duration-300 hover:scale-105">
              <stat.icon className="w-8 h-8 mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm opacity-90">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Emergency Support Card */}
          <div 
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            onMouseEnter={() => setActiveSection('emergency')}
            onMouseLeave={() => setActiveSection(null)}
          >
            <div className="flex items-center mb-6">
              <Phone className="w-8 h-8 text-pink-500" />
              <h2 className="text-2xl font-bold ml-3 text-gray-800">24/7 Crisis Support</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-pink-50 rounded-lg border border-pink-100">
                <p className="font-semibold text-pink-800">National Crisis Line</p>
                <p className="text-pink-700">1-800-273-8255</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <p className="font-semibold text-purple-800">Crisis Text Line</p>
                <p className="text-purple-700">Text HOME to 741741</p>
              </div>
              <div className="p-4 bg-pink-50 rounded-lg border border-pink-100">
                <p className="font-semibold text-pink-800">Veterans Crisis Line</p>
                <p className="text-pink-700">1-800-273-8255 (Press 1)</p>
              </div>
            </div>
          </div>

          {/* Educational Resources Card */}
          <div 
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            onMouseEnter={() => setActiveSection('education')}
            onMouseLeave={() => setActiveSection(null)}
          >
            <div className="flex items-center mb-6">
              <BookOpen className="w-8 h-8 text-purple-500" />
              <h2 className="text-2xl font-bold ml-3 text-gray-800">Learn & Grow</h2>
            </div>
            <ul className="space-y-4">
              {[
                'Understanding Anxiety and Depression',
                'Mindfulness Techniques',
                'Stress Management Strategies',
                'Building Healthy Relationships',
                'Sleep Hygiene Tips',
                'Emotional Intelligence Development'
              ].map((topic, index) => (
                <li key={index} className="flex items-center group">
                  <ArrowRight className="w-4 h-4 text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <a href="#" className="ml-2 text-gray-700 hover:text-pink-500 transition-colors">
                    {topic}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Groups Card */}
          <div 
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            onMouseEnter={() => setActiveSection('groups')}
            onMouseLeave={() => setActiveSection(null)}
          >
            <div className="flex items-center mb-6">
              <Users className="w-8 h-8 text-purple-500" />
              <h2 className="text-2xl font-bold ml-3 text-gray-800">Support Groups</h2>
            </div>
            <div className="space-y-4">
              {[
                { title: 'Anxiety Support', time: 'Mondays 7PM EST', spots: '5 spots left' },
                { title: 'Depression Support', time: 'Wednesdays 6PM EST', spots: '3 spots left' },
                { title: 'PTSD Support', time: 'Thursdays 7PM EST', spots: '8 spots left' },
                { title: 'Grief Support', time: 'Fridays 5PM EST', spots: '4 spots left' }
              ].map((group, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <p className="font-semibold text-gray-800">{group.title}</p>
                  <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {group.time}
                    </div>
                    <span className="text-purple-600">{group.spots}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wellness Programs Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Wellness Programs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Brain,
                title: 'Mindfulness Course',
                description: '8-week program for mental clarity',
                duration: '45 mins/week'
              },
              {
                icon: Headphones,
                title: 'Guided Meditation',
                description: 'Daily audio sessions',
                duration: '15 mins/day'
              },
              {
                icon: Coffee,
                title: 'Wellness Workshop',
                description: 'Interactive group sessions',
                duration: '90 mins/month'
              },
              {
                icon: Sparkles,
                title: 'Stress Relief',
                description: 'Practical coping techniques',
                duration: '30 mins/week'
              }
            ].map((program, index) => (
              <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 transform transition-all duration-300 hover:scale-105">
                <program.icon className="w-8 h-8 text-purple-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{program.title}</h3>
                <p className="text-gray-600 mb-4">{program.description}</p>
                <div className="text-sm text-purple-600 font-medium">{program.duration}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Resources Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Self-Care Guide',
                description: 'Download our comprehensive guide to daily mental wellness practices.',
                icon: Heart,
                action: 'Download Now'
              },
              {
                title: 'Weekly Newsletter',
                description: 'Subscribe to receive weekly mental health tips and resources.',
                icon: Mail,
                action: 'Subscribe'
              },
              {
                title: 'Professional Directory',
                description: 'Find licensed therapists and counselors in your area.',
                icon: BookMarked,
                action: 'Search Directory'
              }
            ].map((resource, index) => (
              <div key={index} className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl transform transition-all duration-300 hover:scale-105">
                <resource.icon className="w-8 h-8 text-pink-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{resource.title}</h3>
                <p className="text-gray-600">{resource.description}</p>
                <button className="mt-4 text-pink-500 font-semibold flex items-center hover:text-pink-600 transition-colors">
                  {resource.action}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;