import React from "react";
import { NavLink, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

function Navbar() {
    const [username, setUsername] = useState('');
    const [avatar,setAvatar] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
      const fetchProfile = async () => {
        try {
          const response = await axios.get('http://localhost:8000/api/users/profile', {
            withCredentials: true,
          });
          setUsername(response.data.user.username);
          setAvatar(response.data.user.avatar); // Adjust based on your database field
        } catch (err) {
          setError('Failed to load user');
        } finally {
          setLoading(false);
        }
      };
  
      fetchProfile();
    }, []);

    const handleLogout = async () => {
        try {
            const response = await axios.post('http://localhost:8000/api/users/logout', {},{
                withCredentials: true,
              });

              setUsername('');
            setAvatar('');
            setError('');
            console.log(response);
        } catch (error) {
            setError('Failed to logout');
        }
    }

  return (
    <nav className="bg-green-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <NavLink to="/" className="text-2xl font-bold">
          HarvestHub
        </NavLink>
        
        <div className="flex space-x-6">
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `hover:text-gray-300 ${isActive ? "border-b-2 border-white" : ""}`
            }
          >
            Products
          </NavLink>
          <NavLink
            to="/wishlist"
            className={({ isActive }) =>
              `hover:text-gray-300 ${isActive ? "border-b-2 border-white" : ""}`
            }
          >
            Wishlist
          </NavLink>
          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `hover:text-gray-300 ${isActive ? "border-b-2 border-white" : ""}`
            }
          >
            Cart
          </NavLink>
          <NavLink
            to="/myorders"
            className={({ isActive }) =>
              `hover:text-gray-300 ${isActive ? "border-b-2 border-white" : ""}`
            }
          >
            My Orders
          </NavLink>
          {username ? (
            <>
                <Link to="/myaccount">
                    <div className="flex flex-row gap-2 justify-center">
                        <span className="font-semibold">{username}</span>
                        <img src={avatar} alt="" className="w-[30px] h-[30px] rounded-full"/>
                    </div>
                </Link>

                <span className="hover:text-gray-300 cursor-pointer" onClick={handleLogout}>Logout</span>
            </>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `hover:text-gray-300 ${isActive ? "border-b-2 border-white" : ""}`
              }
            >
              Login
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
