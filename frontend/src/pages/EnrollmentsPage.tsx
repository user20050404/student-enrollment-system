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
} from '@mui/material';
import { Delete, Add, School, Warning, Info } from '@mui/icons-material';
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

  useEffect(() => {
    fetchEnrollments();
    fetchStudents();
    fetchSections();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentEnrollments(parseInt(selectedStudent));
    } else {
      setStudentEnrollments([]);
      setTotalUnits(0);
    }
  }, [selectedStudent]);

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
      
      // Calculate total units
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
      
      // Check if student is already enrolled in this section
      if (selectedStudent) {
        const alreadyEnrolled = enrollments.some(
          e => e.student === parseInt(selectedStudent) && e.section === parseInt(selectedSection)
        );
        if (alreadyEnrolled) {
          newErrors.section = 'This student is already enrolled in this section. Duplicate enrollment is not allowed.';
        }
      }
      
      // Check if student is already enrolled in the same subject
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Enrollments</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenDialog}
          disabled={loading}
        >
          Enroll Student
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
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
                  <Typography variant="body1" sx={{ py: 4, color: 'text.secondary' }}>
                    No enrollments found. Click "Enroll Student" to add enrollments.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              enrollments.map((enrollment: Enrollment) => (
                <TableRow key={enrollment.id} hover>
                  <TableCell>{enrollment.student_number}</TableCell>
                  <TableCell>{enrollment.student_name}, {enrollment.student_first_name}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      <strong>{enrollment.subject_code}</strong>
                      <br />
                      <span style={{ fontSize: '0.8rem', color: 'gray' }}>
                        {enrollment.subject_name}
                      </span>
                    </Typography>
                  </TableCell>
                  <TableCell>{enrollment.section_code}</TableCell>
                  <TableCell>{enrollment.units}</TableCell>
                  <TableCell>{enrollment.schedule || 'N/A'}</TableCell>
                  <TableCell>{enrollment.room || 'N/A'}</TableCell>
                  <TableCell>{new Date(enrollment.enrolled_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={enrollment.status.toUpperCase()}
                      color={enrollment.status === 'enrolled' ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      onClick={() => handleDrop(enrollment.id)} 
                      color="error"
                      disabled={loading}
                      title="Drop Student"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        disableEscapeKeyDown={loading}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <School color="primary" />
            <Typography variant="h6">Enroll Student in Subjects</Typography>
            {(errors.student || errors.section) && (
              <Warning color="error" sx={{ ml: 1 }} />
            )}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              {/* Student Selection */}
              <FormControl fullWidth margin="normal" error={!!errors.student}>
                <InputLabel>Select Student</InputLabel>
                <Select
                  value={selectedStudent}
                  onChange={(e) => {
                    setSelectedStudent(e.target.value);
                    setErrors({ ...errors, student: undefined });
                  }}
                  label="Select Student"
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>Choose a student</em>
                  </MenuItem>
                  {students.map((student: Student) => (
                    <MenuItem key={student.id} value={student.id.toString()}>
                      {student.student_number} - {student.last_name}, {student.first_name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.student && (
                  <FormHelperText error>{errors.student}</FormHelperText>
                )}
              </FormControl>

              {/* Student Details */}
              {studentDetails && (
                <Card sx={{ mt: 2, bgcolor: '#e3f2fd', border: '1px solid #90caf9' }}>
                  <CardContent sx={{ py: 1 }}>
                    <Typography variant="body2">
                      <strong>Student Details:</strong><br />
                      Name: {studentDetails.name}<br />
                      Program: {studentDetails.program} - Year {studentDetails.yearLevel}<br />
                      Status: <Chip 
                        label={studentDetails.status.toUpperCase()} 
                        color={getStudentStatusColor(studentDetails.status)}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Current Enrollments */}
              {studentEnrollments.length > 0 && (
                <Card sx={{ mt: 2, bgcolor: '#e8f5e9', border: '1px solid #81c784' }}>
                  <CardContent>
                    <Typography variant="body2" gutterBottom>
                      <strong>Currently Enrolled Subjects:</strong>
                    </Typography>
                    {studentEnrollments.map((enrollment, idx) => (
                      <Box key={idx} sx={{ mt: 1, p: 1, bgcolor: 'white', borderRadius: 1 }}>
                        <Typography variant="body2">
                          <strong>{enrollment.subject_code}</strong> - {enrollment.subject_name}
                          <br />
                          <span style={{ fontSize: '0.8rem', color: 'gray' }}>
                            Section: {enrollment.section_code} | Units: {enrollment.units} | Schedule: {enrollment.schedule} | Room: {enrollment.room}
                          </span>
                        </Typography>
                      </Box>
                    ))}
                    <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid #81c784' }}>
                      <Typography variant="body2">
                        <strong>Total Units: {totalUnits}</strong>
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              {/* Section Selection */}
              <FormControl fullWidth margin="normal" error={!!errors.section}>
                <InputLabel>Select Section</InputLabel>
                <Select
                  value={selectedSection}
                  onChange={(e) => {
                    setSelectedSection(e.target.value);
                    setErrors({ ...errors, section: undefined });
                  }}
                  label="Select Section"
                  disabled={loading || !selectedStudent}
                >
                  <MenuItem value="">
                    <em>Choose a section</em>
                  </MenuItem>
                  {sections.map((section: Section) => (
                    <MenuItem key={section.id} value={section.id.toString()}>
                      {section.subject_code} - {section.section_code} ({section.available_slots} slots available)
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

              {/* Section Details */}
              {sectionDetails && selectedStudent && (
                <Card sx={{ mt: 2, bgcolor: '#fff3e0', border: '1px solid #ffb74d' }}>
                  <CardContent>
                    <Typography variant="body2">
                      <strong>Section Details:</strong><br />
                      Subject: {sectionDetails.subjectCode} - {sectionDetails.subjectName}<br />
                      Section: {sectionDetails.sectionCode}<br />
                      Schedule: {sectionDetails.schedule}<br />
                      Room: {sectionDetails.room}<br />
                      Semester: {sectionDetails.semester} | School Year: {sectionDetails.schoolYear}<br />
                      Capacity: {sectionDetails.currentCount} / {sectionDetails.maxCapacity} students<br />
                      Available Slots: <strong>{sectionDetails.availableSlots}</strong>
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Enrollment Summary */}
              {selectedStudent && selectedSection && !errors.section && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Enrollment Summary:</strong><br />
                    Student will be enrolled in {sectionDetails?.subjectCode} - {sectionDetails?.sectionCode}
                    {sectionDetails && ` (${sectionDetails.subjectName})`}<br />
                    Total units after enrollment: <strong>{totalUnits + (sectionDetails?.subjectCode ? 0 : 0)}</strong>
                  </Typography>
                </Alert>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleEnroll} 
            variant="contained" 
            disabled={isEnrollButtonDisabled}
            startIcon={loading ? <CircularProgress size={20} /> : <School />}
          >
            {loading ? 'Enrolling...' : 'Enroll Student'}
          </Button>
        </DialogActions>
      </Dialog>

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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnrollmentsPage;