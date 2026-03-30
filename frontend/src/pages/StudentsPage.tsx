import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Box,
  Typography,
  Tooltip,
  Avatar,
  alpha,
  useTheme,
  Grow,
} from '@mui/material';
import { 
  Edit, 
  Delete, 
  Add, 
  Warning, 
  Visibility,
  Person,
  School,
  Email,
  Refresh,
} from '@mui/icons-material';
import { studentsApi, Student } from '../services/api';

const StudentsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    student_number: '',
    first_name: '',
    last_name: '',
    email: '',
    year_level: '1',
    program: 'BSIT',
    status: 'not_enrolled',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await studentsApi.getAll();
      setStudents(data);
      setLastUpdated(new Date());
    } catch (error) {
      showSnackbar('Error fetching students', 'error');
    }
  };

  const handleRefresh = () => {
    fetchStudents();
    setLastUpdated(new Date());
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.student_number.trim()) {
      newErrors.student_number = 'Student number is required';
    } else if (formData.student_number.length < 5) {
      newErrors.student_number = 'Student number must be at least 5 characters';
    }
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (!/^[a-zA-Z\s]{2,50}$/.test(formData.first_name)) {
      newErrors.first_name = 'First name must contain only letters and spaces (2-50 characters)';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (!/^[a-zA-Z\s]{2,50}$/.test(formData.last_name)) {
      newErrors.last_name = 'Last name must contain only letters and spaces (2-50 characters)';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address (e.g., student@university.edu)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenDialog = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        student_number: student.student_number,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        year_level: student.year_level,
        program: student.program,
        status: student.status,
      });
    } else {
      setEditingStudent(null);
      setFormData({
        student_number: '',
        first_name: '',
        last_name: '',
        email: '',
        year_level: '1',
        program: 'BSIT',
        status: 'not_enrolled',
      });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStudent(null);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showSnackbar('Please fix the errors in the form', 'error');
      return;
    }
    
    setLoading(true);
    try {
      if (editingStudent) {
        await studentsApi.update(editingStudent.id, formData);
        showSnackbar('Student updated successfully', 'success');
      } else {
        await studentsApi.create(formData);
        showSnackbar('Student added successfully', 'success');
      }
      fetchStudents();
      handleCloseDialog();
    } catch (error: any) {
      if (error.response?.data) {
        const backendErrors = error.response.data;
        if (typeof backendErrors === 'object') {
          const newErrors: {[key: string]: string} = {};
          Object.keys(backendErrors).forEach(key => {
            newErrors[key] = Array.isArray(backendErrors[key]) 
              ? backendErrors[key][0] 
              : backendErrors[key];
          });
          setErrors(newErrors);
          showSnackbar('Please correct the errors', 'error');
        } else {
          showSnackbar(backendErrors.error || 'Error saving student', 'error');
        }
      } else {
        showSnackbar('Error saving student. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this student? This will also delete all their enrollments.')) {
      try {
        await studentsApi.delete(id);
        showSnackbar('Student deleted successfully', 'success');
        fetchStudents();
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Error deleting student';
        showSnackbar(errorMessage, 'error');
      }
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'info' | 'error' | 'default' => {
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

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="700">
          Students
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            icon={<Refresh />} 
            label={`Last updated: ${lastUpdated.toLocaleTimeString()}`} 
            size="small"
            variant="outlined"
            onClick={handleRefresh}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            Add Student
          </Button>
        </Box>
      </Box>

      {/* Students Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <TableRow>
                <TableCell><strong>Student Number</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Program</strong></TableCell>
                <TableCell><strong>Year Level</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                      <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Students Found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Click "Add Student" to create a new student record
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow 
                    key={student.id} 
                    hover 
                    sx={{ 
                      cursor: 'pointer',
                      '&:last-child td, &:last-child th': { border: 0 }
                    }}
                    onClick={() => navigate(`/students/${student.id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="500">
                        {student.student_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: alpha(getProgramColor(student.program), 0.1),
                            color: getProgramColor(student.program),
                            fontSize: 14
                          }}
                        >
                          {student.first_name[0]}{student.last_name[0]}
                        </Avatar>
                        <Typography variant="body2">
                          {`${student.last_name}, ${student.first_name}`}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2">{student.email}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={student.program} 
                        size="small"
                        sx={{ 
                          bgcolor: alpha(getProgramColor(student.program), 0.1),
                          color: getProgramColor(student.program),
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{student.year_level}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={student.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(student.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Edit Student">
                        <IconButton onClick={() => handleOpenDialog(student)} size="small">
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Student">
                        <IconButton onClick={() => handleDelete(student.id)} size="small" color="error">
                          <Delete />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Details">
                        <IconButton onClick={() => navigate(`/students/${student.id}`)} color="primary" size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Student Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        TransitionComponent={Grow}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
              <Person />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="600">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {editingStudent ? 'Update student information' : 'Create a new student record'}
              </Typography>
            </Box>
            {Object.keys(errors).length > 0 && (
              <Warning color="error" sx={{ ml: 1 }} />
            )}
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Student Number"
            value={formData.student_number}
            onChange={(e) => {
              setFormData({ ...formData, student_number: e.target.value });
              if (errors.student_number) delete errors.student_number;
            }}
            margin="normal"
            required
            error={!!errors.student_number}
            helperText={errors.student_number}
            disabled={loading}
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            label="First Name"
            value={formData.first_name}
            onChange={(e) => {
              setFormData({ ...formData, first_name: e.target.value });
              if (errors.first_name) delete errors.first_name;
            }}
            margin="normal"
            required
            error={!!errors.first_name}
            helperText={errors.first_name}
            disabled={loading}
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            label="Last Name"
            value={formData.last_name}
            onChange={(e) => {
              setFormData({ ...formData, last_name: e.target.value });
              if (errors.last_name) delete errors.last_name;
            }}
            margin="normal"
            required
            error={!!errors.last_name}
            helperText={errors.last_name}
            disabled={loading}
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) delete errors.email;
            }}
            margin="normal"
            required
            error={!!errors.email}
            helperText={errors.email}
            disabled={loading}
            placeholder="example@university.edu"
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            select
            label="Program"
            value={formData.program}
            onChange={(e) => setFormData({ ...formData, program: e.target.value })}
            margin="normal"
            disabled={loading}
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
            value={formData.year_level}
            onChange={(e) => setFormData({ ...formData, year_level: e.target.value })}
            margin="normal"
            disabled={loading}
            sx={{ mb: 1 }}
          >
            <MenuItem value="1">1st Year</MenuItem>
            <MenuItem value="2">2nd Year</MenuItem>
            <MenuItem value="3">3rd Year</MenuItem>
            <MenuItem value="4">4th Year</MenuItem>
          </TextField>
          {editingStudent && (
            <TextField
              fullWidth
              select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              margin="normal"
              disabled={loading}
            >
              <MenuItem value="not_enrolled">Not Enrolled</MenuItem>
              <MenuItem value="enrolled">Enrolled</MenuItem>
              <MenuItem value="graduated">Graduated</MenuItem>
              <MenuItem value="dropped">Dropped</MenuItem>
            </TextField>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Button 
            onClick={handleCloseDialog} 
            disabled={loading}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
            sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
          >
            {loading ? 'Saving...' : (editingStudent ? 'Update Student' : 'Add Student')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
          elevation={6}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentsPage;