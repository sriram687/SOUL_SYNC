import React, { useState, useEffect } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import 'react-calendar/dist/Calendar.css';
import { Activity } from 'lucide-react';
import Calendar from 'react-calendar';

const ActivityCalendar= () => {
  const [activityData, setActivityData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTypingMessage, setShowTypingMessage] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [typingComplete, setTypingComplete] = useState(false);
  const [reverseTyping, setReverseTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  
  const fullMessage = "Your heatmap and calendar have been updated with today's activity.";
  
  // Simulate user login activity (replace with actual API calls)
  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem('activityData')) || [];
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
        // Set cursor to disappear when typing is complete
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
          setShowCursor(true); // Reset cursor state for next animation
        }, 500);
        return () => clearTimeout(timeout);
      }
    }
  }, [showTypingMessage, typingText, typingComplete, reverseTyping]);
  
  // Update activity data when the user logs in
  const handleLogin = () => {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    const updatedData = [...activityData];
    const existingEntry = updatedData.find((entry) => entry.date === today);
    
    if (existingEntry) {
      existingEntry.count += 1; // Increment count if the date already exists
    } else {
      updatedData.push({ date: today, count: 1 }); // Add new entry for today
    }
    
    setActivityData(updatedData);
    localStorage.setItem('activityData', JSON.stringify(updatedData)); // Save to localStorage
    
    // Show typing animation
    setShowTypingMessage(true);
    setTypingText("");
    setShowCursor(true); // Ensure cursor is visible at start of animation
  };
  
  // Get the color intensity based on the count
  const getColorIntensity = (count) => {
    if (!count) return '#f3f0ff'; // No activity - lightest lavender
    if (count <= 2) return '#d6bcfa'; // Low activity - light lavender
    if (count <= 4) return '#b794f4'; // Medium activity - medium lavender
    if (count <= 6) return '#9f7aea'; // High activity - deep lavender
    return '#805ad5'; // Very high activity - richest lavender
  };
  
  // Handle date selection in the calendar
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };
  
  // Get activity count for selected date
  const getSelectedDateActivity = () => {
    const dateString = selectedDate.toISOString().split('T')[0];
    const activity = activityData.find((entry) => entry.date === dateString);
    return activity ? activity.count : 0;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 border-purple-400">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold flex items-center text-purple-700">
            <Activity className="mr-2 text-pink-500" size={24} />
            Activity Tracker
          </h1>
          <button
            onClick={handleLogin}
            className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-all duration-300 transform hover:scale-105 shadow-md"
          >
            Track Activity
          </button>
        </div>
        
        {/* Typing animation message */}
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
        {/* Left column: Heatmap and Selected Date */}
        <div className="flex flex-col space-y-6">
          <div className="bg-white rounded-lg shadow-md p-4 flex-1 border-l-4 border-purple-300">
            <h2 className="text-lg font-semibold mb-4 text-purple-700">Activity Heatmap</h2>
            <div className="bg-white p-2 rounded">
              <CalendarHeatmap
                startDate={new Date(new Date().setMonth(new Date().getMonth() - 6))}
                endDate={new Date()}
                values={activityData}
                classForValue={(value) => {
                  if (!value) return 'color-empty';
                  return `color-scale-${value.count}`;
                }}
                tooltipDataAttrs={(value) => ({
                  'data-tip': value && value.date ? `${value.date}: ${value.count} activities` : 'No data',
                })}
                showWeekdayLabels
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-pink-300">
            <h2 className="text-lg font-semibold mb-4 text-pink-600">Activity Stats</h2>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-purple-500">Selected Date</span>
                <span className="font-medium text-gray-800">{selectedDate.toDateString()}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-purple-500">Activity Count</span>
                <div 
                  className="font-bold text-xl px-3 py-1 rounded-full text-white transition-all duration-300"
                  style={{ backgroundColor: getColorIntensity(getSelectedDateActivity()) }}
                >
                  {getSelectedDateActivity()}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between items-center px-4">
              {[0, 2, 4, 6, 8].map((count) => (
                <div key={count} className="flex flex-col items-center mx-2">
                  <div 
                    className="w-8 h-8 rounded-md transform hover:scale-125 transition-all duration-300 shadow-sm"
                    style={{ backgroundColor: getColorIntensity(count) }}
                  ></div>
                  <span className="text-xs mt-2 text-purple-700 font-medium">{count}+</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right column: Calendar */}
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-pink-400">
          <h2 className="text-lg font-semibold mb-4 text-pink-600">Monthly View</h2>
          <div className="flex justify-center">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              className="border-0 w-full max-w-md calendar-square"
              tileClassName={({ date }) => {
                const dateString = date.toISOString().split('T')[0];
                const activity = activityData.find((entry) => entry.date === dateString);
                return activity ? `has-activity activity-level-${activity.count}` : "";
              }}
              tileContent={null} // Removed the dots under days
            />
          </div>
        </div>
      </div>
      
      <style jsx>{`
        /* Custom styles for the calendar components */
        :global(.react-calendar) {
          border: none;
          width: 100%;
          font-family: Arial, sans-serif;
        }
        
        :global(.react-calendar__month-view__weekdays) {
          display: flex;
          justify-content: space-between;
          text-align: center;
          color: #805ad5;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        :global(.react-calendar__month-view__days) {
          display: grid !important;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        
        :global(.react-calendar__tile) {
          aspect-ratio: 1 / 1;
          max-width: initial !important;
          padding: 0.75em 0.5em;
          border-radius: 8px;
          transition: all 0.3s ease;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          margin: 2px;
        }
        
        :global(.react-calendar__tile:hover) {
          background-color: #f3e8ff !important;
          transform: scale(1.05);
          z-index: 1;
        }
        
        :global(.react-calendar__tile--now) {
          background-color: #fdd6e7 !important;
        }
        
        :global(.react-calendar__tile--active) {
          background: #ed64a6 !important;
          color: white;
        }
        
        :global(.activity-level-1), :global(.activity-level-2) {
          background-color: #d6bcfa !important;
        }
        
        :global(.activity-level-3), :global(.activity-level-4) {
          background-color: #b794f4 !important;
        }
        
        :global(.activity-level-5), :global(.activity-level-6) {
          background-color: #9f7aea !important;
          color: white !important;
        }
        
        :global(.activity-level-7), :global(.activity-level-8), :global(.activity-level-9) {
          background-color: #805ad5 !important;
          color: white !important;
        }
        
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
        :global(.react-calendar-heatmap .color-scale-9) { fill: #805ad5; }
        
        /* Additional highlight for the calendar */
        :global(.has-activity) {
          position: relative;
          z-index: 1;
        }
        
        :global(.has-activity:hover) {
          box-shadow: 0 0 8px rgba(159, 122, 234, 0.6);
        }
        
        /* Typing animation styles */
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
        
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ActivityCalendar;