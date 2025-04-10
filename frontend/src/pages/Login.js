import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import axios from 'axios';

function Login({ setIsLoggedIn }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const navigate = useNavigate();

  // Check server health on component mount
  useEffect(() => {
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    try {
      setServerStatus('checking');
      // Try to reach the server's health endpoint
      const response = await axios.get('http://localhost:5000/health', { 
        timeout: 5000 
      });
      
      if (response.status === 200) {
        console.log('Server is healthy:', response.data);
        setServerStatus('online');
      } else {
        setServerStatus('error');
      }
    } catch (err) {
      console.error('Server health check failed:', err);
      setServerStatus('offline');
    }
  };

  const { email, password } = formData;

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Login form submitted:', { email: formData.email });
      
      // If server was offline, check again first
      if (serverStatus === 'offline') {
        await checkServerHealth();
      }
      
      console.log('Calling auth service login...');
      const response = await authService.login(formData);
      console.log('Login response received:', response.data);
      
      if (response.data.success) {
        // Double check token exists
        if (!response.data.token) {
          console.error('No token in response:', response.data);
          throw new Error('Authentication failed: No token received');
        }
        
        // Store token with proper error handling
        try {
          localStorage.removeItem('token'); // Clear any existing token first
          localStorage.setItem('token', response.data.token);
          console.log('Token stored successfully');
        } catch (storageError) {
          console.error('Error storing token in localStorage:', storageError);
          throw new Error('Failed to store authentication data');
        }
        
        // Create a proper user object
        let userData = {};
        
        if (response.data.user) {
          userData = {
            id: response.data.user.id || response.data.user._id,
            username: response.data.user.username || 'User',
            email: response.data.user.email || formData.email
          };
        } else {
          console.warn('No user data in response, creating minimal user data');
          userData = {
            id: 'unknown',
            username: formData.email.split('@')[0],
            email: formData.email
          };
        }
        
        console.log('Storing user data:', userData);
        
        try {
          localStorage.removeItem('user'); // Clear existing user data first
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('User data stored successfully');
        } catch (userStorageError) {
          console.error('Error storing user data:', userStorageError);
          // Continue anyway since we have the token
        }
        
        // Update login state in the app
        console.log('Setting isLoggedIn to true');
        setIsLoggedIn(true);
        
        // Redirect with slight delay to ensure state updates
        setTimeout(() => {
          console.log('Redirecting to dashboard...');
          navigate('/dashboard');
        }, 100);
      } else {
        console.error('Login failed with success: false', response.data);
        setError('Login failed: ' + (response.data.message || 'Unknown error'));
      }
      
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Authentication failed';
      
      if (err.response) {
        // The request was made and the server responded with an error status
        console.error('Server error response:', err.response.data);
        errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received from server');
        errorMessage = 'Network error - server unreachable. Please check your connection.';
        
        // Set server status to offline
        setServerStatus('offline');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error during login request:', err.message);
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Login</h2>
      
      {serverStatus === 'offline' && (
        <div style={{ color: 'orange', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fff3cd', borderRadius: '4px', textAlign: 'center' }}>
          <p>Server appears to be offline or unreachable.</p>
          <button 
            className="btn btn-secondary" 
            onClick={checkServerHealth}
            style={{ marginTop: '0.5rem' }}
          >
            Check Server Status
          </button>
        </div>
      )}
      
      {error && (
        <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '1rem' }}
          disabled={loading || serverStatus === 'checking'}
        >
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
      
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <p>Don't have an account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
}

export default Login; 