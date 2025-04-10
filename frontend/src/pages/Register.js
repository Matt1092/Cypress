import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { username, email, password, confirmPassword } = formData;

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate form
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        username,
        email,
        password
      };
      
      console.log('Attempting to register user:', { username, email });
      const response = await authService.register(userData);
      
      console.log('Registration response:', response.data);
      setSuccess(response.data.message || 'Registration successful! You can now log in.');
      
      // Clear the form
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      
      // Redirect to login after short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server responded with error:', err.response.data);
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received from server');
        setError('Network error - server unreachable. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', err.message);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Register</h2>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ color: 'green', marginBottom: '1rem', textAlign: 'center' }}>
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        
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
            minLength="6"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={handleChange}
            className="form-control"
            required
            minLength="6"
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '1rem' }}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Register'}
        </button>
      </form>
      
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}

export default Register; 