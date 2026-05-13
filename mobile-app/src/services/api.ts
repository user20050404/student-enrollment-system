import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Your Render backend URL
const API_BASE_URL = 'https://student-enrollment-api.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login/', { username, password });
    return response.data;
  },
  register: async (userData: any) => {
    const response = await api.post('/auth/register/', userData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },
  logout: async (refresh: string) => {
    const response = await api.post('/auth/logout/', { refresh });
    return response.data;
  },
};

export const studentsApi = {
  getAll: async () => {
    const response = await api.get('/students/');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/students/', data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/students/${id}/`);
    return response.data;
  },
};

export const subjectsApi = {
  getAll: async () => {
    const response = await api.get('/subjects/');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/subjects/', data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/subjects/${id}/`);
    return response.data;
  },
};

export const sectionsApi = {
  getAll: async () => {
    const response = await api.get('/sections/');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/sections/', data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/sections/${id}/`);
    return response.data;
  },
};

export const enrollmentsApi = {
  getAll: async () => {
    const response = await api.get('/enrollments/');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/enrollments/', data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/enrollments/${id}/`);
    return response.data;
  },
};