// Interfaces para la aplicación Unicorn AI

// Interfaz para Lead
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: 'New' | 'Contacted' | 'Converted' | 'Not Interested';
  priority: 'High' | 'Medium' | 'Low';
  notes?: string;
  createdAt: string;
  lastContactDate?: string;
  activar: boolean;
}

// Interfaz para Campaign
export interface CampaignData {
  id?: string;
  name: string;
  budget: number;
  description?: string;
  status: 'Active' | 'Paused' | 'Completed' | 'Planned';
  clicks: number;
  createdAt?: string;
  endDate?: string;
  platform?: string;
  targetAudience?: string;
  performance?: {
    impressions?: number;
    ctr?: number;
    conversions?: number;
    costPerConversion?: number;
  };
}

// Interfaz para Message
export interface Message {
  id: string;
  senderId: 'lead' | 'agent' | 'bot';
  content: string;
  timestamp: string;
  attachments?: string[];
  read?: boolean;
}

// Interfaz para Conversation
export interface Conversation {
  id: string;
  leadId: string;
  leadName: string;
  status: 'New' | 'In Progress' | 'Resolved';
  lastMessage: string;
  updatedAt: string;
  messages: Message[];
  assignedTo?: string;
  tags?: string[];
}

// Interfaz para ReportData
export interface ReportData {
  [key: string]: {
    totalLeads: number;
    conversionRate: number;
    roi: number;
    amountSpent: number;
    clicks: number;
    engagementRate: number;
    leadSources: {
      [source: string]: number;
    };
    monthlyConversions: {
      [month: string]: number;
    };
  };
}

// Interfaz para User
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'agent' | 'viewer';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

// Interfaz para GoogleAdsCredentials
export interface GoogleAdsCredentials {
  client_id: string;
  client_secret: string;
  developer_token: string;
  refresh_token?: string;
}

// Interfaz para NotificationItem
export interface NotificationItem {
  id: string;
  text: string;
  time: string;
  read: boolean;
  type: 'lead' | 'campaign' | 'system';
  link?: string;
}