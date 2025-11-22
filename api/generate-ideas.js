const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY');
    return res.status(500).json({ error: 'Server configuration error' });
  }

const answers = req.body.quizData || req.body;

if (!answers.interests || !answers.skills) {
  return res.status(400).json({ error: 'Missing required fields', received: Object.keys(req.body) });
}

  const prompt = `Generate 10 business ideas based on: Interests: ${answers.interests.join(', ')}, Skills: ${answers.skills.join(', ')}, Time: ${answers.timeCommitment}, Budget: ${answers.budget}, Goals: ${answers.goals.join(', ')}. Return ONLY valid JSON: {"ideas":[{"id":1,"name":"","description":"","whyMatch":"","startupCost":"","timeToRevenue":"","difficulty":"","category":""}]}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return res.status(response.status).json({ error: 'API error', details: errorText.substring(0, 200) });
    }

    const data = await response.json();
    let ideasText = data.content[0].text.trim();
    
    if (ideasText.startsWith('```json')) {
      ideasText = ideasText.replace(/^```json\s*\n/, '').replace(/\n```$/, '');
    }

    const ideas = JSON.parse(ideasText);
    return res.status(200).json(ideas);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal error', details: error.message });
  }
}
