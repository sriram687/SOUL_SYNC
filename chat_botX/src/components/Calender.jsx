import React, { useState, useEffect } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Activity, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const ActivityTracker = () => {
  const [activityData, setActivityData] = useState([]);
  const [showTypingMessage, setShowTypingMessage] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [typingComplete, setTypingComplete] = useState(false);
  const [reverseTyping, setReverseTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [hoveredDate, setHoveredDate] = useState(null);
  
  const fullMessage = "Your activity has been tracked successfully!";
  
  // Generate sample data for the last 30 days
  useEffect(() => {
    const generateData = () => {
      const data = [];
      const today = new Date();
      for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        data.push({
          date: dateStr,
          count: Math.floor(Math.random() * 8) + 1, // Random activity count between 1-8
          hours: Math.floor(Math.random() * 5) + 1 // Random hours between 1-5
        });
      }
      return data;
    };

    const storedData = JSON.parse(localStorage.getItem('activityData')) || generateData();
    setActivityData(storedData);
  }, []);
  
  // Typing effect animation
  useEffect(() => {
    if (!showTypingMessage) return;
    
    if (!typingComplete && !reverseTyping) {
      if (typingText.length < fullMessage.length) {
        const timeout = setTimeout(() => {
          setTypingText(fullMessage.slice(0, typingText.length + 1));
        }, 50);
        return () => clearTimeout(timeout);
      } else {
        setTypingComplete(true);
        setShowCursor(false);
        const timeout = setTimeout(() => {
          setReverseTyping(true);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }
    
    if (reverseTyping) {
      if (typingText.length > 0) {
        const timeout = setTimeout(() => {
          setTypingText(typingText.slice(0, -1));
        }, 30);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setShowTypingMessage(false);
          setTypingComplete(false);
          setReverseTyping(false);
          setShowCursor(true);
        }, 500);
        return () => clearTimeout(timeout);
      }
    }
  }, [showTypingMessage, typingText, typingComplete, reverseTyping]);
  
  // Track new activity
  const handleTrackActivity = () => {
    const today = new Date().toISOString().split('T')[0];
    const updatedData = [...activityData];
    const existingEntry = updatedData.find((entry) => entry.date === today);
    
    if (existingEntry) {
      existingEntry.count += 1;
      existingEntry.hours = Math.min(existingEntry.hours + 1, 8); // Cap at 8 hours
    } else {
      updatedData.push({ date: today, count: 1, hours: 1 });
    }
    
    setActivityData(updatedData);
    localStorage.setItem('activityData', JSON.stringify(updatedData));
    setShowTypingMessage(true);
    setTypingText("");
    setShowCursor(true);
  };
  
  // Get color based on hours spent
  const getColorIntensity = (hours) => {
    if (!hours) return '#f3f0ff';
    if (hours <= 2) return '#d6bcfa';
    if (hours <= 4) return '#b794f4';
    if (hours <= 6) return '#9f7aea';
    return '#805ad5';
  };

  // Format data for bar chart
  const barChartData = activityData.slice(-7).map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    hours: item.hours
  }));

  return (
    <div className="flex flex-col h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 border-purple-400">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold flex items-center text-purple-700">
            <Activity className="mr-2 text-pink-500" size={24} />
            Activity Tracker
          </h1>
          <button
            onClick={handleTrackActivity}
            className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-all duration-300 transform hover:scale-105 shadow-md"
          >
            Track Activity
          </button>
        </div>
        
        {showTypingMessage && (
          <div className="mt-2 overflow-hidden">
            <div className="typing-container bg-purple-100 text-purple-700 p-2 rounded-md shadow-sm">
              <p className="typing-text">{typingText}</p>
              {showCursor && <span className="typing-cursor">|</span>}
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow">
        {/* Left column: Heatmap */}
        <div className="bg-white rounded-lg shadow-md p-4 flex-1 border-l-4 border-purple-300">
          <h2 className="text-lg font-semibold mb-4 text-purple-700">Activity Heatmap</h2>
          <div className="bg-white p-2 rounded">
            <CalendarHeatmap
              startDate={new Date(new Date().setMonth(new Date().getMonth() - 6))}
              endDate={new Date()}
              values={activityData}
              classForValue={(value) => {
                if (!value) return 'color-empty';
                return `color-scale-${value.hours}`;
              }}
              tooltipDataAttrs={(value) => {
                if (!value || !value.date) return { 'data-tip': 'No data' };
                setHoveredDate(value);
                return {
                  'data-tip': `Date: ${value.date}\nHours: ${value.hours}\nActivities: ${value.count}`
                };
              }}
              showWeekdayLabels
            />
          </div>
          
          {hoveredDate && (
            <div className="mt-4 p-3 bg-purple-50 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-purple-700 font-medium">{new Date(hoveredDate.date).toLocaleDateString()}</span>
                <div className="flex items-center">
                  <Clock size={16} className="text-purple-500 mr-1" />
                  <span className="text-purple-700">{hoveredDate.hours} hours</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right column: Bar Graph */}
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-pink-400">
          <h2 className="text-lg font-semibold mb-4 text-pink-600">Weekly Activity</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="hours"
                  fill="#9f7aea"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 flex justify-between items-center px-4">
            {[0, 2, 4, 6, 8].map((hours) => (
              <div key={hours} className="flex flex-col items-center mx-2">
                <div 
                  className="w-8 h-8 rounded-md transform hover:scale-125 transition-all duration-300 shadow-sm"
                  style={{ backgroundColor: getColorIntensity(hours) }}
                ></div>
                <span className="text-xs mt-2 text-purple-700 font-medium">{hours}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        :global(.react-calendar-heatmap) {
          width: 100%;
        }
        
        :global(.react-calendar-heatmap rect) {
          rx: 2;
          ry: 2;
          stroke: #ffffff;
          stroke-width: 2px;
          transition: all 0.3s ease;
        }
        
        :global(.react-calendar-heatmap rect:hover) {
          stroke: #805ad5;
          stroke-width: 2px;
          transform: scale(1.2);
          filter: brightness(1.1);
        }
        
        :global(.react-calendar-heatmap .color-empty) { fill: #f3f0ff; }
        :global(.react-calendar-heatmap .color-scale-1) { fill: #d6bcfa; }
        :global(.react-calendar-heatmap .color-scale-2) { fill: #d6bcfa; }
        :global(.react-calendar-heatmap .color-scale-3) { fill: #b794f4; }
        :global(.react-calendar-heatmap .color-scale-4) { fill: #b794f4; }
        :global(.react-calendar-heatmap .color-scale-5) { fill: #9f7aea; }
        :global(.react-calendar-heatmap .color-scale-6) { fill: #9f7aea; }
        :global(.react-calendar-heatmap .color-scale-7) { fill: #805ad5; }
        :global(.react-calendar-heatmap .color-scale-8) { fill: #805ad5; }
        
        .typing-container {
          display: flex;
          align-items: center;
          animation: slideIn 0.5s ease-out;
        }
        
        .typing-text {
          white-space: nowrap;
          display: inline-block;
          margin: 0;
        }
        
        .typing-cursor {
          display: inline-block;
          margin-left: 2px;
          font-weight: bold;
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ActivityTracker;