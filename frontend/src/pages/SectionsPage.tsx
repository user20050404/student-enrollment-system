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
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Divider,
  FormHelperText,  // ← ADD THIS IMPORT
  alpha,
  useTheme,
  Fade,
  Grow,
} from '@mui/material';
import { 
  Edit, 
  Delete, 
  Add, 
  Warning, 
  School, 
  Class, 
  Schedule, 
  Room,
  Search,
  FilterList,
  Clear,
  Refresh,
} from '@mui/icons-material';
import { sectionsApi, subjectsApi, Section, Subject } from '../services/api';

const SectionsPage: React.FC = () => {
  const theme = useTheme();
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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
  const [showSubjectSelector, setShowSubjectSelector] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchSections();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredSubjects(
        subjects.filter(subject => 
          subject.subject_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subject.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredSubjects(subjects);
    }
  }, [searchTerm, subjects]);

  const fetchSections = async () => {
    try {
      const data = await sectionsApi.getAll();
      setSections(data);
      setLastUpdated(new Date());
    } catch (error) {
      showSnackbar('Error fetching sections', 'error');
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await subjectsApi.getAll();
      const activeSubjects = data.filter((subject: Subject) => subject.status === 'active');
      setSubjects(activeSubjects);
      setFilteredSubjects(activeSubjects);
    } catch (error) {
      showSnackbar('Error fetching subjects', 'error');
    }
  };

  const handleRefresh = () => {
    fetchSections();
    fetchSubjects();
    setLastUpdated(new Date());
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.subject) {
      newErrors.subject = 'Please select a subject';
    }
    
    if (!formData.section_code.trim()) {
      newErrors.section_code = 'Section code is required';
    } else if (!/^[A-Z0-9]{1,10}$/.test(formData.section_code.toUpperCase())) {
      newErrors.section_code = 'Section code must be 1-10 letters/numbers (e.g., A, B, C, 1A)';
    }
    
    if (formData.max_capacity <= 0) {
      newErrors.max_capacity = 'Maximum capacity must be greater than 0';
    } else if (formData.max_capacity > 100) {
      newErrors.max_capacity = 'Maximum capacity cannot exceed 100';
    }
    
    if (!formData.schedule.trim()) {
      newErrors.schedule = 'Schedule is required';
    }
    
    if (!formData.room.trim()) {
      newErrors.room = 'Room is required';
    }
    
    if (!formData.semester.trim()) {
      newErrors.semester = 'Semester is required';
    }
    
    if (!formData.school_year.trim()) {
      newErrors.school_year = 'School year is required';
    } else if (!/^\d{4}-\d{4}$/.test(formData.school_year)) {
      newErrors.school_year = 'School year must be in format YYYY-YYYY (e.g., 2023-2024)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubjectSelect = (subjectId: string, subjectObj?: Subject) => {
    setFormData({ ...formData, subject: subjectId });
    if (subjectObj) {
      setSelectedSubject(subjectObj);
    } else {
      const found = subjects.find(s => s.id.toString() === subjectId);
      setSelectedSubject(found || null);
    }
    if (errors.subject) delete errors.subject;
    setShowSubjectSelector(false);
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
      const subjectObj = subjects.find(s => s.id === section.subject);
      setSelectedSubject(subjectObj || null);
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
      setSelectedSubject(null);
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSection(null);
    setErrors({});
    setSelectedSubject(null);
    setShowSubjectSelector(false);
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

  const getCapacityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return 'error';
    if (percentage >= 70) return 'warning';
    return 'success';
  };

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="700">
          Sections
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
            Add Section
          </Button>
        </Box>
      </Box>

      {/* Sections Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <TableRow>
                <TableCell><strong>Subject</strong></TableCell>
                <TableCell><strong>Section Code</strong></TableCell>
                <TableCell><strong>Schedule</strong></TableCell>
                <TableCell><strong>Room</strong></TableCell>
                <TableCell><strong>Capacity</strong></TableCell>
                <TableCell><strong>Semester</strong></TableCell>
                <TableCell><strong>School Year</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                      <Class sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Sections Found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Click "Add Section" to create a new section
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                sections.map((section: Section) => (
                  <TableRow key={section.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Tooltip title={section.subject_name}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <School fontSize="small" color="primary" />
                          <Typography variant="body2" fontWeight="500">
                            {section.subject_code}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={section.section_code} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Schedule sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2">{section.schedule}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Room sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2">{section.room}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ minWidth: 140 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" fontWeight="500">
                            {section.current_count} / {section.max_capacity}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {section.available_slots} left
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={getCapacityPercentage(section.current_count, section.max_capacity)}
                          sx={{ height: 6, borderRadius: 3 }}
                          color={getCapacityColor(section.current_count, section.max_capacity)}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{section.semester}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{section.school_year}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={section.status.toUpperCase()}
                        color={section.status === 'open' ? 'success' : section.status === 'closed' ? 'error' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit Section">
                        <IconButton onClick={() => handleOpenDialog(section)} size="small">
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Section">
                        <IconButton onClick={() => handleDelete(section.id)} size="small" color="error">
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

      {/* Add/Edit Section Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        disableEscapeKeyDown={loading}
        TransitionComponent={Grow}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                <Class />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="600">
                  {editingSection ? 'Edit Section' : 'Add New Section'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {editingSection ? 'Update section details' : 'Create a new section for a subject'}
                </Typography>
              </Box>
            </Box>
            {Object.keys(errors).length > 0 && (
              <Warning color="error" />
            )}
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          {/* Subject Selection */}
          <FormControl fullWidth error={!!errors.subject}>
            <InputLabel>Select Subject</InputLabel>
            <Select
              value={formData.subject}
              onChange={(e) => handleSubjectSelect(e.target.value)}
              label="Select Subject"
              disabled={loading || !!editingSection}
              renderValue={(selected) => {
                const subject = subjects.find(s => s.id.toString() === selected);
                return subject ? `${subject.subject_code} - ${subject.subject_name}` : 'Select a subject';
              }}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">
                <em>Choose a subject</em>
              </MenuItem>
              {subjects.map((subject: Subject) => (
                <MenuItem key={subject.id} value={subject.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <School color="primary" fontSize="small" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {subject.subject_code}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {subject.subject_name}
                      </Typography>
                    </Box>
                    <Chip 
                      label={`${subject.units} units`} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {errors.subject && (
              <FormHelperText error>{errors.subject}</FormHelperText>
            )}
            {!editingSection && subjects.length > 0 && (
              <Button 
                size="small" 
                startIcon={<FilterList />}
                onClick={() => setShowSubjectSelector(!showSubjectSelector)}
                sx={{ mt: 1, alignSelf: 'flex-start' }}
              >
                Browse All Subjects
              </Button>
            )}
          </FormControl>

          {/* Subject Information Card */}
          {selectedSubject && (
            <Fade in={true}>
              <Card sx={{ mt: 2, mb: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                    Subject Details
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Subject Code</Typography>
                      <Typography variant="body2" fontWeight="500">{selectedSubject.subject_code}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Units</Typography>
                      <Typography variant="body2" fontWeight="500">{selectedSubject.units}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">Description</Typography>
                      <Typography variant="body2">{selectedSubject.description || 'No description available'}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Fade>
          )}

          {/* Section Code and Capacity */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Section Code"
                value={formData.section_code}
                onChange={(e) => {
                  setFormData({ ...formData, section_code: e.target.value.toUpperCase() });
                  if (errors.section_code) delete errors.section_code;
                }}
                required
                error={!!errors.section_code}
                helperText={errors.section_code || 'Example: A, B, C, 1A'}
                disabled={loading}
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
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
                required
                error={!!errors.max_capacity}
                helperText={errors.max_capacity || 'Number of students (1-100)'}
                inputProps={{ min: 1, max: 100 }}
                disabled={loading}
                sx={{ mt: 1 }}
              />
            </Grid>
          </Grid>

          {/* Schedule and Room */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
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
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
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
            </Grid>
          </Grid>

          {/* Semester and School Year */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Semester"
                placeholder="e.g., 1st Semester"
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
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
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
                helperText={errors.school_year || 'Format: YYYY-YYYY'}
                disabled={loading}
              />
            </Grid>
          </Grid>

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
            {loading ? 'Saving...' : (editingSection ? 'Update Section' : 'Add Section')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subject Browser Modal */}
      <Dialog 
        open={showSubjectSelector} 
        onClose={() => setShowSubjectSelector(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
              <School />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="600">
                Browse Available Subjects
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Select a subject to create a section for
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search by code or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            margin="normal"
            slotProps={{
              input: {
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: searchTerm && (
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <Clear />
                  </IconButton>
                ),
              },
            }}
            sx={{ mb: 2 }}
          />
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredSubjects.length === 0 ? (
              <ListItem>
                <ListItemText 
                  primary="No subjects found" 
                  secondary="Try a different search term" 
                />
              </ListItem>
            ) : (
              filteredSubjects.map((subject) => (
                <React.Fragment key={subject.id}>
                  <ListItem disablePadding>
                    <ListItemButton 
                      onClick={() => {
                        handleSubjectSelect(subject.id.toString(), subject);
                        setShowSubjectSelector(false);
                        setSearchTerm('');
                      }}
                      sx={{ borderRadius: 2, mb: 0.5 }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                          <School />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight="600">
                              {subject.subject_code}
                            </Typography>
                            <Chip label={`${subject.units} units`} size="small" variant="outlined" />
                          </Box>
                        }
                        secondary={subject.subject_name}
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))
            )}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Button onClick={() => setShowSubjectSelector(false)} sx={{ borderRadius: 2 }}>
            Close
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

export default SectionsPage;