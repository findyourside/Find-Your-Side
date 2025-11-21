import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, playbook } = req.body;

  if (!email || !playbook) {
    return res.status(400).json({ error: 'Missing email or playbook' });
  }

  try {
    // TODO: Integrate with Loops.so or email service
    console.log('Email would be sent to:', email);
    console.log('Playbook:', playbook.businessName);
    
    return res.status(200).json({ success: true, message: 'Email sent' });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
