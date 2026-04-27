import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import api, { authApi, User, UserProfile } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: any) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await authApi.getProfile();
      console.log('Profile data from API:', data); // Debug log
      setProfile(data);
      if (data) {
        setUser({
          id: data.id,
          username: data.username,
          email: data.email,
          first_name: data.full_name?.split(' ')[0] || '',
          last_name: data.full_name?.split(' ')[1] || '',
          date_joined: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const data = await authApi.login(username, password);
    const { access, refresh, user: userData } = data;
    
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    setUser(userData);
    await fetchProfile();
  };

  const register = async (formData: FormData) => {
    try {
      const response = await authApi.register(formData);
      console.log("Registration success:", response);
      return response;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      authApi.logout(refresh).catch(console.error);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (profileData: any) => {
    const data = await authApi.updateProfile(profileData);
    setProfile(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};