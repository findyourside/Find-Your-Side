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
- Experience: ${answers.experience || 'beginner'}

Return ONLY valid JSON (no markdown):
{"ideas":[{"id":1,"name":"Idea Name","whyItFits":"One sentence why it fits","timeRequired":"2-4 weeks","firstStep":"One specific action"}]}

Create 10 unique ideas. Each field under 15 words.`;

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
        max_tokens: 2000,
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
        { id: 1, name: "Social Media Manager", whyItFits: `Combines your ${skills} skills with ${interests} interests`, timeRequired: "1-2 weeks", firstStep: "Interview 5 small business owners about their social media needs" },
        { id: 2, name: "Freelance Writer", whyItFits: "Leverages your communication abilities", timeRequired: "2-3 weeks", firstStep: "Write 3 sample articles in your interest area" },
        { id: 3, name: "Virtual Assistant", whyItFits: "Matches your organizational skills", timeRequired: "1 week", firstStep: "Create service packages and pricing" },
        { id: 4, name: "Pet Sitting Service", whyItFits: "Flexible schedule fitting your time commitment", timeRequired: "1 week", firstStep: "Post profile on Rover with availability" },
        { id: 5, name: "Online Tutoring", whyItFits: "Uses your subject knowledge", timeRequired: "2 weeks", firstStep: "Create tutor profile on Chegg or Wyzant" },
        { id: 6, name: "Graphic Design", whyItFits: "Applies creative skills", timeRequired: "2-3 weeks", firstStep: "Build 5 portfolio pieces on Canva" },
        { id: 7, name: "Content Creator", whyItFits: `Create content about ${interests}`, timeRequired: "4-8 weeks", firstStep: "Post 10 pieces and track engagement" },
        { id: 8, name: "Dropshipping Store", whyItFits: "Entrepreneurial business model", timeRequired: "3-4 weeks", firstStep: "Research 10 trending products" },
        { id: 9, name: "Email Newsletter", whyItFits: "Build audience in your interest area", timeRequired: "8-12 weeks", firstStep: "Write first 4 newsletter issues" },
        { id: 10, name: "Online Course", whyItFits: "Teach your expertise", timeRequired: "6-10 weeks", firstStep: "Outline 5 course modules" }
      ]
    });
  }
}
