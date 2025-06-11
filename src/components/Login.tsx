import React, { useState, useEffect, useRef } from 'react'; // Agregado useRef
import {
  Box,
  Alert,
  Snackbar,
  IconButton,
  useTheme, // Importado useTheme
  useMediaQuery // Importado useMediaQuery
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { signInWithEmail, signInWithOAuth } from '../utils/auth';
const unicornLogo = 'https://raw.githubusercontent.com/I-am-Soma/unicorn-landing/main/logo%20transparente.png';
import "./Login.css";

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme(); // Inicializa useTheme
  // Detecta si la pantalla es 'sm' (small) o menor. Ajusta 'sm' a 'md' si quieres que tablets también deshabiliten las partículas.
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const animationFrameId = useRef<number | null>(null); // Para almacenar el ID de requestAnimationFrame y poder cancelarlo

  useEffect(() => {
    setTimeout(() => {
      setShowAnimation(true);
    }, 100);

    const checkAuth = () => {
      const user = localStorage.getItem('unicorn_user');
      if (user) {
        navigate('/');
      }
    };
    checkAuth();

    // Solo inicializa las partículas si NO es un dispositivo móvil
    if (!isMobile) {
      initParticles();
    }

    // Función de limpieza para cancelar la animación cuando el componente se desmonte o `isMobile` cambie
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [navigate, isMobile]); // `isMobile` en el array de dependencias para que el efecto se re-ejecute si cambia el tamaño de la pantalla

  const initParticles = () => {
    const canvas = document.getElementById('particles-canvas') as HTMLCanvasElement;
    // Si el canvas no existe (porque no se renderizó en móvil), simplemente retorna
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const particleCount = 150;

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;
      growing: boolean;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.alpha = Math.random() * 0.5 + 0.5;
        this.growing = Math.random() > 0.5;
        
        const colors = [
          '#1976D2',
          '#ec4899',
          '#8b5cf6',
          '#06b6d4',
          '#10b981',
          '#00eaff',
          '#00ff99',
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width || this.x < 0) {
          this.speedX = -this.speedX;
        }
        if (this.y > canvas.height || this.y < 0) {
          this.speedY = -this.speedY;
        }

        if (this.growing) {
          this.size += 0.02;
          if (this.size > 4) {
            this.growing = false;
          }
        } else {
          this.size -= 0.02;
          if (this.size < 1) {
            this.growing = true;
          }
        }
      }

      draw() {
        if (!ctx) return;
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

    const animateParticles = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 - distance/1000})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      
      // Almacena el ID del frame de animación para poder cancelarlo
      animationFrameId.current = requestAnimationFrame(animateParticles); 
    };

    createParticles();
    animateParticles();

    // REMOVIDO: window.addEventListener('resize') de aquí.
    // El canvas ahora se renderiza condicionalmente. Si el usuario cambia el tamaño de la ventana
    // de móvil a desktop, el componente se re-renderizará y el `useEffect` se encargará de inicializar
    // las partículas si `isMobile` se vuelve falso.
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmail(email, password);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook' | 'linkedin') => {
    try {
      setLoading(true);
      setError('');
      
      await signInWithOAuth(provider);
      navigate('/');
    } catch (err: any) {
      console.error(`${provider} login error:`, err);
      setError(err.message || `An error occurred during ${provider} login`);
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
      {/* Condicionalmente renderiza el canvas solo si NO es un dispositivo móvil */}
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

      {/* Condicionalmente renderiza los círculos de fondo borrosos solo si NO es un dispositivo móvil */}
      {!isMobile && (
        <>
          <Box
            sx={{
              position: 'absolute',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              filter: 'blur(80px)',
              background: 'radial-gradient(circle, rgba(25,118,210,0.4) 0%, rgba(25,118,210,0) 70%)',
              top: '20%',
              left: '20%',
              zIndex: 0,
              animation: 'pulse 8s infinite alternate'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: '250px',
              height: '250px',
              borderRadius: '50%',
              filter: 'blur(80px)',
              background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, rgba(236,72,153,0) 70%)',
              bottom: '20%',
              right: '20%',
              zIndex: 0,
              animation: 'pulse 6s infinite alternate-reverse'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              filter: 'blur(80px)',
              background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(139,92,246,0) 70%)',
              top: '60%',
              left: '60%',
              zIndex: 0,
              animation: 'pulse 7s infinite alternate'
            }}
          />
        </>
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
            <div style={{ width: '90%', marginBottom: '15px' }}>
              <input
                type="email"
                className="input-neon"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ position: 'relative', width: '90%', marginBottom: '15px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-neon"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%' }}
              />
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
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
              style={{
                width: '90%',
                textShadow: '0 0 5px rgba(0, 0, 0, 0.5)',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Signing in...' : 'SIGN IN'}
            </button>
            
            <div className="login-options">
              <a href="#" className="forgot-password">Forgot Password?</a>
              <a href="#" className="signup">Sign Up</a>
            </div>
          </form>
          
          <div style={{ margin: '20px 0', width: '90%', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(0, 234, 255, 0.3)' }}></div>
            <span style={{ color: '#00eaff', fontSize: '14px' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(0, 234, 255, 0.3)' }}></div>
          </div>
          
          <div className="oauth-buttons" style={{ width: '90%', display: 'flex', justifyContent: 'space-between' }}>
            <button
              className="oauth-btn google"
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
              style={{ flex: 1, marginRight: '10px' }}
            >
              <GoogleIcon fontSize="small" />
            </button>
            <button
              className="oauth-btn facebook"
              onClick={() => handleOAuthLogin('facebook')}
              disabled={loading}
              style={{ flex: 1, marginRight: '10px' }}
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
        </div>
      </div>
      <p>¿No tienes cuenta? <Link to="/register">Register Here </Link></p>
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

