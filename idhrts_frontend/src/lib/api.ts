import axios from 'axios';

export const api = axios.create({
    baseURL: typeof window !== 'undefined' ? '/api' : 'http://backend:8000/api',
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token && !config.url?.includes('/auth/login')) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});


api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API ERROR RESPONSE URL:', error.config?.url);
    console.log('API ERROR RESPONSE STATUS:', error.response?.status);
    console.log('API ERROR RESPONSE DATA:', error.response?.data);
    return Promise.reject(error);
  }
);