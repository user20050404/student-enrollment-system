import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Edit, Delete, Add, Warning } from '@mui/icons-material';
import { subjectsApi, Subject } from '../services/api';

const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    subject_code: '',
    subject_name: '',
    units: 3,
    description: '',
    status: 'active',
    offered_on: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const data = await subjectsApi.getAll();
      setSubjects(data);
    } catch (error) {
      showSnackbar('Error fetching subjects', 'error');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    // Subject Code validation
    if (!formData.subject_code.trim()) {
      newErrors.subject_code = 'Subject code is required';
    } else if (!/^[A-Z0-9]{3,10}$/.test(formData.subject_code.toUpperCase())) {
      newErrors.subject_code = 'Subject code must be 3-10 uppercase letters/numbers (e.g., CS101)';
    }
    
    // Subject Name validation
    if (!formData.subject_name.trim()) {
      newErrors.subject_name = 'Subject name is required';
    } else if (formData.subject_name.length < 3) {
      newErrors.subject_name = 'Subject name must be at least 3 characters';
    }
    
    // Units validation
    if (formData.units <= 0) {
      newErrors.units = 'Units must be greater than 0';
    } else if (formData.units > 6) {
      newErrors.units = 'Units cannot exceed 6';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenDialog = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        subject_code: subject.subject_code,
        subject_name: subject.subject_name,
        units: subject.units,
        description: subject.description,
        status: subject.status,
        offered_on: subject.offered_on,
      });
    } else {
      setEditingSubject(null);
      setFormData({
        subject_code: '',
        subject_name: '',
        units: 3,
        description: '',
        status: 'active',
        offered_on: '',
      });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSubject(null);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showSnackbar('Please fix the errors in the form', 'error');
      return;
    }
    
    setLoading(true);
    try {
      if (editingSubject) {
        await subjectsApi.update(editingSubject.id, formData);
        showSnackbar('Subject updated successfully', 'success');
      } else {
        await subjectsApi.create(formData);
        showSnackbar('Subject added successfully', 'success');
      }
      fetchSubjects();
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
          showSnackbar(backendErrors.error || 'Error saving subject', 'error');
        }
      } else {
        showSnackbar('Error saving subject. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this subject? This will also delete all sections under it.')) {
      try {
        await subjectsApi.delete(id);
        showSnackbar('Subject deleted successfully', 'success');
        fetchSubjects();
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Error deleting subject';
        showSnackbar(errorMessage, 'error');
      }
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Subjects</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Subject
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Subject Code</TableCell>
              <TableCell>Subject Name</TableCell>
              <TableCell>Units</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Offered On</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subjects.map((subject) => (
              <TableRow key={subject.id}>
                <TableCell>{subject.subject_code}</TableCell>
                <TableCell>{subject.subject_name}</TableCell>
                <TableCell>{subject.units}</TableCell>
                <TableCell>{subject.description}</TableCell>
                <TableCell>{subject.offered_on}</TableCell>
                <TableCell>
                  <Chip
                    label={subject.status.toUpperCase()}
                    color={subject.status === 'active' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(subject)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(subject.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {editingSubject ? 'Edit Subject' : 'Add New Subject'}
            {Object.keys(errors).length > 0 && (
              <Warning color="error" sx={{ ml: 1 }} />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Subject Code"
            value={formData.subject_code}
            onChange={(e) => {
              setFormData({ ...formData, subject_code: e.target.value.toUpperCase() });
              if (errors.subject_code) delete errors.subject_code;
            }}
            margin="normal"
            required
            error={!!errors.subject_code}
            helperText={errors.subject_code || 'Example: CS101, MATH201'}
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Subject Name"
            value={formData.subject_name}
            onChange={(e) => {
              setFormData({ ...formData, subject_name: e.target.value });
              if (errors.subject_name) delete errors.subject_name;
            }}
            margin="normal"
            required
            error={!!errors.subject_name}
            helperText={errors.subject_name}
            disabled={loading}
          />
          <TextField
            fullWidth
            type="number"
            label="Units"
            value={formData.units}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setFormData({ ...formData, units: isNaN(value) ? 0 : value });
              if (errors.units) delete errors.units;
            }}
            margin="normal"
            required
            error={!!errors.units}
            helperText={errors.units || 'Units must be between 1-6'}
            inputProps={{ min: 1, max: 6 }}
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Offered On"
            placeholder="e.g., 1st Semester, 2nd Semester, Summer"
            value={formData.offered_on}
            onChange={(e) => setFormData({ ...formData, offered_on: e.target.value })}
            margin="normal"
            disabled={loading}
          />
          {editingSubject && (
            <TextField
              fullWidth
              select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              margin="normal"
              disabled={loading}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : (editingSubject ? 'Update' : 'Add')}
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

export default SubjectsPage;