// File: src/services/contentService.js
import axios from 'axios';

const API_URL = 'http://localhost:5001/api/content'; // Or your production URL

// Helper to get the auth token from localStorage
const getAuthHeaders = () => {
    const token = localStorage.getItem('token'); // Adjust if you store the token differently
    return {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
};

// --- ADMIN FUNCTIONS ---

// GET /api/content - Fetches all content items for the dashboard
export const getAllContent = async () => {
    const response = await axios.get(API_URL, getAuthHeaders(a));
    return response.data;
};

// POST /api/content - Creates a new content item
export const createContent = async (contentData) => {
    const response = await axios.post(API_URL, contentData, getAuthHeaders());
    return response.data;
};

// PUT /api/content/:id - Updates an existing content item
export const updateContent = async (id, contentData) => {
    const response = await axios.put(`${API_URL}/${id}`, contentData, getAuthHeaders());
    return response.data;
};

// DELETE /api/content/:id - Deletes a content item
export const deleteContent = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
};


// --- PUBLIC FUNCTION ---

// GET /api/content/component/:componentId - Fetches data for one public component
export const getComponentData = async (componentId) => {
    try {
        const response = await axios.get(`${API_URL}/component/${componentId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching content for ${componentId}:`, error);
        // Return null or a default structure so the public page doesn't crash
        return null;
    }
};