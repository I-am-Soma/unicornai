import axiosInstance from '../utils/axiosConfig';
import axios from 'axios';
import {
  Lead,
  CampaignData,
  Conversation,
  Message,
  ReportData
} from '../interfaces/interfaces';
import {
  getStoredLeads,
  storeLeads,
  addLead,
  updateStoredLead,
  deleteStoredLead,
  getStoredCampaigns,
  storeCampaigns,
  addCampaign,
  updateStoredCampaign,
  deleteStoredCampaign,
  getStoredConversations,
  storeConversations
} from '../utils/storage';
import supabase from '../utils/supabaseClient';

const generateId = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

// LEADS
export const fetchLeads = async () => {
  try {
    // Obtener el client_id para filtrar
    const clientId =
      typeof window !== 'undefined'
        ? localStorage.getItem('unicorn_client_id')
        : null;

    let query = supabase.from('Leads').select('*');
    // Aplicar filtro por client_id si está definido
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: leads, error } = await query;
    if (error) throw error;
    if (leads && leads.length > 0) {
      const mappedLeads = leads.map((lead) => ({
        id: lead.id,
        name: lead.business_name || '',
        email: lead.website || '',
        phone: lead.phone || '',
        source: lead.source || '',
        status: lead.status || 'New',
        priority: lead.priority || 'Medium',
        notes: lead.address || '',
        createdAt: lead.created_at,
        rating: lead.rating || 0,
        relevance: lead.relevance || 'Medium',
        activar: lead.activar || false
      }));
      storeLeads(mappedLeads);
      return mappedLeads;
    }
    // Si no hay leads en Supabase, usa los almacenados localmente
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
        notes: 'Demo lead',
        activar: false
      }
    ];
    storeLeads(demoLeads);
    return demoLeads;
  }
};

export const createLead = async (leadData: Partial<Lead>) => {
  try {
    console.log('Creating lead with data:', leadData);

    if (!leadData.name || !leadData.phone) {
      throw new Error('Name and phone are required');
    }

    // Preparar los datos para insertar en Supabase
    const insertData: any = {
      business_name: leadData.name,
      address: leadData.notes || '',
      phone: leadData.phone,
      rating: leadData.rating || 0,
      website: leadData.email || '',
      relevance: leadData.relevance || 'Medium',
      source: leadData.source || 'Manual',
      created_at: new Date().toISOString(),
      activar: leadData.activar || false,
      status: leadData.status || 'New',
      priority: leadData.priority || 'Medium'
    };

    // Añadir client_id si está disponible
    const clientId =
      typeof window !== 'undefined'
        ? localStorage.getItem('unicorn_client_id')
        : null;
    if (clientId) {
      insertData.client_id = clientId;
    }

    console.log('Insert data prepared:', insertData);

    const { data, error } = await supabase
      .from('Leads')
      .insert([insertData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned from insert');
    }

    console.log('Lead created successfully:', data[0]);

    // Mapear de vuelta al formato de la interfaz Lead
    const mappedLead = {
      id: data[0].id,
      name: data[0].business_name,
      email: data[0].website,
      phone: data[0].phone,
      source: data[0].source,
      status: data[0].status || 'New',
      priority: data[0].priority || 'Medium',
      notes: data[0].address,
      createdAt: data[0].created_at,
      activar: data[0].activar
    };

    addLead(mappedLead);
    return mappedLead;
  } catch (error) {
    console.error('Create lead error:', error);
    throw error;
  }
};

export const updateLead = async (id: string, leadData: Partial<Lead>) => {
  try {
    console.log('Updating lead:', id, leadData);

    // Preparar los datos para actualizar en Supabase
    const updateData: any = {
      business_name: leadData.name,
      address: leadData.notes,
      phone: leadData.phone,
      rating: leadData.rating,
      website: leadData.email,
      relevance: leadData.relevance,
      source: leadData.source,
      activar: leadData.activar,
      status: leadData.status,
      priority: leadData.priority
    };

    // Remover campos undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    console.log('Update data prepared:', updateData);

    // Aplicar el filtro por client_id si existe
    const clientId =
      typeof window !== 'undefined'
        ? localStorage.getItem('unicorn_client_id')
        : null;

    let updateQuery = supabase.from('Leads').update(updateData).eq('id', id);
    if (clientId) {
      updateQuery = updateQuery.eq('client_id', clientId);
    }

    const { data, error } = await updateQuery.select();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned from update');
    }

    console.log('Lead updated successfully:', data[0]);

    // Actualizar el storage local
    updateStoredLead(id, leadData);

    return data[0];
  } catch (error) {
    console.error('Update lead error:', error);
    throw error;
  }
};

export const activateLead = async (id: string) => {
  try {
    const clientId =
      typeof window !== 'undefined'
        ? localStorage.getItem('unicorn_client_id')
        : null;

    let updateQuery = supabase
      .from('Leads')
      .update({ activar: true })
      .eq('id', id);
    if (clientId) {
      updateQuery = updateQuery.eq('client_id', clientId);
    }

    const { error } = await updateQuery;

    if (error) throw error;

    updateStoredLead(id, { activar: true });
    return true;
  } catch (error) {
    console.error('Activate lead error:', error);
    throw error;
  }
};

export const deleteLead = async (id: string) => {
  try {
    const clientId =
      typeof window !== 'undefined'
        ? localStorage.getItem('unicorn_client_id')
        : null;

    let deleteQuery = supabase.from('Leads').delete().eq('id', id);
    if (clientId) {
      deleteQuery = deleteQuery.eq('client_id', clientId);
    }

    const { error } = await deleteQuery;
    if (error) throw error;
    deleteStoredLead(id);
  } catch (error) {
    console.error('Delete lead error:', error);
    throw error;
  }
};

// CAMPAIGNS
export const fetchCampaigns = async () => {
  try {
    const clientId =
      typeof window !== 'undefined'
        ? localStorage.getItem('unicorn_client_id')
        : null;

    let query = supabase
      .from('Campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: campaigns, error } = await query;
    if (error) throw error;
    storeCampaigns(campaigns || []);
    return campaigns || [];
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
};

export const createCampaign = async (campaignData: Partial<CampaignData>) => {
  try {
    console.log('Creating campaign with data:', campaignData);

    if (!campaignData.name || !campaignData.budget) {
      throw new Error('Name and budget are required');
    }

    const insertData: any = {
      name: campaignData.name,
      budget: Number(campaignData.budget),
      status: campaignData.status || 'Active',
      clicks: Number(campaignData.clicks) || 0,
      platform: campaignData.platform || null,
      target_audience: campaignData.targetAudience || null,
      created_at: new Date().toISOString()
    };

    // Añadir client_id
    const clientId =
      typeof window !== 'undefined'
        ? localStorage.getItem('unicorn_client_id')
        : null;
    if (clientId) {
      insertData.client_id = clientId;
    }

    console.log('Insert data prepared:', insertData);

    const { data, error } = await supabase
      .from('Campaigns')
      .insert([insertData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned from insert');
    }

    console.log('Campaign created successfully:', data[0]);

    // Actualizar el storage local
    addCampaign(data[0]);

    return data[0];
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

export const updateCampaign = async (
  id: string,
  campaignData: Partial<CampaignData>
) => {
  try {
    console.log('Updating campaign:', id, campaignData);

    const updateData: any = {
      name: campaignData.name,
      budget: campaignData.budget
        ? Number(campaignData.budget)
        : undefined,
      status: campaignData.status,
      clicks: campaignData.clicks
        ? Number(campaignData.clicks)
        : undefined,
      platform: campaignData.platform,
      target_audience: campaignData.targetAudience
    };

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const clientId =
      typeof window !== 'undefined'
        ? localStorage.getItem('unicorn_client_id')
        : null;

    let updateQuery = supabase
      .from('Campaigns')
      .update(updateData)
      .eq('id', id);

    if (clientId) {
      updateQuery = updateQuery.eq('client_id', clientId);
    }

    const { data, error } = await updateQuery.select();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    console.log('Campaign updated successfully:', data[0]);

    // Actualizar el storage local
    updateStoredCampaign(id, campaignData);

    return data[0];
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
};

export const deleteCampaign = async (id: string) => {
  try {
    const clientId =
      typeof window !== 'undefined'
        ? localStorage.getItem('unicorn_client_id')
        : null;

    let deleteQuery = supabase.from('Campaigns').delete().eq('id', id);
    if (clientId) {
      deleteQuery = deleteQuery.eq('client_id', clientId);
    }

    const { error } = await deleteQuery;
    if (error) throw error;
    deleteStoredCampaign(id);
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }
};

// CONVERSATIONS
export const fetchConversations = async () => {
  try {
    const clientId =
      typeof window !== 'undefined'
        ? localStorage.getItem('unicorn_client_id')
        : null;

    let query = supabase
      .from('conversations')
      .select(
        `
        *,
        lead:lead_id (
          business_name,
          phone,
          website
        )
      `
      )
      .order('created_at', { ascending: false });

    // Filtrar por client_id si lo añadiste a la tabla conversations
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Map the data to match our interface
    const mappedConversations = data.map((conv: any) => ({
      id: conv.id,
      leadId: conv.lead_id,
      leadName: conv.lead?.business_name || 'Unknown Lead',
      status: conv.status || 'New',
      lastMessage: conv.message || '',
      updatedAt: conv.created_at,
      messages: [
        {
          id: conv.id,
          senderId: conv.sender,
          content: conv.message,
          timestamp: conv.created_at
        }
      ]
    }));

    // Group messages by conversation
    const groupedConversations = mappedConversations.reduce(
      (acc: any, curr: any) => {
        const existing = acc.find((c: any) => c.leadId === curr.leadId);
        if (existing) {
          existing.messages.push(...curr.messages);
          if (
            new Date(curr.updatedAt) >
            new Date(existing.updatedAt)
          ) {
            existing.lastMessage = curr.lastMessage;
            existing.updatedAt = curr.updatedAt;
          }
        } else {
          acc.push(curr);
        }
        return acc;
      },
      []
    );

    storeConversations(groupedConversations);
    return groupedConversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

export const subscribeToConversations = (callback: (payload: any) => void) => {
  const subscription = supabase
    .channel('conversations_channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations'
      },
      callback
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

export const sendMessage = async (
  conversationId: string,
  message: Partial<Message>
) => {
  try {
    const clientId =
      typeof window !== 'undefined'
        ? localStorage.getItem('unicorn_client_id')
        : null;

    const insertRow: any = {
      lead_id: conversationId,
      message: message.content,
      sender: message.senderId || 'bot',
      created_at: new Date().toISOString()
    };

    if (clientId) {
      insertRow.client_id = clientId;
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert([insertRow])
      .select();

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

// NUEVA FUNCIÓN AGREGADA
const makeWebhookURL =
  'https://hook.us2.make.com/qn218ny6kp3xhlb1ca52mmgp5ld6o4ig';

export const sendLeadRequestToMake = async (data: {
  business_type: string;
  location: string;
}) => {
  try {
    const response = await axios.post(makeWebhookURL, data);
    return response.data;
  } catch (error) {
    console.error('Error enviando datos a Make:', error);
    throw error;
  }
};

// NUEVA URL (por ejemplo para YP/Apify)
const MAKE_WEBHOOK_URL_YP =
  'https://hook.us2.make.com/cvd583e1n9yhle4p1ljlot34ajnger7d';
export const sendLeadRequestToMakeYP = async (data: {
  business_type: string;
  location: string;
}) => {
  try {
    const response = await axios.post(MAKE_WEBHOOK_URL_YP, data);
    return response.data;
  } catch (error) {
    console.error('Error enviando datos a Make (YP/Apify):', error);
    throw error;
  }
};
