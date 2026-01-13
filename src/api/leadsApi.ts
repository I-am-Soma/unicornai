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

    console.log('✅ [fetchLeads] Raw data from Supabase:', leads);

    // Mapear tanto de las columnas nuevas como las antiguas
    const mappedLeads = (leads || []).map((lead: any) => ({
      id: lead.id,
      name: lead.name || lead.business_name || '',
      email: lead.email || lead.website || '',
      phone: lead.phone || '',
      source: lead.source || 'Manual',
      status: lead.status || 'New',
      priority: lead.priority || 'Medium',
      relevance: lead.relevance || 'Medium',
      notes: lead.notes || lead.address || '',
      created_at: lead.created_at,
      rating: lead.rating || 0,
      activar: lead.activar || false,
    }));

    console.log('✅ [fetchLeads] Mapped leads:', mappedLeads);
    return mappedLeads;
  } catch (error) {
    console.error('❌ Error fetching leads:', error);
    return [];
  }
};

export const createLead = async (leadData: Partial<Lead>) => {
  console.log('📥 [createLead] Datos recibidos:', leadData);

  try {
    // Validación
    if (!leadData.name?.trim()) {
      throw new Error('Name is required');
    }
    
    if (!leadData.phone?.trim()) {
      throw new Error('Phone is required');
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

    // OPCIÓN A: Si tu tabla tiene columnas 'name', 'email', 'notes' (úsalas directamente)
    const insertData = {
  name: leadData.name.trim(),
  business_name: leadData.name.trim(), // También llenar business_name
  phone: leadData.phone.trim(),
  email: leadData.email?.trim() || '',
  website: leadData.email?.trim() || '', // También llenar website
  notes: leadData.notes?.trim() || '',
  address: leadData.notes?.trim() || '', // También llenar address
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

    console.log('✅ [createLead] Lead creado en DB:', data);

    // Mapear la respuesta (puede venir con cualquier nombre de columna)
    const mappedLead = {
      id: data.id,
      name: data.name || data.business_name,
      email: data.email || data.website,
      phone: data.phone,
      source: data.source,
      status: data.status,
      priority: data.priority,
      relevance: data.relevance,
      notes: data.notes || data.address,
      created_at: data.created_at,
      rating: data.rating,
      activar: data.activar,
    };

    console.log('✅ [createLead] Lead mapeado:', mappedLead);
    return mappedLead;
  } catch (error) {
    console.error('❌ [createLead] Error final:', error);
    throw error;
  }
};

export const updateLead = async (id: string, leadData: Partial<Lead>) => {
  console.log('📥 [updateLead] ID:', id);
  console.log('📥 [updateLead] Datos recibidos:', leadData);

  try {
    // Construir objeto de actualización con ambos conjuntos de columnas
    const updateData: any = {};

    if (leadData.name !== undefined) {
      updateData.name = leadData.name;
      updateData.business_name = leadData.name; // Ambas columnas
    }
    if (leadData.phone !== undefined) {
      updateData.phone = leadData.phone;
    }
    if (leadData.email !== undefined) {
      updateData.email = leadData.email;
      updateData.website = leadData.email; // Ambas columnas
    }
    if (leadData.notes !== undefined) {
      updateData.notes = leadData.notes;
      updateData.address = leadData.notes; // Ambas columnas
    }
    if (leadData.source !== undefined) {
      updateData.source = leadData.source;
    }
    if (leadData.status !== undefined) {
      updateData.status = leadData.status;
    }
    if (leadData.priority !== undefined) {
      updateData.priority = leadData.priority;
    }
    if (leadData.relevance !== undefined) {
      updateData.relevance = leadData.relevance;
    }
    if (leadData.rating !== undefined) {
      updateData.rating = leadData.rating;
    }

    console.log('📤 [updateLead] Payload final:', updateData);

    const { data, error } = await supabase
      .from('Leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [updateLead] Supabase error:', error);
      throw error;
    }

    console.log('✅ [updateLead] Lead actualizado en DB:', data);

    // Mapear la respuesta (puede venir con cualquier nombre de columna)
    const mappedLead = {
      id: data.id,
      name: data.name || data.business_name,
      email: data.email || data.website,
      phone: data.phone,
      source: data.source,
      status: data.status,
      priority: data.priority,
      relevance: data.relevance,
      notes: data.notes || data.address,
      created_at: data.created_at,
      rating: data.rating,
      activar: data.activar,
    };

    console.log('✅ [updateLead] Lead mapeado:', mappedLead);
    return mappedLead;
  } catch (error) {
    console.error('❌ [updateLead] Error final:', error);
    throw error;
  }
};

export const deleteLead = async (id: string) => {
  console.log('🗑️ [deleteLead] Eliminando lead:', id);
  
  try {
    const { error } = await supabase
      .from('Leads')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ [deleteLead] Supabase error:', error);
      throw error;
    }
    
    console.log('✅ [deleteLead] Lead eliminado correctamente');
  } catch (error) {
    console.error('❌ [deleteLead] Error final:', error);
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
// CAMPAIGNS
// ============================================

export const updateCampaign = async (id: string, campaignData: any) => {
  const { data, error } = await supabase
    .from('Campaigns')
    .update(campaignData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCampaign = async (id: string) => {
  const { error } = await supabase
    .from('Campaigns')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ============================================
// REPORTS
// ============================================

export const fetchReports = async (): Promise<ReportData[]> => [];
export const exportReportToPdf = () => console.warn('Not implemented');
export const exportReportToCsv = () => console.warn('Not implemented');
