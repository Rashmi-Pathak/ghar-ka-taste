import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = `${SERVER_URL}/api`;
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('gkt_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const r = await axios.get(`${API}/auth/me`);
          setUser(r.data);
        } catch (e) {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('gkt_token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data.user);
    setLoading(false);
    return data.user;
  };

  const register = async (name, email, password, role, otp_code) => {
    const { data } = await axios.post(`${API}/auth/register`, { name, email, password, role, otp_code });
    localStorage.setItem('gkt_token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data.user);
    setLoading(false);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('gkt_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const deleteAccount = async () => {
    await axios.delete(`${API}/auth/account`);
    logout();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export { API, SERVER_URL };
