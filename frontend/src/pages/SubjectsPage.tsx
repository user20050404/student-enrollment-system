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
  Avatar,
  alpha,
  useTheme,
  Grow,
  Tooltip,
} from '@mui/material';
import { 
  Edit, 
  Delete, 
  Add, 
  Warning,
  MenuBook,
  Refresh,
  School,
} from '@mui/icons-material';
import { subjectsApi, Subject } from '../services/api';

const SubjectsPage: React.FC = () => {
  const theme = useTheme();
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
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const data = await subjectsApi.getAll();
      setSubjects(data);
      setLastUpdated(new Date());
    } catch (error) {
      showSnackbar('Error fetching subjects', 'error');
    }
  };

  const handleRefresh = () => {
    fetchSubjects();
    setLastUpdated(new Date());
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.subject_code.trim()) {
      newErrors.subject_code = 'Subject code is required';
    } else if (!/^[A-Z0-9]{3,10}$/.test(formData.subject_code.toUpperCase())) {
      newErrors.subject_code = 'Subject code must be 3-10 uppercase letters/numbers (e.g., CS101)';
    }
    
    if (!formData.subject_name.trim()) {
      newErrors.subject_name = 'Subject name is required';
    } else if (formData.subject_name.length < 3) {
      newErrors.subject_name = 'Subject name must be at least 3 characters';
    }
    
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

  const getUnitColor = (units: number) => {
    if (units >= 5) return '#f44336';
    if (units >= 3) return '#ff9800';
    return '#4caf50';
  };

  const activeCount = subjects.filter(s => s.status === 'active').length;
  const inactiveCount = subjects.filter(s => s.status === 'inactive').length;

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="700">
          Subjects
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
            Add Subject
          </Button>
        </Box>
      </Box>

      {/* Subjects Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <TableRow>
                <TableCell><strong>Subject Code</strong></TableCell>
                <TableCell><strong>Subject Name</strong></TableCell>
                <TableCell><strong>Units</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell><strong>Offered On</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                      <MenuBook sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Subjects Found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Click "Add Subject" to create a new subject
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                subjects.map((subject) => (
                  <TableRow key={subject.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontSize: 14
                          }}
                        >
                          <School sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="body2" fontWeight="500">
                          {subject.subject_code}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {subject.subject_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${subject.units} units`} 
                        size="small"
                        sx={{ 
                          bgcolor: alpha(getUnitColor(subject.units), 0.1),
                          color: getUnitColor(subject.units),
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {subject.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {subject.offered_on || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={subject.status.toUpperCase()}
                        color={subject.status === 'active' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit Subject">
                        <IconButton onClick={() => handleOpenDialog(subject)} size="small">
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Subject">
                        <IconButton onClick={() => handleDelete(subject.id)} size="small" color="error">
                          <Delete />
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

      {/* Add/Edit Subject Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        TransitionComponent={Grow}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
              <MenuBook />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="600">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {editingSubject ? 'Update subject information' : 'Create a new subject'}
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
            sx={{ mb: 1 }}
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
            sx={{ mb: 1 }}
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
            sx={{ mb: 1 }}
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
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            label="Offered On"
            placeholder="e.g., 1st Semester, 2nd Semester, Summer"
            value={formData.offered_on}
            onChange={(e) => setFormData({ ...formData, offered_on: e.target.value })}
            margin="normal"
            disabled={loading}
            sx={{ mb: 1 }}
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
            {loading ? 'Saving...' : (editingSubject ? 'Update Subject' : 'Add Subject')}
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

export default SubjectsPage;