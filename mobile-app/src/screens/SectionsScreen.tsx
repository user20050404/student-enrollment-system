import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../styles/globalStyles';
import { sectionsApi } from '../services/api';

interface Section {
  id: number;
  subject_code: string;
  section_code: string;
  schedule: string;
  room: string;
  capacity: number;
}

interface SectionsScreenProps {
  sections: Section[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export default function SectionsScreen({ sections, loading, onRefresh }: SectionsScreenProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [newSection, setNewSection] = useState({ subject_code: '', section_code: '', schedule: '', room: '', capacity: '30' });
  const [submitting, setSubmitting] = useState(false);

  const handleAddSection = async () => {
    if (!newSection.subject_code || !newSection.section_code || !newSection.schedule || !newSection.room) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await sectionsApi.create({ ...newSection, capacity: parseInt(newSection.capacity) });
      await onRefresh();
      setModalVisible(false);
      setNewSection({ subject_code: '', section_code: '', schedule: '', room: '', capacity: '30' });
      Alert.alert('Success', 'Section added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add section');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSection = async (id: number, name: string) => {
    Alert.alert('Delete Section', `Delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await sectionsApi.delete(id);
          await onRefresh();
          Alert.alert('Deleted', 'Section removed successfully');
        } catch (error) {
          Alert.alert('Error', 'Failed to delete section');
        }
      }}
    ]);
  };

  const SectionItem = ({ item }: { item: Section }) => (
    <View style={globalStyles.listItem}>
      <View>
        <Text style={globalStyles.itemTitle}>{item.subject_code} - Section {item.section_code}</Text>
        <Text style={globalStyles.itemSubtitle}>{item.schedule} | {item.room} | Capacity: {item.capacity}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDeleteSection(item.id, `${item.subject_code}-${item.section_code}`)}>
        <Ionicons name="trash-outline" size={22} color="#f44336" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View>
      <View style={globalStyles.listHeader}>
        <Text style={globalStyles.listHeaderTitle}>Sections ({sections.length})</Text>
        <TouchableOpacity style={globalStyles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator style={globalStyles.loader} /> : sections.map(item => <SectionItem key={item.id} item={item} />)}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={globalStyles.modalContainer}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>Add Section</Text>
            <TextInput style={globalStyles.modalInput} placeholder="Subject Code *" value={newSection.subject_code} onChangeText={(t) => setNewSection({...newSection, subject_code: t.toUpperCase()})} />
            <TextInput style={globalStyles.modalInput} placeholder="Section Code *" value={newSection.section_code} onChangeText={(t) => setNewSection({...newSection, section_code: t.toUpperCase()})} />
            <TextInput style={globalStyles.modalInput} placeholder="Schedule *" value={newSection.schedule} onChangeText={(t) => setNewSection({...newSection, schedule: t})} />
            <TextInput style={globalStyles.modalInput} placeholder="Room *" value={newSection.room} onChangeText={(t) => setNewSection({...newSection, room: t})} />
            <TextInput style={globalStyles.modalInput} placeholder="Capacity" value={newSection.capacity} onChangeText={(t) => setNewSection({...newSection, capacity: t})} keyboardType="numeric" />
            <View style={globalStyles.modalButtons}>
              <TouchableOpacity style={globalStyles.modalCancel} onPress={() => setModalVisible(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={globalStyles.modalSave} onPress={handleAddSection} disabled={submitting}>
                <Text style={{color:'#fff'}}>{submitting ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}