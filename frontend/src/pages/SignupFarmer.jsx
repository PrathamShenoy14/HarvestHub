import { PhotoIcon } from '@heroicons/react/24/solid';
import { useState,} from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

function SignupFarmer() {
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
    const [farmName, setFarmName] = useState('');
    const [farmDescription, setFarmDescription] = useState('');
    const [farmPhotos, setFarmPhotos] = useState([null, null, null]);
    const [bankAccountHolderName, setBankAccountHolderName] = useState('');
    const [bankAccountNumber, setBankAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [bankName, setBankName] = useState('');
    const [step, setStep] = useState(1);
    
    const handleNext = ()=>{
      if (!username || !email || !password || !phone || !street || !city || !state || !pincode || !avatar) {
        setError("All fields are required, including profile picture.");
        return;
      }
      setStep((prev)=>prev+1);
    }

    const handleFarmPhotoChange = (e, index) => {
      const file = e.target.files[0];
      if (file) {
        const updatedPhotos = [...farmPhotos];
        updatedPhotos[index] = file;
        setFarmPhotos(updatedPhotos);
        console.log(updatedPhotos)
      }
    };

    const handlePrev = ()=>{
      setStep((prev)=>prev-1);
    }

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setAvatar(selectedFile);
            console.log("New file selected:", selectedFile);
        }
    };
    const handleRegister = async () => {
      if (
          !username || !email || !password || !phone || !street || !city || !state || !pincode || 
          !avatar || !farmName || !farmDescription || farmPhotos.some(photo => photo === null) ||
          !bankAccountHolderName || !bankAccountNumber || !ifscCode || !bankName
      ) {
          setError("All fields are required, including profile picture and farm photos.");
          return;
      }
  
      setLoading(true);
      setError('');
  
      try {
          const formData = new FormData();
          
          // Personal details
          formData.append("username", username);
          formData.append("email", email);
          formData.append("password", password);
          formData.append("role", "farmer");
          formData.append("contactNumber", phone);
          formData.append("street", street);
          formData.append("city", city);
          formData.append("state", state);
          formData.append("pincode", pincode);
  
          // Avatar (Profile Picture)
          formData.append("avatar", avatar);
  
          // Farm details
          formData.append("farmName", farmName);
          formData.append("farmDescription", farmDescription);
  
          // Farm Photos (Array of 3)
          // eslint-disable-next-line no-unused-vars
          farmPhotos.forEach((photo, index) => {
              formData.append(`farmPhotos`, photo);
          });
  
          // Bank details
          formData.append("bankAccountHolderName", bankAccountHolderName);
          formData.append("bankAccountNumber", bankAccountNumber);
          formData.append("ifscCode", ifscCode);
          formData.append("bankName", bankName);
  
          const response = await axios.post('http://localhost:8000/api/users/register/farmer', formData, {
              headers: {
                  'Content-Type': 'multipart/form-data'
              },
          });
  
          console.log("Farmer registered:", response.data);
          alert(response.data.message);
          
      } catch (error) {
          setError(error.response?.data?.message || "Registration failed");
      } finally {
          setLoading(false);
      }
  };
  

    return (
        <div className='flex flex-col bg-gray-100 gap-4'>
          <Navbar/>
          <div className="flex min-h-screen items-center justify-center bg-gray-100 ">
          {step==1 && (
              <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-md">
                <h2 className="text-2xl font-semibold text-gray-900 text-center">Signup Form</h2>

                {error && <p className="text-red-600 text-center mt-2">{error}</p>}

                <div className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                        <input value={username} onChange={(e) => setUsername(e.target.value)} id="username" name="username" type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                    </div>

                    {/* Profile Picture Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10">
                            <div className="text-center">
                                <PhotoIcon className="mx-auto h-12 w-12 text-gray-300" />
                                <div className="mt-4 flex text-sm text-gray-600">
                                    <label htmlFor="file-upload" className="cursor-pointer font-semibold text-green-600 hover:text-green-500">
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
                        <input value={email} onChange={(e) => setEmail(e.target.value)} id="email" name="email" type="email" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input value={password} onChange={(e) => setPassword(e.target.value)} id="password" name="password" type="password" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone No.</label>
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} id="phone" name="phone" type="tel" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                    </div>

                    <div>
                        <label htmlFor="street-address" className="block text-sm font-medium text-gray-700">Street Address</label>
                        <input value={street} onChange={(e) => setStreet(e.target.value)} id="street-address" name="street-address" type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                    </div>

                    <div className="flex space-x-4">
                        <div className="w-1/3">
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                            <input value={city} onChange={(e) => setCity(e.target.value)} id="city" name="city" type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                        </div>
                        <div className="w-1/3">
                            <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
                            <input value={state} onChange={(e) => setState(e.target.value)} id="state" name="state" type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                        </div>
                        <div className="w-1/3">
                            <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">Pincode</label>
                            <input value={pincode} onChange={(e) => setPincode(e.target.value)} id="pincode" name="pincode" type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                        </div>
                    </div>
                </div>

                {/* Register Button with Loading State */}
                <div className="mt-6 flex justify-center">
                    <button onClick={handleNext}
                        className={`w-full rounded-md cursor-pointer px-4 py-2 font-semibold text-white bg-green-600 hover:bg-green-500`}>
                        Next
                    </button>
                </div>
                <p className="text-center text-gray-600 mt-4">
                    Have an account already? <Link to="/login" className="text-green-600 cursor-pointer hover:underline">Login now</Link>
                </p>
              </div>
          )}

          {step == 2 && (
            <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-md">
              <h2 className="text-2xl font-semibold text-gray-900 text-center">Farm Details</h2>
              {error && <p className="text-red-600 text-center mt-2">{error}</p>}
              <div className="mt-6 space-y-4">
                {/* Farm Name */}
                <div>
                  <label htmlFor="farm-name" className="block text-sm font-medium text-gray-700">Farm Name</label>
                  <input value={farmName} onChange={(e) => setFarmName(e.target.value)} id="farm-name" type="text"
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                </div>

                {/* Farm Description */}
                <div>
                  <label htmlFor="farm-desc" className="block text-sm font-medium text-gray-700">Farm Description</label>
                  <textarea value={farmDescription} onChange={(e) => setFarmDescription(e.target.value)} id="farm-desc"
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" rows="3"></textarea>
                </div>

                {/* Farm Photos Upload (3 Files) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Farm Photos</label>
                  <div className="mt-2 grid grid-cols-3 gap-4">
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="relative flex flex-col items-center border border-dashed border-gray-300 p-4 rounded-lg">
                        <PhotoIcon className="h-12 w-12 text-gray-300" />
                        <label className="mt-2 text-sm text-green-600 cursor-pointer hover:text-green-500">
                          Upload Photo {index + 1}
                          <input type="file" accept="image/*" className="sr-only"
                            onChange={(e) => handleFarmPhotoChange(e, index)} />
                        </label>
                        {farmPhotos[index] && <p className="text-xs text-green-600 mt-1">{farmPhotos[index].name}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="mt-6 flex justify-between">
                <button onClick={handlePrev} className="rounded-md cursor-pointer px-4 py-2 font-semibold text-white bg-gray-500 hover:bg-gray-400">
                  Back
                </button>
                <button onClick={handleNext} className="rounded-md cursor-pointer px-4 py-2 font-semibold text-white bg-green-600 hover:bg-green-500">
                  Next
                </button>
              </div>
              <p className="text-center text-gray-600 mt-4">
                    Have an account already? <Link to="/login" className="text-green-600 cursor-pointer hover:underline">Login now</Link>
              </p>
            </div>
          )}

          {step === 3 && (
              <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-md">
                <h2 className="text-2xl font-semibold text-gray-900 text-center">Bank Details</h2>
                {error && <p className="text-red-600 text-center mt-2">{error}</p>}
                <div className="mt-6 space-y-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                    <input value={bankName} onChange={(e) => setBankName(e.target.value)}
                      type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Holder Name</label>
                    <input value={bankAccountHolderName} onChange={(e) => setBankAccountHolderName(e.target.value)}
                      type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bank Account Number</label>
                    <input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)}
                      type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                    <input value={ifscCode} onChange={(e) => setIfscCode(e.target.value)}
                      type="text" className="mt-1 w-full rounded-md border border-gray-300 p-2 outline-none" />
                  </div>

                </div>

                {/* Buttons */}
                <div className="mt-6 flex justify-between">
                  <button onClick={handlePrev}
                    className="rounded-md cursor-pointer px-4 py-2 font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300">
                    Previous
                  </button>
            
                  <button onClick={handleRegister} disabled={loading}
                      className={`rounded-md cursor-pointer px-4 py-2 font-semibold text-white ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-500"}`}>
                      {loading ? "Registering..." : "Register"}
                  </button>
               
                </div>
                <p className="text-center text-gray-600 mt-4">
                    Have an account already? <Link to="/login" className="text-green-600 cursor-pointer hover:underline">Login now</Link>
                </p>
              </div>
            )}          
            
        </div>
        </div>
    );
}

export default SignupFarmer;
