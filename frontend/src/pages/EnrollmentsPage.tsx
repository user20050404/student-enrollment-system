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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  FormHelperText,
  CircularProgress,
  Grid,
  Avatar,
  alpha,
  useTheme,
  Tooltip,
  Fade,
  Grow,
} from '@mui/material';
import { 
  Delete, 
  Add, 
  School, 
  Warning, 
  Info, 
  Person, 
  Class as ClassIcon,
  Schedule,
  Room,
  Refresh,
} from '@mui/icons-material';
import { enrollmentsApi, studentsApi, sectionsApi, Enrollment, Student, Section } from '../services/api';

interface SectionDetails {
  subjectCode: string;
  subjectName: string;
  sectionCode: string;
  availableSlots: number;
  schedule: string;
  room: string;
  semester: string;
  schoolYear: string;
  maxCapacity: number;
  currentCount: number;
}

interface StudentDetails {
  name: string;
  number: string;
  program: string;
  yearLevel: string;
  status: string;
}

const EnrollmentsPage: React.FC = () => {
  const theme = useTheme();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [errors, setErrors] = useState<{ student?: string; section?: string }>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [loading, setLoading] = useState<boolean>(false);
  const [studentEnrollments, setStudentEnrollments] = useState<Enrollment[]>([]);
  const [totalUnits, setTotalUnits] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentEnrollments(parseInt(selectedStudent));
    } else {
      setStudentEnrollments([]);
      setTotalUnits(0);
    }
  }, [selectedStudent]);

  const fetchAllData = async () => {
    await Promise.all([fetchEnrollments(), fetchStudents(), fetchSections()]);
    setLastUpdated(new Date());
  };

  const fetchEnrollments = async (): Promise<void> => {
    try {
      const data = await enrollmentsApi.getAll();
      setEnrollments(data);
    } catch (error) {
      showSnackbar('Error fetching enrollments', 'error');
    }
  };

  const fetchStudents = async (): Promise<void> => {
    try {
      const data = await studentsApi.getAll();
      setStudents(data.filter((student: Student) => student.status !== 'graduated' && student.status !== 'dropped'));
    } catch (error) {
      showSnackbar('Error fetching students', 'error');
    }
  };

  const fetchSections = async (): Promise<void> => {
    try {
      const data = await sectionsApi.getAll();
      setSections(data.filter((section: Section) => section.status === 'open' && section.available_slots > 0));
    } catch (error) {
      showSnackbar('Error fetching sections', 'error');
    }
  };

  const fetchStudentEnrollments = async (studentId: number): Promise<void> => {
    try {
      const data = await studentsApi.getEnrollments(studentId);
      const activeEnrollments = data.filter(e => e.status === 'enrolled');
      setStudentEnrollments(activeEnrollments);
      
      const total = activeEnrollments.reduce((sum, e) => sum + e.units, 0);
      setTotalUnits(total);
    } catch (error) {
      console.error('Error fetching student enrollments:', error);
    }
  };

  const validateEnrollment = (): boolean => {
    const newErrors: { student?: string; section?: string } = {};
    
    if (!selectedStudent) {
      newErrors.student = 'Please select a student';
    }
    
    if (!selectedSection) {
      newErrors.section = 'Please select a section';
    } else {
      const selectedSectionObj = sections.find(s => s.id.toString() === selectedSection);
      if (selectedSectionObj && selectedSectionObj.available_slots <= 0) {
        newErrors.section = `This section is already full. Maximum capacity is ${selectedSectionObj.max_capacity} students.`;
      }
      
      if (selectedStudent) {
        const alreadyEnrolled = enrollments.some(
          e => e.student === parseInt(selectedStudent) && e.section === parseInt(selectedSection)
        );
        if (alreadyEnrolled) {
          newErrors.section = 'This student is already enrolled in this section. Duplicate enrollment is not allowed.';
        }
      }
      
      if (selectedStudent && selectedSectionObj) {
        const alreadyEnrolledInSubject = studentEnrollments.some(
          e => e.subject_code === selectedSectionObj.subject_code
        );
        if (alreadyEnrolledInSubject) {
          newErrors.section = `Student is already enrolled in ${selectedSectionObj.subject_code} (${selectedSectionObj.subject_name}). Cannot enroll in multiple sections of the same subject.`;
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEnroll = async (): Promise<void> => {
    if (!validateEnrollment()) {
      showSnackbar('Please fix the errors in the form', 'error');
      return;
    }
    
    setLoading(true);
    try {
      await enrollmentsApi.create({
        student: parseInt(selectedStudent),
        section: parseInt(selectedSection),
      });
      showSnackbar('Student enrolled successfully!', 'success');
      
      await Promise.all([
        fetchEnrollments(),
        fetchSections(),
        fetchStudentEnrollments(parseInt(selectedStudent))
      ]);
      
      handleCloseDialog();
    } catch (error: any) {
      let errorMessage = 'Error enrolling student. Please try again.';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
      }
      
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (id: number): Promise<void> => {
    if (window.confirm('Are you sure you want to drop this enrollment? This action cannot be undone.')) {
      setLoading(true);
      try {
        await enrollmentsApi.delete(id);
        showSnackbar('Student dropped successfully', 'success');
        
        await Promise.all([
          fetchEnrollments(),
          fetchSections(),
          selectedStudent ? fetchStudentEnrollments(parseInt(selectedStudent)) : Promise.resolve()
        ]);
      } catch (error: any) {
        let errorMessage = 'Error dropping student. Please try again.';
        
        if (error.response?.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          }
        }
        
        showSnackbar(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenDialog = (): void => {
    setSelectedStudent('');
    setSelectedSection('');
    setErrors({});
    setStudentEnrollments([]);
    setTotalUnits(0);
    setOpenDialog(true);
  };

  const handleCloseDialog = (): void => {
    if (!loading) {
      setOpenDialog(false);
      setSelectedStudent('');
      setSelectedSection('');
      setErrors({});
      setStudentEnrollments([]);
      setTotalUnits(0);
    }
  };

  const handleRefresh = () => {
    fetchAllData();
    setLastUpdated(new Date());
  };

  const showSnackbar = (message: string, severity: 'success' | 'error'): void => {
    setSnackbar({ open: true, message, severity });
  };

  const getStudentStatusColor = (status: string): 'success' | 'warning' | 'info' | 'error' | 'default' => {
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

  const getSelectedSectionDetails = (): SectionDetails | null => {
    const section = sections.find(s => s.id.toString() === selectedSection);
    if (section) {
      return {
        subjectCode: section.subject_code,
        subjectName: section.subject_name,
        sectionCode: section.section_code,
        availableSlots: section.available_slots,
        schedule: section.schedule,
        room: section.room,
        semester: section.semester,
        schoolYear: section.school_year,
        maxCapacity: section.max_capacity,
        currentCount: section.current_count
      };
    }
    return null;
  };

  const getSelectedStudentDetails = (): StudentDetails | null => {
    const student = students.find(s => s.id.toString() === selectedStudent);
    if (student) {
      return {
        name: `${student.last_name}, ${student.first_name}`,
        number: student.student_number,
        program: student.program,
        yearLevel: student.year_level,
        status: student.status
      };
    }
    return null;
  };

  const sectionDetails = getSelectedSectionDetails();
  const studentDetails = getSelectedStudentDetails();
  const isEnrollButtonDisabled = loading || !selectedStudent || !selectedSection;

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="700">
          Enrollments
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
            onClick={handleOpenDialog}
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            Enroll Student
          </Button>
        </Box>
      </Box>

      {/* Enrollments Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <TableRow>
                <TableCell><strong>Student Number</strong></TableCell>
                <TableCell><strong>Student Name</strong></TableCell>
                <TableCell><strong>Subject</strong></TableCell>
                <TableCell><strong>Section</strong></TableCell>
                <TableCell><strong>Units</strong></TableCell>
                <TableCell><strong>Schedule</strong></TableCell>
                <TableCell><strong>Room</strong></TableCell>
                <TableCell><strong>Enrolled Date</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                      <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Enrollments Found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Click "Enroll Student" to add enrollments
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                enrollments.map((enrollment: Enrollment) => (
                  <TableRow key={enrollment.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="500">
                        {enrollment.student_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{enrollment.student_name}, {enrollment.student_first_name}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="600">
                          {enrollment.subject_code}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {enrollment.subject_name}
                        </Typography>
                      </Box>
                    </TableCell>
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
                        <Typography variant="body2">{enrollment.schedule || 'N/A'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Room sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2">{enrollment.room || 'N/A'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={enrollment.status.toUpperCase()}
                        color={enrollment.status === 'enrolled' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Drop Student">
                        <IconButton 
                          onClick={() => handleDrop(enrollment.id)} 
                          color="error"
                          disabled={loading}
                        >
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

      {/* Enrollment Dialog */}
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
                <School />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="600">
                  Enroll Student in Subjects
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Select a student and section to enroll
                </Typography>
              </Box>
            </Box>
            {(errors.student || errors.section) && (
              <Warning color="error" />
            )}
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              {/* Student Selection */}
              <FormControl fullWidth error={!!errors.student}>
                <InputLabel>Select Student</InputLabel>
                <Select
                  value={selectedStudent}
                  onChange={(e) => {
                    setSelectedStudent(e.target.value);
                    setErrors({ ...errors, student: undefined });
                  }}
                  label="Select Student"
                  disabled={loading}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">
                    <em>Choose a student</em>
                  </MenuItem>
                  {students.map((student: Student) => (
                    <MenuItem key={student.id} value={student.id.toString()}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person fontSize="small" />
                        {student.student_number} - {student.last_name}, {student.first_name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.student && (
                  <FormHelperText error>{errors.student}</FormHelperText>
                )}
              </FormControl>

              {/* Student Details Card */}
              {studentDetails && (
                <Fade in={true}>
                  <Card sx={{ mt: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                        Student Details
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Name</Typography>
                          <Typography variant="body2">{studentDetails.name}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Program</Typography>
                          <Typography variant="body2">{studentDetails.program} - Year {studentDetails.yearLevel}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="caption" color="text.secondary">Status</Typography>
                          <Chip 
                            label={studentDetails.status.toUpperCase()} 
                            color={getStudentStatusColor(studentDetails.status)}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Fade>
              )}

              {/* Current Enrollments Card */}
              {studentEnrollments.length > 0 && (
                <Fade in={true}>
                  <Card sx={{ mt: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                        Currently Enrolled Subjects ({totalUnits} units total)
                      </Typography>
                      {studentEnrollments.map((enrollment, idx) => (
                        <Box key={idx} sx={{ mt: 1, p: 1.5, bgcolor: 'background.paper', borderRadius: 1.5 }}>
                          <Typography variant="body2" fontWeight="600">
                            {enrollment.subject_code} - {enrollment.subject_name}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Section: {enrollment.section_code}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Units: {enrollment.units}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Schedule: {enrollment.schedule}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Fade>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              {/* Section Selection */}
              <FormControl fullWidth error={!!errors.section}>
                <InputLabel>Select Section</InputLabel>
                <Select
                  value={selectedSection}
                  onChange={(e) => {
                    setSelectedSection(e.target.value);
                    setErrors({ ...errors, section: undefined });
                  }}
                  label="Select Section"
                  disabled={loading || !selectedStudent}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">
                    <em>Choose a section</em>
                  </MenuItem>
                  {sections.map((section: Section) => (
                    <MenuItem key={section.id} value={section.id.toString()}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ClassIcon fontSize="small" />
                        {section.subject_code} - {section.section_code} ({section.available_slots} slots available)
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.section && (
                  <FormHelperText error>{errors.section}</FormHelperText>
                )}
                {!selectedStudent && (
                  <FormHelperText>Please select a student first</FormHelperText>
                )}
              </FormControl>

              {/* Section Details Card */}
              {sectionDetails && selectedStudent && (
                <Fade in={true}>
                  <Card sx={{ mt: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                        Section Details
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Subject</Typography>
                          <Typography variant="body2">{sectionDetails.subjectCode} - {sectionDetails.subjectName}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Section</Typography>
                          <Typography variant="body2">{sectionDetails.sectionCode}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Schedule</Typography>
                          <Typography variant="body2">{sectionDetails.schedule}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Room</Typography>
                          <Typography variant="body2">{sectionDetails.room}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Capacity</Typography>
                          <Typography variant="body2">{sectionDetails.currentCount} / {sectionDetails.maxCapacity}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Available Slots</Typography>
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            {sectionDetails.availableSlots}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Fade>
              )}

              {/* Enrollment Summary Alert */}
              {selectedStudent && selectedSection && !errors.section && (
                <Alert 
                  severity="info" 
                  sx={{ mt: 2, borderRadius: 2 }}
                  icon={<Info />}
                >
                  <Typography variant="body2">
                    <strong>Enrollment Summary</strong><br />
                    Student will be enrolled in <strong>{sectionDetails?.subjectCode} - {sectionDetails?.sectionCode}</strong>
                    {sectionDetails && ` (${sectionDetails.subjectName})`}<br />
                    <strong>Total units after enrollment:</strong> {totalUnits + (sectionDetails?.subjectCode ? 0 : 0)}
                  </Typography>
                </Alert>
              )}
            </Grid>
          </Grid>
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
            onClick={handleEnroll} 
            variant="contained" 
            disabled={isEnrollButtonDisabled}
            startIcon={loading ? <CircularProgress size={20} /> : <School />}
            sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
          >
            {loading ? 'Enrolling...' : 'Enroll Student'}
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

export default EnrollmentsPage;