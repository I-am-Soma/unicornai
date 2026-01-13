// src/components/Register.tsx
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
import supabase from '../utils/supabaseClient';
import './Login.css'; // Usa el mismo archivo CSS que tiene los estilos para .register-*

const unicornLogo =
  'https://raw.githubusercontent.com/I-am-Soma/unicorn-landing/main/logo%20transparente.png';

type Particle = any;

const Register: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
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

    class ParticleClass {
      x = Math.random() * canvas.width;
      y = Math.random() * canvas.height;
      size = Math.random() * 3 + 1;
      speedX = Math.random() - 0.5;
      speedY = Math.random() - 0.5;
      alpha = Math.random() * 0.5 + 0.5;
      growing = Math.random() > 0.5;
      color = ['#1976D2','#ec4899','#8b5cf6','#06b6d4','#10b981','#00eaff','#00ff99'][
        Math.floor(Math.random() * 7)
      ];

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width) this.speedX = -this.speedX;
        if (this.y < 0 || this.y > canvas.height) this.speedY = -this.speedY;
        this.size += this.growing ? 0.02 : -0.02;
        if (this.size >= 4) this.growing = false;
        if (this.size <= 1) this.growing = true;
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

    for (let i = 0; i < particleCount; i++) {
      particles.push(new ParticleClass());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.update();
        p.draw();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255,255,255,${0.1 - dist / 1000})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      });
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signUpWithEmail(email, password, firstName, lastName);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthRegister = async (provider: 'google' | 'facebook' | 'linkedin') => {
    setLoading(true);
    setError('');
    try {
      await signInWithOAuth(provider);
      navigate('/');
    } catch (err: any) {
      setError(err.message || `${provider} registration error`);
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
        overflow: 'visible'
      }}
    >
      {!isMobile && (
        <canvas
          id="particles-canvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0
          }}
        />
      )}

      <div className="register-wrapper">
        <div className="register-container">
          <div className="register-header">
            <img
              src={unicornLogo}
              alt="Unicorn AI Logo"
            />
          </div>
          
          <form onSubmit={handleRegister} className="register-form">
            <div className="input-container">
              <input
                type="text"
                className="input-neon"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="input-container">
              <input
                type="text"
                className="input-neon"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            
            <div className="input-container">
              <input
                type="email"
                className="input-neon"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-neon"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </button>
            </div>

            <div className="input-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="input-neon"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
              </button>
            </div>
            
            <button
              type="submit"
              className={`btn-neon${loading ? ' loading' : ''}`}
              disabled={loading}
            >
              {!loading && 'CREATE ACCOUNT'}
            </button>
            
            <div className="register-options">
              <Link to="/login" className="signin">Already have an account? Sign In</Link>
            </div>
            
            <div className="separator">
              <div className="separator-line" />
              <div className="separator-text">OR</div>
              <div className="separator-line" />
            </div>
            
            <div className="oauth-buttons">
              <button 
                type="button"
                className="oauth-btn google" 
                onClick={() => handleOAuthRegister('google')} 
                disabled={loading}
              >
                <GoogleIcon />
              </button>
              <button 
                type="button"
                className="oauth-btn facebook" 
                onClick={() => handleOAuthRegister('facebook')} 
                disabled={loading}
              >
                <FacebookIcon />
              </button>
              <button 
                type="button"
                className="oauth-btn linkedin" 
                onClick={() => handleOAuthRegister('linkedin')} 
                disabled={loading}
              >
                <LinkedInIcon />
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Register;
