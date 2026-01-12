import supabase from '../utils/supabaseClient';
import { Lead, CampaignData, Message, ReportData } from '../interfaces/interfaces';

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

    return (leads || []).map((lead: any) => ({
      id: lead.id,
      name: lead.business_name || '',
      email: lead.website || '',
      phone: lead.phone || '',
      source: lead.source || 'Manual',
      status: lead.status || 'New',
      priority: lead.priority || 'Medium',
      relevance: lead.relevance || 'Medium',
      notes: lead.address || '',
      created_at: lead.created_at,
      rating: lead.rating || 0,
      activar: lead.activar || false,
    }));
  } catch (error) {
    console.error('❌ Error fetching leads:', error);
    return [];
  }
};

export const createLead = async (leadData: Partial<Lead>) => {
  console.log('📥 [createLead] Datos recibidos:', leadData);

  try {
    if (!leadData.name?.trim() || !leadData.phone?.trim()) {
      throw new Error('Name and phone are required');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { data: userData } = await supabase
      .from('users')
      .select('id, client_id')
      .eq('id', session.user.id)
      .single();

    if (!userData?.client_id) {
      throw new Error('User configuration not found');
    }

    const insertData = {
      business_name: leadData.name.trim(),
      phone: leadData.phone.trim(),
      website: leadData.email?.trim() || '',
      address: leadData.notes?.trim() || '',
      source: leadData.source || 'Manual',
      status: leadData.status || 'New',
      priority: leadData.priority || 'Medium',
      relevance: leadData.relevance || 'Medium',
      rating: typeof leadData.rating === 'number' ? leadData.rating : 0,
      activar: false,
      client_id: userData.client_id,
      user_id: userData.id,
      created_at: new Date().toISOString(),
    };

    console.log('📤 [createLead] Payload final:', insertData);

    const { data, error } = await supabase
      .from('Leads')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('❌ [createLead] Supabase error:', error);
      throw error;
    }

    console.log('✅ [createLead] Lead creado:', data);

    return {
      id: data.id,
      name: data.business_name,
      email: data.website,
      phone: data.phone,
      source: data.source,
      status: data.status,
      priority: data.priority,
      relevance: data.relevance,
      notes: data.address,
      created_at: data.created_at,
      rating: data.rating,
      activar: data.activar,
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
      phone: leadData.phone,
      website: leadData.email,
      address: leadData.notes,
      source: leadData.source,
      status: leadData.status,
      priority: leadData.priority,
      relevance: leadData.relevance,
      rating: leadData.rating,
    };

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const { data, error } = await supabase
      .from('Leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Update lead error:', error);
    throw error;
  }
};

export const deleteLead = async (id: string) => {
  const { error } = await supabase.from('Leads').delete().eq('id', id);
  if (error) throw error;
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

    const { data, error } = await supabase
      .from('Campaigns')
      .select('*')
      .eq('client_id', userData.client_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching campaigns:', error);
    return [];
  }
};

export const createCampaign = async (campaignData: Partial<CampaignData>) => {
  if (!campaignData.name || !campaignData.budget) {
    throw new Error('Name and budget are required');
  }

  const { data, error } = await supabase
    .from('Campaigns')
    .insert([{
      name: campaignData.name,
      budget: Number(campaignData.budget),
      status: campaignData.status || 'Active',
      clicks: Number(campaignData.clicks) || 0,
      platform: campaignData.platform || null,
      target_audience: campaignData.targetAudience || null,
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
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
// REPORTS
// ============================================

export const fetchReports = async (): Promise<ReportData[]> => [];
export const exportReportToPdf = () => console.warn('Not implemented');
export const exportReportToCsv = () => console.warn('Not implemented');
