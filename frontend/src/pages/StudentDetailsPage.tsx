import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Alert,
  CircularProgress,
  Avatar,
  Stack,
  Tooltip,
  Breadcrumbs,
  Link as MuiLink,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  alpha,
  useTheme,
  Fade,
  Grow,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack,
  Person,
  School,
  Class,
  MenuBook,
  Schedule,
  Room,
  CalendarToday,
  Email,
  Grade,
  TrendingUp,
  Delete,
  Edit,
  Print,
  Close,
  Warning,
  Refresh,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { studentsApi, enrollmentsApi, Enrollment, Student, EnrollmentSummary } from '../services/api';

interface StudentWithDetails extends Student {
  total_units?: number;
}

const StudentDetailsPage: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentWithDetails | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [summaries, setSummaries] = useState<EnrollmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    year_level: '',
    program: '',
    status: '',
  });
  const [editErrors, setEditErrors] = useState<{[key: string]: string}>({});
  const [editLoading, setEditLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (id) {
      fetchStudentData(parseInt(id));
    }
  }, [id]);

  const fetchStudentData = async (studentId: number) => {
    setLoading(true);
    setError(null);
    try {
      const [studentData, enrollmentsData, summariesData] = await Promise.all([
        studentsApi.getById(studentId),
        studentsApi.getEnrollments(studentId),
        studentsApi.getSummary(studentId),
      ]);
      
      setStudent(studentData);
      setEnrollments(enrollmentsData);
      setSummaries(summariesData);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load student data. Please try again.');
      console.error('Error fetching student data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDropEnrollment = async (enrollmentId: number) => {
    if (window.confirm('Are you sure you want to drop this enrollment? This action cannot be undone.')) {
      try {
        await enrollmentsApi.delete(enrollmentId);
        if (id) {
          await fetchStudentData(parseInt(id));
        }
      } catch (error) {
        console.error('Error dropping enrollment:', error);
        alert('Failed to drop enrollment. Please try again.');
      }
    }
  };

  const handleEditClick = () => {
    if (student) {
      setEditFormData({
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        year_level: student.year_level,
        program: student.program,
        status: student.status,
      });
      setEditErrors({});
      setEditDialogOpen(true);
    }
  };

  const validateEditForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!editFormData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (!/^[a-zA-Z\s]{2,50}$/.test(editFormData.first_name)) {
      newErrors.first_name = 'First name must contain only letters and spaces (2-50 characters)';
    }
    
    if (!editFormData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (!/^[a-zA-Z\s]{2,50}$/.test(editFormData.last_name)) {
      newErrors.last_name = 'Last name must contain only letters and spaces (2-50 characters)';
    }
    
    if (!editFormData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(editFormData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateStudent = async () => {
    if (!validateEditForm() || !student) return;
    
    setEditLoading(true);
    try {
      await studentsApi.update(student.id, editFormData);
      await fetchStudentData(student.id);
      setEditDialogOpen(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error updating student';
      alert(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    if (id) {
      fetchStudentData(parseInt(id));
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case 'enrolled':
        return 'success';
      case 'not_enrolled':
        return 'warning';
      case 'graduated':
        return 'info';
      case 'dropped':
        return 'error';
      default:
        return 'default';
    }
  };

  const getProgramColor = (program: string): string => {
    switch (program) {
      case 'BSIT':
        return '#2196f3';
      case 'BSCS':
        return '#4caf50';
      case 'BSIS':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  const getYearSuffix = (year: number): string => {
    if (year === 1) return 'st';
    if (year === 2) return 'nd';
    if (year === 3) return 'rd';
    return 'th';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !student) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error || 'Student not found'}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/students')} variant="outlined">
          Back to Students
        </Button>
      </Container>
    );
  }

  const activeEnrollments = enrollments.filter(e => e.status === 'enrolled');
  const totalUnits = activeEnrollments.reduce((sum, e) => sum + e.units, 0);
  const currentSemester = activeEnrollments[0]?.semester || 'N/A';
  const currentSchoolYear = activeEnrollments[0]?.school_year || 'N/A';
  const enrollmentRate = student ? (activeEnrollments.length / (student.year_level === '1' ? 8 : 10)) * 100 : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <MuiLink
          component="button"
          variant="body2"
          onClick={() => navigate('/')}
          sx={{ cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Dashboard
        </MuiLink>
        <MuiLink
          component="button"
          variant="body2"
          onClick={() => navigate('/students')}
          sx={{ cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Students
        </MuiLink>
        <Typography color="text.primary">{student.student_number}</Typography>
      </Breadcrumbs>

      {/* Header with Back Button and Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/students')}
          variant="outlined"
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Back to Students
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            icon={<Refresh />} 
            label={`Updated: ${lastUpdated.toLocaleTimeString()}`} 
            size="small"
            variant="outlined"
            onClick={handleRefresh}
          />
          <Tooltip title="Print">
            <IconButton color="primary" onClick={handlePrint}>
              <Print />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Student">
            <IconButton color="primary" onClick={handleEditClick}>
              <Edit />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Student Profile Card */}
      <Paper elevation={0} sx={{ mb: 4, overflow: 'hidden', borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Box sx={{ 
          background: `linear-gradient(135deg, ${getProgramColor(student.program)} 0%, ${getProgramColor(student.program)}dd 100%)`,
          color: 'white',
          p: 4,
        }}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, sm: 2 }} sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  fontSize: 48,
                  mx: 'auto',
                  border: '4px solid rgba(255,255,255,0.3)',
                }}
              >
                {student.first_name[0]}{student.last_name[0]}
              </Avatar>
            </Grid>
            <Grid size={{ xs: 12, sm: 10 }}>
              <Typography variant="h4" fontWeight="700" gutterBottom>
                {student.last_name}, {student.first_name}
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }} gutterBottom>
                {student.student_number}
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                <Chip 
                  icon={<School />} 
                  label={student.program} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '& .MuiChip-icon': { color: 'white' } }}
                />
                <Chip 
                  icon={<Grade />} 
                  label={`${student.year_level}${getYearSuffix(parseInt(student.year_level))} Year`} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '& .MuiChip-icon': { color: 'white' } }}
                />
                <Chip 
                  label={student.status.toUpperCase()} 
                  color={getStatusColor(student.status)}
                />
              </Stack>
            </Grid>
          </Grid>
        </Box>
        
        {/* Student Information */}
        <Box sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Student Information
          </Typography>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={2.5}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main, width: 40, height: 40 }}>
                    <Email />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Email Address</Typography>
                    <Typography variant="body1">{student.email}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main, width: 40, height: 40 }}>
                    <CalendarToday />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Enrolled Since</Typography>
                    <Typography variant="body1">{new Date(student.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Typography>
                  </Box>
                </Box>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={2.5}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, width: 40, height: 40 }}>
                    <TrendingUp />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Units Enrolled</Typography>
                    <Typography variant="h5" fontWeight="700" color="primary.main">{totalUnits} units</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main, width: 40, height: 40 }}>
                    <MenuBook />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Current Semester</Typography>
                    <Typography variant="body1">{currentSemester} | {currentSchoolYear}</Typography>
                  </Box>
                </Box>
              </Stack>
            </Grid>
          </Grid>

          {/* Enrollment Progress */}
          <Box sx={{ mt: 4, pt: 2 }}>
            <Typography variant="subtitle2" fontWeight="600" gutterBottom>
              Enrollment Progress
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {activeEnrollments.length} of {student.year_level === '1' ? 8 : 10} subjects completed
              </Typography>
              <Typography variant="caption" fontWeight="500" color={enrollmentRate >= 70 ? 'success.main' : 'warning.main'}>
                {Math.min(Math.round(enrollmentRate), 100)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(enrollmentRate, 100)} 
              sx={{ height: 8, borderRadius: 4 }}
              color={enrollmentRate >= 70 ? 'success' : 'warning'}
            />
          </Box>
        </Box>
      </Paper>

      {/* Enrollment Summary Cards */}
      {summaries.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Enrollment History
          </Typography>
          <Grid container spacing={3}>
            {summaries.map((summary) => (
              <Grid key={summary.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Fade in={true}>
                  <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03), borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                        {summary.semester} - {summary.school_year}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">Sections:</Typography>
                        <Typography variant="body2" fontWeight="500">{summary.total_sections}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Units:</Typography>
                        <Typography variant="body2" fontWeight="500">{summary.total_enrolled_units}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Last Updated: {new Date(summary.last_updated).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Current Enrollments Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Current Enrollments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeEnrollments.length} subject(s) enrolled | Total: {totalUnits} units
            </Typography>
          </Box>
          <Chip 
            label="Active" 
            size="small" 
            color="success" 
            icon={<CheckCircle sx={{ fontSize: 14 }} />}
          />
        </Box>
        
        {activeEnrollments.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Enrollments Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enroll this student in subjects to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<School />}
              onClick={() => navigate('/enrollments')}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Enroll Now
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableRow>
                  <TableCell><strong>Subject Code</strong></TableCell>
                  <TableCell><strong>Subject Name</strong></TableCell>
                  <TableCell><strong>Section</strong></TableCell>
                  <TableCell><strong>Units</strong></TableCell>
                  <TableCell><strong>Schedule</strong></TableCell>
                  <TableCell><strong>Room</strong></TableCell>
                  <TableCell><strong>Semester</strong></TableCell>
                  <TableCell><strong>School Year</strong></TableCell>
                  <TableCell><strong>Enrolled Date</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeEnrollments.map((enrollment) => (
                  <TableRow key={enrollment.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">
                        {enrollment.subject_code}
                      </Typography>
                    </TableCell>
                    <TableCell>{enrollment.subject_name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={enrollment.section_code} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${enrollment.units} units`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Schedule sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2">{enrollment.schedule}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Room sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2">{enrollment.room}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{enrollment.semester}</TableCell>
                    <TableCell>{enrollment.school_year}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Drop this subject">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDropEnrollment(enrollment.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Quick Actions */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<School />}
          onClick={() => navigate('/enrollments')}
          sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
        >
          Enroll in More Subjects
        </Button>
      </Box>

      {/* Edit Student Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        TransitionComponent={Grow}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                <Edit />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="600">Edit Student Information</Typography>
                <Typography variant="caption" color="text.secondary">Update student details</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setEditDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {Object.keys(editErrors).length > 0 && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              Please fix the errors below
            </Alert>
          )}
          <TextField
            fullWidth
            label="First Name"
            value={editFormData.first_name}
            onChange={(e) => {
              setEditFormData({ ...editFormData, first_name: e.target.value });
              if (editErrors.first_name) delete editErrors.first_name;
            }}
            margin="normal"
            required
            error={!!editErrors.first_name}
            helperText={editErrors.first_name}
            disabled={editLoading}
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            label="Last Name"
            value={editFormData.last_name}
            onChange={(e) => {
              setEditFormData({ ...editFormData, last_name: e.target.value });
              if (editErrors.last_name) delete editErrors.last_name;
            }}
            margin="normal"
            required
            error={!!editErrors.last_name}
            helperText={editErrors.last_name}
            disabled={editLoading}
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={editFormData.email}
            onChange={(e) => {
              setEditFormData({ ...editFormData, email: e.target.value });
              if (editErrors.email) delete editErrors.email;
            }}
            margin="normal"
            required
            error={!!editErrors.email}
            helperText={editErrors.email}
            disabled={editLoading}
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            select
            label="Program"
            value={editFormData.program}
            onChange={(e) => setEditFormData({ ...editFormData, program: e.target.value })}
            margin="normal"
            disabled={editLoading}
            sx={{ mb: 1 }}
          >
            <MenuItem value="BSIT">BS Information Technology</MenuItem>
            <MenuItem value="BSCS">BS Computer Science</MenuItem>
            <MenuItem value="BSIS">BS Information Systems</MenuItem>
          </TextField>
          <TextField
            fullWidth
            select
            label="Year Level"
            value={editFormData.year_level}
            onChange={(e) => setEditFormData({ ...editFormData, year_level: e.target.value })}
            margin="normal"
            disabled={editLoading}
            sx={{ mb: 1 }}
          >
            <MenuItem value="1">1st Year</MenuItem>
            <MenuItem value="2">2nd Year</MenuItem>
            <MenuItem value="3">3rd Year</MenuItem>
            <MenuItem value="4">4th Year</MenuItem>
          </TextField>
          <TextField
            fullWidth
            select
            label="Status"
            value={editFormData.status}
            onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
            margin="normal"
            disabled={editLoading}
          >
            <MenuItem value="not_enrolled">Not Enrolled</MenuItem>
            <MenuItem value="enrolled">Enrolled</MenuItem>
            <MenuItem value="graduated">Graduated</MenuItem>
            <MenuItem value="dropped">Dropped</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Button onClick={() => setEditDialogOpen(false)} disabled={editLoading} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateStudent} 
            variant="contained" 
            disabled={editLoading}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentDetailsPage;