const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Missing API key' });

  const { businessIdea, timeCommitment, budget, skillsExperience } = req.body;

  if (!businessIdea || !timeCommitment) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const prompt = `Create a 30-day launch playbook for: ${businessIdea}. Time: ${timeCommitment}. ${budget ? `Budget: ${budget}.` : ''} ${skillsExperience ? `Skills: ${skillsExperience}.` : ''} Return ONLY valid JSON: {"businessName":"","overview":"","weeks":[{"week":1,"title":"","focusArea":"","successMetric":"","totalTime":"","dailyTasks":[{"day":1,"title":"","description":"","timeEstimate":"","resources":[]}]}]}`;

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
      return res.status(response.status).json({ error: 'API error', details: errorText.substring(0, 200) });
    }

    const data = await response.json();
    let playbookText = data.content[0].text.trim();
    
    if (playbookText.startsWith('```json')) {
      playbookText = playbookText.replace(/^```json\s*\n/, '').replace(/\n```$/, '');
    }

    const playbook = JSON.parse(playbookText);
    return res.status(200).json(playbook);

  } catch (error) {
    return res.status(500).json({ error: 'Internal error', details: error.message });
  }
}
