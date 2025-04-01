import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Role from './pages/Role.jsx';
import SignupUser from './pages/SignupUser.jsx';
import SignupFarmer from './pages/SignupFarmer.jsx';
import Products from './pages/Products.jsx';
import Account from './pages/Account.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Role/>} />
        <Route path="/register/customer" element={<SignupUser />} />
        <Route path="/register/farmer" element={<SignupFarmer />} />
        <Route path='/products' element={<Products/>} />
        <Route path='/myaccount' element={<Account/>} />
      </Routes>
    </Router>
  );
}

export default App;
