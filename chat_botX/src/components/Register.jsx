import React, { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:5000/register", { email, password });
      toast.success("Registration successful! Please log in.");
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.error("User already exists!");
      } else {
        toast.error("Something went wrong!");
      }
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <h2 className="text-3xl font-semibold mb-4">Register</h2>
      <form className="bg-white p-6 rounded shadow-md w-80" onSubmit={handleRegister}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter your email"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter your password"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-800"
        >
          Register
        </button>
      </form>

      <p className="mt-4">
        Already have an account?{" "}
        <Link to="/login" className="text-purple-700 font-bold hover:underline">
          Log in here
        </Link>
      </p>

      <ToastContainer />
    </div>
  );
};

export default RegisterPage;
