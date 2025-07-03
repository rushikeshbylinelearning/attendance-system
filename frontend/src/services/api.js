import axios from 'axios';

// // 1. Create a new Axios instance
 const api = axios.create({
   baseURL: 'https://itmanagement.bylinelms.com/api' , // Your backend URL
 });

// const api = axios.create({
//   baseURL: 'http://localhost:5001/api' // <-- CORRECTED FOR LOCAL DEVELOPMENT
// });


// 2. Set up the request interceptor
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Authentication Error: Token is invalid or expired.");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- USER MANAGEMENT FUNCTIONS ---

export const addUser = (userData) => api.post('/users', userData);

export const deleteUser = (userId) => api.delete(`/users/${userId}`);

// --- THIS IS THE CRUCIAL LINE THAT IS MISSING FROM YOUR FILE ---
// It makes the 'updateUser' function available for other files to import.
export const updateUser = (userId, updateData) => {
  return api.put(`/users/${userId}`, updateData);
};


// Your existing function can remain.
export const updateUserRole = (userId, role) => api.put(`/users/${userId}/role`, { role });


export default api;