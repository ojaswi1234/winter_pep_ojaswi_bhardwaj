import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext'; // Imports from the file above
import api from '../utils/api';

// This file MUST have "export const AuthProvider"
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on load
    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    api.defaults.headers.common['x-auth-token'] = token;
                    const res = await api.get('/auth/user');
                    setUser(res.data);
                } catch (err) {
                    console.error("Auth check failed:", err);
                    localStorage.removeItem('token');
                    delete api.defaults.headers.common['x-auth-token'];
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        api.defaults.headers.common['x-auth-token'] = res.data.token;
        const userRes = await api.get('/auth/user');
        setUser(userRes.data);
    };

    const register = async (username, email, password) => {
        const res = await api.post('/auth/register', { username, email, password });
        localStorage.setItem('token', res.data.token);
        api.defaults.headers.common['x-auth-token'] = res.data.token;
        const userRes = await api.get('/auth/user');
        setUser(userRes.data);
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['x-auth-token'];
        setUser(null);
        window.location.href = '/login'; 
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};