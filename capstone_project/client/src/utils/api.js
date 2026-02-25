import axios from 'axios';

// Build base URL from env var; always point at the `/api` prefix used by the server.
const rawServerUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
const baseURL = rawServerUrl.endsWith('/api')
    ? rawServerUrl
    : rawServerUrl + '/api';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to add token
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
}, error => Promise.reject(error));

export default api;