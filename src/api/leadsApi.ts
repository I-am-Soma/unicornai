import supabase from '../utils/supabaseClient';
import { Lead, CampaignData, Conversation, Message, ReportData } from '../interfaces/interfaces';

// ============================================
// LEADS
// ============================================

export const fetchLeads = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('⚠️ fetchLeads: No active session');
      return [];
    }

    const { data: userData } = await supabase
      .from('users')
      .select('client_id')
      .eq('id', session.user.id)
      .single();

    if (!userData?.client_id) {
      console.warn('⚠️ fetchLeads: User has no client_id');
      return [];
    }

    const { data: leads, error } = await supabase
      .from('Leads')
      .select('*')
      .eq('client_id', userData.client_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mappedLeads = (leads || []).map((lead: any) => ({
      id: lead.id,
      name: lead.business_name || '',
      email: lead.website || '',
      phone: lead.phone || '',
      source: lead.source || '',
      status: lead.status || 'New',
      priority: lead.priority || 'Medium',
      notes: lead.address || '',
      created_at: lead.created_at,
      rating: lead.rating || 0,
      relevance: lead.relevance || 'Medium',
      activar: lead.activar || false
    }));

    return mappedLeads;
  } catch (error) {
    console.error('❌ Error fetching leads:', error);
    return [];
  }
};

export const createLead = async (leadData: Partial<Lead>) => {
  console.log('📥 [createLead] 1. Datos recibidos:', leadData);

  try {
    if (!leadData.name || !leadData.phone) {
      console.error('❌ [createLead] Validación fallida:', leadData);
      throw new Error('Name and phone are required');
    }

    const insertData = {
      business_name: leadData.name,
      address: leadData.notes || '',
      phone: leadData.phone,
      rating: leadData.rating || 0,
      website: leadData.email || '',
      relevance: leadData.relevance || 'Medium',
      source: leadData.source || 'Manual',
      status: leadData.status || 'New',
      priority: leadData.priority || 'Medium',
      created_at: new Date().toISOString()
    };

    console.log('📤 [createLead] 2. Payload a insertar:', insertData);
    console.log('🔎 [createLead] 3. Tipos de datos:');
    console.log('   - business_name:', insertData.business_name, typeof insertData.business_name);
    console.log('   - phone:', insertData.phone, typeof insertData.phone);
    console.log('   - relevance:', insertData.relevance, typeof insertData.relevance);
    console.log('   - source:', insertData.source, typeof insertData.source);

    const { data, error } = await supabase
      .from('Leads')
      .insert([insertData])
      .select();

    console.log('📬 [createLead] 4. Respuesta Supabase');
    console.log('   - data:', data);
    console.log('   - error:', error);

    if (error) {
      console.error('❌ [createLead] Error Supabase:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned from insert');
    }

    console.log('✅ [createLead] 5. Lead creado exitosamente:', data[0]);

    return {
      id: data[0].id,
      name: data[0].business_name,
      email: data[0].website,
      phone: data[0].phone,
      source: data[0].source,
      status: data[0].status,
      priority: data[0].priority,
      notes: data[0].address,
      created_at: data[0].created_at,
      rating: data[0].rating,
      relevance: data[0].relevance,
      activar: data[0].activar
    };
  } catch (error) {
    console.error('❌ [createLead] Error final:', error);
    throw error;
  }
};

export const updateLead = async (id: string, leadData: Partial<Lead>) => {
  try {
    const updateData: any = {
      business_name: leadData.name,
      address: leadData.notes,
      phone: leadData.phone,
      rating: leadData.rating,
      website: leadData.email,
      relevance: leadData.relevance,
      source: leadData.source,
      status: leadData.status,
      priority: leadData.priority
    };

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const { data, error } = await supabase
      .from('Leads')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('No data returned from update');
    }

    return data[0];
  } catch (error) {
    console.error('❌ Update lead error:', error);
    throw error;
  }
};

export const deleteLead = async (id: string) => {
  try {
    const { error } = await supabase
      .from('Leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Delete lead error:', error);
    throw error;
  }
};

// ============================================
// CAMPAIGNS
// ============================================

export const fetchCampaigns = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data: userData } = await supabase
      .from('users')
      .select('client_id')
      .eq('id', session.user.id)
      .single();

    if (!userData?.client_id) return [];

    const { data: campaigns, error } = await supabase
      .from('Campaigns')
      .select('*')
      .eq('client_id', userData.client_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return campaigns || [];
  } catch (error) {
    console.error('❌ Error fetching campaigns:', error);
    return [];
  }
};

export const createCampaign = async (campaignData: Partial<CampaignData>) => {
  try {
    if (!campaignData.name || !campaignData.budget) {
      throw new Error('Name and budget are required');
    }

    const insertData = {
      name: campaignData.name,
      budget: Number(campaignData.budget),
      status: campaignData.status || 'Active',
      clicks: Number(campaignData.clicks) || 0,
      platform: campaignData.platform || null,
      target_audience: campaignData.targetAudience || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('Campaigns')
      .insert([insertData])
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('No data returned from insert');
    }

    return data[0];
  } catch (error) {
    console.error('❌ Error creating campaign:', error);
    throw error;
  }
};

export const updateCampaign = async (id: string, campaignData: Partial<CampaignData>) => {
  try {
    const updateData: any = {
      name: campaignData.name,
      budget: campaignData.budget ? Number(campaignData.budget) : undefined,
      status: campaignData.status,
      clicks: campaignData.clicks ? Number(campaignData.clicks) : undefined,
      platform: campaignData.platform,
      target_audience: campaignData.targetAudience
    };

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const { data, error } = await supabase
      .from('Campaigns')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error('❌ Error updating campaign:', error);
    throw error;
  }
};

export const deleteCampaign = async (id: string) => {
  try {
    const { error } = await supabase
      .from('Campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Error deleting campaign:', error);
    throw error;
  }
};

// ============================================
// CONVERSATIONS
// ============================================

export const fetchConversations = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data: userData } = await supabase
      .from('users')
      .select('client_id')
      .eq('id', session.user.id)
      .single();

    if (!userData?.client_id) return [];

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('client_id', userData.client_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    return [];
  }
};

// ============================================
// REPORTS (Placeholders)
// ============================================

export const fetchReports = async (): Promise<ReportData[]> => {
  return [];
};

export const exportReportToPdf = (reportData: any) => {
  console.warn('⚠️ exportReportToPdf not implemented');
};

export const exportReportToCsv = (reportData: any) => {
  console.warn('⚠️ exportReportToCsv not implemented');
};
