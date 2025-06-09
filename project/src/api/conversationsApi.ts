// src/api/conversationsApi.ts
import { Conversation, Message } from '../interfaces/interfaces';
import supabase from '../utils/supabaseClient';

export const fetchConversations = async (): Promise<Conversation[]> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        lead:lead_id (
          business_name,
          phone,
          website
        )
      `)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const grouped: { [key: string]: Conversation } = {};

    for (const conv of data || []) {
      if (!grouped[conv.lead_id]) {
        grouped[conv.lead_id] = {
          id: conv.lead_id,
          leadId: conv.lead_id,
          leadName: conv.lead?.business_name || 'Unknown',
          status: conv.status || 'New',
          lastMessage: conv.message,
          updatedAt: conv.created_at,
          messages: [],
        };
      }

      grouped[conv.lead_id].messages.push({
        id: conv.id,
        senderId: conv.sender,
        content: conv.message,
        timestamp: conv.created_at,
      });

      grouped[conv.lead_id].lastMessage = conv.message;
      grouped[conv.lead_id].updatedAt = conv.created_at;
    }

    return Object.values(grouped);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

export const sendConversationMessage = async (leadId: string, message: Partial<Message>) => {
  try {
    const { data, error } = await supabase.from('conversations').insert([
      {
        lead_id: leadId,
        message: message.content,
        sender: message.senderId || 'bot',
        created_at: new Date().toISOString(),
        status: 'In Progress',
      },
    ]).select();

    if (error) throw error;

    return data[0];
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const subscribeToConversations = (callback: (payload: any) => void) => {
  const subscription = supabase
    .channel('conversations_channel')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'conversations',
    }, callback)
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};
