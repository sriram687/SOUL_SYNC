import React, { useState } from "react";
import axios from "axios";

const NutritionTrackingPage = () => {
  const [foodQuery, setFoodQuery] = useState("");
  const [nutritionData, setNutritionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNutritionData = async () => {
    if (!foodQuery.trim()) {
      setError("Please enter a food name.");
      return;
    }

    setLoading(true);
    setError(null);
    setNutritionData(null);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/nutrition?food=${foodQuery}`
      );
      console.log("API Response:", response.data);

      if (!response.data?.foods?.food?.length) {
        setError("No data found for the given food.");
        return;
      }

      setNutritionData(response.data.foods.food[0]);
    } catch (err) {
      console.error("Error fetching nutrition data:", err);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-purple-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Nutrition Tracker</h1>
      <input
        type="text"
        placeholder="Enter food name..."
        value={foodQuery}
        onChange={(e) => setFoodQuery(e.target.value)}
        className="p-2 border rounded-lg w-64 text-center"
      />
      <button
        onClick={fetchNutritionData}
        className="mt-4 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition duration-200"
      >
        Search
      </button>

      {loading && <p className="mt-4">Loading...</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}

      {nutritionData && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow-lg w-96">
          <h2 className="text-xl font-semibold">{nutritionData.food_name}</h2>
          <p><strong>Calories:</strong> {nutritionData.calories ?? "N/A"}</p>
          <p><strong>Protein:</strong> {nutritionData.protein ?? "N/A"}g</p>
          <p><strong>Carbs:</strong> {nutritionData.carbohydrate ?? "N/A"}g</p>
          <p><strong>Fats:</strong> {nutritionData.fat ?? "N/A"}g</p>
        </div>
      )}
    </div>
  );
};

export default NutritionTrackingPage;
