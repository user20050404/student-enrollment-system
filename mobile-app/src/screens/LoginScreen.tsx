import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { globalStyles } from '../styles/globalStyles';

interface LoginScreenProps {
  onSwitchToRegister: () => void;
}

export default function LoginScreen({ onSwitchToRegister }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
    } catch (error) {
      Alert.alert('Error', 'Invalid credentials');
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
          <Text style={globalStyles.title}>Student Enrollment</Text>
          <Text style={globalStyles.subtitle}>Sign in to your account</Text>
        </View>
        <View style={globalStyles.card}>
          <Text style={globalStyles.label}>Username</Text>
          <View style={globalStyles.inputRow}>
            <Ionicons name="person-outline" size={20} color="#1976d2" />
            <TextInput style={globalStyles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
          </View>
          <Text style={globalStyles.label}>Password</Text>
          <View style={globalStyles.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color="#1976d2" />
            <TextInput style={globalStyles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          </View>
          <TouchableOpacity style={globalStyles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={globalStyles.buttonText}>Sign In</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onSwitchToRegister}>
            <Text style={globalStyles.linkText}>Don't have an account? Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}