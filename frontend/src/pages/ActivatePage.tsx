import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import api from '../services/api';

const ActivatePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      activateAccount();
    }
  }, [token]);

  const activateAccount = async () => {
    try {
      const response = await api.post('/auth/activate/', { token });
      setSuccess(true);
      setLoading(false);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Activation failed. Invalid or expired token.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3 }}>
            Activating your account...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center',
      }}>
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
          <Avatar sx={{ 
            mx: 'auto', 
            bgcolor: 'success.main', 
            width: 80, 
            height: 80,
            mb: 2,
          }}>
            <CheckCircle sx={{ fontSize: 50 }} />
          </Avatar>
          <Typography variant="h4" gutterBottom fontWeight="700" color="success.main">
            Account Activated!
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Your account has been successfully activated. You can now log in.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/login')}
            sx={{ mt: 2, borderRadius: 2 }}
          >
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center',
    }}>
      <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
        <Avatar sx={{ 
          mx: 'auto', 
          bgcolor: 'error.main', 
          width: 80, 
          height: 80,
          mb: 2,
        }}>
          <Error sx={{ fontSize: 50 }} />
        </Avatar>
        <Typography variant="h4" gutterBottom fontWeight="700" color="error.main">
          Activation Failed
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {error}
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/register')}
          sx={{ mt: 2, borderRadius: 2 }}
        >
          Back to Register
        </Button>
      </Paper>
    </Container>
  );
};

export default ActivatePage;