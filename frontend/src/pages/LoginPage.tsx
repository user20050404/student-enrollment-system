import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  IconButton,
  InputAdornment,
  Avatar,
  Divider,
  Link,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import { 
  LockOutlined, 
  Visibility, 
  VisibilityOff, 
  School, 
  Person, 
  Email,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    first_name: '',
    last_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation for registration
    if (!isLogin) {
      if (!formData.username.trim()) {
        setError('Username is required');
        setLoading(false);
        return;
      }
      if (!formData.email.trim()) {
        setError('Email is required');
        setLoading(false);
        return;
      }
      if (!formData.password) {
        setError('Password is required');
        setLoading(false);
        return;
      }
      if (!formData.confirmPassword) {
        setError('Please confirm your password');
        setLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
    } else {
      if (!formData.username.trim()) {
        setError('Username is required');
        setLoading(false);
        return;
      }
      if (!formData.password) {
        setError('Password is required');
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        await login(formData.username, formData.password);
        navigate('/');
      } else {
        // Make sure to send confirm_password field
        const registerData = {
          username: formData.username.trim(),
          password: formData.password,
          confirm_password: formData.confirmPassword,  // Important: send as confirm_password
          email: formData.email.trim(),
          first_name: formData.first_name?.trim() || '',
          last_name: formData.last_name?.trim() || '',
          role: 'student',
        };
        
        console.log('Sending registration data:', registerData);
        await register(registerData);
        navigate('/');
      }
    } catch (err: any) {
      console.error('Error:', err);
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        if (errorData.field_errors) {
          const errorMessages = [];
          for (const [field, message] of Object.entries(errorData.field_errors)) {
            errorMessages.push(`${field}: ${message}`);
          }
          setError(errorMessages.join(' • '));
        }
        else if (errorData.errors) {
          const errorMessages = [];
          for (const [field, messages] of Object.entries(errorData.errors)) {
            if (Array.isArray(messages)) {
              errorMessages.push(`${field}: ${messages.join(', ')}`);
            } else {
              errorMessages.push(`${field}: ${messages}`);
            }
          }
          setError(errorMessages.join(' • '));
        }
        else if (errorData.error) {
          setError(errorData.error);
        }
        else if (errorData.non_field_errors) {
          setError(Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors.join(', ') : errorData.non_field_errors);
        }
        else {
          setError('Registration failed. Please check all fields.');
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      first_name: '',
      last_name: '',
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: `radial-gradient(circle at 20% 50%, ${theme.palette.common.white} 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
      
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.common.white, 0.1)} 0%, transparent 70%)`,
        }}
      />
      
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          left: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.common.white, 0.1)} 0%, transparent 70%)`,
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper 
          elevation={24} 
          sx={{ 
            p: { xs: 3, sm: 5 }, 
            borderRadius: 4, 
            width: '100%',
            backdropFilter: 'blur(10px)',
            backgroundColor: alpha(theme.palette.background.paper, 0.95),
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar 
              sx={{ 
                mx: 'auto', 
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                width: 70, 
                height: 70,
                mb: 2,
                boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <School sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography 
              variant="h4" 
              fontWeight="800" 
              gutterBottom
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isLogin 
                ? 'Sign in to continue to Student Enrollment System'
                : 'Register to get started with Student Enrollment System'}
            </Typography>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3, borderRadius: 2 }}
              variant="filled"
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              margin="normal"
              required
              disabled={loading}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: theme.palette.primary.main }} />
                  </InputAdornment>
                ),
              }}
            />

            {!isLogin && (
              <>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  margin="normal"
                  required
                  disabled={loading}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s',
                      '&:hover': {
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: theme.palette.primary.main }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    margin="normal"
                    disabled={loading}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    margin="normal"
                    disabled={loading}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>
              </>
            )}

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              margin="normal"
              required
              disabled={loading}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined sx={{ color: theme.palette.primary.main }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {!isLogin && (
              <TextField
                fullWidth
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                margin="normal"
                required
                disabled={loading}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined sx={{ color: theme.palette.primary.main }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5, 
                borderRadius: 2, 
                textTransform: 'none', 
                fontSize: '1rem',
                fontWeight: 600,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s',
              }}
            >
              {loading ? <CircularProgress size={24} /> : (isLogin ? 'Sign In' : 'Sign Up')}
            </Button>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">or</Typography>
          </Divider>

          <Box sx={{ textAlign: 'center' }}>
            <Link
              component="button"
              variant="body2"
              onClick={toggleMode}
              underline="hover"
              sx={{
                cursor: 'pointer',
                color: theme.palette.primary.main,
                fontWeight: 500,
                '&:hover': {
                  color: theme.palette.primary.dark,
                },
              }}
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;