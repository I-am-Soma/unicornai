import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Fade,
  Backdrop,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  CheckCircle as CheckIcon,
  Lightbulb as TipIcon,
  PlayArrow as StartIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Types
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector del elemento a destacar
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    path?: string;
    onClick?: () => void;
  };
  image?: string;
  tips?: string[];
}

interface OnboardingContextType {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
}

// Definición de pasos del tour
const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a Unicorn AI! 🦄',
    description: 'Estamos emocionados de tenerte aquí. Te guiaremos en un tour rápido para que aproveches al máximo la plataforma.',
    position: 'center',
    tips: [
      'Este tour tomará solo 2 minutos',
      'Puedes saltarlo en cualquier momento',
      'Puedes volver a verlo desde Settings'
    ]
  },
  {
    id: 'dashboard',
    title: 'Tu Dashboard Central',
    description: 'Aquí verás un resumen de todas tus métricas importantes: leads, conversiones, conversaciones activas y más.',
    target: '[data-tour="dashboard"]',
    position: 'right',
    action: {
      label: 'Ir al Dashboard',
      path: '/dashboard'
    },
    tips: [
      'Las métricas se actualizan en tiempo real',
      'Haz click en cualquier número para ver detalles'
    ]
  },
  {
    id: 'leads',
    title: 'Gestión de Leads',
    description: 'Aquí administrarás todos tus prospectos. Puedes importarlos desde Google Maps, Yellow Pages o agregarlos manualmente.',
    target: '[data-tour="leads"]',
    position: 'right',
    action: {
      label: 'Ver Lead Management',
      path: '/leads'
    },
    tips: [
      'Arrastra para cambiar estados',
      'Usa filtros para encontrar leads específicos',
      'Activa leads para iniciar conversaciones'
    ]
  },
  {
    id: 'import',
    title: 'Importa Leads Automáticamente',
    description: 'Usa nuestra herramienta de búsqueda para encontrar leads potenciales en Google Maps y Yellow Pages.',
    target: '[data-tour="search-leads"]',
    position: 'bottom',
    tips: [
      'Busca por tipo de negocio y ubicación',
      'Los leads se importan con información completa',
      'Puedes importar hasta 20 leads por búsqueda'
    ]
  },
  {
    id: 'conversations',
    title: 'Conversaciones en Tiempo Real',
    description: 'Gestiona todas tus conversaciones de WhatsApp desde un solo lugar. Con respuestas automáticas y seguimiento.',
    target: '[data-tour="conversations"]',
    position: 'right',
    action: {
      label: 'Ver Conversaciones',
      path: '/conversations'
    },
    tips: [
      'Activa un lead para iniciar una conversación',
      'Usa plantillas de mensajes para responder rápido',
      'El sistema puede responder automáticamente'
    ]
  },
  {
    id: 'reports',
    title: 'Reportes y Análisis',
    description: 'Visualiza el rendimiento de tus campañas con gráficos detallados y métricas en tiempo real.',
    target: '[data-tour="reports"]',
    position: 'right',
    action: {
      label: 'Ver Reportes',
      path: '/reports'
    },
    tips: [
      'Exporta reportes en PDF o CSV',
      'Compara períodos para ver tendencias',
      'Los datos se actualizan cada hora'
    ]
  },
  {
    id: 'settings',
    title: 'Personaliza tu Experiencia',
    description: 'Configura integraciones, notificaciones, automatizaciones y más desde Settings.',
    target: '[data-tour="settings"]',
    position: 'right',
    tips: [
      'Conecta WhatsApp, Zapier y otras apps',
      'Configura respuestas automáticas',
      'Personaliza tu perfil y preferencias'
    ]
  },
  {
    id: 'complete',
    title: '¡Listo para empezar! 🎉',
    description: 'Ya conoces lo básico. Ahora es momento de crear tu primer lead y comenzar a generar conversiones.',
    position: 'center',
    action: {
      label: 'Crear mi primer lead',
      path: '/leads'
    }
  }
];

// Context
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

// Provider
export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    const hasSkippedOnboarding = localStorage.getItem('onboarding_skipped');
    
    // Show onboarding if not completed and not skipped
    if (!hasCompletedOnboarding && !hasSkippedOnboarding) {
      // Delay para dar tiempo a que la UI cargue
      setTimeout(() => {
        setIsActive(true);
      }, 1000);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      // Scroll to highlighted element
      const step = onboardingSteps[currentStep];
      if (step.target) {
        const element = document.querySelector(step.target);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      // Navigate if needed
      if (step.action?.path) {
        navigate(step.action.path);
      }
    }
  }, [currentStep, isActive, navigate]);

  const startTour = () => {
    setCurrentStep(0);
    setIsActive(true);
    localStorage.removeItem('onboarding_skipped');
  };

  const endTour = () => {
    setIsActive(false);
    localStorage.setItem('onboarding_completed', 'true');
  };

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    setIsActive(false);
    localStorage.setItem('onboarding_skipped', 'true');
  };

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps: onboardingSteps.length,
        startTour,
        endTour,
        nextStep,
        prevStep,
        skipTour,
      }}
    >
      {children}
      {isActive && <OnboardingOverlay />}
    </OnboardingContext.Provider>
  );
};

// Overlay Component
const OnboardingOverlay: React.FC = () => {
  const { currentStep, totalSteps, nextStep, prevStep, skipTour } = useOnboarding();
  const step = onboardingSteps[currentStep];
  
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  }, [step.target]);

  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Calcular posición del tooltip
  const getTooltipPosition = () => {
    if (!targetRect || step.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 20;

    switch (step.position) {
      case 'right':
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.right + padding,
          transform: 'translateY(-50%)',
        };
      case 'left':
        return {
          top: targetRect.top + targetRect.height / 2,
          right: window.innerWidth - targetRect.left + padding,
          transform: 'translateY(-50%)',
        };
      case 'bottom':
        return {
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)',
        };
      case 'top':
        return {
          bottom: window.innerHeight - targetRect.top + padding,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)',
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  return (
    <>
      {/* Backdrop oscuro */}
      <Backdrop
        open
        sx={{
          zIndex: 9998,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Spotlight sobre el elemento */}
      {targetRect && (
        <Box
          sx={{
            position: 'fixed',
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            border: '3px solid',
            borderColor: 'primary.main',
            borderRadius: 2,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 30px rgba(59, 130, 246, 0.5)',
            zIndex: 9999,
            pointerEvents: 'none',
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': {
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 30px rgba(59, 130, 246, 0.5)',
              },
              '50%': {
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 40px rgba(59, 130, 246, 0.8)',
              },
            },
          }}
        />
      )}

      {/* Tooltip con contenido */}
      <Fade in>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            ...getTooltipPosition(),
            zIndex: 10000,
            maxWidth: 450,
            width: { xs: 'calc(100% - 32px)', sm: 450 },
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {/* Progress bar */}
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 4 }}
          />

          {/* Content */}
          <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {step.title}
                </Typography>
                <Chip
                  label={`Paso ${currentStep + 1} de ${totalSteps}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
              <IconButton
                size="small"
                onClick={skipTour}
                sx={{ ml: 1 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Description */}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {step.description}
            </Typography>

            {/* Tips */}
            {step.tips && step.tips.length > 0 && (
              <Box
                sx={{
                  bgcolor: 'info.lighter',
                  p: 2,
                  borderRadius: 2,
                  mb: 2,
                  border: '1px solid',
                  borderColor: 'info.light',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TipIcon fontSize="small" color="info" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2" color="info.main" sx={{ fontWeight: 600 }}>
                    Tips útiles:
                  </Typography>
                </Box>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {step.tips.map((tip, index) => (
                    <Typography
                      key={index}
                      component="li"
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      {tip}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}

            {/* Stepper */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              {Array.from({ length: totalSteps }).map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: index === currentStep ? 'primary.main' : 'grey.300',
                    mx: 0.5,
                    transition: 'all 0.3s',
                  }}
                />
              ))}
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={skipTour}
                size="medium"
              >
                Saltar Tour
              </Button>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {currentStep > 0 && (
                  <Button
                    variant="outlined"
                    onClick={prevStep}
                    startIcon={<BackIcon />}
                  >
                    Atrás
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={nextStep}
                  endIcon={currentStep === totalSteps - 1 ? <CheckIcon /> : <NextIcon />}
                >
                  {currentStep === totalSteps - 1 ? 'Finalizar' : 'Siguiente'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </>
  );
};

// Botón para reiniciar el tour (para usar en Settings)
export const RestartTourButton: React.FC = () => {
  const { startTour } = useOnboarding();

  return (
    <Button
      variant="outlined"
      startIcon={<StartIcon />}
      onClick={() => {
        localStorage.removeItem('onboarding_completed');
        localStorage.removeItem('onboarding_skipped');
        startTour();
      }}
      fullWidth
    >
      Ver Tour de Bienvenida
    </Button>
  );
};0
