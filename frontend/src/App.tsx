import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import {
  School,
  People,
  Class,
  MenuBook,
  Dashboard,
} from '@mui/icons-material';
import StudentsPage from './pages/StudentsPage';
import SubjectsPage from './pages/SubjectsPage';
import SectionsPage from './pages/SectionsPage';
import EnrollmentsPage from './pages/EnrollmentsPage';
import DashboardPage from './pages/DashboardPage';
import StudentDetailsPage from './pages/StudentDetailsPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <School sx={{ mr: 2 }} />
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Student Enrollment & Sectioning System
              </Typography>
            </Toolbar>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              indicatorColor="secondary"
              textColor="inherit"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Dashboard" icon={<Dashboard />} iconPosition="start" component={Link} to="/" />
              <Tab label="Students" icon={<People />} iconPosition="start" component={Link} to="/students" />
              <Tab label="Subjects" icon={<MenuBook />} iconPosition="start" component={Link} to="/subjects" />
              <Tab label="Sections" icon={<Class />} iconPosition="start" component={Link} to="/sections" />
              <Tab label="Enrollments" icon={<School />} iconPosition="start" component={Link} to="/enrollments" />
            </Tabs>
          </AppBar>

          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/:id" element={<StudentDetailsPage />} />
              <Route path="/subjects" element={<SubjectsPage />} />
              <Route path="/sections" element={<SectionsPage />} />
              <Route path="/enrollments" element={<EnrollmentsPage />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;