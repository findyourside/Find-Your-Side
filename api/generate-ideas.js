const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Missing API key' });

  const answers = req.body.quizData || req.body;

  if (!answers.interests?.length || !answers.skills?.length) {
    return res.status(400).json({ error: 'Missing interests or skills' });
  }

  const prompt = `Generate exactly 10 diverse business ideas based on:
Interests: ${answers.interests.join(', ')}
Skills: ${answers.skills.join(', ')}
Time available: ${answers.timeCommitment}
Budget: ${answers.budget}
Goals: ${answers.goals?.join(', ') || 'various'}

For EACH idea, provide: specific business name, 2-3 sentence description explaining what the business does, why it matches their profile, realistic startup cost range, realistic timeline to first revenue, difficulty level (Beginner/Intermediate/Advanced), and business category.

Return ONLY valid JSON with no markdown:
{"ideas":[{"id":1,"name":"Business Name","description":"What it does","whyMatch":"Why it fits","startupCost":"$X-$Y","timeToRevenue":"X weeks","difficulty":"Beginner","category":"Service"}]}`;

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
    let ideasText = data.content[0].text.trim();
    
    ideasText = ideasText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

    let ideas;
    try {
      ideas = JSON.parse(ideasText);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse AI response', sample: ideasText.substring(0, 200) });
    }

    if (!ideas.ideas?.length) {
      return res.status(500).json({ error: 'No ideas in response' });
    }

    return res.status(200).json(ideas);

  } catch (error) {
    return res.status(500).json({ error: 'Internal error', message: error.message });
  }
}
