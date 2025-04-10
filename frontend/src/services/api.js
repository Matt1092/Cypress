import axios from 'axios';

// Create a configured axios instance with base URL and default settings
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000, // 15 second timeout - increased from 10s
  withCredentials: false // Explicitly set to false for cross-origin requests
});

// Add a request interceptor to attach the auth token to every request
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    
    // Log requests in development environment
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common error patterns
api.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;
    
    console.error('API Error:', error);
    
    // Check for network errors
    if (!error.response) {
      console.error('Network error - no response received');
      
      // If we haven't retried yet, retry once
      if (!originalRequest._retry && originalRequest.url !== '/auth/login') {
        originalRequest._retry = true;
        console.log('Retrying request once...');
        
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return api(originalRequest);
      }
    }
    
    // Handle token expiration/invalidation
    if (error.response && error.response.status === 401) {
      console.log('Authentication error, redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth service functions
export const authService = {
  login: async (credentials) => {
    console.log('Login attempt with:', credentials.email);
    
    // For login, try with proper error handling and fallbacks
    try {
      console.log('Attempting login with API instance');
      const response = await api.post('/auth/login', credentials);
      console.log('Login successful via API instance:', response.data);
      
      // Validate response has required fields
      if (!response.data.token) {
        console.error('Server response missing token:', response.data);
        throw new Error('Server response missing authentication token');
      }
      
      return response;
    } catch (err) {
      console.error('Login error with API instance:', err);
      
      if (!err.response) {
        // If network error, try direct URL as fallback
        console.log('Network error detected, trying direct URL fallback');
        try {
          const fallbackResponse = await axios.post('http://localhost:5000/api/auth/login', credentials, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 20000 // Increase timeout for fallback
          });
          
          console.log('Login successful via direct URL:', fallbackResponse.data);
          
          // Validate fallback response
          if (!fallbackResponse.data.token) {
            console.error('Fallback response missing token:', fallbackResponse.data);
            throw new Error('Server response missing authentication token');
          }
          
          return fallbackResponse;
        } catch (fallbackErr) {
          console.error('Login failed with fallback approach:', fallbackErr);
          throw fallbackErr;
        }
      }
      
      // For other types of errors, just propagate
      throw err;
    }
  },
  register: async (userData) => {
    return api.post('/auth/register', userData);
  },
  updateProfile: async (userData) => {
    return api.put('/auth/profile', userData);
  }
};

// Report service functions
export const reportService = {
  getAll: async () => {
    return api.get('/reports');
  },
  getUserReports: async () => {
    return api.get('/reports/user/my-reports');
  },
  createReport: async (reportData) => {
    return api.post('/reports', reportData);
  },
  updateReport: async (id, reportData) => {
    return api.put(`/reports/${id}`, reportData);
  },
  updateReportStatus: async (id, status) => {
    return api.put(`/reports/${id}/status`, { status });
  },
  deleteReport: async (id) => {
    return api.delete(`/reports/${id}`);
  }
};

export default api; 