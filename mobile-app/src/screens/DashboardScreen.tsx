import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../styles/globalStyles';

interface DashboardScreenProps {
  stats: {
    totalStudents: number;
    totalSubjects: number;
    totalSections: number;
    totalEnrollments: number;
  };
  userName: string;
  loading: boolean;
}

export default function DashboardScreen({ stats, userName, loading }: DashboardScreenProps) {
  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={[globalStyles.statCard, { borderTopColor: color }]}>
      <View style={globalStyles.statHeader}>
        <Text style={globalStyles.statValue}>{value}</Text>
        <Ionicons name={icon} size={30} color={color} />
      </View>
      <Text style={globalStyles.statTitle}>{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={globalStyles.center}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.content}>
      <Text style={globalStyles.welcomeText}>Welcome back, {userName}!</Text>
      <View style={globalStyles.statsGrid}>
        <StatCard title="Students" value={stats.totalStudents} icon="people-outline" color="#2196f3" />
        <StatCard title="Subjects" value={stats.totalSubjects} icon="book-outline" color="#4caf50" />
        <StatCard title="Sections" value={stats.totalSections} icon="grid-outline" color="#ff9800" />
        <StatCard title="Enrollments" value={stats.totalEnrollments} icon="school-outline" color="#9c27b0" />
      </View>
    </ScrollView>
  );
}