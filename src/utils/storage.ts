import { Lead, CampaignData, Conversation } from '../interfaces/interfaces';

// Local storage keys
const LEADS_STORAGE_KEY = 'unicorn_leads';
const CAMPAIGNS_STORAGE_KEY = 'unicorn_campaigns';
const CONVERSATIONS_STORAGE_KEY = 'unicorn_conversations';

// Lead storage functions
export const getStoredLeads = (): Lead[] => {
  const storedLeads = localStorage.getItem(LEADS_STORAGE_KEY);
  return storedLeads ? JSON.parse(storedLeads) : [];
};

export const storeLeads = (leads: Lead[]): void => {
  localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
};

export const addLead = (lead: Lead): Lead[] => {
  const leads = getStoredLeads();
  const updatedLeads = [...leads, lead];
  storeLeads(updatedLeads);
  return updatedLeads;
};

export const updateStoredLead = (id: string, updatedLead: Partial<Lead>): Lead[] => {
  const leads = getStoredLeads();
  const updatedLeads = leads.map(lead => 
    lead.id === id ? { ...lead, ...updatedLead } : lead
  );
  storeLeads(updatedLeads);
  return updatedLeads;
};

export const deleteStoredLead = (id: string): Lead[] => {
  const leads = getStoredLeads();
  const updatedLeads = leads.filter(lead => lead.id !== id);
  storeLeads(updatedLeads);
  return updatedLeads;
};

// Campaign storage functions
export const getStoredCampaigns = (): CampaignData[] => {
  const storedCampaigns = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
  return storedCampaigns ? JSON.parse(storedCampaigns) : [];
};

export const storeCampaigns = (campaigns: CampaignData[]): void => {
  localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
};

export const addCampaign = (campaign: CampaignData): CampaignData[] => {
  const campaigns = getStoredCampaigns();
  const updatedCampaigns = [...campaigns, campaign];
  storeCampaigns(updatedCampaigns);
  return updatedCampaigns;
};

export const updateStoredCampaign = (id: string, updatedCampaign: Partial<CampaignData>): CampaignData[] => {
  const campaigns = getStoredCampaigns();
  const updatedCampaigns = campaigns.map(campaign => 
    campaign.id === id ? { ...campaign, ...updatedCampaign } : campaign
  );
  storeCampaigns(updatedCampaigns);
  return updatedCampaigns;
};

export const deleteStoredCampaign = (id: string): CampaignData[] => {
  const campaigns = getStoredCampaigns();
  const updatedCampaigns = campaigns.filter(campaign => campaign.id !== id);
  storeCampaigns(updatedCampaigns);
  return updatedCampaigns;
};

// Conversation storage functions
export const getStoredConversations = (): Conversation[] => {
  const storedConversations = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
  return storedConversations ? JSON.parse(storedConversations) : [];
};

export const storeConversations = (conversations: Conversation[]): void => {
  localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
};

export const addConversation = (conversation: Conversation): Conversation[] => {
  const conversations = getStoredConversations();
  const updatedConversations = [...conversations, conversation];
  storeConversations(updatedConversations);
  return updatedConversations;
};

export const updateStoredConversation = (id: string, updatedConversation: Partial<Conversation>): Conversation[] => {
  const conversations = getStoredConversations();
  const updatedConversations = conversations.map(conversation => 
    conversation.id === id ? { ...conversation, ...updatedConversation } : conversation
  );
  storeConversations(updatedConversations);
  return updatedConversations;
};

export const deleteStoredConversation = (id: string): Conversation[] => {
  const conversations = getStoredConversations();
  const updatedConversations = conversations.filter(conversation => conversation.id !== id);
  storeConversations(updatedConversations);
  return updatedConversations;
};

// User authentication functions
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('unicorn_user');
};

export const logout = (): void => {
  localStorage.removeItem('unicorn_user');
};