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
  const userEmail = answers?.email;

  // ===== LIMIT 1: IP ADDRESS - 10 requests per day =====
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const today = new Date().toISOString().split('T')[0];
  const ipRateLimitKey = `ideas-ip-${clientIP}-${today}`;

  global.ipRateLimitStore = global.ipRateLimitStore || {};

  if (!global.ipRateLimitStore[ipRateLimitKey]) {
    global.ipRateLimitStore[ipRateLimitKey] = 0;
  }

  global.ipRateLimitStore[ipRateLimitKey]++;

  if (global.ipRateLimitStore[ipRateLimitKey] > 10) {
    return res.status(429).json({ 
      error: 'Daily limit reached',
      message: 'Too many requests from this location. Please try again tomorrow.',
      blocked: true,
      reason: 'ip_limit'
    });
  }

  // ===== LIMIT 2: EMAIL ADDRESS - 2 idea sets per month =====
  // Exempt email gets unlimited access
  const EXEMPT_EMAIL = 'hello.findyourside.gmail.com';
  
  if (userEmail && userEmail !== EXEMPT_EMAIL) {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const emailLimitKey = `ideas-${userEmail}-${currentMonth}`;

    global.emailLimitStore = global.emailLimitStore || {};

    if (!global.emailLimitStore[emailLimitKey]) {
      global.emailLimitStore[emailLimitKey] = 0;
    }

    global.emailLimitStore[emailLimitKey]++;

    if (global.emailLimitStore[emailLimitKey] > 2) {
      return res.status(429).json({
        error: 'Monthly limit reached',
        message: "You've used up your free 2 personalized idea sets. Come back next month for 2 more free sets.",
        blocked: true,
        reason: 'email_limit',
        limitType: 'ideas'
      });
    }
  }

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

  const prompt = `Generate 5 personalized business ideas based on this profile:
- Interests: ${interests}
- Skills: ${skills}
- Time available: ${answers.timeCommitment}
- Goals: ${goals}
- Experience: ${answers.experience || 'beginner'}

Return ONLY valid JSON (no markdown):
{"ideas":[{"id":1,"name":"Idea Name","whyItFits":"One sentence why it fits","timeRequired":"2-4 weeks","firstStep":"One specific action"}]}

Create 5 unique ideas. Each field under 15 words.`;

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
      console.error('Anthropic API error:', errorText);
      return res.status(response.status).json({ 
        error: 'API request failed',
        details: errorText.substring(0, 300)
      });
    }

    const data = await response.json();
    let text = data.content[0].text.trim();
    
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const ideas = JSON.parse(text);

    if (!ideas.ideas || !Array.isArray(ideas.ideas) || ideas.ideas.length === 0) {
      throw new Error('Invalid ideas structure');
    }

    // Save quiz response to Airtable
    try {
      await fetch(`${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/save-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quiz',
          email: userEmail,
          data: answers
        }),
      });
    } catch (err) {
      console.error('Error saving quiz data:', err);
      // Don't fail the request if saving fails
    }

    return res.status(200).json(ideas);

  } catch (error) {
    console.error('Error:', error.message);
    
    // Return fallback ideas on error
    return res.status(200).json({
      ideas: [
        { id: 1, name: "Social Media Manager", whyItFits: `Combines your ${skills} skills with ${interests} interests`, timeRequired: "1-2 weeks", firstStep: "Interview 5 small business owners about their social media needs" },
        { id: 2, name: "Freelance Writer", whyItFits: "Leverages your communication abilities", timeRequired: "2-3 weeks", firstStep: "Write 3 sample articles in your interest area" },
        { id: 3, name: "Virtual Assistant", whyItFits: "Matches your organizational skills", timeRequired: "1 week", firstStep: "Create service packages and pricing" },
        { id: 4, name: "Pet Sitting Service", whyItFits: "Flexible schedule fitting your time commitment", timeRequired: "1 week", firstStep: "Post profile on Rover with availability" },
        { id: 5, name: "Online Tutoring", whyItFits: "Uses your subject knowledge", timeRequired: "2 weeks", firstStep: "Create tutor profile on Chegg or Wyzant" }
      ]
    });
  }
}
