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

/*
 * Leads API
 *
 * Este módulo centraliza todas las operaciones CRUD sobre leads,
 * campañas y conversaciones dentro de la plataforma Unicorn AI.
 * Se han incorporado mecanismos de multiusuario basados en el
 * identificador de cliente (`client_id`) para que los datos
 * permanezcan aislados entre distintos clientes. El `client_id`
 * se almacena en `localStorage` bajo la clave `unicorn_client_id`,
 * se incluye al insertar y se utiliza como filtro en todas las
 * consultas, actualizaciones y eliminaciones.
 */

// Generador de ID local, utilizado en datos de prueba
const generateId = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

/*
 * Obtener leads desde Supabase. Si existen datos en localStorage,
 * se devolverán únicamente si la respuesta de Supabase está vacía.
 * El resultado se mapea al formato de la interfaz Lead y se almacena
 * en localStorage para cachear resultados entre sesiones.
 */
export const fetchLeads = async () => {
  try {
    const clientId =
      typeof window !== 'undefined'
        ? localStorage.getItem('unicorn_client_id')
        : null;

    let query = supabase.from('Leads').select('*');
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: leads, error } = await query;
    if (error) throw error;

    if (leads && leads.length > 0) {
      // Mapeamos para incluir rating y relevance, además de status, priority y notes
      const mappedLeads = leads.map((lead: any) => ({
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

    // Si no hay datos en Supabase, devolvemos los almacenados localmente
    const storedLeads = getStoredLeads();
    if (storedLeads.length > 0) return storedLeads;

    // Finalmente, intentamos obtener datos desde una API de fallback
    const response = await axiosInstance.get('/leads');
    storeLeads(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching leads:', error);
    // Datos de demostración en caso de error
    const demoLeads = [
      {
        id: generateId(),
        name: 'Demo User',
        email: 'demo@example.com',
        phone: '555-0000',
        source: 'Demo',
        status: 'New',
        priority: 'Medium',
        createdAt: new Date().toISOString(),
        notes: 'Demo lead',
        rating: 0,
        relevance: 'Medium',
        activar: false
      }
    ];
    storeLeads(demoLeads);
    return demoLeads;
  }
};

/*
 * Crear un nuevo lead. Valida que existan nombre y teléfono,
 * prepara los datos con los campos de la tabla y añade el `client_id`
 * si se encuentra en localStorage. Devuelve el lead creado en
 * formato de interfaz Lead y lo almacena en localStorage.
 */
export const createLead = async (leadData: Partial<Lead>) => {
  try {
    if (!leadData.name || !leadData.phone) {
      throw new Error('Name and phone are required');
    }

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

    // Asignar client_id si existe en localStorage
    const clientId =
      typeof window !== 'undefined'
        ? localStorage.getItem('unicorn_client_id')
        : null;
    if (clientId) insertData.client_id = clientId;

    const { data, error } = await supabase
      .from('Leads')
      .insert([insertData])
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('No data returned from insert');
    }

    const mappedLead: Lead = {
      id: data[0].id,
      name: data[0].business_name,
      email: data[0].website,
      phone: data[0].phone,
      source: data[0].source,
      status: data[0].status || 'New',
      priority: data[0].priority || 'Medium',
      notes: data[0].address,
      createdAt: data[0].created_at,
      rating: data[0].rating || 0,
      relevance: data[0].relevance || 'Medium',
      activar: data[0].activar
    };

    addLead(mappedLead);
    return mappedLead;
  } catch (error) {
    console.error('Create lead error:', error);
    throw error;
  }
};

/*
 * Actualizar un lead por ID. Se filtra por `client_id` para evitar
 * modificar leads de otros clientes. Sólo se actualizan los campos
 * proporcionados.
 */
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
      activar: leadData.activar,
      status: leadData.status,
      priority: leadData.priority
    };

    // Quitar campos undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const clientId =
      typeof window !== 'undefined'
        ? localStorage.getItem('unicorn_client_id')
        : null;

    let updateQuery = supabase.from('Leads').update(updateData).eq('id', id);
    if (clientId) updateQuery = updateQuery.eq('client_id', clientId);

    const { data, error } = await updateQuery.select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('No data returned from update');
    }

    updateStoredLead(id, leadData);
    return data[0];
  } catch (error) {
    console.error('Update lead error:', error);
    throw error;
  }
};

/*
 * Activar un lead (marcar `activar` en true) por ID. Se filtra por
 * `client_id` para asegurar que sólo se afecten los leads del cliente
 * actual.
 */
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
    if (clientId) updateQuery = updateQuery.eq('client_id', clientId);

    const { error } = await updateQuery;
    if (error) throw error;

    updateStoredLead(id, { activar: true });
    return true;
  } catch (error) {
    console.error('Activate lead error:', error);
    throw error;
  }
};

/*
 * Eliminar un lead por ID. Se filtra por `client_id` para evitar
 * eliminar leads de otros clientes.
 */
export const deleteLead = async (id: string) => {
  try {
    const clientId =
      typeof window !== 'undefined'
        ? localStorage.getItem('unicorn_client_id')
        : null;

    let deleteQuery = supabase.from('Leads').delete().eq('id', id);
    if (clientId) deleteQuery = deleteQuery.eq('client_id', clientId);

    const { error } = await deleteQuery;
    if (error) throw error;
    deleteStoredLead(id);
  } catch (error) {
    console.error('Delete lead error:', error);
    throw error;
  }
};

/*
 * Campañas
 *
 * Las funciones de campañas siguen la misma filosofía: filtrar por
 * `client_id` y asignarlo al momento de crear la campaña. Se mapea
 * la respuesta al formato de interfaz CampaignData cuando es necesario.
 */
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

    const clientId =
      typeof window !== 'undefined'
        ? localStorage.getItem('unicorn_client_id')
        : null;
    if (clientId) insertData.client_id = clientId;

    const { data, error } = await supabase
      .from('Campaigns')
      .insert([insertData])
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('No data returned from insert');
    }

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
    const updateData: any = {
      name: campaignData.name,
      budget: campaignData.budget ? Number(campaignData.budget) : undefined,
      status: campaignData.status,
      clicks: campaignData.clicks ? Number(campaignData.clicks) : undefined,
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
    if (clientId) updateQuery = updateQuery.eq('client_id', clientId);

    const { data, error } = await updateQuery.select();
    if (error) throw error;

    updateStoredCampaign(id, campaignData);
    return data?.[0];
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

/*
 * Conversaciones
 *
 * Para mantener la segregación por cliente, se filtra por `client_id`
 * en las consultas y se añade en las inserciones. En la respuesta
 * transformamos cada conversación a un objeto que agrupa los
 * mensajes por lead.
 */
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

    // Filtrar por client_id si la tabla conversations lo posee
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Mapeamos la respuesta al formato esperado por la interfaz
    const mappedConversations = (data || []).map((conv: any) => ({
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

    // Agrupamos los mensajes por conversación (lead)
    const groupedConversations = mappedConversations.reduce(
      (acc: any, curr: any) => {
        const existing = acc.find((c: any) => c.leadId === curr.leadId);
        if (existing) {
          existing.messages.push(...curr.messages);
          if (new Date(curr.updatedAt) > new Date(existing.updatedAt)) {
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

/*
 * Suscribirse a cambios en la tabla conversations mediante supabase
 * channel. Devuelve una función para cancelar la suscripción.
 */
export const subscribeToConversations = (
  callback: (payload: any) => void
) => {
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

/*
 * Enviar un mensaje en una conversación. Incluye el `client_id` en la
 * inserción para mantener la segregación por cliente.
 */
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
    if (clientId) insertRow.client_id = clientId;

    const { data, error } = await supabase
      .from('conversations')
      .insert([insertRow])
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/*
 * Reportes (placeholders)
 *
 * Estas funciones aún no se han implementado. Devuelven valores
 * de ejemplo y mostrarán advertencias en la consola para que el
 * desarrollador sepa que son placeholders.
 */
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

/*
 * Integraciones con Make.com (webhooks)
 *
 * Estas funciones envían solicitudes HTTP a webhooks configurados en
 * Make para iniciar procesos externos (por ejemplo scraping o
 * enriquecimiento de datos). Se conservan tal cual estaban en la
 * versión anterior del archivo.
 */
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
