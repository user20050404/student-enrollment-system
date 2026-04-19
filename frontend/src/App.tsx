import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
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
  Avatar,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  alpha,
  useScrollTrigger,
  Slide,
  Fade,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  School,
  People,
  Class,
  MenuBook,
  Dashboard,
  Notifications,
  Settings,
  Person,
  Logout,
  Help,
  Info,
  DarkMode,
  LightMode,
  AccountCircle,
  CheckCircle,
  Warning,
} from '@mui/icons-material';

// Import page components
import StudentsPage from './pages/StudentsPage';
import SubjectsPage from './pages/SubjectsPage';
import SectionsPage from './pages/SectionsPage';
import EnrollmentsPage from './pages/EnrollmentsPage';
import DashboardPage from './pages/DashboardPage';
import StudentDetailsPage from './pages/StudentDetailsPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider, useAuth } from './context/AuthContext';

// Custom scroll behavior
interface HideOnScrollProps {
  children: React.ReactElement;
}

function HideOnScroll(props: HideOnScrollProps) {
  const { children } = props;
  const trigger = useScrollTrigger();
  
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

// Enhanced theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff4081',
      dark: '#c51162',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 8 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 16 },
      },
    },
  },
});

// Tab configuration with metadata
const tabs = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/', color: '#1976d2' },
  { label: 'Students', icon: <People />, path: '/students', color: '#2e7d32' },
  { label: 'Subjects', icon: <MenuBook />, path: '/subjects', color: '#ed6c02' },
  { label: 'Sections', icon: <Class />, path: '/sections', color: '#9c27b0' },
  { label: 'Enrollments', icon: <School />, path: '/enrollments', color: '#0288d1' },
];

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Create a separate component for the main app content that uses useLocation
function AppContent() {
  const location = useLocation();
  const { user, profile, logout, isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Update tab based on current path (only when authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      const currentPath = location.pathname;
      const tabIndex = tabs.findIndex(tab => {
        if (tab.path === '/') return currentPath === '/';
        return currentPath.startsWith(tab.path);
      });
      if (tabIndex !== -1) {
        setCurrentTab(tabIndex);
      }
    }
  }, [location, isAuthenticated]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  // Mock notifications
  const notifications = [
    { id: 1, message: 'New student enrolled', time: '5 min ago', type: 'success', icon: <CheckCircle fontSize="small" /> },
    { id: 2, message: 'Section CS101-A is full', time: '1 hour ago', type: 'warning', icon: <Warning fontSize="small" /> },
    { id: 3, message: 'New subject added: Web Development', time: '2 hours ago', type: 'info', icon: <Info fontSize="small" /> },
    { id: 4, message: 'Enrollment deadline approaching', time: '1 day ago', type: 'error', icon: <Warning fontSize="small" /> },
  ];

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      success: '#4caf50',
      warning: '#ff9800',
      info: '#2196f3',
      error: '#f44336',
    };
    return colors[type] || '#757575';
  };

  const currentTheme = createTheme({
    ...theme,
    palette: {
      ...theme.palette,
      mode: darkMode ? 'dark' : 'light',
    },
  });

  // If not authenticated, show login page without layout
  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <HideOnScroll>
          <AppBar 
            position="sticky" 
            elevation={0}
            sx={{
              backgroundColor: currentTheme.palette.background.paper,
              borderBottom: `1px solid ${alpha(currentTheme.palette.divider, 0.1)}`,
              backdropFilter: 'blur(20px)',
            }}
          >
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              {/* Logo and Brand */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: currentTheme.palette.primary.main,
                    width: 40,
                    height: 40,
                  }}
                >
                  <School />
                </Avatar>
                <Box>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ 
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${currentTheme.palette.primary.main} 0%, ${currentTheme.palette.secondary.main} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    Enrollment System
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Student Management Platform
                  </Typography>
                </Box>
              </Box>

              {/* Desktop Navigation Tabs */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 1, justifyContent: 'center' }}>
                <Tabs
                  value={currentTab}
                  onChange={handleTabChange}
                  indicatorColor="primary"
                  textColor="primary"
                  sx={{
                    '& .MuiTab-root': {
                      minWidth: 100,
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                      },
                    },
                  }}
                >
                  {tabs.map((tab, index) => (
                    <Tab
                      key={index}
                      label={tab.label}
                      icon={tab.icon}
                      iconPosition="start"
                      component={Link}
                      to={tab.path}
                      sx={{
                        '&.Mui-selected': {
                          color: tab.color,
                        },
                      }}
                    />
                  ))}
                </Tabs>
              </Box>

              {/* Right Side Actions */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
                  <IconButton onClick={toggleDarkMode} size="small">
                    {darkMode ? <LightMode /> : <DarkMode />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Notifications">
                  <IconButton onClick={handleNotificationOpen} size="small">
                    <Badge badgeContent={4} color="error">
                      <Notifications />
                    </Badge>
                  </IconButton>
                </Tooltip>

                <Tooltip title="Account">
                  <IconButton onClick={handleMenuOpen} size="small">
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: currentTheme.palette.primary.main,
                      }}
                    >
                      {profile?.full_name?.[0] || user?.username?.[0] || 'U'}
                    </Avatar>
                  </IconButton>
                </Tooltip>
              </Box>
            </Toolbar>
          </AppBar>
        </HideOnScroll>

        {/* Mobile Navigation Drawer */}
        <Box component="nav" sx={{ display: { xs: 'block', md: 'none' } }}>
          <Menu
            anchorEl={null}
            open={mobileOpen}
            onClose={handleDrawerToggle}
            sx={{ display: { xs: 'block', md: 'none' } }}
          >
            {tabs.map((tab, index) => (
              <MenuItem
                key={index}
                component={Link}
                to={tab.path}
                onClick={handleDrawerToggle}
                selected={currentTab === index}
              >
                <ListItemIcon>{tab.icon}</ListItemIcon>
                <ListItemText>{tab.label}</ListItemText>
              </MenuItem>
            ))}
            <Divider />
            <MenuItem onClick={toggleDarkMode}>
              <ListItemIcon>{darkMode ? <LightMode /> : <DarkMode />}</ListItemIcon>
              <ListItemText>{darkMode ? 'Light Mode' : 'Dark Mode'}</ListItemText>
            </MenuItem>
          </Menu>
        </Box>

        {/* Notifications Popover */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: {
              width: 320,
              maxHeight: 400,
              borderRadius: 2,
              mt: 1.5,
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${currentTheme.palette.divider}` }}>
            <Typography variant="subtitle1" fontWeight="600">
              Notifications
            </Typography>
            <Typography variant="caption" color="text.secondary">
              You have {notifications.length} unread notifications
            </Typography>
          </Box>
          {notifications.map((notification) => (
            <MenuItem key={notification.id} onClick={handleNotificationClose}>
              <ListItemIcon>
                <Avatar sx={{ bgcolor: alpha(getNotificationColor(notification.type), 0.1) }}>
                  {notification.icon}
                </Avatar>
              </ListItemIcon>
              <ListItemText 
                primary={notification.message}
                secondary={notification.time}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </MenuItem>
          ))}
          <Divider />
          <MenuItem onClick={handleNotificationClose}>
            <ListItemText primary="View All Notifications" primaryTypographyProps={{ align: 'center', variant: 'body2' }} />
          </MenuItem>
        </Menu>

        {/* User Menu Popover */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              width: 280,
              borderRadius: 2,
              mt: 1.5,
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: currentTheme.palette.primary.main }}>
              {profile?.full_name?.[0] || user?.username?.[0] || 'U'}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="600">
                {profile?.full_name || user?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Box>
          <Divider />
          <MenuItem component={Link} to="/profile" onClick={handleMenuClose}>
            <ListItemIcon><Person fontSize="small" /></ListItemIcon>
            <ListItemText>My Profile</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon><Help fontSize="small" /></ListItemIcon>
            <ListItemText>Help & Support</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: currentTheme.palette.error.main }}>
            <ListItemIcon><Logout fontSize="small" sx={{ color: currentTheme.palette.error.main }} /></ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>

        {/* Main Content - Protected Routes */}
        <Container 
          maxWidth="xl" 
          sx={{ 
            mt: 3, 
            mb: 4,
            flex: 1,
            px: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Fade in={true} timeout={500}>
            <Box>
              <Routes>
                <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
                <Route path="/students/:id" element={<ProtectedRoute><StudentDetailsPage /></ProtectedRoute>} />
                <Route path="/subjects" element={<ProtectedRoute><SubjectsPage /></ProtectedRoute>} />
                <Route path="/sections" element={<ProtectedRoute><SectionsPage /></ProtectedRoute>} />
                <Route path="/enrollments" element={<ProtectedRoute><EnrollmentsPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              </Routes>
            </Box>
          </Fade>
        </Container>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 3,
            px: 2,
            mt: 'auto',
            backgroundColor: alpha(currentTheme.palette.background.paper, 0.8),
            borderTop: `1px solid ${alpha(currentTheme.palette.divider, 0.1)}`,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Student Enrollment & Sectioning System. All rights reserved.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Built with Django REST Framework & React TypeScript
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

// Main App component with Router wrapper and AuthProvider
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;