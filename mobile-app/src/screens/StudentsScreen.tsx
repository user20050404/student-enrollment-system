import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../styles/globalStyles';
import { studentsApi } from '../services/api';

interface Student {
  id: number;
  student_number: string;
  first_name: string;
  last_name: string;
  email: string;
  program: string;
  year_level: string;
}

interface StudentsScreenProps {
  students: Student[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export default function StudentsScreen({ students, loading, onRefresh }: StudentsScreenProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [newStudent, setNewStudent] = useState({ student_number: '', first_name: '', last_name: '', email: '', program: 'BSIT', year_level: '1' });
  const [submitting, setSubmitting] = useState(false);

  const handleAddStudent = async () => {
    if (!newStudent.student_number || !newStudent.first_name || !newStudent.last_name || !newStudent.email) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await studentsApi.create(newStudent);
      await onRefresh();
      setModalVisible(false);
      setNewStudent({ student_number: '', first_name: '', last_name: '', email: '', program: 'BSIT', year_level: '1' });
      Alert.alert('Success', 'Student added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: number, name: string) => {
    Alert.alert('Delete Student', `Delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await studentsApi.delete(id);
          await onRefresh();
          Alert.alert('Deleted', 'Student removed successfully');
        } catch (error) {
          Alert.alert('Error', 'Failed to delete student');
        }
      }}
    ]);
  };

  const StudentItem = ({ item }: { item: Student }) => (
    <View style={globalStyles.listItem}>
      <View>
        <Text style={globalStyles.itemTitle}>{item.last_name}, {item.first_name}</Text>
        <Text style={globalStyles.itemSubtitle}>{item.student_number} | {item.program} Year {item.year_level}</Text>
        <Text style={globalStyles.itemSubtitle}>{item.email}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDeleteStudent(item.id, `${item.first_name} ${item.last_name}`)}>
        <Ionicons name="trash-outline" size={22} color="#f44336" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View>
      <View style={globalStyles.listHeader}>
        <Text style={globalStyles.listHeaderTitle}>Students ({students.length})</Text>
        <TouchableOpacity style={globalStyles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator style={globalStyles.loader} /> : students.map(item => <StudentItem key={item.id} item={item} />)}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={globalStyles.modalContainer}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>Add Student</Text>
            <TextInput style={globalStyles.modalInput} placeholder="Student Number *" value={newStudent.student_number} onChangeText={(t) => setNewStudent({...newStudent, student_number: t})} />
            <TextInput style={globalStyles.modalInput} placeholder="First Name *" value={newStudent.first_name} onChangeText={(t) => setNewStudent({...newStudent, first_name: t})} />
            <TextInput style={globalStyles.modalInput} placeholder="Last Name *" value={newStudent.last_name} onChangeText={(t) => setNewStudent({...newStudent, last_name: t})} />
            <TextInput style={globalStyles.modalInput} placeholder="Email *" value={newStudent.email} onChangeText={(t) => setNewStudent({...newStudent, email: t})} keyboardType="email-address" />
            <View style={globalStyles.modalButtons}>
              <TouchableOpacity style={globalStyles.modalCancel} onPress={() => setModalVisible(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={globalStyles.modalSave} onPress={handleAddStudent} disabled={submitting}>
                <Text style={{color:'#fff'}}>{submitting ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}