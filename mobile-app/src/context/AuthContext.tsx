import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { authApi } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface Profile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: FormData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await fetchProfile();
      }
    } catch (error) {
      console.error('Auth init error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await authApi.getProfile();
      setProfile(data);
      setUser({
        id: data.id,
        username: data.username,
        email: data.email,
        first_name: data.full_name?.split(' ')[0] || '',
        last_name: data.full_name?.split(' ')[1] || '',
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      delete api.defaults.headers.common['Authorization'];
    }
  };

  const login = async (username: string, password: string) => {
    const data = await authApi.login(username, password);
    const { access, refresh, user: userData } = data;

    await SecureStore.setItemAsync('access_token', access);
    await SecureStore.setItemAsync('refresh_token', refresh);
    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    setUser(userData);
    await fetchProfile();
  };

  const register = async (formData: FormData) => {
    const response = await authApi.register(formData);
    return response;
  };

  const logout = async () => {
    try {
      const refresh = await SecureStore.getItemAsync('refresh_token');
      if (refresh) authApi.logout(refresh).catch(console.error);
    } catch {}
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, login, register, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};