import type { VercelRequest, VercelResponse } from '@vercel/node';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface PlaybookRequest {
  businessIdea: string;
  timeCommitment: string;
  budget?: string;
  skillsExperience?: string;
  email?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate API key
  if (!ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY environment variable');
    return res.status(500).json({ 
      error: 'Server configuration error: Missing API key',
      details: 'ANTHROPIC_API_KEY not configured'
    });
  }

  const { businessIdea, timeCommitment, budget, skillsExperience, email }: PlaybookRequest = req.body;

  if (!businessIdea || !timeCommitment) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const prompt = `You are an expert business consultant. Create a detailed 30-day launch playbook for this business idea.

Business Idea: ${businessIdea}
Time Commitment: ${timeCommitment}
${budget ? `Budget: ${budget}` : ''}
${skillsExperience ? `Skills/Experience: ${skillsExperience}` : ''}

Create a comprehensive 30-day launch plan with:
- 4 weeks of detailed daily tasks
- Each week should have a clear focus area and success metric
- Tasks should be specific, actionable, and realistic
- Include time estimates for each task
- Suggest free or low-cost resources/tools when possible
- Consider the person's time commitment and budget constraints

Return ONLY valid JSON in this exact format (no markdown, no code blocks, just pure JSON):
{
  "businessName": "A catchy name for this business",
  "overview": "2-3 sentence overview of the 30-day plan",
  "weeks": [
    {
      "week": 1,
      "title": "Week title",
      "focusArea": "Main focus this week",
      "successMetric": "How to measure success",
      "totalTime": "Total time needed this week",
      "dailyTasks": [
        {
          "day": 1,
          "title": "Task title",
          "description": "Detailed task description",
          "timeEstimate": "Time needed",
          "resources": ["Resource 1", "Resource 2"]
        }
      ]
    }
  ]
}

CRITICAL: Return ONLY the JSON object. No explanatory text before or after. No markdown formatting. Just pure JSON.`;

  try {
    console.log('Calling Anthropic API...');
    
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
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    console.log('API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      
      return res.status(response.status).json({
        error: 'Failed to generate playbook',
        details: `API returned ${response.status}`,
        message: errorText.substring(0, 200)
      });
    }

    const data = await response.json();
    console.log('API response received, processing...');

    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error('Unexpected API response structure:', JSON.stringify(data));
      return res.status(500).json({
        error: 'Invalid API response structure',
        details: 'Missing content in response'
      });
    }

    let playbookText = data.content[0].text.trim();
    console.log('Raw playbook text length:', playbookText.length);
    console.log('First 200 chars:', playbookText.substring(0, 200));

    // Remove markdown code blocks if present
    if (playbookText.startsWith('```json')) {
      playbookText = playbookText.replace(/^```json\s*\n/, '').replace(/\n```$/, '');
    } else if (playbookText.startsWith('```')) {
      playbookText = playbookText.replace(/^```\s*\n/, '').replace(/\n```$/, '');
    }

    // Try to parse JSON
    let playbook;
    try {
      playbook = JSON.parse(playbookText);
      console.log('Successfully parsed playbook JSON');
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed text:', playbookText.substring(0, 500));
      
      return res.status(500).json({
        error: 'Failed to parse playbook',
        details: 'AI returned invalid JSON format',
        rawResponse: playbookText.substring(0, 300)
      });
    }

    // Validate playbook structure
    if (!playbook.businessName || !playbook.overview || !playbook.weeks || !Array.isArray(playbook.weeks)) {
      console.error('Invalid playbook structure:', Object.keys(playbook));
      return res.status(500).json({
        error: 'Invalid playbook structure',
        details: 'Missing required fields in generated playbook'
      });
    }

    console.log('Playbook generated successfully!');
    return res.status(200).json(playbook);

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error
    });
  }
}
