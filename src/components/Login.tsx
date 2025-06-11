import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Snackbar,
  Alert,
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

const unicornLogo =
  'https://raw.githubusercontent.com/I-am-Soma/unicorn-landing/main/logo%20transparente.png';

// Si tienes un tipo Particle, impórtalo o decláralo; aquí lo dejamos any
type Particle = any;

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const rafId = useRef<number | null>(null);

  // Si ya hay sesión, redirige; inicializa partículas sólo en desktop
  useEffect(() => {
    if (localStorage.getItem('unicorn_user')) {
      navigate('/');
      return;
    }
    if (!isMobile) initParticles();
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [navigate, isMobile]);

  // Lógica de partículas
  const initParticles = () => {
    const canvas = document.getElementById('particles-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const count = 150;

    class P {
      x = Math.random() * canvas.width;
      y = Math.random() * canvas.height;
      size = Math.random() * 3 + 1;
      sx = Math.random() - 0.5;
      sy = Math.random() - 0.5;
      alpha = Math.random() * 0.5 + 0.5;
      grow = Math.random() > 0.5;
      color = ['#1976D2','#ec4899','#8b5cf6','#06b6d4','#10b981','#00eaff','#00ff99'][
        Math.floor(Math.random() * 7)
      ];

      update() {
        this.x += this.sx;
        this.y += this.sy;
        if (this.x < 0 || this.x > canvas.width) this.sx = -this.sx;
        if (this.y < 0 || this.y > canvas.height) this.sy = -this.sy;
        this.size += this.grow ? 0.02 : -0.02;
        if (this.size >= 4) this.grow = false;
        if (this.size <= 1) this.grow = true;
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

    for (let i = 0; i < count; i++) particles.push(new P());

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.update();
        p.draw();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255,255,255,${0.1 - d/1000})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      });
      rafId.current = requestAnimationFrame(animate);
    };
    animate();
  };

  // Submit de email/password
  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmail(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // OAuth
  const onOAuth = async (prov: 'google'|'facebook'|'linkedin') => {
    setLoading(true);
    setError('');
    try {
      await signInWithOAuth(prov);
      navigate('/');
    } catch (err: any) {
      setError(err.message || `Error con ${prov}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="login-wrapper">
      {!isMobile && <canvas id="particles-canvas" />}

      <div className="login-container">
        <div className="login-header">
          <img src={unicornLogo} alt="Unicorn AI Logo" />
        </div>

        <form onSubmit={onLogin} className="login-form">
          <div className="input-container">
            <input
              type="email"
              className="input-neon"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-container">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-neon"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
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

          <button
            type="submit"
            className={`btn-neon${loading ? ' loading' : ''}`}
            disabled={loading}
          >
            {!loading && 'SIGN IN'}
          </button>

          <div className="login-options">
            <Link to="#" className="forgot-password">Forgot Password?</Link>
            <Link to="/register" className="signup">Sign Up</Link>
          </div>

          <div className="separator">
            <div className="separator-line" />
            <div className="separator-text">OR</div>
            <div className="separator-line" />
          </div>

          <div className="oauth-buttons">
            <button className="oauth-btn google" onClick={() => onOAuth('google')} disabled={loading}>
              <GoogleIcon />
            </button>
            <button className="oauth-btn facebook" onClick={() => onOAuth('facebook')} disabled={loading}>
              <FacebookIcon />
            </button>
            <button className="oauth-btn linkedin" onClick={() => onOAuth('linkedin')} disabled={loading}>
              <LinkedInIcon />
            </button>
          </div>
        </form>
      </div>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Login;
