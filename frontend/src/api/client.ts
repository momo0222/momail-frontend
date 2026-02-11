import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json'
    }
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);