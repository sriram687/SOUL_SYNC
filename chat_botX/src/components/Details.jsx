import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

const MenstrualCycleTracker = () => {
  const [periodStart, setPeriodStart] = useState(1);
  const [periodEnd, setPeriodEnd] = useState(5);
  const [cycleData, setCycleData] = useState(Array(30).fill(0));
  const [currentDay] = useState(new Date().getDate());
  const [currentMonth] = useState(format(new Date(), 'MMMM'));
  
  // Create cycle data based on user input
  useEffect(() => {
    const newCycleData = Array(30).fill(0);
    for (let i = periodStart - 1; i < periodEnd; i++) {
      if (i >= 0 && i < 30) {
        newCycleData[i] = 1;
      }
    }
    setCycleData(newCycleData);
  }, [periodStart, periodEnd]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Form already updates state on change, so no additional action needed here
  };

  // Get day of week for a particular day
  const getDayOfWeek = (day) => {
    const dayIndex = (day + 3) % 7; // Simple formula for weekday (starting on 1st)
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIndex];
  };

  // Render calendar grid
  const renderCalendar = () => {
    const rows = 5;
    const cols = 6;
    const calendar = [];

    for (let row = 0; row < rows; row++) {
      const rowCells = [];
      for (let col = 0; col < cols; col++) {
        const dayIndex = row * cols + col;
        if (dayIndex < 30) {
          const isPeriodDay = cycleData[dayIndex] === 1;
          const isCurrentDay = dayIndex + 1 === currentDay;
          
          const cellStyle = {
            backgroundColor: isPeriodDay ? '#ffcccb' : isCurrentDay ? '#8fbc8f' : '#d3d3d3',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '8px',
            padding: '10px',
            position: 'relative',
            boxSizing: 'border-box'
          };
          
          rowCells.push(
            <div key={`cell-${row}-${col}`} className="grid-cell" style={{ padding: '5px' }}>
              <div style={cellStyle}>
                <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{dayIndex + 1}</div>
                <div style={{ fontSize: '10px', textAlign: 'center' }}>
                  {currentMonth.slice(0, 3)} {dayIndex + 1}
                  <br />
                  ({getDayOfWeek(dayIndex)})
                </div>
              </div>
            </div>
          );
        }
      }
      
      calendar.push(
        <div key={`row-${row}`} style={{ display: 'flex', width: '100%' }}>
          {rowCells}
        </div>
      );
    }
    
    return calendar;
  };
  
  return (
    <div style={{ 
      maxWidth: '1000px', 
      margin: '0 auto', 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f4f4f9'
    }}>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px' 
      }}>
        <h1 style={{ 
          color: '#6a5acd', 
          marginBottom: '10px' 
        }}>
          Menstrual Cycle Tracker (Calendar View)
        </h1>
        <p>Track your menstrual cycle with this calendar visualization</p>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '30px',
        flexWrap: 'wrap'
      }}>
        {/* Input Section */}
        <div style={{
          flex: '1',
          minWidth: '300px',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '20px', color: '#6a5acd' }}>Enter Cycle Information</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="periodStart" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                First day of your period (1-30):
              </label>
              <input
                type="number"
                id="periodStart"
                min="1"
                max="30"
                value={periodStart}
                onChange={(e) => setPeriodStart(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #ddd'
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="periodEnd" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Last day of your period (1-30):
              </label>
              <input
                type="number"
                id="periodEnd"
                min="1"
                max="30"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #ddd'
                }}
                required
              />
            </div>
            
            <button 
              type="submit" 
              style={{
                backgroundColor: '#6a5acd',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Update Calendar
            </button>
          </form>
          
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ marginBottom: '15px', color: '#6a5acd' }}>Legend</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#ffcccb', borderRadius: '4px' }}></div>
                <span>Period Days</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#8fbc8f', borderRadius: '4px' }}></div>
                <span>Current Day</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#d3d3d3', borderRadius: '4px' }}></div>
                <span>Regular Days</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Calendar Section */}
        <div style={{
          flex: '2',
          minWidth: '500px',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ color: '#6a5acd' }}>Calendar View</h2>
            <div>Current Month: {currentMonth}</div>
          </div>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '5px',
            marginBottom: '10px'
          }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} style={{ 
                textAlign: 'center', 
                fontWeight: 'bold',
                color: '#6a5acd'
              }}>
                {day}
              </div>
            ))}
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {renderCalendar()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenstrualCycleTracker;