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
  LinearProgress,
  Tooltip,
} from '@mui/material';
import { Edit, Delete, Add, Warning } from '@mui/icons-material';
import { sectionsApi, subjectsApi, Section, Subject } from '../services/api';

const SectionsPage: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    section_code: '',
    max_capacity: 30,
    schedule: '',
    room: '',
    semester: '',
    school_year: '',
    status: 'open',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSections();
    fetchSubjects();
  }, []);

  const fetchSections = async () => {
    try {
      const data = await sectionsApi.getAll();
      setSections(data);
    } catch (error) {
      showSnackbar('Error fetching sections', 'error');
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await subjectsApi.getAll();
      setSubjects(data.filter((subject: Subject) => subject.status === 'active'));
    } catch (error) {
      showSnackbar('Error fetching subjects', 'error');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    // Subject validation
    if (!formData.subject) {
      newErrors.subject = 'Please select a subject';
    }
    
    // Section Code validation
    if (!formData.section_code.trim()) {
      newErrors.section_code = 'Section code is required';
    } else if (!/^[A-Z0-9]{1,10}$/.test(formData.section_code.toUpperCase())) {
      newErrors.section_code = 'Section code must be 1-10 letters/numbers (e.g., A, B, C, 1A)';
    }
    
    // Max Capacity validation
    if (formData.max_capacity <= 0) {
      newErrors.max_capacity = 'Maximum capacity must be greater than 0';
    } else if (formData.max_capacity > 100) {
      newErrors.max_capacity = 'Maximum capacity cannot exceed 100';
    }
    
    // Schedule validation
    if (!formData.schedule.trim()) {
      newErrors.schedule = 'Schedule is required';
    } else if (formData.schedule.length < 5) {
      newErrors.schedule = 'Please enter a valid schedule (e.g., MWF 9:00-10:30 AM)';
    }
    
    // Room validation
    if (!formData.room.trim()) {
      newErrors.room = 'Room is required';
    }
    
    // Semester validation
    if (!formData.semester.trim()) {
      newErrors.semester = 'Semester is required';
    }
    
    // School Year validation
    if (!formData.school_year.trim()) {
      newErrors.school_year = 'School year is required';
    } else if (!/^\d{4}-\d{4}$/.test(formData.school_year)) {
      newErrors.school_year = 'School year must be in format YYYY-YYYY (e.g., 2023-2024)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenDialog = (section?: Section) => {
    if (section) {
      setEditingSection(section);
      setFormData({
        subject: section.subject.toString(),
        section_code: section.section_code,
        max_capacity: section.max_capacity,
        schedule: section.schedule,
        room: section.room,
        semester: section.semester,
        school_year: section.school_year,
        status: section.status,
      });
    } else {
      setEditingSection(null);
      setFormData({
        subject: '',
        section_code: '',
        max_capacity: 30,
        schedule: '',
        room: '',
        semester: '',
        school_year: '',
        status: 'open',
      });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSection(null);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showSnackbar('Please fix the errors in the form', 'error');
      return;
    }
    
    setLoading(true);
    try {
      if (editingSection) {
        await sectionsApi.update(editingSection.id, formData);
        showSnackbar('Section updated successfully', 'success');
      } else {
        await sectionsApi.create(formData);
        showSnackbar('Section added successfully', 'success');
      }
      fetchSections();
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
          showSnackbar(backendErrors.error || 'Error saving section', 'error');
        }
      } else {
        showSnackbar('Error saving section. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this section? This will also delete all enrollments for this section.')) {
      try {
        await sectionsApi.delete(id);
        showSnackbar('Section deleted successfully', 'success');
        fetchSections();
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Error deleting section';
        showSnackbar(errorMessage, 'error');
      }
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const getCapacityPercentage = (current: number, max: number) => {
    return (current / max) * 100;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Sections</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Section
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell>Section Code</TableCell>
              <TableCell>Schedule</TableCell>
              <TableCell>Room</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Semester</TableCell>
              <TableCell>School Year</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sections.map((section: Section) => (
              <TableRow key={section.id}>
                <TableCell>
                  <Tooltip title={section.subject_name}>
                    <span>{section.subject_code}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>{section.section_code}</TableCell>
                <TableCell>{section.schedule}</TableCell>
                <TableCell>{section.room}</TableCell>
                <TableCell>
                  <Box sx={{ minWidth: 100 }}>
                    <Typography variant="body2">
                      {section.current_count} / {section.max_capacity}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={getCapacityPercentage(section.current_count, section.max_capacity)}
                      sx={{ mt: 1 }}
                      color={section.available_slots > 0 ? 'primary' : 'error'}
                    />
                  </Box>
                </TableCell>
                <TableCell>{section.semester}</TableCell>
                <TableCell>{section.school_year}</TableCell>
                <TableCell>
                  <Chip
                    label={section.status.toUpperCase()}
                    color={section.status === 'open' ? 'success' : section.status === 'closed' ? 'error' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(section)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(section.id)}>
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
            {editingSection ? 'Edit Section' : 'Add New Section'}
            {Object.keys(errors).length > 0 && (
              <Warning color="error" sx={{ ml: 1 }} />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Subject"
            value={formData.subject}
            onChange={(e) => {
              setFormData({ ...formData, subject: e.target.value });
              if (errors.subject) delete errors.subject;
            }}
            margin="normal"
            required
            error={!!errors.subject}
            helperText={errors.subject}
            disabled={loading || !!editingSection}
          >
            <MenuItem value="">Select a subject</MenuItem>
            {subjects.map((subject: Subject) => (
              <MenuItem key={subject.id} value={subject.id}>
                {subject.subject_code} - {subject.subject_name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Section Code"
            value={formData.section_code}
            onChange={(e) => {
              setFormData({ ...formData, section_code: e.target.value.toUpperCase() });
              if (errors.section_code) delete errors.section_code;
            }}
            margin="normal"
            required
            error={!!errors.section_code}
            helperText={errors.section_code || 'Example: A, B, C, 1A'}
            disabled={loading}
          />
          <TextField
            fullWidth
            type="number"
            label="Maximum Capacity"
            value={formData.max_capacity}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setFormData({ ...formData, max_capacity: isNaN(value) ? 0 : value });
              if (errors.max_capacity) delete errors.max_capacity;
            }}
            margin="normal"
            required
            error={!!errors.max_capacity}
            helperText={errors.max_capacity || 'Maximum number of students (1-100)'}
            inputProps={{ min: 1, max: 100 }}
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Schedule"
            placeholder="e.g., MWF 9:00-10:30 AM"
            value={formData.schedule}
            onChange={(e) => {
              setFormData({ ...formData, schedule: e.target.value });
              if (errors.schedule) delete errors.schedule;
            }}
            margin="normal"
            required
            error={!!errors.schedule}
            helperText={errors.schedule}
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Room"
            placeholder="e.g., Room 101"
            value={formData.room}
            onChange={(e) => {
              setFormData({ ...formData, room: e.target.value });
              if (errors.room) delete errors.room;
            }}
            margin="normal"
            required
            error={!!errors.room}
            helperText={errors.room}
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Semester"
            placeholder="e.g., 1st Semester, 2nd Semester"
            value={formData.semester}
            onChange={(e) => {
              setFormData({ ...formData, semester: e.target.value });
              if (errors.semester) delete errors.semester;
            }}
            margin="normal"
            required
            error={!!errors.semester}
            helperText={errors.semester}
            disabled={loading}
          />
          <TextField
            fullWidth
            label="School Year"
            placeholder="e.g., 2023-2024"
            value={formData.school_year}
            onChange={(e) => {
              setFormData({ ...formData, school_year: e.target.value });
              if (errors.school_year) delete errors.school_year;
            }}
            margin="normal"
            required
            error={!!errors.school_year}
            helperText={errors.school_year || 'Format: YYYY-YYYY (e.g., 2023-2024)'}
            disabled={loading}
          />
          {editingSection && (
            <TextField
              fullWidth
              select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              margin="normal"
              disabled={loading}
            >
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : (editingSection ? 'Update' : 'Add')}
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

export default SectionsPage;