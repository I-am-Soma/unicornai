import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
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
import supabase from '../utils/supabaseClient';

// ============================================================================
// MULTILANGUAGE SYSTEM
// ============================================================================

type Language = 'en' | 'es' | 'fr' | 'de' | 'pt';

const detectUserLanguage = (): Language => {
  const browserLang = navigator.language.toLowerCase();
  
  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('fr')) return 'fr';
  if (browserLang.startsWith('de')) return 'de';
  if (browserLang.startsWith('pt')) return 'pt';
  
  return 'en'; // Default
};

interface TranslatedStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    path?: string;
    onClick?: () => void;
  };
  tips?: string[];
}

const translations = {
  en: {
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Unicorn AI! 🦄',
        description: "We're excited to have you here. Let us guide you through a quick tour to make the most of the platform.",
        position: 'center',
        tips: [
          'This tour will take only 2 minutes',
          'You can skip it anytime',
          'You can restart it from Settings'
        ]
      },
      {
        id: 'dashboard',
        title: 'Your Central Dashboard',
        description: "Here you'll see a summary of all your important metrics: leads, conversions, active conversations and more.",
        target: '[data-tour="dashboard"]',
        position: 'right',
        action: {
          label: 'Go to Dashboard',
          path: '/dashboard'
        },
        tips: [
          'Metrics update in real-time',
          'Click any number to see details'
        ]
      },
      {
        id: 'leads',
        title: 'Lead Management',
        description: "Here you'll manage all your prospects. Import them from Google Maps, Yellow Pages or add them manually.",
        target: '[data-tour="leads"]',
        position: 'right',
        action: {
          label: 'View Lead Management',
          path: '/leads'
        },
        tips: [
          'Drag to change status',
          'Use filters to find specific leads',
          'Activate leads to start conversations'
        ]
      },
      {
        id: 'import',
        title: 'Import Leads Automatically',
        description: 'Use our search tool to find potential leads on Google Maps and Yellow Pages.',
        target: '[data-tour="search-leads"]',
        position: 'bottom',
        tips: [
          'Search by business type and location',
          'Leads are imported with complete information',
          'You can import up to 20 leads per search'
        ]
      },
      {
        id: 'conversations',
        title: 'Real-Time Conversations',
        description: 'Manage all your WhatsApp conversations from one place. With automatic responses and tracking.',
        target: '[data-tour="conversations"]',
        position: 'right',
        action: {
          label: 'View Conversations',
          path: '/conversations'
        },
        tips: [
          'Activate a lead to start a conversation',
          'Use message templates for quick replies',
          'The system can respond automatically'
        ]
      },
      {
        id: 'reports',
        title: 'Reports & Analytics',
        description: 'Visualize your campaign performance with detailed charts and real-time metrics.',
        target: '[data-tour="reports"]',
        position: 'right',
        action: {
          label: 'View Reports',
          path: '/reports'
        },
        tips: [
          'Export reports in PDF or CSV',
          'Compare periods to see trends',
          'Data updates every hour'
        ]
      },
      {
        id: 'settings',
        title: 'Customize Your Experience',
        description: 'Configure integrations, notifications, automations and more from Settings.',
        target: '[data-tour="settings"]',
        position: 'right',
        tips: [
          'Connect WhatsApp, Zapier and other apps',
          'Configure automatic responses',
          'Customize your profile and preferences'
        ]
      },
      {
        id: 'complete',
        title: 'Ready to Start! 🎉',
        description: "You know the basics now. It's time to create your first lead and start generating conversions.",
        position: 'center',
        action: {
          label: 'Create my first lead',
          path: '/leads'
        }
      }
    ],
    buttons: {
      skip: 'Skip Tour',
      back: 'Back',
      next: 'Next',
      finish: 'Finish',
      restart: 'View Welcome Tour',
      stepOf: 'Step',
      of: 'of',
      usefulTips: 'Useful Tips:'
    }
  },
  es: {
    steps: [
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
    ],
    buttons: {
      skip: 'Saltar Tour',
      back: 'Atrás',
      next: 'Siguiente',
      finish: 'Finalizar',
      restart: 'Ver Tour de Bienvenida',
      stepOf: 'Paso',
      of: 'de',
      usefulTips: 'Tips útiles:'
    }
  },
  fr: {
    steps: [
      {
        id: 'welcome',
        title: 'Bienvenue sur Unicorn AI! 🦄',
        description: 'Nous sommes ravis de vous avoir ici. Laissez-nous vous guider dans une visite rapide pour tirer le meilleur parti de la plateforme.',
        position: 'center',
        tips: [
          'Cette visite ne prendra que 2 minutes',
          'Vous pouvez la passer à tout moment',
          'Vous pouvez la redémarrer depuis Paramètres'
        ]
      },
      {
        id: 'dashboard',
        title: 'Votre Tableau de Bord Central',
        description: 'Ici vous verrez un résumé de toutes vos métriques importantes: prospects, conversions, conversations actives et plus.',
        target: '[data-tour="dashboard"]',
        position: 'right',
        action: {
          label: 'Aller au Tableau de Bord',
          path: '/dashboard'
        },
        tips: [
          'Les métriques se mettent à jour en temps réel',
          'Cliquez sur n\'importe quel nombre pour voir les détails'
        ]
      },
      {
        id: 'leads',
        title: 'Gestion des Prospects',
        description: 'Ici vous gérerez tous vos prospects. Importez-les depuis Google Maps, Yellow Pages ou ajoutez-les manuellement.',
        target: '[data-tour="leads"]',
        position: 'right',
        action: {
          label: 'Voir la Gestion des Prospects',
          path: '/leads'
        },
        tips: [
          'Glissez pour changer le statut',
          'Utilisez les filtres pour trouver des prospects spécifiques',
          'Activez les prospects pour démarrer des conversations'
        ]
      },
      {
        id: 'import',
        title: 'Importer des Prospects Automatiquement',
        description: 'Utilisez notre outil de recherche pour trouver des prospects potentiels sur Google Maps et Yellow Pages.',
        target: '[data-tour="search-leads"]',
        position: 'bottom',
        tips: [
          'Recherchez par type d\'entreprise et emplacement',
          'Les prospects sont importés avec des informations complètes',
          'Vous pouvez importer jusqu\'à 20 prospects par recherche'
        ]
      },
      {
        id: 'conversations',
        title: 'Conversations en Temps Réel',
        description: 'Gérez toutes vos conversations WhatsApp depuis un seul endroit. Avec réponses automatiques et suivi.',
        target: '[data-tour="conversations"]',
        position: 'right',
        action: {
          label: 'Voir les Conversations',
          path: '/conversations'
        },
        tips: [
          'Activez un prospect pour démarrer une conversation',
          'Utilisez des modèles de messages pour répondre rapidement',
          'Le système peut répondre automatiquement'
        ]
      },
      {
        id: 'reports',
        title: 'Rapports et Analyses',
        description: 'Visualisez la performance de vos campagnes avec des graphiques détaillés et des métriques en temps réel.',
        target: '[data-tour="reports"]',
        position: 'right',
        action: {
          label: 'Voir les Rapports',
          path: '/reports'
        },
        tips: [
          'Exportez les rapports en PDF ou CSV',
          'Comparez les périodes pour voir les tendances',
          'Les données se mettent à jour toutes les heures'
        ]
      },
      {
        id: 'settings',
        title: 'Personnalisez Votre Expérience',
        description: 'Configurez les intégrations, notifications, automatisations et plus depuis Paramètres.',
        target: '[data-tour="settings"]',
        position: 'right',
        tips: [
          'Connectez WhatsApp, Zapier et autres applications',
          'Configurez les réponses automatiques',
          'Personnalisez votre profil et préférences'
        ]
      },
      {
        id: 'complete',
        title: 'Prêt à Commencer! 🎉',
        description: 'Vous connaissez maintenant les bases. Il est temps de créer votre premier prospect et de commencer à générer des conversions.',
        position: 'center',
        action: {
          label: 'Créer mon premier prospect',
          path: '/leads'
        }
      }
    ],
    buttons: {
      skip: 'Passer la Visite',
      back: 'Retour',
      next: 'Suivant',
      finish: 'Terminer',
      restart: 'Voir la Visite de Bienvenue',
      stepOf: 'Étape',
      of: 'de',
      usefulTips: 'Conseils utiles:'
    }
  },
  de: {
    steps: [
      {
        id: 'welcome',
        title: 'Willkommen bei Unicorn AI! 🦄',
        description: 'Wir freuen uns, Sie hier zu haben. Lassen Sie uns Sie durch eine kurze Tour führen, um das Beste aus der Plattform herauszuholen.',
        position: 'center',
        tips: [
          'Diese Tour dauert nur 2 Minuten',
          'Sie können sie jederzeit überspringen',
          'Sie können sie von den Einstellungen aus neu starten'
        ]
      },
      {
        id: 'dashboard',
        title: 'Ihr Zentrales Dashboard',
        description: 'Hier sehen Sie eine Zusammenfassung aller wichtigen Kennzahlen: Leads, Conversions, aktive Gespräche und mehr.',
        target: '[data-tour="dashboard"]',
        position: 'right',
        action: {
          label: 'Zum Dashboard gehen',
          path: '/dashboard'
        },
        tips: [
          'Kennzahlen werden in Echtzeit aktualisiert',
          'Klicken Sie auf eine beliebige Zahl, um Details zu sehen'
        ]
      },
      {
        id: 'leads',
        title: 'Lead-Verwaltung',
        description: 'Hier verwalten Sie alle Ihre Interessenten. Importieren Sie sie von Google Maps, Yellow Pages oder fügen Sie sie manuell hinzu.',
        target: '[data-tour="leads"]',
        position: 'right',
        action: {
          label: 'Lead-Verwaltung anzeigen',
          path: '/leads'
        },
        tips: [
          'Ziehen Sie, um den Status zu ändern',
          'Verwenden Sie Filter, um bestimmte Leads zu finden',
          'Aktivieren Sie Leads, um Gespräche zu starten'
        ]
      },
      {
        id: 'import',
        title: 'Leads Automatisch Importieren',
        description: 'Verwenden Sie unser Suchwerkzeug, um potenzielle Leads auf Google Maps und Yellow Pages zu finden.',
        target: '[data-tour="search-leads"]',
        position: 'bottom',
        tips: [
          'Suchen Sie nach Geschäftstyp und Standort',
          'Leads werden mit vollständigen Informationen importiert',
          'Sie können bis zu 20 Leads pro Suche importieren'
        ]
      },
      {
        id: 'conversations',
        title: 'Echtzeit-Gespräche',
        description: 'Verwalten Sie alle Ihre WhatsApp-Gespräche von einem Ort aus. Mit automatischen Antworten und Nachverfolgung.',
        target: '[data-tour="conversations"]',
        position: 'right',
        action: {
          label: 'Gespräche anzeigen',
          path: '/conversations'
        },
        tips: [
          'Aktivieren Sie einen Lead, um ein Gespräch zu starten',
          'Verwenden Sie Nachrichtenvorlagen für schnelle Antworten',
          'Das System kann automatisch antworten'
        ]
      },
      {
        id: 'reports',
        title: 'Berichte & Analysen',
        description: 'Visualisieren Sie die Leistung Ihrer Kampagnen mit detaillierten Diagrammen und Echtzeit-Metriken.',
        target: '[data-tour="reports"]',
        position: 'right',
        action: {
          label: 'Berichte anzeigen',
          path: '/reports'
        },
        tips: [
          'Exportieren Sie Berichte als PDF oder CSV',
          'Vergleichen Sie Zeiträume, um Trends zu sehen',
          'Daten werden stündlich aktualisiert'
        ]
      },
      {
        id: 'settings',
        title: 'Passen Sie Ihre Erfahrung An',
        description: 'Konfigurieren Sie Integrationen, Benachrichtigungen, Automatisierungen und mehr in den Einstellungen.',
        target: '[data-tour="settings"]',
        position: 'right',
        tips: [
          'Verbinden Sie WhatsApp, Zapier und andere Apps',
          'Konfigurieren Sie automatische Antworten',
          'Passen Sie Ihr Profil und Ihre Einstellungen an'
        ]
      },
      {
        id: 'complete',
        title: 'Bereit zum Start! 🎉',
        description: 'Sie kennen jetzt die Grundlagen. Es ist Zeit, Ihren ersten Lead zu erstellen und Conversions zu generieren.',
        position: 'center',
        action: {
          label: 'Meinen ersten Lead erstellen',
          path: '/leads'
        }
      }
    ],
    buttons: {
      skip: 'Tour Überspringen',
      back: 'Zurück',
      next: 'Weiter',
      finish: 'Fertig',
      restart: 'Willkommenstour Ansehen',
      stepOf: 'Schritt',
      of: 'von',
      usefulTips: 'Nützliche Tipps:'
    }
  },
  pt: {
    steps: [
      {
        id: 'welcome',
        title: 'Bem-vindo ao Unicorn AI! 🦄',
        description: 'Estamos animados em tê-lo aqui. Vamos guiá-lo em um tour rápido para aproveitar ao máximo a plataforma.',
        position: 'center',
        tips: [
          'Este tour levará apenas 2 minutos',
          'Você pode pulá-lo a qualquer momento',
          'Você pode reiniciá-lo nas Configurações'
        ]
      },
      {
        id: 'dashboard',
        title: 'Seu Painel Central',
        description: 'Aqui você verá um resumo de todas as suas métricas importantes: leads, conversões, conversas ativas e mais.',
        target: '[data-tour="dashboard"]',
        position: 'right',
        action: {
          label: 'Ir para o Painel',
          path: '/dashboard'
        },
        tips: [
          'As métricas são atualizadas em tempo real',
          'Clique em qualquer número para ver detalhes'
        ]
      },
      {
        id: 'leads',
        title: 'Gestão de Leads',
        description: 'Aqui você gerenciará todos os seus prospects. Importe-os do Google Maps, Yellow Pages ou adicione-os manualmente.',
        target: '[data-tour="leads"]',
        position: 'right',
        action: {
          label: 'Ver Gestão de Leads',
          path: '/leads'
        },
        tips: [
          'Arraste para mudar o status',
          'Use filtros para encontrar leads específicos',
          'Ative leads para iniciar conversas'
        ]
      },
      {
        id: 'import',
        title: 'Importar Leads Automaticamente',
        description: 'Use nossa ferramenta de busca para encontrar leads potenciais no Google Maps e Yellow Pages.',
        target: '[data-tour="search-leads"]',
        position: 'bottom',
        tips: [
          'Busque por tipo de negócio e localização',
          'Os leads são importados com informações completas',
          'Você pode importar até 20 leads por busca'
        ]
      },
      {
        id: 'conversations',
        title: 'Conversas em Tempo Real',
        description: 'Gerencie todas as suas conversas do WhatsApp de um só lugar. Com respostas automáticas e acompanhamento.',
        target: '[data-tour="conversations"]',
        position: 'right',
        action: {
          label: 'Ver Conversas',
          path: '/conversations'
        },
        tips: [
          'Ative um lead para iniciar uma conversa',
          'Use modelos de mensagens para respostas rápidas',
          'O sistema pode responder automaticamente'
        ]
      },
      {
        id: 'reports',
        title: 'Relatórios e Análises',
        description: 'Visualize o desempenho de suas campanhas com gráficos detalhados e métricas em tempo real.',
        target: '[data-tour="reports"]',
        position: 'right',
        action: {
          label: 'Ver Relatórios',
          path: '/reports'
        },
        tips: [
          'Exporte relatórios em PDF ou CSV',
          'Compare períodos para ver tendências',
          'Os dados são atualizados a cada hora'
        ]
      },
      {
        id: 'settings',
        title: 'Personalize Sua Experiência',
        description: 'Configure integrações, notificações, automações e mais nas Configurações.',
        target: '[data-tour="settings"]',
        position: 'right',
        tips: [
          'Conecte WhatsApp, Zapier e outros aplicativos',
          'Configure respostas automáticas',
          'Personalize seu perfil e preferências'
        ]
      },
      {
        id: 'complete',
        title: 'Pronto para Começar! 🎉',
        description: 'Você já conhece o básico. Agora é hora de criar seu primeiro lead e começar a gerar conversões.',
        position: 'center',
        action: {
          label: 'Criar meu primeiro lead',
          path: '/leads'
        }
      }
    ],
    buttons: {
      skip: 'Pular Tour',
      back: 'Voltar',
      next: 'Próximo',
      finish: 'Finalizar',
      restart: 'Ver Tour de Boas-Vindas',
      stepOf: 'Passo',
      of: 'de',
      usefulTips: 'Dicas úteis:'
    }
  }
};

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface OnboardingContextType {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  language: Language;
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  setLanguage: (lang: Language) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

// ============================================================================
// PROVIDER
// ============================================================================

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [language, setLanguage] = useState<Language>(detectUserLanguage());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // ✅ VERIFICAR AUTENTICACIÓN CON SUPABASE
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        console.log('🔐 Auth status:', !!session);
      } catch (error) {
        console.error('❌ Error checking auth:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ✅ MOSTRAR ONBOARDING SOLO SI ESTÁ AUTENTICADO
  useEffect(() => {
    if (!isAuthenticated) {
      setIsActive(false);
      return;
    }

    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    const hasSkippedOnboarding = localStorage.getItem('onboarding_skipped');
    
    // Show onboarding if not completed and not skipped
    if (!hasCompletedOnboarding && !hasSkippedOnboarding) {
      // Delay para dar tiempo a que la UI cargue
      const timeout = setTimeout(() => {
        setIsActive(true);
      }, 1500);
      
      return () => clearTimeout(timeout);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isActive && isAuthenticated) {
      const currentSteps = translations[language].steps;
      const step = currentSteps[currentStep];
      
      // Scroll to highlighted element
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
  }, [currentStep, isActive, isAuthenticated, navigate, language]);

  const startTour = () => {
    if (!isAuthenticated) {
      console.warn('⚠️ Cannot start tour: user not authenticated');
      return;
    }
    setCurrentStep(0);
    setIsActive(true);
    localStorage.removeItem('onboarding_skipped');
  };

  const endTour = () => {
    setIsActive(false);
    localStorage.setItem('onboarding_completed', 'true');
  };

  const nextStep = () => {
    const totalSteps = translations[language].steps.length;
    if (currentStep < totalSteps - 1) {
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
        totalSteps: translations[language].steps.length,
        language,
        startTour,
        endTour,
        nextStep,
        prevStep,
        skipTour,
        setLanguage,
      }}
    >
      {children}
      {isActive && isAuthenticated && <OnboardingOverlay />}
    </OnboardingContext.Provider>
  );
};

// ============================================================================
// OVERLAY COMPONENT
// ============================================================================

const OnboardingOverlay: React.FC = () => {
  const { currentStep, totalSteps, nextStep, prevStep, skipTour, language } = useOnboarding();
  const currentSteps = translations[language].steps;
  const currentButtons = translations[language].buttons;
  const step = currentSteps[currentStep];
  
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
                  label={`${currentButtons.stepOf} ${currentStep + 1} ${currentButtons.of} ${totalSteps}`}
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
                    {currentButtons.usefulTips}
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
                {currentButtons.skip}
              </Button>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {currentStep > 0 && (
                  <Button
                    variant="outlined"
                    onClick={prevStep}
                    startIcon={<BackIcon />}
                  >
                    {currentButtons.back}
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={nextStep}
                  endIcon={currentStep === totalSteps - 1 ? <CheckIcon /> : <NextIcon />}
                >
                  {currentStep === totalSteps - 1 ? currentButtons.finish : currentButtons.next}
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </>
  );
};

// ============================================================================
// RESTART TOUR BUTTON (for Settings)
// ============================================================================

export const RestartTourButton: React.FC = () => {
  const { startTour, language } = useOnboarding();
  const currentButtons = translations[language].buttons;

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
      {currentButtons.restart}
    </Button>
  );
};
