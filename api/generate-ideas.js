const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // DEBUG: Check if API key exists
  if (!ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is missing from environment');
    return res.status(500).json({ 
      error: 'Missing API key',
      message: 'ANTHROPIC_API_KEY not set in Vercel environment variables',
      received: Object.keys(process.env).filter(k => k.includes('ANTHROPIC'))
    });
  }

  console.log('API Key found, length:', ANTHROPIC_API_KEY.length);
  console.log('API Key starts with:', ANTHROPIC_API_KEY.substring(0, 20));

  const answers = req.body.quizData || req.body;

  console.log('Received answers:', Object.keys(answers));

  if (!answers?.interests?.length || !answers?.skills?.length) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      interests: answers?.interests?.length || 0,
      skills: answers?.skills?.length || 0
    });
  }

  const prompt = `Generate exactly 10 business ideas. Return ONLY this JSON format, no markdown:
{"ideas":[{"id":1,"name":"Social Media Manager","whyMatch":"Uses your marketing skills","timeToRevenue":"1-2 weeks","firstStep":"Interview 5 small business owners"},{"id":2,"name":"Freelance Writer","whyMatch":"Matches your communication abilities","timeToRevenue":"2-3 weeks","firstStep":"Write 3 sample articles and post on Medium"},{"id":3,"name":"Virtual Assistant","whyMatch":"Your organizational skills are perfect","timeToRevenue":"1 week","firstStep":"Create a service package and set pricing"},{"id":4,"name":"Pet Sitting Service","whyMatch":"Flexible schedule work","timeToRevenue":"1 week","firstStep":"Post on Rover with your availability"},{"id":5,"name":"Online Tutoring","whyMatch":"Your teaching ability","timeToRevenue":"2 weeks","firstStep":"Create profile on Chegg or Tutor.com"},{"id":6,"name":"Graphic Design","whyMatch":"Uses your creative skills","timeToRevenue":"2-3 weeks","firstStep":"Create 5 portfolio pieces on Canva"},{"id":7,"name":"Content Creator","whyMatch":"Your communication talent","timeToRevenue":"4-8 weeks","firstStep":"Publish 10 posts and track engagement"},{"id":8,"name":"Dropshipping Store","whyMatch":"Business builder mindset","timeToRevenue":"3-4 weeks","firstStep":"Research 10 trending products on Etsy"},{"id":9,"name":"Email Newsletter","whyMatch":"Your writing and audience skills","timeToRevenue":"8-12 weeks","firstStep":"Write first 4 newsletter issues"},{"id":10,"name":"Online Course","whyMatch":"Your expertise and teaching","timeToRevenue":"6-10 weeks","firstStep":"Outline 5 course modules"}]}`;

  try {
    console.log('Making fetch request to Anthropic API...');

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
    });

    console.log('API response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error text:', errorText.substring(0, 500));
      
      return res.status(response.status).json({ 
        error: 'API request failed',
        status: response.status,
        details: errorText.substring(0, 300)
      });
    }

    const data = await response.json();
    console.log('API response received');

    const text = data.content[0].text.trim();
    console.log('Response text length:', text.length);

    let jsonText = text;
    if (text.includes('```')) {
      jsonText = text.split('```')[1].replace('json\n', '').trim();
    }

    const ideas = JSON.parse(jsonText);
    console.log('Ideas parsed successfully, count:', ideas.ideas?.length);

    return res.status(200).json(ideas);

  } catch (error) {
    console.error('Catch block error:', error.message);
    console.error('Error stack:', error.stack);
    
    // Return fallback
    return res.status(200).json({
      ideas: [
        { id: 1, name: "Social Media Manager", whyMatch: "Uses your marketing skills", timeToRevenue: "1-2 weeks", firstStep: "Interview 5 small business owners" },
        { id: 2, name: "Freelance Writer", whyMatch: "Matches your communication abilities", timeToRevenue: "2-3 weeks", firstStep: "Write 3 sample articles and post on Medium" },
        { id: 3, name: "Virtual Assistant", whyMatch: "Your organizational skills are perfect", timeToRevenue: "1 week", firstStep: "Create a service package and set pricing" },
        { id: 4, name: "Pet Sitting Service", whyMatch: "Flexible schedule work", timeToRevenue: "1 week", firstStep: "Post on Rover with your availability" },
        { id: 5, name: "Online Tutoring", whyMatch: "Your teaching ability", timeToRevenue: "2 weeks", firstStep: "Create profile on Chegg or Tutor.com" },
        { id: 6, name: "Graphic Design", whyMatch: "Uses your creative skills", timeToRevenue: "2-3 weeks", firstStep: "Create 5 portfolio pieces on Canva" },
        { id: 7, name: "Content Creator", whyMatch: "Your communication talent", timeToRevenue: "4-8 weeks", firstStep: "Publish 10 posts and track engagement" },
        { id: 8, name: "Dropshipping Store", whyMatch: "Business builder mindset", timeToRevenue: "3-4 weeks", firstStep: "Research 10 trending products on Etsy" },
        { id: 9, name: "Email Newsletter", whyMatch: "Your writing and audience skills", timeToRevenue: "8-12 weeks", firstStep: "Write first 4 newsletter issues" },
        { id: 10, name: "Online Course", whyMatch: "Your expertise and teaching", timeToRevenue: "6-10 weeks", firstStep: "Outline 5 course modules" }
      ]
    });
  }
}
