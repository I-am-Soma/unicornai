import axiosInstance from '../utils/axiosConfig';
import axios from 'axios';
import { Lead, CampaignData, Conversation, Message, ReportData } from '../interfaces/interfaces';
import { 
  getStoredLeads, storeLeads, addLead, updateStoredLead, deleteStoredLead,
  getStoredCampaigns, storeCampaigns, addCampaign, updateStoredCampaign, deleteStoredCampaign,
  getStoredConversations, storeConversations
} from '../utils/storage';
import supabase from '../utils/supabaseClient';

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// LEADS
export const fetchLeads = async () => {
  try {
    const { data: leads, error } = await supabase.from('Leads').select('*');
    if (error) throw error;
    if (leads && leads.length > 0) {
      const mappedLeads = leads.map((lead) => ({
        id: lead.id,
        name: lead.business_name || '',
        email: lead.website || '',
        phone: lead.phone || '',
        source: lead.source || '',
        status: 'New',
        priority: 'Medium',
        notes: lead.address || '',
        createdAt: lead.created_at,
        rating: lead.rating || 0,
        relevance: lead.relevance || 'Medium',
      }));
      storeLeads(mappedLeads);
      return mappedLeads;
    }
    const storedLeads = getStoredLeads();
    if (storedLeads.length > 0) return storedLeads;

    const response = await axiosInstance.get('/leads');
    storeLeads(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching leads:', error);
    const demoLeads = [
      { 
        id: '1', 
        name: 'Demo User', 
        email: 'demo@example.com', 
        phone: '555-0000', 
        source: 'Demo', 
        status: 'New', 
        priority: 'Medium', 
        createdAt: new Date().toISOString(), 
        notes: 'Demo lead' 
      }
    ];
    storeLeads(demoLeads);
    return demoLeads;
  }
};

export const createLead = async (leadData: Partial<Lead>) => {
  try {
    if (!leadData.name || !leadData.phone) throw new Error('Required fields missing');
    const { data, error } = await supabase.from('Leads').insert([{ 
      business_name: leadData.name,
      address: leadData.notes || '',
      phone: leadData.phone,
      rating: leadData.rating || 0,
      website: leadData.email || '',
      relevance: leadData.relevance || 'Medium',
      source: leadData.source || 'Manual',
      created_at: new Date()
    }]).select();
    if (error) throw error;
    addLead(data[0]);
    return data[0];
  } catch (error) {
    console.error('Create lead error:', error);
    throw error;
  }
};

export const updateLead = async (id: string, leadData: Partial<Lead>) => {
  try {
    const mappedData = {
      business_name: leadData.name,
      address: leadData.notes,
      phone: leadData.phone,
      rating: leadData.rating,
      website: leadData.email,
      relevance: leadData.relevance,
      source: leadData.source
    };
    await supabase.from('Leads').update(mappedData).eq('id', id);
    updateStoredLead(id, leadData);
  } catch (error) {
    console.error('Update lead error:', error);
    throw error;
  }
};

export const deleteLead = async (id: string) => {
  try {
    await supabase.from('Leads').delete().eq('id', id);
    deleteStoredLead(id);
  } catch (error) {
    console.error('Delete lead error:', error);
    throw error;
  }
};

// CAMPAIGNS
export const fetchCampaigns = async () => {
  try {
    const { data: campaigns, error } = await supabase.from('Campaigns').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    storeCampaigns(campaigns);
    return campaigns;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
};

export const createCampaign = async (campaignData: CampaignData) => {
  try {
    if (!campaignData.name || !campaignData.budget) throw new Error('Name and budget are required');
    const { data, error } = await supabase.from('Campaigns').insert([
      { ...campaignData, created_at: new Date() }
    ]).select();
    if (error) throw error;
    addCampaign(data[0]);
    return data[0];
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

export const updateCampaign = async (id: string, campaignData: Partial<CampaignData>) => {
  try {
    const { data, error } = await supabase.from('Campaigns').update(campaignData).eq('id', id).select();
    if (error) throw error;
    updateStoredCampaign(id, campaignData);
    return data[0];
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
};

export const deleteCampaign = async (id: string) => {
  try {
    await supabase.from('Campaigns').delete().eq('id', id);
    deleteStoredCampaign(id);
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }
};

// CONVERSATIONS
export const fetchConversations = async () => {
  try {
    const { data, error } = await supabase.from('Conversations').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    storeConversations(data);
    return data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

export const sendMessage = async (conversationId: string, message: Partial<Message>) => {
  try {
    const { data, error } = await supabase.from('ConversationsMessages').insert([
      {
        conversation_id: conversationId,
        sender_id: message.senderId || 'agent',
        content: message.content,
        timestamp: new Date().toISOString(),
      },
    ]).select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// REPORTS PLACEHOLDERS
export const fetchReports = async (): Promise<ReportData[]> => {
  console.warn('fetchReports placeholder called (not implemented yet)');
  return [];
};

export const exportReportToPdf = (reportData: any) => {
  console.warn('exportReportToPdf placeholder called (not implemented yet)');
};

export const exportReportToCsv = (reportData: any) => {
  console.warn('exportReportToCsv placeholder called (not implemented yet)');
};

// NUEVA FUNCIÓN PARA YELLOW PAGES VIA APIFY
const YELLOW_PAGES_WEBHOOK_URL = 'https://hook.us2.make.com/cvd583e1n9yhle4p1ljlot34ajnger7d';

export const sendYellowPagesLead = async (data: { business_type: string; location: string }) => {
  try {
    const response = await axios.post(YELLOW_PAGES_WEBHOOK_URL, data);
    console.log('Lead enviado a Yellow Pages (Apify):', response.data);
    return response.data;
  } catch (error) {
    console.error('Error enviando a Yellow Pages Make:', error);
    throw error;
  }
};

