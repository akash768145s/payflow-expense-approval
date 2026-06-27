import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for cookie-based session auth
  headers: {
    'Content-Type': 'application/json',
  },
});
