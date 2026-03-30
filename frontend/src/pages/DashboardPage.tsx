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
  ListItemAvatar,
  Divider,
  Avatar,
  Chip,
  Button,
  IconButton,
  alpha,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import {
  People,
  MenuBook,
  Class,
  School,
  Refresh,
  Timer,
  CheckCircle,
  Assignment,
  Star,
  Timeline,
  BarChart,
} from '@mui/icons-material';
import { studentsApi, subjectsApi, sectionsApi, enrollmentsApi, Student, Enrollment } from '../services/api';

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    totalSections: 0,
    totalEnrollments: 0,
    enrolledStudents: 0,
    completionRate: 0,
  });
  const [recentEnrollments, setRecentEnrollments] = useState<Enrollment[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [studentsData, subjectsData, sectionsData, enrollmentsData] = await Promise.all([
        studentsApi.getAll(),
        subjectsApi.getAll(),
        sectionsApi.getAll(),
        enrollmentsApi.getAll(),
      ]);

      const enrolledStudents = studentsData.filter((student: Student) => student.status === 'enrolled').length;

      const completionRate = studentsData.length > 0 
        ? (enrolledStudents / studentsData.length) * 100 
        : 0;

      setStats({
        totalStudents: studentsData.length,
        totalSubjects: subjectsData.length,
        totalSections: sectionsData.length,
        totalEnrollments: enrollmentsData.length,
        enrolledStudents: enrolledStudents,
        completionRate: completionRate,
      });

      const recent = enrollmentsData.slice(-5).reverse();
      setRecentEnrollments(recent);

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleRefresh = () => {
    fetchAllData();
    setLastUpdated(new Date());
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card 
      sx={{ 
        height: '100%', 
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
        cursor: 'pointer',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.5px',
                mb: 1,
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h3" 
              component="div" 
              sx={{ 
                fontWeight: 700,
                mb: 1,
                background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {value.toLocaleString()}
            </Typography>
          </Box>
          <Avatar 
            sx={{ 
              bgcolor: alpha(color, 0.1), 
              color: color,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
      <Box 
        sx={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          height: 3, 
          background: `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`,
        }} 
      />
    </Card>
  );

  const enrollmentRate = stats.totalStudents > 0 
    ? (stats.enrolledStudents / stats.totalStudents) * 100 
    : 0;

  const getEnrollmentStatusColor = (rate: number) => {
    if (rate >= 70) return '#4caf50';
    if (rate >= 40) return '#ff9800';
    return '#f44336';
  };

  // Subject enrollment data from real data
  const [subjectEnrollments, setSubjectEnrollments] = useState<any[]>([]);

  // Fetch real subject enrollment data
  useEffect(() => {
    const fetchSubjectEnrollments = async () => {
      try {
        const subjectsData = await subjectsApi.getAll();
        const enrollmentsData = await enrollmentsApi.getAll();
        
        const subjectStats = subjectsData.map(subject => {
          const enrollments = enrollmentsData.filter(e => e.subject_code === subject.subject_code && e.status === 'enrolled');
          return {
            code: subject.subject_code,
            name: subject.subject_name,
            enrollments: enrollments.length,
            max: 100,
            color: ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#0288d1'][Math.floor(Math.random() * 5)],
          };
        }).sort((a, b) => b.enrollments - a.enrollments).slice(0, 5);
        
        setSubjectEnrollments(subjectStats);
      } catch (error) {
        console.error('Error fetching subject enrollments:', error);
        // Fallback data
        setSubjectEnrollments([
          { code: 'CS101', name: 'Programming', enrollments: 0, max: 100, color: '#1976d2' },
          { code: 'MATH101', name: 'Calculus', enrollments: 0, max: 100, color: '#2e7d32' },
        ]);
      }
    };
    
    fetchSubjectEnrollments();
  }, [stats.totalEnrollments]);

  return (
    <Box>
      {/* Header with Refresh */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            icon={<Timer />} 
            label={`Last updated: ${lastUpdated.toLocaleTimeString()}`} 
            size="small"
            variant="outlined"
          />
          <IconButton onClick={handleRefresh} size="small">
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={<People />}
            color="#1976d2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active Subjects"
            value={stats.totalSubjects}
            icon={<MenuBook />}
            color="#2e7d32"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active Sections"
            value={stats.totalSections}
            icon={<Class />}
            color="#ed6c02"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Enrollments"
            value={stats.totalEnrollments}
            icon={<School />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Subject Distribution Section */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight="600">
                  Subject Enrollment Distribution
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Most enrolled subjects
                </Typography>
              </Box>
            </Box>
            
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                    <TableCell><strong>Subject</strong></TableCell>
                    <TableCell align="right"><strong>Enrollments</strong></TableCell>
                    <TableCell align="right"><strong>Progress</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subjectEnrollments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          No enrollment data available
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    subjectEnrollments.map((subject, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(subject.color, 0.1), color: subject.color }}>
                              <MenuBook sx={{ fontSize: 16 }} />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="500">
                                {subject.code}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {subject.name}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="500">
                            {subject.enrollments}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 150 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={Math.min((subject.enrollments / subject.max) * 100, 100)}
                              sx={{ flex: 1, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {Math.min(Math.round((subject.enrollments / subject.max) * 100), 100)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight="600">
                Quick Stats
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Key metrics at a glance
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    borderRadius: 2,
                    textAlign: 'center',
                  }}
                >
                  <Timeline sx={{ color: theme.palette.info.main, mb: 1, fontSize: 32 }} />
                  <Typography variant="h6" fontWeight="700">
                    {stats.totalEnrollments}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Enrollments
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                    borderRadius: 2,
                    textAlign: 'center',
                  }}
                >
                  <BarChart sx={{ color: theme.palette.success.main, mb: 1, fontSize: 32 }} />
                  <Typography variant="h6" fontWeight="700">
                    {stats.totalSections}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active Sections
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: alpha(theme.palette.warning.main, 0.05),
                    borderRadius: 2,
                    textAlign: 'center',
                  }}
                >
                  <School sx={{ color: theme.palette.warning.main, mb: 1, fontSize: 32 }} />
                  <Typography variant="h6" fontWeight="700">
                    {stats.totalSubjects}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Subjects
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: alpha(theme.palette.secondary.main, 0.05),
                    borderRadius: 2,
                    textAlign: 'center',
                  }}
                >
                  <People sx={{ color: theme.palette.secondary.main, mb: 1, fontSize: 32 }} />
                  <Typography variant="h6" fontWeight="700">
                    {stats.enrolledStudents}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Enrolled Students
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Enrollment Rate Card */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Overall Enrollment Rate
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h4" fontWeight="700" color={getEnrollmentStatusColor(enrollmentRate)}>
                  {enrollmentRate.toFixed(1)}%
                </Typography>
                <Chip 
                  label={enrollmentRate >= 70 ? 'Excellent' : enrollmentRate >= 40 ? 'Good' : 'Needs Improvement'}
                  size="small"
                  color={enrollmentRate >= 70 ? 'success' : enrollmentRate >= 40 ? 'warning' : 'error'}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={enrollmentRate} 
                sx={{ 
                  height: 10, 
                  borderRadius: 5,
                  backgroundColor: alpha(getEnrollmentStatusColor(enrollmentRate), 0.1),
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getEnrollmentStatusColor(enrollmentRate),
                    borderRadius: 5,
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity Section */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight="600">
                  Recent Enrollments
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Latest enrollment transactions
                </Typography>
              </Box>
              <Chip 
                label="Live" 
                size="small" 
                color="success" 
                icon={<CheckCircle sx={{ fontSize: 14 }} />}
              />
            </Box>
            
            <List>
              {recentEnrollments.length === 0 ? (
                <ListItem>
                  <ListItemText 
                    primary="No recent enrollments"
                    secondary="Enrollments will appear here"
                    primaryTypographyProps={{ align: 'center' }}
                    secondaryTypographyProps={{ align: 'center' }}
                  />
                </ListItem>
              ) : (
                recentEnrollments.map((enrollment: Enrollment, index: number) => (
                  <React.Fragment key={enrollment.id}>
                    <ListItem sx={{ py: 2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                          <School />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="body2" fontWeight="500">
                              {enrollment.student_name}
                            </Typography>
                            <Chip 
                              label={enrollment.subject_code} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box component="span">
                            <Typography variant="caption" color="text.secondary" component="span">
                              {enrollment.subject_name} • Section {enrollment.section_code}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary" component="span">
                              {new Date(enrollment.enrolled_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentEnrollments.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))
              )}
            </List>
            
            <Button 
              fullWidth 
              variant="text" 
              sx={{ mt: 2 }}
              onClick={() => window.location.href = '/enrollments'}
            >
              View All Enrollments
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;