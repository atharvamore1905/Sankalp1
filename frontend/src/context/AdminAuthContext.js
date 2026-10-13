import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AdminAuthContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

export const getAdminAuthHeader = () => {
  const token = localStorage.getItem('sankalp_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const headers = getAdminAuthHeader();
      const res = await axios.get(`${API}/admin/me`, {
        withCredentials: true,
        headers
      });
      setAdmin(res.data.admin);
    } catch (error) {
      setAdmin(null);
    }
    setLoading(false);
  };

  const adminLogin = async (email, password) => {
    const res = await axios.post(`${API}/admin/login`, { email, password }, { withCredentials: true });
    if (res.data?.token) {
      localStorage.setItem('sankalp_admin_token', res.data.token);
    }
    setAdmin(res.data.admin);
    return res.data;
  };

  const adminLogout = async () => {
    try {
      const headers = getAdminAuthHeader();
      await axios.post(`${API}/admin/logout`, {}, {
        withCredentials: true,
        headers
      });
    } catch (err) {
      console.warn('Logout notification error:', err);
    }
    localStorage.removeItem('sankalp_admin_token');
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, adminLogin, adminLogout, checkAdminAuth, getAdminAuthHeader }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};
