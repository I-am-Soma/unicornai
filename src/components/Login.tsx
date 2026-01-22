import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Link,
  useMediaQuery,
  useTheme,
  Fade,
  Container,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Login as LoginIcon,
  Google as GoogleIcon,
  Apple as AppleIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabaseClient';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Asegurar viewport correcto en mobile
  useEffect(() => {
    // Verificar que el viewport esté configurado
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      );
    }
    console.log('📱 Window width:', window.innerWidth);
    console.log('📱 Screen width:', window.screen.width);
    console.log('📱 Is mobile?', isMobile);
  }, [isMobile]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Attempting login...');
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) throw signInError;

      console.log('✅ Login successful:', data.user?.email);
      navigate('/');
      
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to login with Google');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: { xs: 3, sm: 3 },
        width: '100%',
      }}
    >
      <Container maxWidth="sm" sx={{ width: '100%' }}>
        <Fade in timeout={600}>
          <Paper
            elevation={isMobile ? 0 : 24}
            sx={{
              p: { xs: 4, sm: 4, md: 5 },
              borderRadius: { xs: 4, sm: 3 },
              backdropFilter: isMobile ? 'blur(10px)' : 'none',
              backgroundColor: isMobile ? 'rgba(255, 255, 255, 0.95)' : 'white',
              width: '100%',
              maxWidth: { xs: '100%', sm: 450 },
              mx: 'auto',
            }}
          >
            {/* Logo y Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 64, sm: 80 },
                  height: { xs: 64, sm: 80 },
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  mb: 2,
                  boxShadow: '0 8px 16px rgba(102, 126, 234, 0.4)',
                }}
              >
                <AccountIcon sx={{ fontSize: { xs: 32, sm: 40 }, color: 'white' }} />
              </Box>
              
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  fontSize: { xs: '2rem', sm: '2.125rem' }, // MÁS GRANDE
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Welcome Back
              </Typography>
              
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: '1rem', sm: '1.0625rem' } }} // MÁS GRANDE
              >
                Sign in to continue to Unicorn AI
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Fade in>
                <Alert
                  severity="error"
                  onClose={() => setError(null)}
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                    '& .MuiAlert-message': {
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    },
                  }}
                >
                  {error}
                </Alert>
              </Fade>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleLogin}>
              {/* Email Field */}
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                autoFocus={!isMobile}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" sx={{ fontSize: { xs: 24, sm: 24 } }} />
                    </InputAdornment>
                  ),
                  sx: {
                    minHeight: { xs: 56, sm: 60 }, // MÁS GRANDE
                    fontSize: { xs: '1.125rem', sm: '1.125rem' }, // MÁS GRANDE
                  },
                }}
                InputLabelProps={{
                  sx: {
                    fontSize: { xs: '1.125rem', sm: '1.125rem' }, // MÁS GRANDE
                  },
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              {/* Password Field */}
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" sx={{ fontSize: { xs: 24, sm: 24 } }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={loading}
                        sx={{
                          minWidth: 48,
                          minHeight: 48,
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    minHeight: { xs: 56, sm: 60 }, // MÁS GRANDE
                    fontSize: { xs: '1.125rem', sm: '1.125rem' }, // MÁS GRANDE
                  },
                }}
                InputLabelProps={{
                  sx: {
                    fontSize: { xs: '1.125rem', sm: '1.125rem' }, // MÁS GRANDE
                  },
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              {/* Forgot Password */}
              <Box sx={{ textAlign: 'right', mb: 3 }}>
                <Link
                  href="#"
                  underline="hover"
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '0.875rem' },
                    color: 'primary.main',
                    fontWeight: 500,
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              {/* Login Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <LoginIcon />}
                sx={{
                  minHeight: { xs: 56, sm: 60 }, // MÁS GRANDE
                  borderRadius: 2,
                  fontSize: { xs: '1.125rem', sm: '1.25rem' }, // MÁS GRANDE
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(102, 126, 234, 0.6)',
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                  },
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>

            {/* Divider */}
            <Divider sx={{ my: 3 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}
              >
                or continue with
              </Typography>
            </Divider>

            {/* Social Login Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleLogin}
                disabled={loading}
                startIcon={<GoogleIcon />}
                sx={{
                  minHeight: { xs: 48, sm: 52 },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  fontWeight: 500,
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'rgba(102, 126, 234, 0.05)',
                  },
                }}
              >
                Google
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                disabled={loading}
                startIcon={<AppleIcon />}
                sx={{
                  minHeight: { xs: 48, sm: 52 },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  fontWeight: 500,
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'text.primary',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  },
                }}
              >
                Apple
              </Button>
            </Box>

            {/* Sign Up Link */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                Don't have an account?{' '}
                <Link
                  onClick={() => navigate('/register')}
                  sx={{
                    cursor: 'pointer',
                    color: 'primary.main',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign up
                </Link>
              </Typography>
            </Box>

            {/* Mobile-only: Version info */}
            {isMobile && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Unicorn AI v1.0.0
                </Typography>
              </Box>
            )}
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default Login;
