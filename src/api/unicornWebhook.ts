// src/api/unicornWebhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createLead } from './leadsApi'; // usa tu función existente

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const {
      business_name,
      phone,
      address,
      website,
      rating,
      relevance,
      source
    } = req.body;

    const lead = {
      name: business_name || '',
      phone: phone || '',
      notes: address || '',
      email: website || '',
      rating: rating || 0,
      relevance: relevance || 'Medium',
      source: source || 'Yelp',
    };

    const result = await createLead(lead);
    return res.status(200).json({ message: 'Lead received and stored', result });
  } catch (error) {
    console.error('Error receiving lead from Make webhook:', error);
    return res.status(500).json({ message: 'Internal error' });
  }
}
