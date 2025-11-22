const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Missing API key' });

  const ideaFormData = req.body.ideaFormData;
  const idea = req.body.idea;

  const businessIdea = req.body.businessIdea || ideaFormData?.businessIdea || idea?.name;
  const timeCommitment = req.body.timeCommitment || ideaFormData?.timeCommitment;
  const budget = req.body.budget || ideaFormData?.budget;
  const skillsExperience = req.body.skillsExperience || ideaFormData?.skillsExperience;

  if (!businessIdea || !timeCommitment) {
    return res.status(400).json({ error: 'Missing required fields: businessIdea or timeCommitment' });
  }

  const prompt = `Create a detailed 30-day launch playbook for: "${businessIdea}". 
Time commitment: ${timeCommitment}. 
${budget ? `Budget: ${budget}.` : ''}
${skillsExperience ? `Skills/Experience: ${skillsExperience}.` : ''}

Generate exactly 4 weeks with 5-7 daily tasks per week. Each task needs: day number (1-30), title, detailed description, time estimate, and 2-3 resources.

CRITICAL: Return ONLY valid JSON, no markdown or code blocks:
{
  "businessName": "Creative name for the business",
  "overview": "2-3 sentence overview of the 30-day plan",
  "weeks": [
    {
      "week": 1,
      "title": "Week title",
      "focusArea": "Focus area description",
      "successMetric": "How to measure success",
      "totalTime": "Total hours needed",
      "dailyTasks": [
        {"day": 1, "title": "Task title", "description": "Detailed description", "timeEstimate": "2 hours", "resources": ["Resource 1", "Resource 2"]}
      ]
    }
  ]
}`;

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
      return res.status(response.status).json({ error: 'Anthropic API error', details: errorText.substring(0, 300) });
    }

    const data = await response.json();
    let playbookText = data.content[0].text.trim();
    
    // Remove markdown formatting
    playbookText = playbookText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

    // Validate JSON
    let playbook;
    try {
      playbook = JSON.parse(playbookText);
    } catch (e) {
      console.error('Parse error:', e.message);
      console.error('Raw text:', playbookText.substring(0, 500));
      return res.status(500).json({ error: 'Invalid JSON response from AI', sample: playbookText.substring(0, 200) });
    }

    // Validate structure
    if (!playbook.businessName || !playbook.overview || !playbook.weeks) {
      return res.status(500).json({ error: 'Invalid playbook structure', got: Object.keys(playbook) });
    }

    return res.status(200).json(playbook);

  } catch (error) {
    return res.status(500).json({ error: 'Internal error', message: error.message });
  }
}
