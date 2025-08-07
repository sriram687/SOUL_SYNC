import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Utensils, FileText, Brain, Plus, X, BarChart2, Heart, Clock, Activity, Flame, Droplet, Zap, Scissors, Bell, Target } from 'lucide-react';
import axios from 'axios';
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Chart } from 'react-google-charts';
import { Tooltip } from 'react-tooltip';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

const Nutrition = () => {
  const navigate = useNavigate();

  // Token expiration check function
  const isTokenExpired = () => {
    const token = localStorage.getItem('token');
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch (error) {
      return true;
    }
  };

  // Personal Metrics State
  const [bodyMetrics, setBodyMetrics] = useState({
    weight: '',
    height: '',
    age: '',
    gender: '',
    activityLevel: 'moderate',
  });

  // Nutrition Search State
  const [foodQuery, setFoodQuery] = useState('');
  const [foodResults, setFoodResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nutrients, setNutrients] = useState([]);
  const [dailyGoals, setDailyGoals] = useState({
    calories: 2000,
    protein: 50,
    carbs: 300,
    fat: 65
  });
  const [activeTab, setActiveTab] = useState('search');
  const [mealType, setMealType] = useState('breakfast');
  const [showModal, setShowModal] = useState(false);
  const [waterIntake, setWaterIntake] = useState(0);
  const searchInputRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));


  const handleDateChange = (date) => {
    setSelectedDate(date);
    fetchDiaryEntries(date);
  };

  // Notification functions
  const showWaterReminder = () => {
    console.log('showWaterReminder called');
    const waterTips = [
      "💧 Stay hydrated! Aim for 8 glasses of water daily for optimal health.",
      "🌊 Your body is 60% water - keep it replenished throughout the day!",
      "💦 Drinking water helps boost metabolism and aids digestion.",
      "🥤 Pro tip: Add lemon or cucumber to make water more refreshing!",
      "⏰ Set hourly reminders to sip water regularly."
    ];

    const randomTip = waterTips[Math.floor(Math.random() * waterTips.length)];

    toast.info(randomTip, {
      position: "top-right",
      autoClose: 5000,
    });
  };

  const showDailyGoalsNotification = () => {
    console.log('showDailyGoalsNotification called');
    const goalTips = [
      "🎯 Welcome to your nutrition journey! Set realistic daily goals for success.",
      "📊 Track your macros: Balance proteins, carbs, and healthy fats.",
      "🥗 Remember: Small consistent changes lead to big results!",
      "💪 Your daily goals are personalized - stick to them for optimal health.",
      "🌟 Every meal is a new opportunity to nourish your body!"
    ];

    const randomGoalTip = goalTips[Math.floor(Math.random() * goalTips.length)];

    toast.success(randomGoalTip, {
      position: "top-center",
      autoClose: 6000,
    });
  };

  const showHydrationProgress = (glasses) => {
    const messages = {
      1: "🌟 Great start! Keep the momentum going!",
      2: "💪 You're building a healthy habit!",
      3: "🔥 Fantastic! Your body is thanking you!",
      4: "⭐ Halfway there! You're doing amazing!",
      5: "🚀 Over halfway! Keep pushing forward!",
      6: "🎉 Excellent progress! Almost at your goal!",
      7: "🏆 One more glass to go! You've got this!",
      8: "🎊 Goal achieved! You're a hydration champion!"
    };

    if (messages[glasses]) {
      toast.success(messages[glasses], {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        icon: "💧"
      });
    }
  };

  const showNutritionTips = () => {
    console.log('showNutritionTips called');
    const nutritionTips = [
      "🥬 Eat the rainbow! Different colored foods provide various nutrients.",
      "🍎 Whole foods are always better than processed alternatives.",
      "🥜 Don't forget healthy fats - they're essential for nutrient absorption!",
      "🍽️ Practice mindful eating - chew slowly and savor your meals.",
      "⚖️ Balance is key - no food is completely off-limits in moderation."
    ];

    const randomNutritionTip = nutritionTips[Math.floor(Math.random() * nutritionTips.length)];

    toast.info(randomNutritionTip, {
      position: "bottom-left",
      autoClose: 5000,
    });
  };

  const DateSelector = () => {
    return (
      <div className="flex items-center space-x-2 mb-4">
        <CalendarIcon className="h-5 w-5 text-gray-500" />
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
        />
      </div>
    );
  };

  // Calculate daily progress
  const calculateProgress = () => {
    const totals = diaryEntries.reduce((acc, entry) => {
      return {
        calories: acc.calories + (parseFloat(entry.food.calories) || 0),
        protein: acc.protein + (parseFloat(entry.food.protein) || 0),
        carbs: acc.carbs + (parseFloat(entry.food.carbs) || 0),
        fat: acc.fat + (parseFloat(entry.food.fat) || 0)
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    return {
      calories: Math.min((totals.calories / dailyGoals.calories) * 100, 100),
      protein: Math.min((totals.protein / dailyGoals.protein) * 100, 100),
      carbs: Math.min((totals.carbs / dailyGoals.carbs) * 100, 100),
      fat: Math.min((totals.fat / dailyGoals.fat) * 100, 100)
    };
  };

  const progress = calculateProgress();

  // Safe nutrition value extraction
  const extractNutritionValue = (food, nutrientId) => {
    if (!food.foodNutrients) return 'N/A';
    
    const nutrient = food.foodNutrients.find(n => n.nutrientId === nutrientId);
    return nutrient ? `${Math.round(nutrient.value * 10) / 10} ${nutrient.unitName.toLowerCase()}` : 'N/A';
  };

  // Food Search
  const searchFood = async () => {
    if (!foodQuery.trim()) {
      setError('Please enter a food name');
      toast.error('Please enter a food name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/nutrition/search`,
        { params: { query: foodQuery } }
      );
      
      setFoodResults(response.data.foods || []);
      if (response.data.foods?.length === 0) {
        toast.info('No results found. Try a different search term.');
      }
    } catch (err) {
      setError('Failed to fetch food data');
      toast.error('Failed to fetch food data');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };


  const fetchDiaryEntries = async (date = new Date().toISOString().slice(0, 10)) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }
  
      // Check if token is expired before making the request
      if (isTokenExpired()) {
        toast.error('Your session has expired. Please log in again.');
        navigate('/login');
        return;
      }
  
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/nutrition/diary`, 
        {
          params: { date },
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
  
      // MongoDB ObjectIDs need to be converted to regular IDs for React state
      const formattedEntries = response.data.map(entry => ({
        ...entry,
        id: entry._id.$oid || entry._id || Date.now() // Handle MongoDB ObjectID format
      }));
  
      setDiaryEntries(formattedEntries);
      console.log('Loaded diary entries:', formattedEntries);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        toast.error('Authentication error. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error('Failed to load your diary entries');
        console.error('Fetch diary error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add this useEffect to load diary entries on component mount
useEffect(() => {
  // Focus search input on mount
  searchInputRef.current?.focus();

  // Load today's diary entries
  fetchDiaryEntries();

  // Fetch user's saved metrics and goals if you have them stored
  fetchUserMetrics();

  // Test immediate notification
  console.log('Component mounted, showing test notification');
  toast.success('🎉 Welcome to Nutrition Tracker!');
}, []);

// Separate useEffect for notifications to avoid dependency issues
useEffect(() => {
  console.log('Notifications useEffect triggered');
  // Show initial notifications with a slight delay to ensure component is mounted
  const timer1 = setTimeout(() => {
    console.log('Timer 1 executing - Daily Goals');
    showDailyGoalsNotification();
  }, 2000);

  const timer2 = setTimeout(() => {
    console.log('Timer 2 executing - Water Reminder');
    showWaterReminder();
  }, 5000);

  const timer3 = setTimeout(() => {
    console.log('Timer 3 executing - Nutrition Tips');
    showNutritionTips();
  }, 8000);

  return () => {
    clearTimeout(timer1);
    clearTimeout(timer2);
    clearTimeout(timer3);
  };
}, []); // Empty dependency array means this runs once on mount

// Water intake notifications
useEffect(() => {
  if (waterIntake > 0) {
    showHydrationProgress(waterIntake);
  }
}, [waterIntake]);

// Periodic water reminders
useEffect(() => {
  const waterReminderInterval = setInterval(() => {
    if (waterIntake < 8) {
      showWaterReminder();
    }
  }, 30 * 60 * 1000); // Every 30 minutes

  return () => clearInterval(waterReminderInterval);
}, [waterIntake]);




// Add this function to fetch user metrics from the backend
const fetchUserMetrics = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (isTokenExpired()) {
      return; // Already handled in fetchDiaryEntries
    }

    // First try to load from localStorage for quick render
    const cachedMetrics = localStorage.getItem('userMetrics');
    const cachedGoals = localStorage.getItem('userGoals');
    
    if (cachedMetrics) {
      setBodyMetrics(JSON.parse(cachedMetrics));
    }
    
    if (cachedGoals) {
      setDailyGoals(JSON.parse(cachedGoals));
    }

    // Then fetch from backend (if you have API endpoints for these)
    // This is optional - implement these API endpoints if needed
    const metricsResponse = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/user/metrics`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (metricsResponse.data) {
      setBodyMetrics(metricsResponse.data);
      localStorage.setItem('userMetrics', JSON.stringify(metricsResponse.data));
    }
    
    const goalsResponse = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/user/goals`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (goalsResponse.data) {
      setDailyGoals(goalsResponse.data);
      localStorage.setItem('userGoals', JSON.stringify(goalsResponse.data));
    }
  } catch (err) {
    // Silently fail - we already have localStorage fallback
    console.error('Failed to fetch user metrics:', err);
  }
};

  // Autocomplete
  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/nutrition/autocomplete`,
        { params: { query } }
      );
      setSuggestions(response.data.suggestions || []);
    } catch (err) {
      console.error("Autocomplete error:", err);
    }
  };

  // Get Food Details
  const getFoodDetails = async (fdcId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/nutrition/get`,
        { params: { fdc_id: fdcId } }
      );
      
      setSelectedFood(response.data);
      
      // Extract and format nutrients for display
      if (response.data.foodNutrients) {
        const importantNutrients = response.data.foodNutrients.filter(n => 
          [1008, 1003, 1004, 1005, 1093, 1087, 1089, 1106].includes(n.nutrientId)
        );
        setNutrients(importantNutrients);
      }
      
      // Scroll to details section
      setTimeout(() => {
        document.getElementById('nutrition-details')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (err) {
      setError('Failed to fetch food details');
      toast.error('Failed to fetch food details');
      console.error('Food details error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add to Diary
  const addToDiary = async (food, mealType) => {
    if (!food) return;
  
    // Check if token is expired
    if (isTokenExpired()) {
      toast.error('Your session has expired. Please log in again.');
      // Redirect to login page
      navigate('/login');
      return;
    }
  
    const foodName = food.description || food.brandOwner || 'Unknown Food';
    const newEntry = {
      id: Date.now(),
      food: {
        name: foodName,
        calories: extractNutritionValue(food, 1008),
        protein: extractNutritionValue(food, 1003),
        carbs: extractNutritionValue(food, 1005),
        fat: extractNutritionValue(food, 1004),
        fdcId: food.fdcId
      },
      mealType,
      date: new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    };
  
    // Store locally in state
    setDiaryEntries(prev => [newEntry, ...prev]);
  
    // Save to DB
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
  
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/nutrition/diary`, newEntry, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success(`${foodName} added to ${mealType} and saved!`);
    } catch (err) {
      // Check for specific authentication errors
      if (err.response && err.response.status === 401) {
        toast.error('Authentication error. Please log in again.');
        // Clean up invalid token
        localStorage.removeItem('token');
        // Redirect to login page
        navigate('/login');
      } else {
        toast.error('Saved locally but failed to store in DB');
        console.error('DB Save Error:', err);
      }
    }
  
    setShowModal(false);
  };

  // Remove from Diary
  const removeFromDiary = (id) => {
    setDiaryEntries(prev => prev.filter(entry => entry.id !== id));
    toast.info('Food removed from diary');
  };

  // Common nutrients IDs (USDA standard)
  const nutrientMap = {
    1008: { name: 'Calories', unit: 'kcal', icon: <Flame className="w-4 h-4" /> },
    1003: { name: 'Protein', unit: 'g', icon: <Scissors className="w-4 h-4" /> },
    1004: { name: 'Fat', unit: 'g', icon: <Droplet className="w-4 h-4" /> },
    1005: { name: 'Carbs', unit: 'g', icon: <Zap className="w-4 h-4" /> },
    1093: { name: 'Sodium', unit: 'mg', icon: <Activity className="w-4 h-4" /> },
    1087: { name: 'Calcium', unit: 'mg', icon: <Plus className="w-4 h-4" /> },
    1089: { name: 'Iron', unit: 'mg', icon: <Plus className="w-4 h-4" /> },
    1106: { name: 'Vitamin D', unit: 'IU', icon: <Plus className="w-4 h-4" /> }
  };

  // Calculate meal totals
  const calculateMealTotals = (mealType) => {
    return diaryEntries
      .filter(entry => entry.mealType.toLowerCase() === mealType.toLowerCase())
      .reduce((acc, entry) => {
        return {
          calories: acc.calories + (parseFloat(entry.food.calories) || 0),
          protein: acc.protein + (parseFloat(entry.food.protein) || 0),
          carbs: acc.carbs + (parseFloat(entry.food.carbs) || 0),
          fat: acc.fat + (parseFloat(entry.food.fat) || 0)
        };
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  // Chart data for macro nutrients
  const macroData = [
    ['Macro', 'Amount'],
    ['Protein', parseFloat(calculateMealTotals('all').protein)],
    ['Carbs', parseFloat(calculateMealTotals('all').carbs)],
    ['Fat', parseFloat(calculateMealTotals('all').fat)]
  ];

  // Popular foods to suggest
  const popularFoods = [
    { name: 'Apple', emoji: '🍎' },
    { name: 'Banana', emoji: '🍌' },
    { name: 'Chicken Breast', emoji: '🍗' },
    { name: 'Salmon', emoji: '🐟' },
    { name: 'Egg', emoji: '🥚' },
    { name: 'Avocado', emoji: '🥑' },
    { name: 'Broccoli', emoji: '🥦' },
    { name: 'Rice', emoji: '🍚' }
  ];

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  return (

    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-yellow-50">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 9999 }}
      />
      
      <header className="fixed top-0 w-full z-50 flex justify-between items-center p-5 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <Brain className="w-10 h-10 text-emerald-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-yellow-500 bg-clip-text text-transparent">
              Soul Sync
            </h1>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-full transition ${activeTab === 'search' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Food Search
          </button>
          <button
            onClick={() => setActiveTab('diary')}
            className={`px-4 py-2 rounded-full transition ${activeTab === 'diary' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            My Diary
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2 rounded-full transition ${activeTab === 'insights' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Insights
          </button>
          {/* Test notification button */}
          <button
            onClick={() => {
              console.log('Test button clicked');
              toast.success('🎉 Test notification working!', {
                position: "top-right",
                autoClose: 3000,
              });
            }}
            className="px-3 py-2 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 transition"
          >
            Test
          </button>
        </div>
      </header>
      
      <div className="min-h-screen pt-24 pb-10 px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column - Personal Metrics */}
              <div className="lg:col-span-1 space-y-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-emerald-800 flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Daily Goals
                    </h2>
                    <button
                      onClick={showDailyGoalsNotification}
                      className="p-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition"
                      title="Get goal tips"
                    >
                      <Target className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-4 rounded-xl">
                      <div className="h-24">
                        <CircularProgressbar
                          value={progress.calories}
                          text={`${Math.round(progress.calories)}%`}
                          styles={buildStyles({
                            pathColor: '#10b981',
                            textColor: '#065f46',
                            trailColor: '#d1fae5',
                            textSize: '24px'
                          })}
                        />
                      </div>
                      <p className="text-center mt-2 text-sm font-medium text-emerald-800">Calories</p>
                    </div>
                    
                    <div className="bg-emerald-50 p-4 rounded-xl">
                      <div className="h-24">
                        <CircularProgressbar
                          value={progress.protein}
                          text={`${Math.round(progress.protein)}%`}
                          styles={buildStyles({
                            pathColor: '#3b82f6',
                            textColor: '#1e40af',
                            trailColor: '#dbeafe',
                            textSize: '24px'
                          })}
                        />
                      </div>
                      <p className="text-center mt-2 text-sm font-medium text-blue-800">Protein</p>
                    </div>
                    
                    <div className="bg-emerald-50 p-4 rounded-xl">
                      <div className="h-24">
                        <CircularProgressbar
                          value={progress.carbs}
                          text={`${Math.round(progress.carbs)}%`}
                          styles={buildStyles({
                            pathColor: '#f59e0b',
                            textColor: '#92400e',
                            trailColor: '#fef3c7',
                            textSize: '24px'
                          })}
                        />
                      </div>
                      <p className="text-center mt-2 text-sm font-medium text-amber-800">Carbs</p>
                    </div>
                    
                    <div className="bg-emerald-50 p-4 rounded-xl">
                      <div className="h-24">
                        <CircularProgressbar
                          value={progress.fat}
                          text={`${Math.round(progress.fat)}%`}
                          styles={buildStyles({
                            pathColor: '#8b5cf6',
                            textColor: '#5b21b6',
                            trailColor: '#ede9fe',
                            textSize: '24px'
                          })}
                        />
                      </div>
                      <p className="text-center mt-2 text-sm font-medium text-violet-800">Fat</p>
                    </div>
                  </div>
                </motion.div>

                {/* Water Tracker */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                  <h2 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <Droplet className="w-5 h-5" />
                    Water Intake
                  </h2>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Today's goal: 8 glasses</span>
                    <span className="text-sm font-medium">{waterIntake}/8</span>
                  </div>
                  
                  <div className="grid grid-cols-8 gap-2">
                    {[...Array(8)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setWaterIntake(i + 1)}
                        className={`h-12 rounded-lg transition-all ${i < waterIntake ? 'bg-blue-500' : 'bg-blue-100'}`}
                      />
                    ))}
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => setWaterIntake(prev => Math.min(prev + 1, 8))}
                      className="w-full bg-blue-100 text-blue-800 py-2 rounded-lg hover:bg-blue-200 transition flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Glass
                    </button>

                    <button
                      onClick={showWaterReminder}
                      className="w-full bg-blue-50 text-blue-700 py-2 rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2 text-sm"
                    >
                      <Bell className="w-4 h-4" />
                      Get Hydration Tip
                    </button>
                  </div>
                </motion.div>

                {/* Popular Foods */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                  <h2 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Popular Foods
                  </h2>
                  
                  <div className="grid grid-cols-4 gap-3">
                    {popularFoods.map((food, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setFoodQuery(food.name);
                          searchInputRef.current.focus();
                        }}
                        className="flex flex-col items-center p-2 rounded-lg hover:bg-emerald-50 transition"
                        data-tooltip-id="food-tooltip"
                        data-tooltip-content={food.name}
                      >
                        <span className="text-2xl">{food.emoji}</span>
                        <span className="text-xs mt-1 text-gray-600 truncate w-full text-center">{food.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Middle Column - Food Search */}
              <div className="lg:col-span-2 space-y-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Utensils className="text-emerald-600" />
                    <h2 className="text-xl font-bold text-emerald-800">Discover Foods</h2>
                  </div>

                  <div className="relative">
                    <div className="relative">
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search for food (e.g., apple, chicken breast)..."
                        className="w-full p-4 border border-gray-200 rounded-xl text-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        value={foodQuery}
                        onChange={(e) => {
                          setFoodQuery(e.target.value);
                          fetchSuggestions(e.target.value);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && searchFood()}
                      />
                      <button
                        onClick={searchFood}
                        disabled={loading}
                        className="absolute right-2 top-2 bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition flex justify-center items-center"
                      >
                        {loading ? <Loader2 className="animate-spin" /> : "Search"}
                      </button>
                    </div>
                    
                    {suggestions.length > 0 && (
                      <motion.ul 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto"
                      >
                        {suggestions.map((item, index) => (
                          <motion.li
                            key={index}
                            whileHover={{ scale: 1.01 }}
                            className="p-3 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-0"
                            onClick={() => {
                              setFoodQuery(item);
                              setSuggestions([]);
                              searchInputRef.current.focus();
                            }}
                          >
                            {item}
                          </motion.li>
                        ))}
                      </motion.ul>
                    )}
                  </div>

                  {error && <p className="mt-2 text-red-500">{error}</p>}

                  {/* Search Results */}
                  <div className="mt-6">
                    {foodResults.length > 0 && (
                      <h3 className="text-lg font-semibold text-gray-700 mb-3">Search Results</h3>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {foodResults.map(food => (
                        <motion.div
                          key={food.fdcId}
                          whileHover={{ y: -2 }}
                          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
                          onClick={() => getFoodDetails(food.fdcId)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="bg-emerald-100 p-2 rounded-lg">
                              <Utensils className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{food.description || food.brandOwner || 'Unknown Food'}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {food.brandOwner && food.description ? `${food.brandOwner} • ` : ''}
                                {food.dataType || 'Generic'}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Nutrition Details */}
                {selectedFood && (
                  <motion.div
                    id="nutrition-details"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="text-emerald-600" />
                        <h2 className="text-xl font-bold text-emerald-800">Nutrition Details</h2>
                      </div>
                      <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                      >
                        Add to Diary
                      </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {selectedFood.description || 'Food Details'}
                        </h3>
                        {selectedFood.brandOwner && (
                          <p className="text-sm text-gray-600 mb-4">{selectedFood.brandOwner}</p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="bg-emerald-50 p-4 rounded-xl flex items-center gap-3">
                            <div className="bg-emerald-100 p-2 rounded-lg">
                              <Flame className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm text-emerald-700">Calories</p>
                              <p className="font-bold text-lg">
                                {extractNutritionValue(selectedFood, 1008)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Scissors className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-blue-700">Protein</p>
                              <p className="font-bold text-lg">
                                {extractNutritionValue(selectedFood, 1003)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-amber-50 p-4 rounded-xl flex items-center gap-3">
                            <div className="bg-amber-100 p-2 rounded-lg">
                              <Zap className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-sm text-amber-700">Carbs</p>
                              <p className="font-bold text-lg">
                                {extractNutritionValue(selectedFood, 1005)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-violet-50 p-4 rounded-xl flex items-center gap-3">
                            <div className="bg-violet-100 p-2 rounded-lg">
                              <Droplet className="w-5 h-5 text-violet-600" />
                            </div>
                            <div>
                              <p className="text-sm text-violet-700">Fat</p>
                              <p className="font-bold text-lg">
                                {extractNutritionValue(selectedFood, 1004)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="md:w-1/2">
                        <h4 className="font-medium text-emerald-800 mb-3">Additional Nutrients</h4>
                        <div className="space-y-3">
                          {nutrients.filter(n => ![1008, 1003, 1004, 1005].includes(n.nutrientId)).map(nutrient => (
                            <div key={nutrient.nutrientId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                {nutrientMap[nutrient.nutrientId]?.icon || <Plus className="w-4 h-4" />}
                                <span className="text-sm text-gray-700">
                                  {nutrientMap[nutrient.nutrientId]?.name || `Nutrient ${nutrient.nutrientId}`}
                                </span>
                              </div>
                              <span className="text-sm font-medium">
                                {nutrient.value} {nutrient.unitName.toLowerCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'diary' && (
            <motion.div
              key="diary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-emerald-800 flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Food Diary
                  </h2>
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Food
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {['Breakfast', 'Lunch', 'Dinner'].map(meal => {
                    const totals = calculateMealTotals(meal);
                    return (
                      <div key={meal} className="bg-gray-50 p-4 rounded-xl">
                        <h3 className="font-medium text-gray-900 mb-2">{meal}</h3>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Calories</span>
                            <span className="font-medium">{Math.round(totals.calories)} kcal</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Protein</span>
                            <span className="font-medium">{Math.round(totals.protein)}g</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Carbs</span>
                            <span className="font-medium">{Math.round(totals.carbs)}g</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Fat</span>
                            <span className="font-medium">{Math.round(totals.fat)}g</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {diaryEntries.length > 0 ? (
                  <div className="space-y-4">
                    {diaryEntries.map(entry => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{entry.food.name}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {entry.mealType} • {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromDiary(entry.id)}
                            className="text-gray-400 hover:text-red-500 transition"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 mt-3">
                          <div className="bg-emerald-50 p-2 rounded-lg text-center">
                            <p className="text-xs text-emerald-700">Calories</p>
                            <p className="font-medium">{entry.food.calories}</p>
                          </div>
                          <div className="bg-blue-50 p-2 rounded-lg text-center">
                            <p className="text-xs text-blue-700">Protein</p>
                            <p className="font-medium">{entry.food.protein}</p>
                          </div>
                          <div className="bg-amber-50 p-2 rounded-lg text-center">
                            <p className="text-xs text-amber-700">Carbs</p>
                            <p className="font-medium">{entry.food.carbs}</p>
                          </div>
                          <div className="bg-violet-50 p-2 rounded-lg text-center">
                            <p className="text-xs text-violet-700">Fat</p>
                            <p className="font-medium">{entry.food.fat}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="mx-auto w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                      <Utensils className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No entries yet</h3>
                    <p className="text-gray-600 mb-4">Start by adding foods to your diary</p>
                    <button
                      onClick={() => {
                        setShowModal(true);
                        setActiveTab('search');
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                    >
                      Add Food
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-emerald-800 flex items-center gap-2 mb-6">
                  <BarChart2 className="w-6 h-6" />
                  Nutrition Insights
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-3">Macronutrient Distribution</h3>
                    <div className="h-64">
                      <Chart
                        chartType="PieChart"
                        data={macroData}
                        options={{
                          title: '',
                          pieHole: 0.4,
                          colors: ['#3b82f6', '#f59e0b', '#8b5cf6'],
                          legend: { position: 'bottom' },
                          pieSliceText: 'value',
                          tooltip: { trigger: 'focus' }
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-3">Daily Progress</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-emerald-700">Calories</span>
                          <span>{Math.round(progress.calories)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-emerald-600 h-2.5 rounded-full" 
                            style={{ width: `${progress.calories}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-blue-700">Protein</span>
                          <span>{Math.round(progress.protein)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${progress.protein}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-amber-700">Carbs</span>
                          <span>{Math.round(progress.carbs)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-amber-600 h-2.5 rounded-full" 
                            style={{ width: `${progress.carbs}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-violet-700">Fat</span>
                          <span>{Math.round(progress.fat)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-violet-600 h-2.5 rounded-full" 
                            style={{ width: `${progress.fat}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <h3 className="font-medium text-gray-900 mb-4">Recent Foods</h3>
                {diaryEntries.length > 0 ? (
                  <Carousel
                    showArrows={true}
                    showStatus={false}
                    showThumbs={false}
                    infiniteLoop={true}
                    autoPlay={true}
                    interval={5000}
                    stopOnHover={true}
                    className="max-w-md mx-auto"
                  >
                    {diaryEntries.slice(0, 5).map(entry => (
                      <div key={entry.id} className="bg-emerald-50 p-6 rounded-xl text-center h-48 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                          <Utensils className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h4 className="font-medium text-gray-900">{entry.food.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {entry.mealType} • {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-emerald-700 mt-2">
                          {entry.food.calories} • P: {entry.food.protein} • C: {entry.food.carbs} • F: {entry.food.fat}
                        </p>
                      </div>
                    ))}
                  </Carousel>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-xl">
                    <p className="text-gray-600">No recent foods to display</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add to Diary Modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add to Diary</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {selectedFood ? (
              <>
                <p className="mb-4">Add <span className="font-medium">{selectedFood.description || 'this food'}</span> to:</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(meal => (
                    <button
                      key={meal}
                      onClick={() => addToDiary(selectedFood, meal)}
                      className="p-3 bg-emerald-50 text-emerald-800 rounded-lg hover:bg-emerald-100 transition flex items-center justify-center gap-2"
                    >
                      {meal}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-600 mb-4">No food selected. Please search and select a food first.</p>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setActiveTab('search');
                    setTimeout(() => {
                      searchInputRef.current?.focus();
                    }, 300);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                >
                  Search Foods
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
      
      <Tooltip id="food-tooltip" />

      {/* Floating Nutrition Tips Button */}
      <motion.button
        onClick={showNutritionTips}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-emerald-500 to-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Get nutrition tips"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <Bell className="w-6 h-6" />
      </motion.button>
    </div>
  );
};

export default Nutrition;