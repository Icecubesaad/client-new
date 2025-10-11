'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  preferredLanguage: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    lastUpdated: Date;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    
    console.log('🔧 AuthContext Debug:', {
      hasToken: !!token,
      apiBaseUrl: API_BASE_URL,
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'SSR',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR'
    });
    
    if (!API_BASE_URL) {
      const error = 'NEXT_PUBLIC_BACKEND_URL is not defined!';
      console.error('❌ Backend URL Error:', error);
      toast.error(`Config Error: ${error}`);
      setLoading(false);
      return;
    }
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user/profile`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      Cookies.remove('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Attempting login to:', `${API_BASE_URL}/api/auth/login`);
      
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      console.log('✅ Login successful:', response.status);
      const { token, user: userData } = response.data;
      
      Cookies.set('token', token, { 
        expires: 7,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      
      toast.success('Login successful!');
      return true;
    } catch (error: any) {
      console.error('❌ Login failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
        url: `${API_BASE_URL}/api/auth/login`
      });
      
      const message = error.response?.data?.error || error.message || 'Login failed';
      toast.error(`Login Error: ${message}`);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name,
        email,
        password,
      });

      const { token, user: userData } = response.data;
      
      Cookies.set('token', token, { 
        expires: 7,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      
      toast.success('Registration successful!');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      return false;
    }
  };

  const logout = () => {
    Cookies.remove('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};