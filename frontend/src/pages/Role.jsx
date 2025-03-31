import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Role() {
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleNext = () => {
    if (!role) {
      setError("Please select a role before proceeding.");
      return;
    }
    setError("");
    navigate(role === "customer" ? "/register/customer" : "/register/farmer");
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-96">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Select Your Role
        </h2>
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        <label className="block text-gray-700 mb-2">Choose Role:</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Select Role</option>
          <option value="customer">Customer</option>
          <option value="farmer">Farmer</option>
        </select>

        <button
          onClick={handleNext}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 font-bold rounded-md transition duration-200"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Role;
