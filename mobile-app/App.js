import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ========== INITIAL DATA ==========
let MOCK_STUDENTS = [
  { id: '1', student_number: '20240001', first_name: 'Juan', last_name: 'Dela Cruz', email: 'juan@email.com', program: 'BSIT', year_level: '1', status: 'enrolled' },
  { id: '2', student_number: '20240002', first_name: 'Maria', last_name: 'Santos', email: 'maria@email.com', program: 'BSCS', year_level: '2', status: 'enrolled' },
];

let MOCK_SUBJECTS = [
  { id: '1', subject_code: 'CS101', subject_name: 'Programming', units: 3, status: 'active' },
  { id: '2', subject_code: 'CS102', subject_name: 'Data Structures', units: 3, status: 'active' },
  { id: '3', subject_code: 'MATH101', subject_name: 'Calculus', units: 3, status: 'active' },
];

let MOCK_SECTIONS = [
  { id: '1', subject_code: 'CS101', subject_name: 'Programming', section_code: 'A', schedule: 'MWF 9:00-10:30', room: 'Room 101', capacity: 30, enrolled: 25, status: 'open' },
  { id: '2', subject_code: 'CS101', subject_name: 'Programming', section_code: 'B', schedule: 'TTH 1:00-2:30', room: 'Room 102', capacity: 30, enrolled: 18, status: 'open' },
];

let MOCK_USERS = [
  { id: '1', username: 'admin', password: 'admin123', name: 'Admin User', email: 'admin@email.com' },
];

let MOCK_ENROLLMENTS = [
  { id: '1', student_id: '1', student_name: 'Juan Dela Cruz', student_number: '20240001', section_id: '1', subject_code: 'CS101', section_code: 'A', units: 3, status: 'enrolled', enrolled_date: new Date().toISOString() },
];

// Helper functions
const addStudent = (student) => { const newStudent = { id: Date.now().toString(), ...student }; MOCK_STUDENTS = [...MOCK_STUDENTS, newStudent]; return newStudent; };
const updateStudent = (id, data) => { MOCK_STUDENTS = MOCK_STUDENTS.map(s => s.id === id ? { ...s, ...data } : s); return MOCK_STUDENTS.find(s => s.id === id); };
const deleteStudent = (id) => { MOCK_STUDENTS = MOCK_STUDENTS.filter(s => s.id !== id); };
const addSubject = (subject) => { const newSubject = { id: Date.now().toString(), ...subject }; MOCK_SUBJECTS = [...MOCK_SUBJECTS, newSubject]; return newSubject; };
const updateSubject = (id, data) => { MOCK_SUBJECTS = MOCK_SUBJECTS.map(s => s.id === id ? { ...s, ...data } : s); };
const deleteSubject = (id) => { MOCK_SUBJECTS = MOCK_SUBJECTS.filter(s => s.id !== id); };
const addSection = (section) => { const newSection = { id: Date.now().toString(), enrolled: 0, status: 'open', ...section }; MOCK_SECTIONS = [...MOCK_SECTIONS, newSection]; return newSection; };
const updateSection = (id, data) => { MOCK_SECTIONS = MOCK_SECTIONS.map(s => s.id === id ? { ...s, ...data } : s); };
const deleteSection = (id) => { MOCK_SECTIONS = MOCK_SECTIONS.filter(s => s.id !== id); };
const addEnrollment = (enrollment) => { const newEnrollment = { id: Date.now().toString(), status: 'enrolled', enrolled_date: new Date().toISOString(), ...enrollment }; MOCK_ENROLLMENTS = [...MOCK_ENROLLMENTS, newEnrollment]; return newEnrollment; };
const deleteEnrollment = (id) => { MOCK_ENROLLMENTS = MOCK_ENROLLMENTS.filter(e => e.id !== id); };
const addUser = (user) => { const newUser = { id: Date.now().toString(), ...user }; MOCK_USERS = [...MOCK_USERS, newUser]; return newUser; };

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLogin, setIsLogin] = useState(true);

  // Auth state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Modal states
  const [studentModal, setStudentModal] = useState(false);
  const [subjectModal, setSubjectModal] = useState(false);
  const [sectionModal, setSectionModal] = useState(false);
  const [enrollmentModal, setEnrollmentModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editType, setEditType] = useState('');

  // Form states
  const [newStudent, setNewStudent] = useState({ student_number: '', first_name: '', last_name: '', email: '', program: 'BSIT', year_level: '1' });
  const [newSubject, setNewSubject] = useState({ subject_code: '', subject_name: '', units: '3' });
  const [newSection, setNewSection] = useState({ subject_code: '', subject_name: '', section_code: '', schedule: '', room: '', capacity: '30' });
  const [newEnrollment, setNewEnrollment] = useState({ student_id: '', section_id: '' });

  // Data state
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [subjects, setSubjects] = useState(MOCK_SUBJECTS);
  const [sections, setSections] = useState(MOCK_SECTIONS);
  const [enrollments, setEnrollments] = useState(MOCK_ENROLLMENTS);
  const [users, setUsers] = useState(MOCK_USERS);
  
  // Stats update automatically when data changes
  const stats = { 
    totalStudents: students.length, 
    totalSubjects: subjects.length, 
    totalSections: sections.length, 
    totalEnrollments: enrollments.length 
  };

  const handleLogin = () => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      Alert.alert('Success', `Welcome back, ${user.name}!`);
      setUsername('');
      setPassword('');
    } else {
      Alert.alert('Error', 'Invalid username or password');
    }
  };

  const handleRegister = () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (users.find(u => u.username === username)) {
      Alert.alert('Error', 'Username already exists');
      return;
    }
    const newUser = addUser({ 
      username, 
      password, 
      name: `${firstName} ${lastName}`.trim() || username,
      email 
    });
    Alert.alert('Success', 'Account created! Please login.');
    setIsLogin(true);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setEmail('');
    setFirstName('');
    setLastName('');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleAddStudent = () => {
    if (!newStudent.student_number || !newStudent.first_name || !newStudent.last_name || !newStudent.email) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    const student = addStudent(newStudent);
    setStudents([...students, student]);
    setStudentModal(false);
    setNewStudent({ student_number: '', first_name: '', last_name: '', email: '', program: 'BSIT', year_level: '1' });
    Alert.alert('Success', `Student ${student.first_name} ${student.last_name} added! Dashboard updated.`);
  };

  const handleEditStudent = (student) => {
    setEditItem(student);
    setEditType('student');
    setEditModal(true);
  };

  const handleSaveEdit = () => {
    if (editType === 'student') {
      updateStudent(editItem.id, editItem);
      setStudents([...students.map(s => s.id === editItem.id ? editItem : s)]);
    } else if (editType === 'subject') {
      updateSubject(editItem.id, editItem);
      setSubjects([...subjects.map(s => s.id === editItem.id ? editItem : s)]);
    } else if (editType === 'section') {
      updateSection(editItem.id, editItem);
      setSections([...sections.map(s => s.id === editItem.id ? editItem : s)]);
    }
    setEditModal(false);
    setEditItem(null);
    Alert.alert('Success', 'Updated successfully! Dashboard updated.');
  };

  const handleDeleteStudent = (id, name) => {
    Alert.alert('Delete Student', `Delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteStudent(id);
        setStudents(students.filter(s => s.id !== id));
        Alert.alert('Deleted', `${name} removed. Dashboard updated.`);
      }}
    ]);
  };

  const handleAddSubject = () => {
    if (!newSubject.subject_code || !newSubject.subject_name) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    const subject = addSubject({ ...newSubject, units: parseInt(newSubject.units) });
    setSubjects([...subjects, subject]);
    setSubjectModal(false);
    setNewSubject({ subject_code: '', subject_name: '', units: '3' });
    Alert.alert('Success', `Subject ${subject.subject_code} - ${subject.subject_name} added! Dashboard updated.`);
  };

  const handleDeleteSubject = (id, name) => {
    Alert.alert('Delete Subject', `Delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteSubject(id);
        setSubjects(subjects.filter(s => s.id !== id));
        Alert.alert('Deleted', `${name} removed. Dashboard updated.`);
      }}
    ]);
  };

  const handleAddSection = () => {
    if (!newSection.subject_code || !newSection.section_code || !newSection.schedule || !newSection.room) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    const subject = subjects.find(s => s.subject_code === newSection.subject_code);
    const section = addSection({ 
      ...newSection, 
      subject_name: subject?.subject_name || '',
      capacity: parseInt(newSection.capacity) 
    });
    setSections([...sections, section]);
    setSectionModal(false);
    setNewSection({ subject_code: '', subject_name: '', section_code: '', schedule: '', room: '', capacity: '30' });
    Alert.alert('Success', `Section ${section.subject_code}-${section.section_code} added! Dashboard updated.`);
  };

  const handleDeleteSection = (id, name) => {
    Alert.alert('Delete Section', `Delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteSection(id);
        setSections(sections.filter(s => s.id !== id));
        Alert.alert('Deleted', `${name} removed. Dashboard updated.`);
      }}
    ]);
  };

  const handleAddEnrollment = () => {
    const student = students.find(s => s.id === newEnrollment.student_id);
    const section = sections.find(s => s.id === newEnrollment.section_id);
    if (!student || !section) {
      Alert.alert('Error', 'Please select student and section');
      return;
    }
    const alreadyEnrolled = enrollments.find(e => e.student_id === student.id && e.section_id === section.id);
    if (alreadyEnrolled) {
      Alert.alert('Error', 'Student already enrolled in this section');
      return;
    }
    const enrollment = addEnrollment({
      student_id: student.id,
      student_name: `${student.first_name} ${student.last_name}`,
      student_number: student.student_number,
      section_id: section.id,
      subject_code: section.subject_code,
      section_code: section.section_code,
      units: 3,
    });
    setEnrollments([...enrollments, enrollment]);
    setEnrollmentModal(false);
    setNewEnrollment({ student_id: '', section_id: '' });
    Alert.alert('Success', `${student.first_name} ${student.last_name} enrolled in ${section.subject_code}-${section.section_code}! Dashboard updated.`);
  };

  const handleDeleteEnrollment = (id, studentName) => {
    Alert.alert('Drop Enrollment', `Drop ${studentName} from this subject?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Drop', style: 'destructive', onPress: () => {
        deleteEnrollment(id);
        setEnrollments(enrollments.filter(e => e.id !== id));
        Alert.alert('Dropped', `${studentName} dropped. Dashboard updated.`);
      }}
    ]);
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <View style={styles.iconWrapper}><Ionicons name="school" size={50} color="#fff" /></View>
            <Text style={styles.title}>Student Enrollment</Text>
            <Text style={styles.subtitle}>{isLogin ? 'Sign in to your account' : 'Create a new account'}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputRow}><Ionicons name="person-outline" size={20} color="#1976d2" /><TextInput style={styles.input} placeholder="Enter username" value={username} onChangeText={setUsername} autoCapitalize="none" /></View>
            
            {!isLogin && (
              <>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputRow}><Ionicons name="mail-outline" size={20} color="#1976d2" /><TextInput style={styles.input} placeholder="Enter email" value={email} onChangeText={setEmail} keyboardType="email-address" /></View>
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>First Name</Text>
                    <TextInput style={styles.inputSimple} placeholder="First name" value={firstName} onChangeText={setFirstName} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Last Name</Text>
                    <TextInput style={styles.inputSimple} placeholder="Last name" value={lastName} onChangeText={setLastName} />
                  </View>
                </View>
              </>
            )}

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}><Ionicons name="lock-closed-outline" size={20} color="#1976d2" /><TextInput style={styles.input} placeholder="Enter password" value={password} onChangeText={setPassword} secureTextEntry /></View>
            
            {!isLogin && (
              <>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputRow}><Ionicons name="lock-closed-outline" size={20} color="#1976d2" /><TextInput style={styles.input} placeholder="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry /></View>
              </>
            )}
            
            <TouchableOpacity style={styles.button} onPress={isLogin ? handleLogin : handleRegister}>
              <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.linkText}>{isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}</Text>
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
        <Text style={styles.userName}>{currentUser?.name}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#f44336" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {['dashboard', 'students', 'subjects', 'sections', 'enrollments'].map((tab) => (
          <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)}>
            <Ionicons name={
              tab === 'dashboard' ? 'home' : 
              tab === 'students' ? 'people' : 
              tab === 'subjects' ? 'book' : 
              tab === 'sections' ? 'grid' : 'school'
            } size={24} color={activeTab === tab ? '#1976d2' : '#999'} />
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'dashboard' && (
          <View>
            <Text style={styles.welcomeText}>Welcome back, {currentUser?.name}!</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderTopColor: '#2196f3' }]}>
                <View style={styles.statHeader}><Text style={styles.statValue}>{stats.totalStudents}</Text><Ionicons name="people-outline" size={30} color="#2196f3" /></View>
                <Text style={styles.statTitle}>Students</Text>
                <Text style={styles.statChange}>Total enrolled students</Text>
              </View>
              <View style={[styles.statCard, { borderTopColor: '#4caf50' }]}>
                <View style={styles.statHeader}><Text style={styles.statValue}>{stats.totalSubjects}</Text><Ionicons name="book-outline" size={30} color="#4caf50" /></View>
                <Text style={styles.statTitle}>Subjects</Text>
                <Text style={styles.statChange}>Active subjects</Text>
              </View>
              <View style={[styles.statCard, { borderTopColor: '#ff9800' }]}>
                <View style={styles.statHeader}><Text style={styles.statValue}>{stats.totalSections}</Text><Ionicons name="grid-outline" size={30} color="#ff9800" /></View>
                <Text style={styles.statTitle}>Sections</Text>
                <Text style={styles.statChange}>Available sections</Text>
              </View>
              <View style={[styles.statCard, { borderTopColor: '#9c27b0' }]}>
                <View style={styles.statHeader}><Text style={styles.statValue}>{stats.totalEnrollments}</Text><Ionicons name="school-outline" size={30} color="#9c27b0" /></View>
                <Text style={styles.statTitle}>Enrollments</Text>
                <Text style={styles.statChange}>Total enrolled students</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'students' && (
          <View>
            <View style={styles.listHeader}><Text style={styles.listHeaderTitle}>Students ({students.length})</Text><TouchableOpacity style={styles.addButton} onPress={() => setStudentModal(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity></View>
            {students.length === 0 ? <Text style={styles.emptyText}>No students found. Tap + to add.</Text> : 
              students.map(item => (
                <View key={item.id} style={styles.listItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{item.last_name}, {item.first_name}</Text>
                    <Text style={styles.listSubtitle}>{item.student_number} | {item.program} Year {item.year_level}</Text>
                    <Text style={styles.listSubtitle}>{item.email}</Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => handleEditStudent(item)} style={styles.editBtn}><Ionicons name="create-outline" size={22} color="#1976d2" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteStudent(item.id, `${item.first_name} ${item.last_name}`)}><Ionicons name="trash-outline" size={22} color="#f44336" /></TouchableOpacity>
                  </View>
                </View>
              ))
            }
          </View>
        )}

        {activeTab === 'subjects' && (
          <View>
            <View style={styles.listHeader}><Text style={styles.listHeaderTitle}>Subjects ({subjects.length})</Text><TouchableOpacity style={styles.addButton} onPress={() => setSubjectModal(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity></View>
            {subjects.length === 0 ? <Text style={styles.emptyText}>No subjects found. Tap + to add.</Text> : 
              subjects.map(item => (
                <View key={item.id} style={styles.listItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{item.subject_code} - {item.subject_name}</Text>
                    <Text style={styles.listSubtitle}>{item.units} units | {item.status}</Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => { setEditItem(item); setEditType('subject'); setEditModal(true); }} style={styles.editBtn}><Ionicons name="create-outline" size={22} color="#1976d2" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteSubject(item.id, item.subject_code)}><Ionicons name="trash-outline" size={22} color="#f44336" /></TouchableOpacity>
                  </View>
                </View>
              ))
            }
          </View>
        )}

        {activeTab === 'sections' && (
          <View>
            <View style={styles.listHeader}><Text style={styles.listHeaderTitle}>Sections ({sections.length})</Text><TouchableOpacity style={styles.addButton} onPress={() => setSectionModal(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity></View>
            {sections.length === 0 ? <Text style={styles.emptyText}>No sections found. Tap + to add.</Text> : 
              sections.map(item => (
                <View key={item.id} style={styles.listItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{item.subject_code} - Section {item.section_code}</Text>
                    <Text style={styles.listSubtitle}>{item.subject_name} | {item.schedule} | {item.room}</Text>
                    <Text style={styles.listSubtitle}>Capacity: {item.enrolled}/{item.capacity} students</Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => { setEditItem(item); setEditType('section'); setEditModal(true); }} style={styles.editBtn}><Ionicons name="create-outline" size={22} color="#1976d2" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteSection(item.id, `${item.subject_code}-${item.section_code}`)}><Ionicons name="trash-outline" size={22} color="#f44336" /></TouchableOpacity>
                  </View>
                </View>
              ))
            }
          </View>
        )}

        {activeTab === 'enrollments' && (
          <View>
            <View style={styles.listHeader}><Text style={styles.listHeaderTitle}>Enrollments ({enrollments.length})</Text><TouchableOpacity style={styles.addButton} onPress={() => setEnrollmentModal(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity></View>
            {enrollments.length === 0 ? <Text style={styles.emptyText}>No enrollments found. Tap + to enroll.</Text> : 
              enrollments.map(item => (
                <View key={item.id} style={styles.listItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{item.student_name}</Text>
                    <Text style={styles.listSubtitle}>{item.subject_code} - Section {item.section_code} | {item.units} units</Text>
                    <Text style={styles.listSubtitle}>Enrolled: {new Date(item.enrolled_date).toLocaleDateString()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteEnrollment(item.id, item.student_name)}><Ionicons name="trash-outline" size={22} color="#f44336" /></TouchableOpacity>
                </View>
              ))
            }
          </View>
        )}
      </ScrollView>

      {/* Add Student Modal */}
      <Modal visible={studentModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Student</Text>
            <TextInput style={styles.modalInput} placeholder="Student Number *" value={newStudent.student_number} onChangeText={(t) => setNewStudent({...newStudent, student_number: t})} />
            <TextInput style={styles.modalInput} placeholder="First Name *" value={newStudent.first_name} onChangeText={(t) => setNewStudent({...newStudent, first_name: t})} />
            <TextInput style={styles.modalInput} placeholder="Last Name *" value={newStudent.last_name} onChangeText={(t) => setNewStudent({...newStudent, last_name: t})} />
            <TextInput style={styles.modalInput} placeholder="Email *" value={newStudent.email} onChangeText={(t) => setNewStudent({...newStudent, email: t})} keyboardType="email-address" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setStudentModal(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleAddStudent}><Text style={{color:'#fff'}}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Subject Modal */}
      <Modal visible={subjectModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Subject</Text>
            <TextInput style={styles.modalInput} placeholder="Subject Code *" value={newSubject.subject_code} onChangeText={(t) => setNewSubject({...newSubject, subject_code: t.toUpperCase()})} />
            <TextInput style={styles.modalInput} placeholder="Subject Name *" value={newSubject.subject_name} onChangeText={(t) => setNewSubject({...newSubject, subject_name: t})} />
            <TextInput style={styles.modalInput} placeholder="Units" value={newSubject.units} onChangeText={(t) => setNewSubject({...newSubject, units: t})} keyboardType="numeric" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setSubjectModal(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleAddSubject}><Text style={{color:'#fff'}}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Section Modal */}
      <Modal visible={sectionModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Section</Text>
            <TextInput style={styles.modalInput} placeholder="Subject Code *" value={newSection.subject_code} onChangeText={(t) => setNewSection({...newSection, subject_code: t.toUpperCase()})} />
            <TextInput style={styles.modalInput} placeholder="Section Code *" value={newSection.section_code} onChangeText={(t) => setNewSection({...newSection, section_code: t.toUpperCase()})} />
            <TextInput style={styles.modalInput} placeholder="Schedule *" value={newSection.schedule} onChangeText={(t) => setNewSection({...newSection, schedule: t})} />
            <TextInput style={styles.modalInput} placeholder="Room *" value={newSection.room} onChangeText={(t) => setNewSection({...newSection, room: t})} />
            <TextInput style={styles.modalInput} placeholder="Capacity" value={newSection.capacity} onChangeText={(t) => setNewSection({...newSection, capacity: t})} keyboardType="numeric" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setSectionModal(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleAddSection}><Text style={{color:'#fff'}}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Enrollment Modal */}
      <Modal visible={enrollmentModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enroll Student</Text>
            <Text style={styles.pickerLabel}>Select Student</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              {students.map(student => (
                <TouchableOpacity key={student.id} style={[styles.pickerItem, newEnrollment.student_id === student.id && styles.pickerItemSelected]} onPress={() => setNewEnrollment({...newEnrollment, student_id: student.id})}>
                  <Text>{student.last_name}, {student.first_name}</Text>
                  <Text style={{fontSize:10, color:'#666'}}>{student.student_number}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.pickerLabel}>Select Section</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              {sections.map(section => (
                <TouchableOpacity key={section.id} style={[styles.pickerItem, newEnrollment.section_id === section.id && styles.pickerItemSelected]} onPress={() => setNewEnrollment({...newEnrollment, section_id: section.id})}>
                  <Text>{section.subject_code}-{section.section_code}</Text>
                  <Text style={{fontSize:10, color:'#666'}}>{section.schedule}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEnrollmentModal(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleAddEnrollment}><Text style={{color:'#fff'}}>Enroll</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={editModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit {editType === 'student' ? 'Student' : editType === 'subject' ? 'Subject' : 'Section'}</Text>
            {editType === 'student' && editItem && (
              <>
                <TextInput style={styles.modalInput} placeholder="Student Number" value={editItem.student_number} onChangeText={(t) => setEditItem({...editItem, student_number: t})} />
                <TextInput style={styles.modalInput} placeholder="First Name" value={editItem.first_name} onChangeText={(t) => setEditItem({...editItem, first_name: t})} />
                <TextInput style={styles.modalInput} placeholder="Last Name" value={editItem.last_name} onChangeText={(t) => setEditItem({...editItem, last_name: t})} />
                <TextInput style={styles.modalInput} placeholder="Email" value={editItem.email} onChangeText={(t) => setEditItem({...editItem, email: t})} />
              </>
            )}
            {editType === 'subject' && editItem && (
              <>
                <TextInput style={styles.modalInput} placeholder="Subject Code" value={editItem.subject_code} onChangeText={(t) => setEditItem({...editItem, subject_code: t.toUpperCase()})} />
                <TextInput style={styles.modalInput} placeholder="Subject Name" value={editItem.subject_name} onChangeText={(t) => setEditItem({...editItem, subject_name: t})} />
                <TextInput style={styles.modalInput} placeholder="Units" value={String(editItem.units)} onChangeText={(t) => setEditItem({...editItem, units: parseInt(t) || 0})} keyboardType="numeric" />
              </>
            )}
            {editType === 'section' && editItem && (
              <>
                <TextInput style={styles.modalInput} placeholder="Subject Code" value={editItem.subject_code} onChangeText={(t) => setEditItem({...editItem, subject_code: t.toUpperCase()})} />
                <TextInput style={styles.modalInput} placeholder="Section Code" value={editItem.section_code} onChangeText={(t) => setEditItem({...editItem, section_code: t.toUpperCase()})} />
                <TextInput style={styles.modalInput} placeholder="Schedule" value={editItem.schedule} onChangeText={(t) => setEditItem({...editItem, schedule: t})} />
                <TextInput style={styles.modalInput} placeholder="Room" value={editItem.room} onChangeText={(t) => setEditItem({...editItem, room: t})} />
                <TextInput style={styles.modalInput} placeholder="Capacity" value={String(editItem.capacity)} onChangeText={(t) => setEditItem({...editItem, capacity: parseInt(t) || 0})} keyboardType="numeric" />
              </>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditModal(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveEdit}><Text style={{color:'#fff'}}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContainer: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  iconWrapper: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1976d2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666' },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 12, height: 50, backgroundColor: '#fafafa', marginBottom: 12 },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },
  inputSimple: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 12, height: 50, fontSize: 16, backgroundColor: '#fafafa' },
  row: { flexDirection: 'row', marginTop: 4 },
  button: { backgroundColor: '#1976d2', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  linkText: { textAlign: 'center', marginTop: 20, color: '#1976d2', fontSize: 14 },
  appHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1976d2', flex: 1, marginLeft: 10 },
  userName: { fontSize: 14, color: '#666', marginRight: 10 },
  logoutBtn: { padding: 5 },
  tabBar: { flexDirection: 'row', backgroundColor: 'white', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tabItem: { flex: 1, alignItems: 'center' },
  tabLabel: { fontSize: 11, color: '#999', marginTop: 4 },
  tabLabelActive: { color: '#1976d2', fontWeight: '600' },
  content: { flex: 1, padding: 20 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#1976d2', marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 15, borderTopWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 2 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  statTitle: { fontSize: 14, color: '#666' },
  statChange: { fontSize: 10, color: '#4caf50', marginTop: 5 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  listHeaderTitle: { fontSize: 20, fontWeight: 'bold', color: '#1976d2' },
  addButton: { backgroundColor: '#1976d2', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  listItem: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  listSubtitle: { fontSize: 12, color: '#666', marginTop: 4 },
  actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  editBtn: { marginRight: 10 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 50 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  modalCancel: { backgroundColor: '#e0e0e0', padding: 12, borderRadius: 10, flex: 1, marginRight: 10, alignItems: 'center' },
  modalSave: { backgroundColor: '#1976d2', padding: 12, borderRadius: 10, flex: 1, alignItems: 'center' },
  pickerLabel: { fontSize: 14, fontWeight: '600', marginTop: 10, marginBottom: 5 },
  pickerScroll: { flexDirection: 'row', marginBottom: 10, maxHeight: 80 },
  pickerItem: { backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8, marginRight: 10, alignItems: 'center', minWidth: 100 },
  pickerItemSelected: { backgroundColor: '#1976d2' },
});