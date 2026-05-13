import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { globalStyles } from '../styles/globalStyles';

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
}

export default function RegisterScreen({ onSwitchToLogin }: RegisterScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('confirm_password', confirmPassword);
      formData.append('email', email);
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('role', 'student');
      await register(formData);
      Alert.alert('Success', 'Account created! Please check your email to activate.', [{ text: 'OK', onPress: onSwitchToLogin }]);
    } catch (error) {
      Alert.alert('Error', 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
        <View style={globalStyles.header}>
          <View style={globalStyles.iconWrapper}>
            <Ionicons name="school" size={50} color="#fff" />
          </View>
          <Text style={globalStyles.title}>Create Account</Text>
          <Text style={globalStyles.subtitle}>Register to get started</Text>
        </View>
        <View style={globalStyles.card}>
          <Text style={globalStyles.label}>Username *</Text>
          <View style={globalStyles.inputRow}>
            <Ionicons name="person-outline" size={20} color="#1976d2" />
            <TextInput style={globalStyles.input} placeholder="Username" value={username} onChangeText={setUsername} />
          </View>
          <Text style={globalStyles.label}>Email *</Text>
          <View style={globalStyles.inputRow}>
            <Ionicons name="mail-outline" size={20} color="#1976d2" />
            <TextInput style={globalStyles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          </View>
          <View style={globalStyles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={globalStyles.label}>First Name</Text>
              <TextInput style={globalStyles.inputSimple} placeholder="First name" value={firstName} onChangeText={setFirstName} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={globalStyles.label}>Last Name</Text>
              <TextInput style={globalStyles.inputSimple} placeholder="Last name" value={lastName} onChangeText={setLastName} />
            </View>
          </View>
          <Text style={globalStyles.label}>Password *</Text>
          <View style={globalStyles.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color="#1976d2" />
            <TextInput style={globalStyles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          </View>
          <Text style={globalStyles.label}>Confirm Password *</Text>
          <View style={globalStyles.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color="#1976d2" />
            <TextInput style={globalStyles.input} placeholder="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          </View>
          <TouchableOpacity style={globalStyles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={globalStyles.buttonText}>Sign Up</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onSwitchToLogin}>
            <Text style={globalStyles.linkText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}