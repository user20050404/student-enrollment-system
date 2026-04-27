import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Grid,
  TextField,
  Button,
  Divider,
  Chip,
  Alert,
  IconButton,
  Snackbar,
} from '@mui/material';
import { Edit, Save, Cancel, Person, Email, Phone, Home, Cake } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const ProfilePage: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    birth_date: profile?.birth_date || '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const handleEdit = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      birth_date: profile?.birth_date || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error updating profile', severity: 'error' });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'student': return 'primary';
      case 'teacher': return 'success';
      case 'registrar': return 'warning';
      default: return 'default';
    }
  };

  const getInitials = () => {
    const first = user?.first_name?.[0] || '';
    const last = user?.last_name?.[0] || '';
    return (first + last).toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U';
  };

  // Get profile picture URL from profile data
  const getProfilePictureUrl = () => {
    if (profile && (profile as any).profile_picture) {
      const url = (profile as any).profile_picture;
      if (url.startsWith('http')) {
        return url;
      }
      return `http://localhost:8000${url}`;
    }
    return null;
  };

  const profilePictureUrl = getProfilePictureUrl();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Profile Header Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            {profilePictureUrl && !imageError ? (
              <Avatar
                src={profilePictureUrl}
                onError={() => setImageError(true)}
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  border: (theme) => `3px solid ${theme.palette.primary.main}`,
                }}
              />
            ) : (
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: 48,
                }}
              >
                {getInitials()}
              </Avatar>
            )}
            <Typography variant="h5" fontWeight="700">
              {profile?.full_name || user?.username}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              @{user?.username}
            </Typography>
            <Chip
              label={profile?.role?.toUpperCase() || 'STUDENT'}
              color={getRoleColor(profile?.role || 'student')}
              size="small"
              sx={{ mt: 1 }}
            />
            <Divider sx={{ my: 2 }} />
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Member since:</strong> {new Date(user?.date_joined || '').toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>User ID:</strong> {user?.id}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Profile Details Card */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="700">
                Profile Information
              </Typography>
              {!isEditing ? (
                <Button
                  startIcon={<Edit />}
                  onClick={handleEdit}
                  variant="outlined"
                  size="small"
                >
                  Edit Profile
                </Button>
              ) : (
                <Box>
                  <IconButton onClick={handleCancel} color="error" size="small">
                    <Cancel />
                  </IconButton>
                  <IconButton onClick={handleSave} color="success" size="small">
                    <Save />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Birth Date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  disabled={!isEditing}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <Cake sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <Home sx={{ mr: 1, color: 'action.active', mt: 1 }} />,
                  }}
                />
              </Grid>
            </Grid>

            {profile?.age && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>Age:</strong> {profile.age} years old
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProfilePage;