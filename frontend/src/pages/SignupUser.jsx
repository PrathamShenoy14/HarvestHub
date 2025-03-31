import { PhotoIcon } from '@heroicons/react/24/solid';
import { useState,} from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function SignupUser() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setAvatar(selectedFile);
            console.log("New file selected:", selectedFile);
        }
    };
    const handleRegister = async () => {
        if (!username || !email || !password || !phone || !street || !city || !state || !pincode || !avatar) {
            setError("All fields are required, including profile picture.");
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append("username", username);
            formData.append("email", email);
            formData.append("password", password);
            formData.append("role", "customer");
            formData.append("contactNumber", phone);
            formData.append("street", street);
            formData.append("city", city);
            formData.append("state", state);
            formData.append("pincode", pincode);
            formData.append("avatar", avatar); // File upload

            const response = await axios.post('http://localhost:8000/api/users/register/user', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
            });

            console.log("User registered:", response.data);
            alert(response.data.message);
        } catch (error) {
            setError(error.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-md">
                <h2 className="text-2xl font-semibold text-gray-900 text-center">Signup Form</h2>

                {error && <p className="text-red-600 text-center mt-2">{error}</p>}

                <div className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                        <input onChange={(e) => setUsername(e.target.value)} id="username" name="username" type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                    </div>

                    {/* Profile Picture Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10">
                            <div className="text-center">
                                <PhotoIcon className="mx-auto h-12 w-12 text-gray-300" />
                                <div className="mt-4 flex text-sm text-gray-600">
                                    <label htmlFor="file-upload" className="cursor-pointer font-semibold text-indigo-600 hover:text-indigo-500">
                                        Upload an image
                                        <input id="file-upload" name="file-upload" type="file" accept="image/*"
                                            className="sr-only" onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                {avatar && <p className="text-xs text-green-600 mt-1">File selected: {avatar.name}</p>}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input onChange={(e) => setEmail(e.target.value)} id="email" name="email" type="email" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input onChange={(e) => setPassword(e.target.value)} id="password" name="password" type="password" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone No.</label>
                        <input onChange={(e) => setPhone(e.target.value)} id="phone" name="phone" type="tel" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                    </div>

                    <div>
                        <label htmlFor="street-address" className="block text-sm font-medium text-gray-700">Street Address</label>
                        <input onChange={(e) => setStreet(e.target.value)} id="street-address" name="street-address" type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                    </div>

                    <div className="flex space-x-4">
                        <div className="w-1/3">
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                            <input onChange={(e) => setCity(e.target.value)} id="city" name="city" type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                        </div>
                        <div className="w-1/3">
                            <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
                            <input onChange={(e) => setState(e.target.value)} id="state" name="state" type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                        </div>
                        <div className="w-1/3">
                            <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">Pincode</label>
                            <input onChange={(e) => setPincode(e.target.value)} id="pincode" name="pincode" type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                        </div>
                    </div>
                </div>

                {/* Register Button with Loading State */}
                <div className="mt-6 flex justify-center">
                    <button onClick={handleRegister} disabled={loading}
                        className={`w-full rounded-md cursor-pointer px-4 py-2 font-semibold text-white ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500"}`}>
                        {loading ? "Registering..." : "Register"}
                    </button>
                </div>
                <p className="text-center text-gray-600 mt-4">
                    Have an account already? <Link to="/login" className="text-indigo-600 cursor-pointer hover:underline">Login now</Link>
                </p>
            </div>
        </div>
    );
}

export default SignupUser;
