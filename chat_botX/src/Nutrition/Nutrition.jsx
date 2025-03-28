import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Utensils, FileText,Brain } from 'lucide-react';
import axios from 'axios';
import { Link } from "react-router-dom";

const Nutrition = () => {
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

  // Safe nutrition value extraction
  const extractNutritionValue = (food, key, defaultValue = 'N/A') => {
    try {
      // Handle different possible data structures
      if (food.servings?.serving && Array.isArray(food.servings.serving)) {
        return food.servings.serving[0]?.[key] || defaultValue;
      }
      return food[key] || defaultValue;
    } catch (err) {
      console.error(`Error extracting ${key}:`, err);
      return defaultValue;
    }
  };

  // Food Search
  const searchFood = async () => {
    if (!foodQuery.trim()) {
      setError('Please enter a food name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/nutrition/search`, {
        params: { query: foodQuery }
      });
      
      // Ensure food results exist and is an array
      const foods = response.data.foods?.food || response.data.foods || [];
      setFoodResults(Array.isArray(foods) ? foods : []);
    } catch (err) {
      setError('Failed to fetch food data');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Autocomplete
  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/nutrition/autocomplete`, {
        params: { query }
      });
      setSuggestions(response.data.suggestions || []);
    } catch (err) {
      console.error("Autocomplete error:", err);
    }
  };

  // Get Food Details
  const getFoodDetails = async (foodId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/nutrition/get`, {
        params: { food_id: foodId }
      });
      
      // Robust food selection
      const food = response.data.food || response.data;
      setSelectedFood(food);
    } catch (err) {
      setError('Failed to fetch food details');
      console.error('Food details error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add to Diary
  const addToDiary = (food, mealType) => {
    if (!food) return;

    const foodName = food.food_name || 'Unknown Food';
    setDiaryEntries(prev => [
      ...prev,
      {
        id: Date.now(),
        food: { 
          name: foodName,
          calories: extractNutritionValue(food, 'calories'),
          protein: extractNutritionValue(food, 'protein'),
          carbs: extractNutritionValue(food, 'carbohydrate'),
          fat: extractNutritionValue(food, 'fat')
        },
        mealType,
        date: new Date().toISOString()
      }
    ]);
  };

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
    <div className="min-h-screen mt-20 bg-yellow-green-50 p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Personal Metrics */}
        <div className="md:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-green-800 mb-4">Personal Metrics</h2>
            <div className="space-y-4">
              <input
                type="number"
                placeholder="Weight (kg)"
                className="w-full p-3 border border-green-200 rounded-lg"
                value={bodyMetrics.weight}
                onChange={(e) => setBodyMetrics({...bodyMetrics, weight: e.target.value})}
              />
              <input
                type="number"
                placeholder="Height (cm)"
                className="w-full p-3 border border-green-200 rounded-lg"
                value={bodyMetrics.height}
                onChange={(e) => setBodyMetrics({...bodyMetrics, height: e.target.value})}
              />
              <select
                className="w-full p-3 border border-green-200 rounded-lg"
                value={bodyMetrics.activityLevel}
                onChange={(e) => setBodyMetrics({...bodyMetrics, activityLevel: e.target.value})}
              >
                <option value="sedentary">Sedentary</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
              </select>
            </div>
          </motion.div>

          {/* Food Diary */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-green-800 mb-4">Food Diary</h2>
            {diaryEntries.length > 0 ? (
              <div className="space-y-2">
                {diaryEntries.map(entry => (
                  <div key={entry.id} className="p-3 bg-green-50 rounded-lg">
                    <p className="font-medium">{entry.food.name}</p>
                    <p className="text-sm text-gray-600">
                      {entry.mealType} • {new Date(entry.date).toLocaleTimeString()}
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      {entry.food.calories} cal | 
                      P: {entry.food.protein}g | 
                      C: {entry.food.carbs}g | 
                      F: {entry.food.fat}g
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No entries yet</p>
            )}
          </motion.div>
        </div>

        {/* Middle Column - Food Search */}
        <div className="md:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <Utensils className="text-green-600" />
              <h2 className="text-xl font-bold text-green-800">Food Search</h2>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search for food..."
                className="w-full p-3 border border-green-200 rounded-lg"
                value={foodQuery}
                onChange={(e) => {
                  setFoodQuery(e.target.value);
                  fetchSuggestions(e.target.value);
                }}
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {suggestions.map((item, index) => (
                    <li 
                      key={index}
                      className="p-2 hover:bg-green-50 cursor-pointer"
                      onClick={() => {
                        setFoodQuery(item);
                        setSuggestions([]);
                      }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              onClick={searchFood}
              disabled={loading}
              className="mt-3 w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition flex justify-center items-center"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Search"}
            </button>

            {error && <p className="mt-2 text-red-500">{error}</p>}

            {/* Search Results */}
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
              {foodResults.map(food => (
                <div 
                  key={food.food_id || food.id}
                  className="p-3 border-b border-green-100 hover:bg-green-50 cursor-pointer"
                  onClick={() => getFoodDetails(food.food_id || food.id)}
                >
                  <p className="font-medium">{food.food_name || food.name}</p>
                  <p className="text-sm text-gray-600">{food.food_type || 'Unknown Type'}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column - Food Details */}
        <div className="md:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText className="text-green-600" />
              <h2 className="text-xl font-bold text-green-800">Nutrition Details</h2>
            </div>

            {selectedFood ? (
              <div>
                <h3 className="text-lg font-semibold">{selectedFood.food_name || 'Food Details'}</h3>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700">Calories</p>
                    <p className="font-bold">
                      {extractNutritionValue(selectedFood, 'calories')}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700">Protein</p>
                    <p className="font-bold">
                      {extractNutritionValue(selectedFood, 'protein')}g
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700">Carbs</p>
                    <p className="font-bold">
                      {extractNutritionValue(selectedFood, 'carbohydrate')}g
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700">Fat</p>
                    <p className="font-bold">
                      {extractNutritionValue(selectedFood, 'fat')}g
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-x-2">
                  <button 
                    onClick={() => addToDiary(selectedFood, 'Breakfast')}
                    className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm"
                  >
                    Breakfast
                  </button>
                  <button 
                    onClick={() => addToDiary(selectedFood, 'Lunch')}
                    className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm"
                  >
                    Lunch
                  </button>
                  <button 
                    onClick={() => addToDiary(selectedFood, 'Dinner')}
                    className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm"
                  >
                    Dinner
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Select a food to view details</p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Nutrition;