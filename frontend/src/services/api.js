import axios from 'axios';

// 1. Create a new Axios instance
const api = axios.create({
  baseURL: 'http://localhost:5001/api', // Your backend URL
});

// 2. Set up the request interceptor
// This function will be called before every request is sent
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      // If a token exists, add it to the Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Return the modified config
  },
  (error) => {
    // Handle request setup errors
    return Promise.reject(error);
  }
);

// 3. (Optional but Recommended) Set up a response interceptor
// This function will be called for every response that comes back
api.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Specifically check for 401 Unauthorized
    if (error.response && error.response.status === 401) {
      // This means the token is invalid or expired
      console.error("Authentication Error: Token is invalid or expired.");
      // Clear the invalid token from storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect the user to the login page
      // Use window.location instead of useNavigate to avoid circular dependencies
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;