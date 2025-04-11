import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { reportService } from '../services/api';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportFormData, setReportFormData] = useState({
    name: '',
    description: '',
    userLocation: '',
    type: 'infrastructure'
  });
  const [locationCoordinates, setLocationCoordinates] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [userReports, setUserReports] = useState([]);
  const [reportsFetched, setReportsFetched] = useState(false);
  const navigate = useNavigate();
  const autocompleteRef = useRef(null);
  const locationInputRef = useRef(null);

  // Function to fetch user reports
  const fetchUserReports = useCallback(async () => {
    try {
      setReportsFetched(false);
      const response = await reportService.getUserReports();
      
      if (response.data.success) {
        console.log('User reports:', response.data.data);
        setUserReports(response.data.data);
      } else {
        console.error('Failed to fetch reports:', response.data.message);
      }
    } catch (err) {
      console.error('Error fetching user reports:', err);
    } finally {
      setReportsFetched(true);
    }
  }, []);

  // Initialize Google Maps Autocomplete
  const initializeAutocomplete = () => {
    if (!window.google || !locationInputRef.current) {
      console.error('Google API not loaded or location input ref not available');
      return;
    }
    
    try {
      // Create autocomplete instance with specific options
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        locationInputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'ca' }, // Restrict to Canada for this example
          fields: ['address_components', 'formatted_address', 'geometry', 'name']
        }
      );
      
      // Add listener for place changed
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
          console.error('No location details available for this place');
          return;
        }
        
        // Get the selected address
        const address = place.formatted_address;
        
        // Get the location coordinates
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        // Update form data with the selected address
        setReportFormData(prev => ({
          ...prev,
          userLocation: address
        }));
        
        // Save coordinates for submission
        setLocationCoordinates({ lat, lng });
        
        console.log('Selected location:', { address, lat, lng });
      });
      
      console.log('Google Places Autocomplete initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }
  };

  // Load Google Maps API script
  const loadGoogleMapsScript = () => {
    // If script is already loaded and Google API is available
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('Google API already loaded');
      initializeAutocomplete();
      return;
    }
    
    // Check if script is already being loaded
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      console.log('Google Maps script is already loading');
      return;
    }
    
    try {
      const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
      
      // Use a hardcoded API key for testing if environment variable is not set
      const apiKey = googleMapsApiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE' ? 
        'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg' : // Example API key with limited functionality
        googleMapsApiKey;
      
      console.log('Loading Google Maps API with key:', apiKey.substring(0, 5) + '...');
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsCallback`;
      script.id = 'google-maps-script';
      script.async = true;
      script.defer = true;
      
      // Define global callback function
      window.initGoogleMapsCallback = () => {
        console.log('Google Maps API loaded successfully');
        initializeAutocomplete();
      };
      
      // Handle script load error
      script.onerror = (error) => {
        console.error('Error loading Google Maps script:', error);
      };
      
      document.head.appendChild(script);
      
      return () => {
        if (document.getElementById('google-maps-script')) {
          document.head.removeChild(document.getElementById('google-maps-script'));
        }
        delete window.initGoogleMapsCallback;
      };
    } catch (error) {
      console.error('Error setting up Google Maps script:', error);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      console.log('No token found in Dashboard, redirecting to login');
      navigate('/login');
      return;
    }
    
    // Verify token is valid by making a request to the auth check endpoint
    const verifyToken = async () => {
      try {
        console.log('Verifying token in Dashboard...');
        const response = await axios.get('http://localhost:5000/api/auth/check', {
          headers: {
            'x-auth-token': token
          }
        });
        
        console.log('Token verification successful');
        
        if (userData) {
          setUser(JSON.parse(userData));
          // Fetch user's reports when authentication is confirmed
          fetchUserReports();
        } else {
          console.warn('No user data found in localStorage');
          // Redirect to login if user data is missing
          navigate('/login');
        }
      } catch (error) {
        console.error('Token verification failed in Dashboard:', error);
        // Token is invalid, clear it and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    };
    
    verifyToken();
  }, [navigate, fetchUserReports]);

  // Separate useEffect for Google Maps loading
  useEffect(() => {
    // Only load Google Maps API when showing the report form
    if (showReportForm) {
      loadGoogleMapsScript();
      
      // Clean up when form is closed
      return () => {
        if (autocompleteRef.current) {
          // Clean up event listeners
          window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
          autocompleteRef.current = null;
        }
      };
    }
  }, [showReportForm]);

  const handleReportChange = (e) => {
    setReportFormData({
      ...reportFormData,
      [e.target.name]: e.target.value
    });
    
    // If the location field is changed manually, reset the coordinates
    if (e.target.name === 'userLocation') {
      setLocationCoordinates(null);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setLoading(true);

    try {
      // Use the coordinates from Google Places if available, otherwise use default
      let coordinates = [-79.3832, 43.6532]; // Toronto coordinates [longitude, latitude]
      
      if (locationCoordinates) {
        // Convert to [longitude, latitude] format for GeoJSON
        coordinates = [locationCoordinates.lng, locationCoordinates.lat];
      }
      
      // Create proper GeoJSON Point
      const locationData = {
        type: 'Point',
        coordinates: coordinates
      };
      
      // Create the report payload with all required fields
      const reportData = {
        name: reportFormData.name,
        description: reportFormData.description,
        userLocation: reportFormData.userLocation,
        type: reportFormData.type,
        location: locationData
      };
      
      console.log('Submitting report with data:', JSON.stringify(reportData, null, 2));
      
      // Make the API request using the report service
      const response = await reportService.createReport(reportData);
      
      console.log('Response:', response.data);
      
      if (response.data.success) {
        setFormSuccess('Report submitted successfully!');
        setReportFormData({
          name: '',
          description: '',
          userLocation: '',
          type: 'infrastructure'
        });
        setLocationCoordinates(null);
        setShowReportForm(false);
        
        // Refresh reports list after successful submission
        fetchUserReports();
      } else {
        setFormError(response.data.message || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      
      // Log all error details to help debug
      if (err.response) {
        console.error('Error status:', err.response.status);
        console.error('Error data:', err.response.data);
        
        // Display the error message from the server in a user-friendly way
        if (err.response.status === 400 && 
            err.response.data && 
            err.response.data.message && 
            err.response.data.message.includes('already been reported')) {
          // This is a duplicate report error
          setFormError(
            <div className="duplicate-report-error">
              <p><strong>Duplicate Report Detected</strong></p>
              <p>{err.response.data.message}</p>
              <p>Please check the map to see the existing report.</p>
            </div>
          );
        } else {
          setFormError(err.response.data?.message || `Server error: ${err.response.status}`);
        }
      } else if (err.request) {
        console.error('No response received:', err.request);
        setFormError('No response from server. Please try again later.');
      } else {
        console.error('Error message:', err.message);
        setFormError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Helper function to render status with appropriate CSS class
  const renderStatus = (status) => {
    let statusClass = '';
    
    switch(status) {
      case 'Report Flagged':
        statusClass = 'status-waiting';
        break;
      case 'Verified':
        statusClass = 'status-verified';
        break;
      case 'In progress':
        statusClass = 'status-in-progress';
        break;
      case 'Solved':
        statusClass = 'status-solved';
        break;
      default:
        statusClass = '';
    }
    
    return (
      <span className={`status-indicator ${statusClass}`}>
        {status}
      </span>
    );
  };

  // Handle resolving a report
  const handleResolveReport = async (reportId) => {
    try {
      setLoading(true);
      const response = await reportService.updateReportStatus(reportId, 'Solved');
      
      if (response.data.success) {
        setFormSuccess('Report marked as resolved successfully!');
        // Update the reports list to reflect the change
        fetchUserReports();
      } else {
        setFormError(response.data.message || 'Failed to update report status');
      }
    } catch (err) {
      console.error('Error resolving report:', err);
      setFormError('Error updating report status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If not logged in, the useEffect will redirect
  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Welcome, {user.username}!</h1>
      
      {formSuccess && (
        <div className="alert-success">
          {formSuccess}
        </div>
      )}
      
      <div className="dashboard-card">
        <h2>Your Profile</h2>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>
      
      <div className="dashboard-card">
        <h2>Report a Problem</h2>
        {!showReportForm ? (
          <>
            <p>Help improve your city by reporting issues you encounter.</p>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowReportForm(true)}
            >
              Create New Report
            </button>
          </>
        ) : (
          <form onSubmit={handleReportSubmit}>
            {formError && (
              <div className="alert-error">{formError}</div>
            )}
            
            <div className="form-group">
              <label htmlFor="name">Report Title</label>
              <input
                type="text"
                id="name"
                name="name"
                value={reportFormData.name}
                onChange={handleReportChange}
                className="form-control"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="type">Type of Issue</label>
              <select
                id="type"
                name="type"
                value={reportFormData.type}
                onChange={handleReportChange}
                className="form-control"
                required
              >
                <option value="infrastructure">Infrastructure</option>
                <option value="cleanliness">Cleanliness</option>
                <option value="human">Human-related</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={reportFormData.description}
                onChange={handleReportChange}
                className="form-control"
                rows="5"
                required
              ></textarea>
            </div>
            
            <div className="form-group location-group">
              <label htmlFor="userLocation">Your Location (Start typing for autocomplete)</label>
              <input
                type="text"
                id="userLocation"
                name="userLocation"
                value={reportFormData.userLocation}
                onChange={handleReportChange}
                ref={locationInputRef}
                className="form-control"
                placeholder="e.g., 123 Main St, Toronto"
                autoComplete="off"
                required
              />
              {locationCoordinates && (
                <div className="location-found">
                  <small>✓ Location found: {reportFormData.userLocation}</small>
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowReportForm(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
      
      <div className="dashboard-card">
        <h2>Your Reports</h2>
        {!reportsFetched ? (
          <p>Loading your reports...</p>
        ) : userReports.length === 0 ? (
          <p>You haven't submitted any reports yet.</p>
        ) : (
          <div className="reports-list">
            {userReports.map(report => (
              <div key={report._id} className="report-item">
                <h3>{report.name}</h3>
                <div className="report-details">
                  <p><strong>Type:</strong> {report.type}</p>
                  <p><strong>Status:</strong> {renderStatus(report.status)}</p>
                  <p><strong>Description:</strong> {report.description}</p>
                  <p><strong>Location:</strong> {report.userLocation}</p>
                  <p><strong>Submitted:</strong> {formatDate(report.createdAt)}</p>
                </div>
                {report.status !== 'Solved' && (
                  <div className="report-actions">
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleResolveReport(report._id)}
                      disabled={loading}
                    >
                      Mark as Resolved
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard; 