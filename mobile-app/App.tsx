import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const API_BASE_URL = 'http://172.22.32.236:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const authApi = {
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
};

const studentsApi = {
  getAll: async () => {
    const response = await api.get('/students/');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/students/', data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/students/${id}/`);
  },
};

const subjectsApi = {
  getAll: async () => {
    const response = await api.get('/subjects/');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/subjects/', data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/subjects/${id}/`);
  },
};

const sectionsApi = {
  getAll: async () => {
    const response = await api.get('/sections/');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/sections/', data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/sections/${id}/`);
  },
};

const enrollmentsApi = {
  getAll: async () => {
    const response = await api.get('/enrollments/');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/enrollments/', data);
    return response.data;
  },
  delete: async (id: number) => {
    await api.delete(`/enrollments/${id}/`);
  },
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLogin, setIsLogin] = useState(true);

  // Auth form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Data
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Modals
  const [studentModal, setStudentModal] = useState(false);
  const [subjectModal, setSubjectModal] = useState(false);
  const [sectionModal, setSectionModal] = useState(false);
  const [enrollModal, setEnrollModal] = useState(false);

  // Form data
  const [newStudent, setNewStudent] = useState({ student_number: '', first_name: '', last_name: '', email: '', program: 'BSIT', year_level: '1' });
  const [newSubject, setNewSubject] = useState({ subject_code: '', subject_name: '', units: '3' });
  const [newSection, setNewSection] = useState({ subject_code: '', section_code: '', schedule: '', room: '', capacity: '30' });
  const [newEnroll, setNewEnroll] = useState({ student_id: '', section_id: '' });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      try {
        const profile = await authApi.getProfile();
        setUser(profile);
        setIsAuthenticated(true);
        await loadAllData();
      } catch (e) {
        await logout();
      }
    }
    setLoading(false);
  };

  const loadAllData = async () => {
    setLoadingData(true);
    try {
      const [s, sub, sec, e] = await Promise.all([
        studentsApi.getAll(),
        subjectsApi.getAll(),
        sectionsApi.getAll(),
        enrollmentsApi.getAll(),
      ]);
      setStudents(s);
      setSubjects(sub);
      setSections(sec);
      setEnrollments(e);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    delete api.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Enter username and password');
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.login(username, password);
      await SecureStore.setItemAsync('access_token', data.access);
      await SecureStore.setItemAsync('refresh_token', data.refresh);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
      const profile = await authApi.getProfile();
      setUser(profile);
      setIsAuthenticated(true);
      await loadAllData();
      setUsername('');
      setPassword('');
      Alert.alert('Success', `Welcome ${profile.full_name || profile.username}!`);
    } catch (e) {
      Alert.alert('Error', 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Fill all required fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('username', username);
      fd.append('password', password);
      fd.append('confirm_password', confirmPassword);
      fd.append('email', email);
      fd.append('first_name', firstName);
      fd.append('last_name', lastName);
      fd.append('role', 'student');
      await authApi.register(fd);
      Alert.alert('Success', 'Account created! Check email to activate.');
      setIsLogin(true);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setEmail('');
      setFirstName('');
      setLastName('');
    } catch (e) {
      Alert.alert('Error', 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async () => {
    if (!newStudent.student_number || !newStudent.first_name || !newStudent.last_name || !newStudent.email) {
      Alert.alert('Error', 'Fill all fields');
      return;
    }
    try {
      await studentsApi.create(newStudent);
      await loadAllData();
      setStudentModal(false);
      setNewStudent({ student_number: '', first_name: '', last_name: '', email: '', program: 'BSIT', year_level: '1' });
      Alert.alert('Success', 'Student added!');
    } catch (e) {
      Alert.alert('Error', 'Failed to add');
    }
  };

  const deleteStudent = async (id: number, name: string) => {
    Alert.alert('Delete', `Delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await studentsApi.delete(id);
        await loadAllData();
        Alert.alert('Deleted', 'Student removed');
      }}
    ]);
  };

  const addSubject = async () => {
    if (!newSubject.subject_code || !newSubject.subject_name) {
      Alert.alert('Error', 'Fill all fields');
      return;
    }
    try {
      await subjectsApi.create({ ...newSubject, units: parseInt(newSubject.units) });
      await loadAllData();
      setSubjectModal(false);
      setNewSubject({ subject_code: '', subject_name: '', units: '3' });
      Alert.alert('Success', 'Subject added!');
    } catch (e) {
      Alert.alert('Error', 'Failed to add');
    }
  };

  const deleteSubject = async (id: number, name: string) => {
    Alert.alert('Delete', `Delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await subjectsApi.delete(id);
        await loadAllData();
        Alert.alert('Deleted', 'Subject removed');
      }}
    ]);
  };

  const addSection = async () => {
    if (!newSection.subject_code || !newSection.section_code || !newSection.schedule || !newSection.room) {
      Alert.alert('Error', 'Fill all fields');
      return;
    }
    try {
      await sectionsApi.create({ ...newSection, capacity: parseInt(newSection.capacity) });
      await loadAllData();
      setSectionModal(false);
      setNewSection({ subject_code: '', section_code: '', schedule: '', room: '', capacity: '30' });
      Alert.alert('Success', 'Section added!');
    } catch (e) {
      Alert.alert('Error', 'Failed to add');
    }
  };

  const deleteSection = async (id: number, name: string) => {
    Alert.alert('Delete', `Delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await sectionsApi.delete(id);
        await loadAllData();
        Alert.alert('Deleted', 'Section removed');
      }}
    ]);
  };

  const addEnrollment = async () => {
    const student = students.find((s: any) => s.id === parseInt(newEnroll.student_id));
    const section = sections.find((s: any) => s.id === parseInt(newEnroll.section_id));
    if (!student || !section) {
      Alert.alert('Error', 'Select student and section');
      return;
    }
    try {
      await enrollmentsApi.create({ student: parseInt(newEnroll.student_id), section: parseInt(newEnroll.section_id) });
      await loadAllData();
      setEnrollModal(false);
      setNewEnroll({ student_id: '', section_id: '' });
      Alert.alert('Success', `${student.first_name} enrolled!`);
    } catch (e) {
      Alert.alert('Error', 'Failed to enroll');
    }
  };

  const deleteEnrollment = async (id: number, studentName: string) => {
    Alert.alert('Drop', `Drop ${studentName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Drop', style: 'destructive', onPress: async () => {
        await enrollmentsApi.delete(id);
        await loadAllData();
        Alert.alert('Dropped', 'Enrollment removed');
      }}
    ]);
  };

  const stats = { students: students.length, subjects: subjects.length, sections: sections.length, enrollments: enrollments.length };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  if (!isAuthenticated) {
    if (isLogin) {
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.header}>
              <View style={styles.iconWrapper}><Ionicons name="school" size={50} color="#fff" /></View>
              <Text style={styles.title}>Student Enrollment</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={20} color="#1976d2" />
                <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
              </View>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={20} color="#1976d2" />
                <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
              </View>
              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsLogin(false)}>
                <Text style={styles.linkText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <View style={styles.iconWrapper}><Ionicons name="school" size={50} color="#fff" /></View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Register to get started</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>Username *</Text>
            <View style={styles.inputRow}><Ionicons name="person-outline" size={20} color="#1976d2" /><TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} /></View>
            <Text style={styles.label}>Email *</Text>
            <View style={styles.inputRow}><Ionicons name="mail-outline" size={20} color="#1976d2" /><TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" /></View>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}><Text style={styles.label}>First Name</Text><TextInput style={styles.inputSimple} placeholder="First name" value={firstName} onChangeText={setFirstName} /></View>
              <View style={{ flex: 1 }}><Text style={styles.label}>Last Name</Text><TextInput style={styles.inputSimple} placeholder="Last name" value={lastName} onChangeText={setLastName} /></View>
            </View>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputRow}><Ionicons name="lock-closed-outline" size={20} color="#1976d2" /><TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry /></View>
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={styles.inputRow}><Ionicons name="lock-closed-outline" size={20} color="#1976d2" /><TextInput style={styles.input} placeholder="Confirm" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry /></View>
            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsLogin(true)}>
              <Text style={styles.linkText}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appHeader}>
        <Ionicons name="school" size={28} color="#1976d2" />
        <Text style={styles.headerTitle}>Enrollment System</Text>
        <Text style={styles.userName}>{user?.full_name || user?.username}</Text>
        <TouchableOpacity onPress={logout}><Ionicons name="log-out-outline" size={24} color="#f44336" /></TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {['dashboard', 'students', 'subjects', 'sections', 'enrollments'].map((tab) => (
          <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)}>
            <Ionicons name={tab === 'dashboard' ? 'home' : tab === 'students' ? 'people' : tab === 'subjects' ? 'book' : tab === 'sections' ? 'grid' : 'school'} size={22} color={activeTab === tab ? '#1976d2' : '#999'} />
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'dashboard' && (
          <View>
            <Text style={styles.welcomeText}>Welcome, {user?.full_name || user?.username}!</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderTopColor: '#2196f3' }]}><Text style={styles.statValue}>{stats.students}</Text><Text style={styles.statTitle}>Students</Text></View>
              <View style={[styles.statCard, { borderTopColor: '#4caf50' }]}><Text style={styles.statValue}>{stats.subjects}</Text><Text style={styles.statTitle}>Subjects</Text></View>
              <View style={[styles.statCard, { borderTopColor: '#ff9800' }]}><Text style={styles.statValue}>{stats.sections}</Text><Text style={styles.statTitle}>Sections</Text></View>
              <View style={[styles.statCard, { borderTopColor: '#9c27b0' }]}><Text style={styles.statValue}>{stats.enrollments}</Text><Text style={styles.statTitle}>Enrollments</Text></View>
            </View>
          </View>
        )}

        {activeTab === 'students' && (
          <View>
            <View style={styles.listHeader}><Text style={styles.listTitle}>Students ({students.length})</Text><TouchableOpacity style={styles.addBtn} onPress={() => setStudentModal(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity></View>
            {loadingData ? <ActivityIndicator /> : students.map((item: any) => (
              <View key={item.id} style={styles.listItem}>
                <View><Text style={styles.itemTitle}>{item.last_name}, {item.first_name}</Text><Text style={styles.itemSub}>{item.student_number} | {item.program} Y{item.year_level}</Text></View>
                <TouchableOpacity onPress={() => deleteStudent(item.id, `${item.first_name} ${item.last_name}`)}><Ionicons name="trash-outline" size={22} color="#f44336" /></TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'subjects' && (
          <View>
            <View style={styles.listHeader}><Text style={styles.listTitle}>Subjects ({subjects.length})</Text><TouchableOpacity style={styles.addBtn} onPress={() => setSubjectModal(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity></View>
            {loadingData ? <ActivityIndicator /> : subjects.map((item: any) => (
              <View key={item.id} style={styles.listItem}>
                <View><Text style={styles.itemTitle}>{item.subject_code} - {item.subject_name}</Text><Text style={styles.itemSub}>{item.units} units</Text></View>
                <TouchableOpacity onPress={() => deleteSubject(item.id, item.subject_code)}><Ionicons name="trash-outline" size={22} color="#f44336" /></TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'sections' && (
          <View>
            <View style={styles.listHeader}><Text style={styles.listTitle}>Sections ({sections.length})</Text><TouchableOpacity style={styles.addBtn} onPress={() => setSectionModal(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity></View>
            {loadingData ? <ActivityIndicator /> : sections.map((item: any) => (
              <View key={item.id} style={styles.listItem}>
                <View><Text style={styles.itemTitle}>{item.subject_code} - {item.section_code}</Text><Text style={styles.itemSub}>{item.schedule} | {item.room} | Cap:{item.capacity}</Text></View>
                <TouchableOpacity onPress={() => deleteSection(item.id, `${item.subject_code}-${item.section_code}`)}><Ionicons name="trash-outline" size={22} color="#f44336" /></TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'enrollments' && (
          <View>
            <View style={styles.listHeader}><Text style={styles.listTitle}>Enrollments ({enrollments.length})</Text><TouchableOpacity style={styles.addBtn} onPress={() => setEnrollModal(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity></View>
            {loadingData ? <ActivityIndicator /> : enrollments.map((item: any) => (
              <View key={item.id} style={styles.listItem}>
                <View><Text style={styles.itemTitle}>{item.student_name}</Text><Text style={styles.itemSub}>{item.subject_code} - {item.section_code}</Text></View>
                <TouchableOpacity onPress={() => deleteEnrollment(item.id, item.student_name)}><Ionicons name="trash-outline" size={22} color="#f44336" /></TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Student Modal */}
      <Modal visible={studentModal} transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Student</Text>
            <TextInput style={styles.modalInput} placeholder="Student Number" value={newStudent.student_number} onChangeText={(t: string) => setNewStudent({...newStudent, student_number: t})} />
            <TextInput style={styles.modalInput} placeholder="First Name" value={newStudent.first_name} onChangeText={(t: string) => setNewStudent({...newStudent, first_name: t})} />
            <TextInput style={styles.modalInput} placeholder="Last Name" value={newStudent.last_name} onChangeText={(t: string) => setNewStudent({...newStudent, last_name: t})} />
            <TextInput style={styles.modalInput} placeholder="Email" value={newStudent.email} onChangeText={(t: string) => setNewStudent({...newStudent, email: t})} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setStudentModal(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={addStudent}><Text style={{color:'#fff'}}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Subject Modal */}
      <Modal visible={subjectModal} transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Subject</Text>
            <TextInput style={styles.modalInput} placeholder="Subject Code" value={newSubject.subject_code} onChangeText={(t: string) => setNewSubject({...newSubject, subject_code: t.toUpperCase()})} />
            <TextInput style={styles.modalInput} placeholder="Subject Name" value={newSubject.subject_name} onChangeText={(t: string) => setNewSubject({...newSubject, subject_name: t})} />
            <TextInput style={styles.modalInput} placeholder="Units" value={newSubject.units} onChangeText={(t: string) => setNewSubject({...newSubject, units: t})} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setSubjectModal(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={addSubject}><Text style={{color:'#fff'}}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Section Modal */}
      <Modal visible={sectionModal} transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Section</Text>
            <TextInput style={styles.modalInput} placeholder="Subject Code" value={newSection.subject_code} onChangeText={(t: string) => setNewSection({...newSection, subject_code: t.toUpperCase()})} />
            <TextInput style={styles.modalInput} placeholder="Section Code" value={newSection.section_code} onChangeText={(t: string) => setNewSection({...newSection, section_code: t.toUpperCase()})} />
            <TextInput style={styles.modalInput} placeholder="Schedule" value={newSection.schedule} onChangeText={(t: string) => setNewSection({...newSection, schedule: t})} />
            <TextInput style={styles.modalInput} placeholder="Room" value={newSection.room} onChangeText={(t: string) => setNewSection({...newSection, room: t})} />
            <TextInput style={styles.modalInput} placeholder="Capacity" value={newSection.capacity} onChangeText={(t: string) => setNewSection({...newSection, capacity: t})} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setSectionModal(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={addSection}><Text style={{color:'#fff'}}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Enrollment Modal */}
      <Modal visible={enrollModal} transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enroll Student</Text>
            <Text style={styles.pickerLabel}>Select Student</Text>
            <ScrollView horizontal>
              {students.map((student: any) => (
                <TouchableOpacity key={student.id} style={[styles.pickerItem, newEnroll.student_id == student.id && styles.pickerSelected]} onPress={() => setNewEnroll({...newEnroll, student_id: student.id})}>
                  <Text>{student.last_name}, {student.first_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.pickerLabel}>Select Section</Text>
            <ScrollView horizontal>
              {sections.map((section: any) => (
                <TouchableOpacity key={section.id} style={[styles.pickerItem, newEnroll.section_id == section.id && styles.pickerSelected]} onPress={() => setNewEnroll({...newEnroll, section_id: section.id})}>
                  <Text>{section.subject_code}-{section.section_code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEnrollModal(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={addEnrollment}><Text style={{color:'#fff'}}>Enroll</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  iconWrapper: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1976d2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 24, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 12, height: 48, backgroundColor: '#fafafa', marginBottom: 12 },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },
  inputSimple: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 12, height: 48, fontSize: 16, backgroundColor: '#fafafa' },
  row: { flexDirection: 'row', marginTop: 4 },
  button: { backgroundColor: '#1976d2', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  linkText: { textAlign: 'center', marginTop: 20, color: '#1976d2', fontSize: 14 },
  appHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1976d2', flex: 1, marginLeft: 10 },
  userName: { fontSize: 14, color: '#666', marginRight: 10 },
  tabBar: { flexDirection: 'row', backgroundColor: 'white', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tabItem: { flex: 1, alignItems: 'center' },
  tabLabel: { fontSize: 11, color: '#999', marginTop: 4 },
  tabLabelActive: { color: '#1976d2', fontWeight: '600' },
  content: { flex: 1, padding: 20 },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#1976d2', marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 15, borderTopWidth: 4, elevation: 2 },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  statTitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 5 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#1976d2' },
  addBtn: { backgroundColor: '#1976d2', width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  listItem: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  itemSub: { fontSize: 12, color: '#666', marginTop: 3 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 15 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  modalCancel: { backgroundColor: '#e0e0e0', padding: 12, borderRadius: 10, flex: 1, marginRight: 10, alignItems: 'center' },
  modalSave: { backgroundColor: '#1976d2', padding: 12, borderRadius: 10, flex: 1, alignItems: 'center' },
  pickerLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 10 },
  pickerItem: { backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8, marginRight: 10, minWidth: 100, alignItems: 'center' },
  pickerSelected: { backgroundColor: '#1976d2' },
});