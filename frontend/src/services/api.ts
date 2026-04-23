import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
const token = localStorage.getItem('access_token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// ========== TYPE DEFINITIONS ==========

export interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
  units: number;
  description: string;
  status: string;
  offered_on: string;
}

export interface Student {
  id: number;
  student_number: string;
  first_name: string;
  last_name: string;
  email: string;
  year_level: string;
  program: string;
  status: string;
  created_at: string;
  total_units?: number;
}

export interface Section {
  id: number;
  subject: number;
  subject_code: string;
  subject_name: string;
  section_code: string;
  max_capacity: number;
  current_count: number;
  available_slots: number;
  schedule: string;
  room: string;
  semester: string;
  school_year: string;
  status: string;
}

export interface Enrollment {
  id: number;
  student: number;
  section: number;
  student_name: string;
  student_number: string;
  student_first_name: string;
  section_code: string;
  subject_code: string;
  subject_name: string;
  units: number;
  schedule: string;
  room: string;
  semester: string;
  school_year: string;
  enrolled_at: string;
  status: string;
}

export interface EnrollmentSummary {
  id: number;
  student: number;
  student_name: string;
  student_number: string;
  semester: string;
  school_year: string;
  total_enrolled_units: number;
  total_sections: number;
  last_updated: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  phone: string;
  address: string;
  birth_date: string;
  age: number;
}

// ========== AUTHENTICATION API (User App) ==========
// These endpoints go to /api/auth/ which is handled by the user app
export const authApi = {
  register: async (userData: any): Promise<any> => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },
  login: async (username: string, password: string): Promise<any> => {
    const response = await api.post('/auth/login/', { username, password });
    return response.data;
  },
  logout: async (refresh: string): Promise<void> => {
    await api.post('/auth/logout/', { refresh });
  },
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/auth/profile/');
    return response.data;
  },
  updateProfile: async (data: any): Promise<UserProfile> => {
    const response = await api.put<UserProfile>('/auth/profile/', data);
    return response.data;
  },
  changePassword: async (old_password: string, new_password: string, confirm_password: string): Promise<any> => {
    const response = await api.post('/auth/change-password/', { 
      old_password, 
      new_password, 
      confirm_password 
    });
    return response.data;
  },
};

// ========== SUBJECTS API ==========
export const subjectsApi = {
  getAll: async (): Promise<Subject[]> => {
    const response = await api.get<Subject[]>('/subjects/');
    return response.data;
  },
  getById: async (id: number): Promise<Subject> => {
    const response = await api.get<Subject>(`/subjects/${id}/`);
    return response.data;
  },
  create: async (data: any): Promise<Subject> => {
    const response = await api.post<Subject>('/subjects/', data);
    return response.data;
  },
  update: async (id: number, data: any): Promise<Subject> => {
    const response = await api.put<Subject>(`/subjects/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/subjects/${id}/`);
  },
};

// ========== STUDENTS API ==========
export const studentsApi = {
  getAll: async (): Promise<Student[]> => {
    const response = await api.get<Student[]>('/students/');
    return response.data;
  },
  getById: async (id: number): Promise<Student> => {
    const response = await api.get<Student>(`/students/${id}/`);
    return response.data;
  },
  create: async (data: any): Promise<Student> => {
    const response = await api.post<Student>('/students/', data);
    return response.data;
  },
  update: async (id: number, data: any): Promise<Student> => {
    const response = await api.put<Student>(`/students/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/students/${id}/`);
  },
  getEnrollments: async (id: number): Promise<Enrollment[]> => {
    const response = await api.get<Enrollment[]>(`/students/${id}/enrollments/`);
    return response.data;
  },
  getSummary: async (id: number): Promise<EnrollmentSummary[]> => {
    const response = await api.get<EnrollmentSummary[]>(`/students/${id}/summary/`);
    return response.data;
  },
  getEnrolledSubjects: async (id: number): Promise<Enrollment[]> => {
    const response = await api.get<Enrollment[]>(`/students/${id}/enrolled_subjects/`);
    return response.data;
  },
  getTotalUnits: async (id: number, semester?: string, school_year?: string): Promise<{ total_units: number }> => {
    let url = `/students/${id}/total-units/`;
    const params = new URLSearchParams();
    if (semester) params.append('semester', semester);
    if (school_year) params.append('school_year', school_year);
    if (params.toString()) url += `?${params.toString()}`;
    const response = await api.get<{ total_units: number }>(url);
    return response.data;
  },
};

// ========== SECTIONS API ==========
export const sectionsApi = {
  getAll: async (): Promise<Section[]> => {
    const response = await api.get<Section[]>('/sections/');
    return response.data;
  },
  getById: async (id: number): Promise<Section> => {
    const response = await api.get<Section>(`/sections/${id}/`);
    return response.data;
  },
  create: async (data: any): Promise<Section> => {
    const response = await api.post<Section>('/sections/', data);
    return response.data;
  },
  update: async (id: number, data: any): Promise<Section> => {
    const response = await api.put<Section>(`/sections/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/sections/${id}/`);
  },
  getEnrollments: async (id: number): Promise<Enrollment[]> => {
    const response = await api.get<Enrollment[]>(`/sections/${id}/enrollments/`);
    return response.data;
  },
};

// ========== ENROLLMENTS API ==========
export const enrollmentsApi = {
  getAll: async (): Promise<Enrollment[]> => {
    const response = await api.get<Enrollment[]>('/enrollments/');
    return response.data;
  },
  create: async (data: any): Promise<Enrollment> => {
    const response = await api.post<Enrollment>('/enrollments/', data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/enrollments/${id}/`);
  },
};

// ========== SUMMARIES API ==========
export const summariesApi = {
  getAll: async (): Promise<EnrollmentSummary[]> => {
    const response = await api.get<EnrollmentSummary[]>('/summaries/');
    return response.data;
  },
  getByStudent: async (studentId: number): Promise<EnrollmentSummary[]> => {
    const response = await api.get<EnrollmentSummary[]>(`/summaries/?student_id=${studentId}`);
    return response.data;
  },
};

export default api;