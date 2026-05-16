import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

import API_BASE from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  // Theme toggle — persisted and global
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/v1/auth/me`);
      setUser(response.data);
    } catch (err) {
      console.error("Failed to fetch user", err);
      logout();
    }
  };

  const login = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await axios.post(`${API_BASE}/api/v1/auth/login`, formData);
    const { access_token, user: userData } = response.data;
    
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('token', access_token);
  };

  const register = async (email, password) => {
    await axios.post(`${API_BASE}/api/v1/auth/register`, { email, password });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <AuthContext.Provider value={{ user, token, isDark, toggleTheme, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
