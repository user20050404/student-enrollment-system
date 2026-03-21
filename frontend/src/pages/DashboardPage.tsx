import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  People,
  MenuBook,
  Class,
  School,
  TrendingUp,
} from '@mui/icons-material';
import { studentsApi, subjectsApi, sectionsApi, enrollmentsApi, Student, Enrollment } from '../services/api';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    totalSections: 0,
    totalEnrollments: 0,
    enrolledStudents: 0,
  });
  const [recentEnrollments, setRecentEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentEnrollments();
  }, []);

  const fetchStats = async () => {
    try {
      const [studentsData, subjectsData, sectionsData, enrollmentsData] = await Promise.all([
        studentsApi.getAll(),
        subjectsApi.getAll(),
        sectionsApi.getAll(),
        enrollmentsApi.getAll(),
      ]);

      const enrolledStudents = studentsData.filter((student: Student) => student.status === 'enrolled').length;

      setStats({
        totalStudents: studentsData.length,
        totalSubjects: subjectsData.length,
        totalSections: sectionsData.length,
        totalEnrollments: enrollmentsData.length,
        enrolledStudents: enrolledStudents,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentEnrollments = async () => {
    try {
      const data = await enrollmentsApi.getAll();
      const recent = data.slice(-5).reverse();
      setRecentEnrollments(recent);
    } catch (error) {
      console.error('Error fetching recent enrollments:', error);
    }
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`, color: 'white' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" component="div">
              {value}
            </Typography>
          </Box>
          <Box sx={{ fontSize: 48, opacity: 0.7 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const enrollmentRate = stats.totalStudents > 0 
    ? (stats.enrolledStudents / stats.totalStudents) * 100 
    : 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={<People sx={{ fontSize: 48 }} />}
            color="#2196f3"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Subjects"
            value={stats.totalSubjects}
            icon={<MenuBook sx={{ fontSize: 48 }} />}
            color="#4caf50"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Sections"
            value={stats.totalSections}
            icon={<Class sx={{ fontSize: 48 }} />}
            color="#ff9800"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Enrollments"
            value={stats.totalEnrollments}
            icon={<School sx={{ fontSize: 48 }} />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Enrollment Rate
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h4">
                {enrollmentRate.toFixed(1)}%
              </Typography>
              <TrendingUp color="success" />
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={enrollmentRate} 
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {stats.enrolledStudents} out of {stats.totalStudents} students are enrolled
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Enrollments
            </Typography>
            <List>
              {recentEnrollments.map((enrollment: Enrollment, index: number) => (
                <React.Fragment key={enrollment.id}>
                  <ListItem>
                    <ListItemText
                      primary={`${enrollment.student_name} - ${enrollment.subject_name}`}
                      secondary={`Section: ${enrollment.section_code} | ${new Date(enrollment.enrolled_at).toLocaleDateString()}`}
                    />
                  </ListItem>
                  {index < recentEnrollments.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {recentEnrollments.length === 0 && (
                <ListItem>
                  <ListItemText primary="No recent enrollments" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;