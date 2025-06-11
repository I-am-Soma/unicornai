// src/components/Login.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Alert,
  Snackbar,
  IconButton,
  useTheme,
  useMediaQuery,
  Typography
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon
} from '@mui/icons-material';
import { signInWithEmail, signInWithOAuth } from '../utils/auth';
import './Login.css';

const unicornLogo = 'https://raw.githubusercontent.com/I-am-Soma/unicorn-landing/main/logo%20transparente.png';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('unicorn_user');
    if (user) {
      navigate('/');
    }
    if (!isMobile) {
      initParticles();
    }
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [navigate, isMobile]);

  const initParticles = () => {
    const canvas = document.getElementById('particles-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles: Particle[] = [];
    const particleCount = 150;

    class Particle {
      x: number; y: number; size: number; speedX: number; speedY: number;
      color: string; alpha: number; growing: boolean;
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() - 0.5;
        this.speedY = Math.random() - 0.5;
        this.alpha = Math.random() * 0.5 + 0.5;
        this.growing = Math.random() > 0.5;
        const colors = ['#1976D2','#ec4899','#8b5cf6','#06b6d4','#10b981','#00eaff','#00ff99'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width) this.speedX = -this.speedX;
        if (this.y < 0 || this.y > canvas.height) this.speedY = -this.speedY;
        if (this.growing) {
          this.size = Math.min(this.size + 0.02, 4);
          if (this.size >= 4) this.growing = false;
        } else {
          this.size = Math.max(this.size - 0.02, 1);
          if (this.size <= 1) this.growing = true;
        }
      }
      draw() {
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
      }
    }

    function createParticles() {
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.update();
        p.draw();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255,255,255,${0.1 - dist/1000})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
      animationFrameId.current = requestAnimationFrame(animate);
    }

    createParticles();
    animate();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmail(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login error');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook' | 'linkedin') => {
    setLoading(true);
    setError('');
    try {
      await signInWithOAuth(provider);
      navigate('/');
    } catch (err: any) {
      setError(err.message || `${provider} login error`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%)',
        position: 'relative',
        overflow: 'hidden',
        animation: 'gradientShift 10s infinite alternate'
      }}
    >
      {!isMobile && (
        <canvas
          id="particles-canvas"
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0
          }}
        />
      )}

      <div className="login-wrapper">
        <div className="login-container">
          <div className="login-header">
            <img
              src={unicornLogo}
              alt="Unicorn AI Logo"
              style={{
                width: 100,
                height: 100,
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.5))',
                animation: 'float 6s ease-in-out infinite'
              }}
            />
          </div>

          <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '90%', marginBottom: 15 }}>
              <input
                type="email"
                className="input-neon"
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ position: 'relative', width: '90%', marginBottom: 15 }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-neon"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ width: '100%' }}
              />
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#00eaff'
                }}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </div>
            <button
              type="submit"
              className="btn-neon"
              disabled={loading}
              style={{ width: '90%', textShadow: '0 0 5px rgba(0,0,0,0.5)', fontWeight: 'bold' }}
            >
              {loading ? 'Signing in...' : 'SIGN IN'}
            </button>
            <div className="login-options" style={{ width: '90%', display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <a href="#" className="forgot-password">Forgot Password?</a>
              <a href="#" className="signup">Sign Up</a>
            </div>
          </form>

          <div style={{ margin: '20px 0', width: '90%', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,234,255,0.3)' }} />
            <span style={{ color: '#00eaff', fontSize: 14 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,234,255,0.3)' }} />
          </div>

          <div className="oauth-buttons" style={{ width: '90%', display: 'flex', justifyContent: 'space-between' }}>
            <button
              className="oauth-btn google"
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
              style={{ flex: 1, marginRight: 10 }}
            >
              <GoogleIcon fontSize="small" />
            </button>
            <button
              className="oauth-btn facebook"
              onClick={() => handleOAuthLogin('facebook')}
              disabled={loading}
              style={{ flex: 1, marginRight: 10 }}
            >
              <FacebookIcon fontSize="small" />
            </button>
            <button
              className="oauth-btn linkedin"
              onClick={() => handleOAuthLogin('linkedin')}
              disabled={loading}
              style={{ flex: 1 }}
            >
              <LinkedInIcon fontSize="small" />
            </button>
          </div>

          {/* Enlace de registro */}
          <Box sx={{ textAlign: 'center', mt: 2, width: '90%' }}>
            <Typography variant="body2">
              ¿No tienes cuenta?{' '}
              <Link to="/register" style={{ color: '#00eaff', textDecoration: 'none' }}>
                Regístrate aquí
              </Link>
            </Typography>
          </Box>
        </div>
      </div>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login;

