// frontend/src/api/axios.js
import axios from 'axios';

// const api = axios.create({
//   baseURL: 'https://attendance.bylinelms.com/api',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

const api = axios.create({
  baseURL: 'http://localhost:3001/api' // <-- CORRECTED FOR LOCAL DEVELOPMENT
});

api.interceptors.request.use(
  (config) => {
    // FIX: Read from sessionStorage
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // FIX: Remove from sessionStorage
      sessionStorage.removeItem('token');
      // Redirect to login page to prevent being stuck in a bad state
      window.location = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;