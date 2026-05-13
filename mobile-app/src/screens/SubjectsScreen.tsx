import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../styles/globalStyles';
import { subjectsApi } from '../services/api';

interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
  units: number;
}

interface SubjectsScreenProps {
  subjects: Subject[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export default function SubjectsScreen({ subjects, loading, onRefresh }: SubjectsScreenProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [newSubject, setNewSubject] = useState({ subject_code: '', subject_name: '', units: '3' });
  const [submitting, setSubmitting] = useState(false);

  const handleAddSubject = async () => {
    if (!newSubject.subject_code || !newSubject.subject_name) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await subjectsApi.create({ ...newSubject, units: parseInt(newSubject.units) });
      await onRefresh();
      setModalVisible(false);
      setNewSubject({ subject_code: '', subject_name: '', units: '3' });
      Alert.alert('Success', 'Subject added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async (id: number, name: string) => {
    Alert.alert('Delete Subject', `Delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await subjectsApi.delete(id);
          await onRefresh();
          Alert.alert('Deleted', 'Subject removed successfully');
        } catch (error) {
          Alert.alert('Error', 'Failed to delete subject');
        }
      }}
    ]);
  };

  const SubjectItem = ({ item }: { item: Subject }) => (
    <View style={globalStyles.listItem}>
      <View>
        <Text style={globalStyles.itemTitle}>{item.subject_code} - {item.subject_name}</Text>
        <Text style={globalStyles.itemSubtitle}>{item.units} units</Text>
      </View>
      <TouchableOpacity onPress={() => handleDeleteSubject(item.id, item.subject_code)}>
        <Ionicons name="trash-outline" size={22} color="#f44336" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View>
      <View style={globalStyles.listHeader}>
        <Text style={globalStyles.listHeaderTitle}>Subjects ({subjects.length})</Text>
        <TouchableOpacity style={globalStyles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator style={globalStyles.loader} /> : subjects.map(item => <SubjectItem key={item.id} item={item} />)}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={globalStyles.modalContainer}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>Add Subject</Text>
            <TextInput style={globalStyles.modalInput} placeholder="Subject Code *" value={newSubject.subject_code} onChangeText={(t) => setNewSubject({...newSubject, subject_code: t.toUpperCase()})} />
            <TextInput style={globalStyles.modalInput} placeholder="Subject Name *" value={newSubject.subject_name} onChangeText={(t) => setNewSubject({...newSubject, subject_name: t})} />
            <TextInput style={globalStyles.modalInput} placeholder="Units" value={newSubject.units} onChangeText={(t) => setNewSubject({...newSubject, units: t})} keyboardType="numeric" />
            <View style={globalStyles.modalButtons}>
              <TouchableOpacity style={globalStyles.modalCancel} onPress={() => setModalVisible(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={globalStyles.modalSave} onPress={handleAddSubject} disabled={submitting}>
                <Text style={{color:'#fff'}}>{submitting ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}