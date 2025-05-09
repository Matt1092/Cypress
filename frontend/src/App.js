import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import axios from 'axios';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Map from './pages/Map';
import Reports from './pages/Reports';
import NewReport from './pages/NewReport';
import ReportDetails from './pages/ReportDetails';
import Profile from './pages/Profile';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Verify token validity with the backend
  const verifyAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, user is not logged in');
      setIsLoggedIn(false);
      setAuthChecked(true);
      return;
    }

    try {
      // Call auth check endpoint
      console.log('Verifying token with backend...');
      const response = await axios.get('http://localhost:5000/api/auth/check', {
        headers: {
          'x-auth-token': token
        }
      });
      
      console.log('Auth check successful:', response.data);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Token validation failed:', error);
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
    } finally {
      setAuthChecked(true);
    }
  };
  
  useEffect(() => {
    verifyAuth();
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  const handleLogin = (userData) => {
    // TODO: Implement actual login logic with backend
    console.log('Logging in user:', userData);
    setIsLoggedIn(true);
  };

  const handleRegister = (userData) => {
    // TODO: Implement actual registration logic with backend
    console.log('Registering user:', userData);
    setIsLoggedIn(true);
  };

  // Show loading state until auth check completes
  if (!authChecked) {
    return (
      <div className="loading-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Checking authentication status...
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="logo">
            <Link to="/">Cypress</Link>
          </div>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/map">Reports Map</Link>
            {isLoggedIn ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home isLoggedIn={isLoggedIn} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register onRegister={handleRegister} />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/map" element={<Map />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/new" element={<NewReport />} />
            <Route path="/reports/:id" element={<ReportDetails />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>&copy; 2025 Cypress - Report city problems</p>
        </footer>
      </div>
    </Router>
  );
}

export default App; 