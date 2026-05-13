import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../styles/globalStyles';
import { enrollmentsApi, studentsApi, sectionsApi } from '../services/api';

interface Enrollment {
  id: number;
  student_name: string;
  student_id: number;
  subject_code: string;
  section_code: string;
}

interface EnrollmentsScreenProps {
  enrollments: Enrollment[];
  students: any[];
  sections: any[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export default function EnrollmentsScreen({ enrollments, students, sections, loading, onRefresh }: EnrollmentsScreenProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddEnrollment = async () => {
    if (!selectedStudent || !selectedSection) {
      Alert.alert('Error', 'Please select student and section');
      return;
    }
    setSubmitting(true);
    try {
      await enrollmentsApi.create({ student: parseInt(selectedStudent), section: parseInt(selectedSection) });
      await onRefresh();
      setModalVisible(false);
      setSelectedStudent('');
      setSelectedSection('');
      Alert.alert('Success', 'Student enrolled successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to enroll student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEnrollment = async (id: number, studentName: string) => {
    Alert.alert('Drop Enrollment', `Drop ${studentName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Drop', style: 'destructive', onPress: async () => {
        try {
          await enrollmentsApi.delete(id);
          await onRefresh();
          Alert.alert('Dropped', 'Enrollment removed successfully');
        } catch (error) {
          Alert.alert('Error', 'Failed to drop enrollment');
        }
      }}
    ]);
  };

  const EnrollmentItem = ({ item }: { item: Enrollment }) => (
    <View style={globalStyles.listItem}>
      <View>
        <Text style={globalStyles.itemTitle}>{item.student_name}</Text>
        <Text style={globalStyles.itemSubtitle}>{item.subject_code} - Section {item.section_code}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDeleteEnrollment(item.id, item.student_name)}>
        <Ionicons name="trash-outline" size={22} color="#f44336" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View>
      <View style={globalStyles.listHeader}>
        <Text style={globalStyles.listHeaderTitle}>Enrollments ({enrollments.length})</Text>
        <TouchableOpacity style={globalStyles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator style={globalStyles.loader} /> : enrollments.map(item => <EnrollmentItem key={item.id} item={item} />)}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={globalStyles.modalContainer}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>Enroll Student</Text>
            <Text style={globalStyles.pickerLabel}>Select Student</Text>
            <ScrollView horizontal>
              {students.map(s => (
                <TouchableOpacity key={s.id} style={[globalStyles.pickerItem, selectedStudent == s.id && globalStyles.pickerSelected]} onPress={() => setSelectedStudent(s.id)}>
                  <Text>{s.last_name}, {s.first_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={globalStyles.pickerLabel}>Select Section</Text>
            <ScrollView horizontal>
              {sections.map(s => (
                <TouchableOpacity key={s.id} style={[globalStyles.pickerItem, selectedSection == s.id && globalStyles.pickerSelected]} onPress={() => setSelectedSection(s.id)}>
                  <Text>{s.subject_code}-{s.section_code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={globalStyles.modalButtons}>
              <TouchableOpacity style={globalStyles.modalCancel} onPress={() => setModalVisible(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={globalStyles.modalSave} onPress={handleAddEnrollment} disabled={submitting}>
                <Text style={{color:'#fff'}}>{submitting ? 'Enrolling...' : 'Enroll'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}