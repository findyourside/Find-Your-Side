import type { VercelRequest, VercelResponse } from '@vercel/node';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface QuizAnswers {
  interests: string[];
  skills: string[];
  timeCommitment: string;
  budget: string;
  goals: string[];
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

  const answers: QuizAnswers = req.body;

  if (!answers.interests || !answers.skills || !answers.timeCommitment || !answers.budget || !answers.goals) {
    return res.status(400).json({ error: 'Missing required quiz answers' });
  }

  const prompt = `You are an expert business consultant. Based on these user inputs, generate 10 specific, actionable business ideas.

User Profile:
- Interests: ${answers.interests.join(', ')}
- Skills: ${answers.skills.join(', ')}
- Time Commitment: ${answers.timeCommitment}
- Budget: ${answers.budget}
- Goals: ${answers.goals.join(', ')}

Generate 10 diverse business ideas that:
1. Match their interests and skills
2. Are realistic given their time and budget
3. Align with their goals
4. Range from quick-start to more complex
5. Include both online and offline options where applicable

For each idea provide:
- A catchy, specific business name
- Clear description (2-3 sentences)
- Why it matches their profile
- Realistic startup costs
- Time to first revenue
- Difficulty level (Beginner/Intermediate/Advanced)

Return ONLY valid JSON in this exact format (no markdown, no code blocks, just pure JSON):
{
  "ideas": [
    {
      "id": 1,
      "name": "Business Name",
      "description": "Clear description of the business",
      "whyMatch": "Why this matches their profile",
      "startupCost": "$X - $Y or specific amount",
      "timeToRevenue": "X weeks/months",
      "difficulty": "Beginner|Intermediate|Advanced",
      "category": "Service|Product|Digital|Consulting"
    }
  ]
}

CRITICAL: Return ONLY the JSON object. No explanatory text before or after. No markdown formatting. Just pure JSON with all 10 ideas.`;

  try {
    console.log('Calling Anthropic API for ideas generation...');
    
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
        error: 'Failed to generate business ideas',
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

    let ideasText = data.content[0].text.trim();
    console.log('Raw ideas text length:', ideasText.length);
    console.log('First 200 chars:', ideasText.substring(0, 200));

    // Remove markdown code blocks if present
    if (ideasText.startsWith('```json')) {
      ideasText = ideasText.replace(/^```json\s*\n/, '').replace(/\n```$/, '');
    } else if (ideasText.startsWith('```')) {
      ideasText = ideasText.replace(/^```\s*\n/, '').replace(/\n```$/, '');
    }

    // Try to parse JSON
    let ideas;
    try {
      ideas = JSON.parse(ideasText);
      console.log('Successfully parsed ideas JSON');
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed text:', ideasText.substring(0, 500));
      
      return res.status(500).json({
        error: 'Failed to parse business ideas',
        details: 'AI returned invalid JSON format',
        rawResponse: ideasText.substring(0, 300)
      });
    }

    // Validate ideas structure
    if (!ideas.ideas || !Array.isArray(ideas.ideas)) {
      console.error('Invalid ideas structure:', Object.keys(ideas));
      return res.status(500).json({
        error: 'Invalid ideas structure',
        details: 'Missing or invalid ideas array in response'
      });
    }

    if (ideas.ideas.length === 0) {
      console.error('No ideas generated');
      return res.status(500).json({
        error: 'No ideas generated',
        details: 'API returned empty ideas array'
      });
    }

    console.log(`Successfully generated ${ideas.ideas.length} business ideas!`);
    return res.status(200).json(ideas);

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error
    });
  }
}
