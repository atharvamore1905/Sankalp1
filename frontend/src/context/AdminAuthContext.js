import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AdminAuthContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const res = await axios.get(`${API}/admin/me`, { withCredentials: true });
      setAdmin(res.data.admin);
    } catch (error) {
      setAdmin(null);
    }
    setLoading(false);
  };

  const adminLogin = async (email, password) => {
    const res = await axios.post(`${API}/admin/login`, { email, password }, { withCredentials: true });
    setAdmin(res.data.admin);
    return res.data;
  };

  const adminLogout = async () => {
    await axios.post(`${API}/admin/logout`, {}, { withCredentials: true });
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, adminLogin, adminLogout, checkAdminAuth }}>
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
