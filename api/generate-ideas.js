const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ 
      error: 'Missing API key',
      message: 'ANTHROPIC_API_KEY not set in Vercel environment variables'
    });
  }

  const answers = req.body.quizData || req.body;

  if (!answers?.interests?.length || !answers?.skills?.length) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      interests: answers?.interests?.length || 0,
      skills: answers?.skills?.length || 0
    });
  }

  const interests = Array.isArray(answers.interests) ? answers.interests.join(', ') : answers.interests;
  const skills = Array.isArray(answers.skills) ? answers.skills.join(', ') : answers.skills;
  const goals = Array.isArray(answers.goal) ? answers.goal.join(', ') : (answers.goal || 'income');

  const prompt = `Generate 10 personalized business ideas based on this profile:
- Interests: ${interests}
- Skills: ${skills}
- Time available: ${answers.timeCommitment}
- Goals: ${goals}
- Experience level: ${answers.experience || 'beginner'}

Return ONLY valid JSON (no markdown, no code blocks):
{"ideas":[{"id":1,"name":"Specific business name","whyMatch":"One sentence explaining why this fits their interests and skills","timeToRevenue":"X weeks or X months","firstStep":"One specific action to validate this idea"}]}

Create 10 unique ideas personalized to their profile. Each idea must have all 4 fields: id, name, whyMatch, timeToRevenue, firstStep.`;

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
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: 'API request failed',
        details: errorText.substring(0, 300)
      });
    }

    const data = await response.json();
    let text = data.content[0].text.trim();
    
    // Remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const ideas = JSON.parse(text);

    if (!ideas.ideas || !Array.isArray(ideas.ideas) || ideas.ideas.length === 0) {
      throw new Error('Invalid ideas structure');
    }

    return res.status(200).json(ideas);

  } catch (error) {
    console.error('Error:', error.message);
    
    // Return fallback with personalized context
    return res.status(200).json({
      ideas: [
        { id: 1, name: "Social Media Manager", whyMatch: `Combines your ${skills} skills with ${interests} interests`, timeToRevenue: "1-2 weeks", firstStep: "Interview 5 small business owners about their social media needs" },
        { id: 2, name: "Freelance Writer", whyMatch: "Leverages your communication abilities", timeToRevenue: "2-3 weeks", firstStep: "Write 3 sample articles in your interest area" },
        { id: 3, name: "Virtual Assistant", whyMatch: "Matches your organizational skills", timeToRevenue: "1 week", firstStep: "Create service packages and pricing" },
        { id: 4, name: "Pet Sitting Service", whyMatch: "Flexible schedule fitting your time commitment", timeToRevenue: "1 week", firstStep: "Post profile on Rover with availability" },
        { id: 5, name: "Online Tutoring", whyMatch: "Uses your subject knowledge", timeToRevenue: "2 weeks", firstStep: "Create tutor profile on Chegg or Wyzant" },
        { id: 6, name: "Graphic Design", whyMatch: "Applies creative skills", timeToRevenue: "2-3 weeks", firstStep: "Build 5 portfolio pieces on Canva" },
        { id: 7, name: "Content Creator", whyMatch: `Create content about ${interests}`, timeToRevenue: "4-8 weeks", firstStep: "Post 10 pieces and track engagement" },
        { id: 8, name: "Dropshipping Store", whyMatch: "Entrepreneurial business model", timeToRevenue: "3-4 weeks", firstStep: "Research 10 trending products" },
        { id: 9, name: "Email Newsletter", whyMatch: "Build audience in your interest area", timeToRevenue: "8-12 weeks", firstStep: "Write first 4 newsletter issues" },
        { id: 10, name: "Online Course", whyMatch: "Teach your expertise", timeToRevenue: "6-10 weeks", firstStep: "Outline 5 course modules" }
      ]
    });
  }
}
