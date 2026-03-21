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
} from '@mui/material';
import { Edit, Delete, Add, Warning, Visibility } from '@mui/icons-material';
import { studentsApi, Student } from '../services/api';

const StudentsPage: React.FC = () => {
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

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await studentsApi.getAll();
      setStudents(data);
    } catch (error) {
      showSnackbar('Error fetching students', 'error');
    }
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Students</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Student
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
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
            {students.map((student) => (
              <TableRow 
                key={student.id} 
                hover 
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/students/${student.id}`)}
              >
                <TableCell>{student.student_number}</TableCell>
                <TableCell>{`${student.last_name}, ${student.first_name}`}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.program}</TableCell>
                <TableCell>{student.year_level}</TableCell>
                <TableCell>
                  <Chip
                    label={student.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(student.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Edit Student">
                    <IconButton onClick={() => handleOpenDialog(student)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Student">
                    <IconButton onClick={() => handleDelete(student.id)}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View Details">
                    <IconButton onClick={() => navigate(`/students/${student.id}`)} color="primary">
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {editingStudent ? 'Edit Student' : 'Add New Student'}
            {Object.keys(errors).length > 0 && (
              <Warning color="error" sx={{ ml: 1 }} />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
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
          />
          <TextField
            fullWidth
            select
            label="Program"
            value={formData.program}
            onChange={(e) => setFormData({ ...formData, program: e.target.value })}
            margin="normal"
            disabled={loading}
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
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : (editingStudent ? 'Update' : 'Add')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentsPage;