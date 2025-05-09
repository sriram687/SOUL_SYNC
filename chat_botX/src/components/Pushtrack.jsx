import { useState, useRef, useEffect } from 'react';
import { ActivitySquare, Award, Flame, Clock, Play, ChevronRight, Send, MessageCircle, X } from 'lucide-react';

export default function PushUpTracker() {
  const [isCounting, setIsCounting] = useState(false);
  const [workoutStats, setWorkoutStats] = useState({
    start_time: new Date().toISOString(),
    duration: 0,
    total_reps: 0,
    correct_reps: 0,
    calories_burned: 0,
    form_accuracy: 0,
    position: 'unknown',
    form_feedback: 'Start in plank position',
    rep_status: '',
  });
  const [processedImage, setProcessedImage] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [error, setError] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    { role: 'bot', content: 'Hi! I\'m your fitness buddy. I can help you with your workout. Start a session or ask me anything!' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [userId, setUserId] = useState('user_' + Math.random().toString(36).substring(2, 9));
  const [chatSessionStarted, setChatSessionStarted] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timerRef = useRef(null);
  const chatContainerRef = useRef(null);
  const audioRef = useRef(null);

  // Voice settings
  const [useVoice, setUseVoice] = useState(true); // Enable voice by default
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Mock recent workouts (replace with API call if available)
  const recentWorkouts = [
    {
      _id: '1',
      start_time: '2025-05-08T10:15:00Z',
      duration: 480,
      total_reps: 25,
      correct_reps: 22,
      calories_burned: 35.8,
    },
    {
      _id: '2',
      start_time: '2025-05-06T18:30:00Z',
      duration: 395,
      total_reps: 20,
      correct_reps: 17,
      calories_burned: 28.5,
    },
  ];

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start workout with direct push_counter.py integration
const startWorkout = async () => {
  console.log('[startWorkout] Initiating workout session');
  setError(null);
  setShowStartModal(false);

  try {
    // First, start the chat session if not already started
    if (!chatSessionStarted) {
      await startChatSession();
    }

    // Add message to chat with voice
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const chatResponse = await fetch(`${backendUrl}/api/pushup-chat/start-pushup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          outputMode: useVoice ? "voice" : "text"
        }),
      });

      if (chatResponse.ok) {
        const chatData = await chatResponse.json();

        // Add bot message with avatar
        setChatMessages(prev => [...prev, {
          role: 'bot',
          content: chatData.response || 'Starting push-up tracking! I\'ll be opening a separate window to track your push-ups. Please position yourself in front of the camera in that window.',
          avatar_url: chatData.avatar_url || null
        }]);

        // Play audio if available
        if (chatData.audio_url && useVoice) {
          playAudio(`${backendUrl}${chatData.audio_url}`);
        }
      } else {
        // Fallback if API call fails
        setChatMessages(prev => [...prev, {
          role: 'bot',
          content: 'Starting push-up tracking! I\'ll be opening a separate window to track your push-ups. Please position yourself in front of the camera in that window.'
        }]);
      }
    } catch (err) {
      console.error('[startWorkout] Error getting voice response:', err);
      // Fallback message
      setChatMessages(prev => [...prev, {
        role: 'bot',
        content: 'Starting push-up tracking! I\'ll be opening a separate window to track your push-ups. Please position yourself in front of the camera in that window.'
      }]);
    }

    // Start the direct push counter
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    console.log(`[startWorkout] Starting direct push counter: ${backendUrl}/api/start_direct_counter`);

    const startResponse = await fetch(`${backendUrl}/api/start_direct_counter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!startResponse.ok) {
      throw new Error(`Failed to start direct push counter: ${startResponse.status}`);
    }

    const startData = await startResponse.json();
    console.log('[startWorkout] Direct counter started:', startData);
    setSessionId(startData.session_id);

    // Set isCounting to true to update the UI
    setIsCounting(true);

    // Start a timer to periodically fetch stats from the direct counter
    timerRef.current = setInterval(async () => {
      try {
        // Fetch stats from the direct counter
        const statsResponse = await fetch(`${backendUrl}/api/get_direct_counter_stats?session_id=${startData.session_id}`);

        if (!statsResponse.ok) {
          console.warn('[fetchStats] Failed to fetch stats:', statsResponse.status);
          return;
        }

        const statsData = await statsResponse.json();
        console.log('[fetchStats] Stats received:', statsData);

        // Update the workout stats
        setWorkoutStats((prev) => ({
          ...prev,
          total_reps: statsData.stats.reps_completed,
          correct_reps: statsData.stats.reps_completed - statsData.stats.incorrect_forms,
          calories_burned: statsData.stats.calories_burned,
          form_accuracy: statsData.stats.form_accuracy,
          duration: statsData.elapsed_time,
          position: 'external', // Indicate that position is tracked externally
          form_feedback: 'See external window for form feedback',
          rep_status: `Last update: ${new Date().toLocaleTimeString()}`,
        }));
      } catch (err) {
        console.error('[fetchStats] Error:', err);
      }
    }, 1000);

    // Show a message to the user about the external window
    setChatMessages(prev => [...prev, {
      role: 'bot',
      content: `The push-up counter is now running in a separate window. Please check your taskbar or desktop for a new Python window. I'll continue to update your stats here as you work out.`
    }]);

  } catch (err) {
    console.error('[startWorkout] Error:', err);
    setError(`Failed to start workout: ${err.message}`);
    setIsCounting(false);
    cleanup();
  }
};

  // Process video frames
  const processVideoFrames = () => {
    console.log('[processVideoFrames] Starting video processing');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let frameCount = 0;
    const targetFPS = 10; // Process 10 frames per second

    // Define processFrame function first
    const processFrame = async () => {
      if (!isCounting || !videoRef.current || !videoRef.current.videoWidth) {
        console.log('[processFrame] Skipping frame - video not ready or counting stopped');
        if (isCounting) {
          // Try again later if we're still counting but video isn't ready
          animationRef.current = requestAnimationFrame(processFrame);
        }
        return;
      }

      try {
        frameCount++;
        // Skip frames to maintain target FPS but ensure we're not skipping too many
        // Process every 3 frames (20fps) for better pose detection
        if (frameCount % 3 !== 0) {
          animationRef.current = requestAnimationFrame(processFrame);
          return;
        }

        // Set canvas dimensions to match video
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        // Draw the video frame to the canvas
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Optional: Add visual indicators to help with positioning
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Draw positioning guides (subtle crosshair)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, canvas.height);
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvas.width, centerY);
        ctx.stroke();

        // Convert to JPEG with higher quality for better pose detection
        const imageData = canvas.toDataURL('image/jpeg', 0.85);

        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        console.log(`[processFrame] Sending frame to backend: ${backendUrl}/api/process_frame`);
        const response = await fetch(`${backendUrl}/api/process_frame`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: imageData,
            session_id: sessionId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Frame processing failed: ${response.status}`);
        }

        const data = await response.json();
        if (data.status === 'error') {
          throw new Error(data.message);
        }

        console.log('[processFrame] Received data from backend:', data);

        if (!data.stats) {
          console.error('[processFrame] No stats received from backend');
          throw new Error('No stats received from backend');
        }

        console.log('[processFrame] Stats received:', {
          reps_completed: data.stats.reps_completed,
          correct_reps: data.stats.correct_reps,
          calories_burned: data.stats.calories_burned,
          form_accuracy: data.stats.form_accuracy
        });

        // Get position and form feedback directly from the response
        const position = data.position || 'unknown';
        const formFeedback = data.form_feedback || 'Start in plank position';
        const repStatus = data.rep_status || '';

        console.log('[processFrame] Position:', position);
        console.log('[processFrame] Form feedback:', formFeedback);
        console.log('[processFrame] Rep status:', repStatus);

        // Update state with processed data
        setProcessedImage(data.processed_image);
        setWorkoutStats((prev) => {
          const newStats = {
            ...prev,
            total_reps: data.stats.reps_completed,
            correct_reps: data.stats.correct_reps,
            calories_burned: parseFloat(data.stats.calories_burned),
            form_accuracy: data.stats.form_accuracy,
            position: position,
            form_feedback: formFeedback,
            rep_status: repStatus,
          };
          console.log('[processFrame] Updated workout stats:', newStats);
          return newStats;
        });

        console.log('[processFrame] Updated state with processed image:', !!data.processed_image);
      } catch (err) {
        console.error('Frame processing error:', err);
        setError(`Frame processing error: ${err.message}`);
      } finally {
        if (isCounting) {
          animationRef.current = requestAnimationFrame(processFrame);
        }
      }
    };

    // Start processing frames
    if (videoRef.current && videoRef.current.videoWidth) {
      console.log('[processVideoFrames] Video already ready, starting frame processing');
      animationRef.current = requestAnimationFrame(processFrame);
    } else if (videoRef.current) {
      console.log('[processVideoFrames] Waiting for video to be ready');
      videoRef.current.addEventListener('loadeddata', () => {
        console.log('[processVideoFrames] Video ready, starting frame processing');
        animationRef.current = requestAnimationFrame(processFrame);
      });
    } else {
      console.log('[processVideoFrames] Video element not available');
    }
  };

  // Stop workout with direct counter integration
  const stopWorkout = async () => {
    if (!sessionId) {
      console.warn('No active workout session to end');
      cleanup();
      return;
    }

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      // Stop the direct push counter
      console.log(`[stopWorkout] Stopping direct push counter: ${backendUrl}/api/stop_direct_counter`);
      const stopResponse = await fetch(`${backendUrl}/api/stop_direct_counter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!stopResponse.ok) {
        console.warn('[stopWorkout] Failed to stop direct push counter:', stopResponse.status);
      } else {
        const stopData = await stopResponse.json();
        console.log('[stopWorkout] Direct push counter stopped:', stopData);

        // Update the final stats
        if (stopData.final_stats) {
          setWorkoutStats((prev) => ({
            ...prev,
            total_reps: stopData.final_stats.reps_completed,
            correct_reps: stopData.final_stats.reps_completed - stopData.final_stats.incorrect_forms,
            calories_burned: stopData.final_stats.calories_burned,
            form_accuracy: 100 - Math.round((stopData.final_stats.incorrect_forms / Math.max(1, stopData.final_stats.reps_completed)) * 100),
          }));
        }

        // Add message to chat with final stats and voice
        try {
          const chatResponse = await fetch(`${backendUrl}/api/pushup-chat/stop-pushup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              outputMode: useVoice ? "voice" : "text"
            }),
          });

          if (chatResponse.ok) {
            const chatData = await chatResponse.json();

            // Add bot message with avatar
            setChatMessages(prev => [...prev, {
              role: 'bot',
              content: chatData.response || `Great workout! The push-up counter window has been closed. You completed ${stopData.final_stats.reps_completed} push-ups with ${stopData.final_stats.incorrect_forms} form issues. You burned approximately ${parseFloat(stopData.final_stats.calories_burned).toFixed(1)} calories.`,
              avatar_url: chatData.avatar_url || null
            }]);

            // Play audio if available
            if (chatData.audio_url && useVoice) {
              playAudio(`${backendUrl}${chatData.audio_url}`);
            }
          } else {
            // Fallback if API call fails
            setChatMessages(prev => [...prev, {
              role: 'bot',
              content: `Great workout! The push-up counter window has been closed. You completed ${stopData.final_stats.reps_completed} push-ups with ${stopData.final_stats.incorrect_forms} form issues. You burned approximately ${parseFloat(stopData.final_stats.calories_burned).toFixed(1)} calories.`
            }]);
          }
        } catch (err) {
          console.error('[stopWorkout] Error getting voice response:', err);
          // Fallback message
          setChatMessages(prev => [...prev, {
            role: 'bot',
            content: `Great workout! The push-up counter window has been closed. You completed ${stopData.final_stats.reps_completed} push-ups with ${stopData.final_stats.incorrect_forms} form issues. You burned approximately ${parseFloat(stopData.final_stats.calories_burned).toFixed(1)} calories.`
          }]);
        }
      }

      // Open chat to show the workout summary
      setShowChat(true);

    } catch (err) {
      console.error('End workout error:', err);
      setError(`Failed to end workout: ${err.message}`);
    } finally {
      cleanup();
    }
  };

  // Cleanup resources
  const cleanup = () => {
    console.log('[cleanup] Cleaning up resources');

    // Stop video tracks
    if (videoRef.current?.srcObject) {
      console.log('[cleanup] Stopping video tracks');
      videoRef.current.srcObject.getTracks().forEach((track) => {
        console.log(`[cleanup] Stopping track: ${track.kind}`);
        track.stop();
      });
      videoRef.current.srcObject = null;
    }

    // Cancel animation frame
    if (animationRef.current) {
      console.log('[cleanup] Canceling animation frame');
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Clear timer
    if (timerRef.current) {
      console.log('[cleanup] Clearing timer');
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Reset state
    console.log('[cleanup] Resetting state');
    setIsCounting(false);
    setSessionId(null);
    setProcessedImage(null);

    console.log('[cleanup] Cleanup complete');
  };

  // Play audio from URL
  const playAudio = (audioUrl) => {
    if (!useVoice) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = audioUrl;
      audioRef.current.onplay = () => setIsAudioPlaying(true);
      audioRef.current.onended = () => setIsAudioPlaying(false);
      audioRef.current.onerror = () => {
        console.error('Audio playback error');
        setIsAudioPlaying(false);
      };

      audioRef.current.play().catch(err => {
        console.error('Failed to play audio:', err);
        setIsAudioPlaying(false);
      });
    }
  };

  // Chat functions
  const startChatSession = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      console.log(`[startChatSession] Starting chat session: ${backendUrl}/api/pushup-chat/start`);

      const response = await fetch(`${backendUrl}/api/pushup-chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          outputMode: useVoice ? "voice" : "text"
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start chat session: ${response.status}`);
      }

      const data = await response.json();
      console.log('[startChatSession] Response:', data);

      // Add bot message with avatar
      setChatMessages(prev => [...prev, {
        role: 'bot',
        content: data.response,
        avatar_url: data.avatar_url || null
      }]);

      // Play audio if available
      if (data.audio_url && useVoice) {
        playAudio(`${backendUrl}${data.audio_url}`);
      }

      setChatSessionStarted(true);
    } catch (err) {
      console.error('Start chat session error:', err);
      setChatMessages(prev => [...prev, { role: 'bot', content: 'Sorry, I had trouble connecting. Please try again.' }]);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // Start chat session if not started
    if (!chatSessionStarted) {
      await startChatSession();
    }

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      console.log(`[sendMessage] Sending message to: ${backendUrl}/api/pushup-chat/message`);

      const response = await fetch(`${backendUrl}/api/pushup-chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: userMessage,
          outputMode: useVoice ? "voice" : "text"
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();
      console.log('[sendMessage] Response:', data);

      // Add bot response to chat with avatar
      setChatMessages(prev => [...prev, {
        role: 'bot',
        content: data.response,
        avatar_url: data.avatar_url || null
      }]);

      // Play audio if available
      if (data.audio_url && useVoice) {
        playAudio(`${backendUrl}${data.audio_url}`);
      }

      // Scroll to bottom of chat
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    } catch (err) {
      console.error('Send message error:', err);
      setChatMessages(prev => [...prev, { role: 'bot', content: 'Sorry, I had trouble responding. Please try again.' }]);
    }
  };

  const toggleChat = () => {
    setShowChat(prev => !prev);

    // Start chat session if not started and chat is being opened
    if (!chatSessionStarted && !showChat) {
      startChatSession();
    }
  };

  // Handle Enter key in chat input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Initialize video element when component mounts
  useEffect(() => {
    console.log('[useEffect] Component mounted, initializing video ref');
    // Just checking if the ref is available
    if (videoRef.current) {
      console.log('[useEffect] Video ref is available on mount');
    }

    // Start chat session
    startChatSession();

    // Scroll to bottom of chat when messages change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }

    // Clean up on component unmount
    return () => {
      console.log('[useEffect] Component unmounting, cleaning up');
      cleanup();
    };
  }, []);

  // Effect to scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Chat toggle button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 p-4 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        aria-label="Toggle chat"
      >
        {showChat ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat panel */}
      {showChat && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 h-96 bg-white rounded-lg shadow-xl flex flex-col overflow-hidden">
          {/* Chat header */}
          <div className="bg-purple-600 text-white p-3 flex justify-between items-center">
            <div className="flex items-center">
              <h3 className="font-medium">Fitness Buddy</h3>
              <button
                onClick={() => setUseVoice(!useVoice)}
                className="ml-2 text-white hover:text-purple-200 p-1"
                title={useVoice ? "Mute voice" : "Enable voice"}
              >
                {useVoice ? "🔊" : "🔇"}
              </button>
            </div>
            <button onClick={toggleChat} className="text-white hover:text-purple-200">
              <X size={20} />
            </button>
          </div>

          {/* Chat messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'bot' && msg.avatar_url && (
                  <div className="h-8 w-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                    <img
                      src={msg.avatar_url}
                      alt="Fitness Buddy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Hidden audio element for voice responses */}
          <audio ref={audioRef} className="hidden" controls={false} />


          {/* Chat input */}
          <div className="border-t border-gray-200 p-3 flex">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={sendMessage}
              className="bg-purple-600 text-white px-4 py-2 rounded-r-lg hover:bg-purple-700 transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Video feed */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Push-Up Tracker</h2>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {/* Always render the video element but keep it hidden when not counting */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
                style={{ display: isCounting && !processedImage ? 'block' : 'none' }}
                onLoadedMetadata={() => console.log('Video metadata loaded in UI')}
                onPlay={() => console.log('Video playback started in UI')}
                onError={(e) => console.error('Video error in UI:', e)}
              />

              {isCounting ? (
                <>
                  {processedImage && (
                    <img
                      src={processedImage}
                      alt="Processed frame"
                      className="w-full h-full object-contain"
                      onLoad={() => console.log('Processed image loaded')}
                      onError={(e) => console.error('Image load error:', e)}
                    />
                  )}
                  {/* External window notice */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white p-6 text-center">
                    <div className="bg-gray-800 p-6 rounded-lg max-w-md">
                      <h3 className="text-xl font-semibold mb-4">Push-Up Tracking Active</h3>
                      <p className="mb-6">
                        The push-up counter is running in a separate window. Please check your taskbar or desktop for a new Python window.
                      </p>

                      {/* Stats display */}
                      <div className="bg-gray-900 p-4 rounded-lg mb-6">
                        <h4 className="text-lg font-medium mb-3 text-blue-300">Current Stats</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center">
                            <Award className="h-6 w-6 text-yellow-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-400">Reps</div>
                              <div className="text-xl font-bold">{workoutStats.total_reps}</div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Flame className="h-6 w-6 text-red-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-400">Calories</div>
                              <div className="text-xl font-bold">{workoutStats.calories_burned.toFixed(1)}</div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-6 w-6 text-blue-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-400">Duration</div>
                              <div className="text-xl font-bold">{formatDuration(workoutStats.duration)}</div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="h-6 w-6 text-green-400 mr-2">✓</div>
                            <div>
                              <div className="text-sm text-gray-400">Form</div>
                              <div className="text-xl font-bold">{workoutStats.form_accuracy}%</div>
                            </div>
                          </div>
                        </div>

                        {workoutStats.rep_status && (
                          <div className="mt-4 text-sm text-gray-400 text-center">
                            {workoutStats.rep_status}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Stop button */}
                  <button
                    onClick={stopWorkout}
                    className="absolute top-4 right-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Stop
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <p className="text-lg mb-4">Camera feed will appear here</p>
                    <button
                      onClick={() => setShowStartModal(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center mx-auto"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Start Workout
                    </button>
                  </div>
                </div>
              )}
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right column - Stats and Actions */}
        <div className="space-y-6">
          {/* Current workout stats */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Workout</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-blue-600 font-bold text-3xl">{workoutStats.total_reps}</div>
                <div className="text-gray-600 text-sm">Total Reps</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-green-600 font-bold text-3xl">{workoutStats.correct_reps}</div>
                <div className="text-gray-600 text-sm">Correct Reps</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-yellow-600 font-bold text-3xl">{workoutStats.form_accuracy}%</div>
                <div className="text-gray-600 text-sm">Form Accuracy</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-red-600 font-bold text-3xl">
                  {workoutStats.calories_burned.toFixed(1)}
                </div>
                <div className="text-gray-600 text-sm">Calories</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">{formatDuration(workoutStats.duration)}</span>
              </div>
            </div>
          </div>

          {/* Recent workouts */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Workouts</h2>
              <button className="text-blue-600 text-sm flex items-center">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            <div className="space-y-4">
              {recentWorkouts.map((workout) => (
                <div
                  key={workout._id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{formatDate(workout.start_time)}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDuration(workout.duration)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">
                        {workout.correct_reps}/{workout.total_reps}
                      </div>
                      <div className="text-sm text-gray-500">
                        {workout.calories_burned.toFixed(1)} cal
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <button
              onClick={() => setShowStartModal(true)}
              disabled={isCounting}
              className={`w-full py-3 bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center ${
                isCounting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              <Play className="h-5 w-5 mr-2" />
              Start New Workout
            </button>
            {isCounting && (
              <button
                onClick={stopWorkout}
                className="w-full mt-2 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                End Workout
              </button>
            )}

            {/* Chat quick actions */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-md font-medium text-gray-700 mb-3">Ask Fitness Buddy</h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => {
                    setShowChat(true);
                    setInputMessage("How do I maintain proper push-up form?");
                    setTimeout(() => sendMessage(), 100);
                  }}
                  className="py-2 px-3 bg-purple-100 text-purple-800 rounded-lg text-sm hover:bg-purple-200 transition-colors text-left"
                >
                  How do I maintain proper push-up form?
                </button>
                <button
                  onClick={() => {
                    setShowChat(true);
                    setInputMessage("What muscles do push-ups work?");
                    setTimeout(() => sendMessage(), 100);
                  }}
                  className="py-2 px-3 bg-purple-100 text-purple-800 rounded-lg text-sm hover:bg-purple-200 transition-colors text-left"
                >
                  What muscles do push-ups work?
                </button>
                <button
                  onClick={() => {
                    setShowChat(true);
                    setInputMessage("Give me a push-up challenge");
                    setTimeout(() => sendMessage(), 100);
                  }}
                  className="py-2 px-3 bg-purple-100 text-purple-800 rounded-lg text-sm hover:bg-purple-200 transition-colors text-left"
                >
                  Give me a push-up challenge
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Workout Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Start Workout</h2>
            <p className="text-gray-600 mb-4">
              Make sure you're in a well-lit area with enough space. Position yourself so your upper body
              is visible in the camera.
            </p>

            {/* Positioning guide */}
            <div className="relative w-full h-48 border-2 border-dashed border-blue-400 mb-6 flex items-center justify-center bg-gray-100">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-16 border-2 border-dashed border-yellow-400 rounded-full mt-[-40px]"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-32 border-2 border-dashed border-green-400 mt-[20px]"></div>
              </div>
              <div className="text-sm text-blue-700 bg-white bg-opacity-80 p-2 rounded absolute bottom-2 left-2">
                <ul className="list-disc pl-4">
                  <li>Position your shoulders in the yellow circle</li>
                  <li>Keep your body in the green area</li>
                  <li>Ensure good lighting for better tracking</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowStartModal(false)}
                className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={startWorkout}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}