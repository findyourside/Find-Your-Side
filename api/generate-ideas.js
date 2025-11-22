const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const answers = req.body.quizData || req.body;

  if (!answers?.interests?.length || !answers?.skills?.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const interests = Array.isArray(answers.interests) ? answers.interests.join(', ') : answers.interests;
  const skills = Array.isArray(answers.skills) ? answers.skills.join(', ') : answers.skills;

  const prompt = `Generate exactly 10 business ideas. For EACH idea provide:
1. name: specific business name
2. whyMatch: 1 sentence explaining why this matches their skills/interests (${interests}, ${skills})
3. timeToRevenue: realistic timeline like "1-2 weeks" or "3-4 weeks"
4. firstStep: ONE specific action to validate this idea (e.g., "Interview 5 potential customers", "Create a landing page")

Return ONLY this JSON format, no markdown:
{"ideas":[{"id":1,"name":"Social Media Manager","whyMatch":"Uses your ${skills} skills","timeToRevenue":"1-2 weeks","firstStep":"Interview 5 small business owners about social media struggles"},{"id":2,"name":"Freelance Writer","whyMatch":"Matches your communication skills","timeToRevenue":"2-3 weeks","firstStep":"Write 3 sample articles and post on Medium"},{"id":3,"name":"Virtual Assistant","whyMatch":"Your organizational skills are perfect","timeToRevenue":"1 week","firstStep":"Create a service package and price list"},{"id":4,"name":"Dog Walking Service","whyMatch":"Flexible work matching your schedule","timeToRevenue":"1 week","firstStep":"Post on Rover and Wag with your availability"},{"id":5,"name":"Online Tutoring","whyMatch":"Your teaching ability","timeToRevenue":"2 weeks","firstStep":"Create profile on Tutor.com or Chegg"},{"id":6,"name":"Graphic Design","whyMatch":"Uses your creative skills","timeToRevenue":"2-3 weeks","firstStep":"Create 5 portfolio pieces on Canva"},{"id":7,"name":"Content Creator","whyMatch":"Your communication talent","timeToRevenue":"4-8 weeks","firstStep":"Publish 10 posts and track engagement"},{"id":8,"name":"Dropshipping","whyMatch":"Business builder mindset","timeToRevenue":"3-4 weeks","firstStep":"Research 10 trending products on Etsy"},{"id":9,"name":"Email Newsletter","whyMatch":"Your writing and audience skills","timeToRevenue":"8-12 weeks","firstStep":"Write first 4 newsletter issues"},{"id":10,"name":"Online Course","whyMatch":"Your expertise and teaching","timeToRevenue":"6-10 weeks","firstStep":"Outline 5 course modules"}]}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(500).json({ error: 'API request failed' });
    }

    const data = await response.json();
    const text = data.content[0].text.trim();
    
    let jsonText = text;
    if (text.includes('```')) {
      jsonText = text.split('```')[1].replace('json\n', '').trim();
    }

    const ideas = JSON.parse(jsonText);
    
    if (!ideas.ideas || !Array.isArray(ideas.ideas)) {
      return res.status(200).json({ 
        ideas: [
          { id: 1, name: "Social Media Manager", whyMatch: "Uses your marketing skills", timeToRevenue: "1-2 weeks", firstStep: "Interview 5 small business owners" },
          { id: 2, name: "Freelance Writing", whyMatch: "Matches your communication abilities", timeToRevenue: "2-3 weeks", firstStep: "Write 3 sample articles and post on Medium" },
          { id: 3, name: "Virtual Assistant", whyMatch: "Your organizational skills shine", timeToRevenue: "1 week", firstStep: "Create service package and pricing" },
          { id: 4, name: "Pet Sitting", whyMatch: "Flexible schedule work", timeToRevenue: "1 week", firstStep: "Post on Rover with your availability" },
          { id: 5, name: "Online Tutoring", whyMatch: "Your teaching ability", timeToRevenue: "2 weeks", firstStep: "Create profile on Chegg or Tutor.com" },
          { id: 6, name: "Graphic Design", whyMatch: "Uses creative skills", timeToRevenue: "2-3 weeks", firstStep: "Create 5 portfolio pieces on Canva" },
          { id: 7, name: "Content Creator", whyMatch: "Your communication talent", timeToRevenue: "4-8 weeks", firstStep: "Publish 10 posts and track engagement" },
          { id: 8, name: "Dropshipping Store", whyMatch: "Business builder mindset", timeToRevenue: "3-4 weeks", firstStep: "Research 10 trending products on Etsy" },
          { id: 9, name: "Email Newsletter", whyMatch: "Your writing and audience skills", timeToRevenue: "8-12 weeks", firstStep: "Write first 4 newsletter issues" },
          { id: 10, name: "Online Course", whyMatch: "Your expertise and teaching", timeToRevenue: "6-10 weeks", firstStep: "Outline 5 course modules" }
        ]
      });
    }

    return res.status(200).json(ideas);

  } catch (error) {
    console.error('Error:', error.message);
    // Fallback with correct field names
    return res.status(200).json({
      ideas: [
        { id: 1, name: "Social Media Manager", whyMatch: "Uses your marketing skills", timeToRevenue: "1-2 weeks", firstStep: "Interview 5 small business owners about their social media needs" },
        { id: 2, name: "Freelance Writer", whyMatch: "Matches your communication abilities", timeToRevenue: "2-3 weeks", firstStep: "Write 3 sample articles and post on Medium" },
        { id: 3, name: "Virtual Assistant", whyMatch: "Your organizational skills are perfect", timeToRevenue: "1 week", firstStep: "Create a service package and set pricing" },
        { id: 4, name: "Pet Sitting Service", whyMatch: "Flexible schedule work", timeToRevenue: "1 week", firstStep: "Post on Rover with your availability" },
        { id: 5, name: "Online Tutoring", whyMatch: "Your teaching ability", timeToRevenue: "2 weeks", firstStep: "Create profile on Chegg or Tutor.com" },
        { id: 6, name: "Graphic Design", whyMatch: "Uses your creative skills", timeToRevenue: "2-3 weeks", firstStep: "Create 5 portfolio pieces on Canva" },
        { id: 7, name: "Content Creator", whyMatch: "Your communication talent", timeToRevenue: "4-8 weeks", firstStep: "Publish 10 posts and track engagement metrics" },
        { id: 8, name: "Dropshipping Store", whyMatch: "Business builder mindset", timeToRevenue: "3-4 weeks", firstStep: "Research 10 trending products on Etsy" },
        { id: 9, name: "Email Newsletter", whyMatch: "Your writing and audience skills", timeToRevenue: "8-12 weeks", firstStep: "Write first 4 newsletter issues" },
        { id: 10, name: "Online Course", whyMatch: "Your expertise and teaching ability", timeToRevenue: "6-10 weeks", firstStep: "Outline 5 course modules and topics" }
      ]
    });
  }
}
