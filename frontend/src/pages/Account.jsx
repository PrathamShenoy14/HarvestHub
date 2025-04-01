import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

function Account() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    contactNumber: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    farmName: "",
    farmDescription: "",
    bankAccountHolderName: "",
    bankAccountNumber: "",
    ifscCode: "",
    bankName: "",
  });

  useEffect(() => {
    const fetchAccountDetails = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/users/profile", {
          withCredentials: true,
        });

        setUser(response.data.user);
        setFormData({
          username: response.data.user.username || "",
          email: response.data.user.email || "",
          contactNumber: response.data.user.contactNumber || "",
          street: response.data.user.addresses?.[0]?.street || "",
          city: response.data.user.addresses?.[0]?.city || "",
          state: response.data.user.addresses?.[0]?.state || "",
          pincode: response.data.user.addresses?.[0]?.pincode || "",
          farmName: response.data.user.farmDetails?.farmName || "",
          farmDescription: response.data.user.farmDetails?.farmDescription || "",
          bankAccountHolderName: response.data.user.bankAccountHolderName || "",
          bankAccountNumber: "",
          ifscCode: "",
          bankName: "",
        });

      } catch (err) {
        setError("Failed to fetch account details");
      } finally {
        setLoading(false);
      }
    };

    fetchAccountDetails();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    console.log(formData);
    
  };

  const handleUpdate = async () => {
    try {
      const response = await axios.patch("http://localhost:8000/api/users/update-account", formData, {
        withCredentials: true,
      });
      console.log(response.data);
      
      alert("Account updated successfully!");
    
    } catch (error) {
      alert("Failed to update account");
    }
  };

  const handleAvatarUpload = async (e) => {
    const formData = new FormData();
    formData.append("avatar", e.target.files[0]);

    try {
      const response = await axios.patch("http://localhost:8000/api/users/update-avatar", formData, {
        withCredentials: true,
      });

      alert("Avatar updated!");
      setUser(response.data.user);
    } catch (error) {
      alert("Failed to update avatar");
    }
  };

  const handleFarmPhotoUpdate = async (e, index) => {
    const formData = new FormData();
    formData.append("farmPhotos", e.target.files[0]); // Fix: Use "farmPhotos" to match backend
    formData.append("index", index); // Pass index to update specific image

    try {
      const response = await axios.patch("http://localhost:8000/api/users/update-farm-photos", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }, // Ensure correct content type
      });

      alert("Farm photo updated!");
      setUser(response.data.user); // Update UI
    } catch (error) {
      alert("Failed to update farm photo");
    }
};

  if (loading) return <p className="text-center mt-10 text-gray-600">Loading...</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="flex flex-col gap-4 bg-white">
        <Navbar/>
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
      <h2 className="text-3xl font-bold text-center mb-6">Account Details</h2>

      {user && (
        <div className="flex flex-col items-center">
          {/* Avatar Upload Section */}
          <div className="relative">
            <img
              src={user.avatar || "https://via.placeholder.com/100"}
              alt="Avatar"
              className="w-24 h-24 rounded-full border-4 border-blue-500 shadow-md mb-4 object-cover cursor-pointer"
              onClick={() => document.getElementById("avatarUpload").click()}
            />
            <input
              type="file"
              id="avatarUpload"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <p className="text-blue-500 text-sm cursor-pointer" onClick={() => document.getElementById("avatarUpload").click()}>
              Change Avatar
            </p>
          </div>

          {/* Editable Form */}
          <div className="mt-6 w-full max-w-md">
            <label className="block font-medium">Username</label>
            <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full border p-2 mt-1 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none" />

            <label className="block font-medium mt-4">Email</label>
            <input type="text" name="email" value={formData.email} onChange={handleInputChange} className="w-full border p-2 mt-1 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none" />

            <label className="block font-medium mt-4">Contact Number</label>
            <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className="w-full border p-2 mt-1 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none" />

            <label className="block font-medium mt-4">Street</label>
            <input type="text" name="street" value={formData.street} onChange={handleInputChange} className="w-full border p-2 mt-1 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none" />

            <div className="mt-4 flex space-x-4">
                <div className="flex-1">
                <label className="block font-medium">City</label>
                <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full border p-2 mt-1 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
                </div>

                <div className="flex-1">
                <label className="block font-medium">State</label>
                <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full border p-2 mt-1 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
                </div>

                <div className="flex-1">
                <label className="block font-medium">Pincode</label>
                <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full border p-2 mt-1 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
                </div>
            </div>
          
          </div>

          {/* Farm Photos (For Farmers) */}
          {user.role === "farmer" && (
  <div className="mt-6 w-full max-w-md">
    {/* Farm Name Field */}
    <label className="block font-medium">Farm Name</label>
    <input
    type="text"
    name="farmName"
    value={formData.farmName}
    onChange={handleInputChange}
    className="w-full border p-2 mt-1 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
    />

    {/* Farm Description Field */}
    <label className="block font-medium mt-4">Farm Description</label>
    <textarea
    name="farmDescription"
    value={formData.farmDescription}
    onChange={handleInputChange}
    className="w-full border p-2 mt-1 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
    rows="4"
    />

    {/* Farm Photos Section */}
    <h3 className="text-lg font-semibold mb-3 text-center mt-6">Farm Photos</h3>
    <div className="flex flex-wrap gap-3 justify-between items-center">
      {user.farmDetails.farmPhotos?.length > 0 ? (
        user.farmDetails.farmPhotos.map((photo, index) => (
          <div key={index} className="relative">
            <img
              src={photo}
              alt={`Farm ${index + 1}`}
              className="w-32 h-32 object-cover rounded-lg shadow-md cursor-pointer"
              onClick={() => document.getElementById(`farmPhotoUpload${index}`).click()}
            />
            <input
              type="file"
              id={`farmPhotoUpload${index}`}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFarmPhotoUpdate(e, index)}
            />
            <p
              className="text-blue-500 text-xs text-center cursor-pointer mt-1"
              onClick={() => document.getElementById(`farmPhotoUpload${index}`).click()}
            >
              Update Photo
            </p>
          </div>
        ))
      ) : (
        <p className="text-gray-500">No farm photos uploaded</p>
      )}
    </div>
  </div>
)}


          {/* Save Button */}
          <button onClick={handleUpdate} className="bg-green-500 cursor-pointer text-white px-6 py-2 rounded mt-6 w-full max-w-md hover:bg-green-600">
            Save Changes
          </button>
        </div>
      )}
    </div>
    </div>
    
  );
}

export default Account;
