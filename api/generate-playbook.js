const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Missing API key' });
  }

  // ===== LIMIT 1: IP ADDRESS - 10 requests per day =====
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const today = new Date().toISOString().split('T')[0];
  const ipRateLimitKey = `playbook-ip-${clientIP}-${today}`;

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

  // ===== LIMIT 2: EMAIL ADDRESS - 2 action plans per month =====
  const ideaFormData = req.body.ideaFormData;
  const userEmail = ideaFormData?.email || req.body.userEmail;

  if (userEmail) {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const emailLimitKey = `playbook-${userEmail}-${currentMonth}`;

    global.emailLimitStore = global.emailLimitStore || {};

    if (!global.emailLimitStore[emailLimitKey]) {
      global.emailLimitStore[emailLimitKey] = 0;
    }

    global.emailLimitStore[emailLimitKey]++;

    if (global.emailLimitStore[emailLimitKey] > 2) {
      return res.status(429).json({
        error: 'Monthly limit reached',
        message: "You've used up your free 2 action plans. Come back for 2 more free plans next month.",
        blocked: true,
        reason: 'email_limit',
        limitType: 'playbooks'
      });
    }
  }

  console.log('Request body:', JSON.stringify(req.body, null, 2));

  const idea = req.body.idea;
  let businessIdea;

  if (ideaFormData) {
    const businessType = ideaFormData.businessType === 'Other' 
      ? ideaFormData.businessTypeOther 
      : ideaFormData.businessType;
    businessIdea = `${businessType} business that ${ideaFormData.problemSolving} for ${ideaFormData.targetCustomer}`;
  } else if (idea?.name) {
    businessIdea = idea.name;
  } else {
    businessIdea = req.body.businessIdea || 'Unknown Business';
  }

  console.log('Extracted businessIdea:', businessIdea);

  const timeCommitment = req.body.timeCommitment || ideaFormData?.timeCommitment || '10 hours/week';

  if (!businessIdea || businessIdea === 'Unknown Business') {
    return res.status(400).json({ error: 'Missing business idea' });
  }

  const prompt = `Create a 4-week action plan for: ${businessIdea}
Time available: ${timeCommitment}
4 weeks, 5 tasks per week (20 days total). Each task description under 30 words.
Return ONLY valid JSON (no markdown):
{
  "businessName": "Name",
  "overview": "1 sentence about launch strategy",
  "weeks": [
    {
      "week": 1,
      "title": "Week title",
      "focusArea": "Key focus area for this week",
      "dailyTasks": [
        {"day": 1, "title": "Task title", "description": "Clear task description under 30 words"}
      ]
    }
  ]
}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

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
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      return res.status(500).json({ error: 'API failed', details: errorText.substring(0, 200) });
    }

    const data = await response.json();
    let text = data.content[0].text.trim();
    
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let playbook;
    try {
      playbook = JSON.parse(text);
    } catch (parseErr) {
      console.error('Parse error:', parseErr.message);
      return res.status(500).json({ error: 'Invalid JSON from API' });
    }

    if (!playbook.businessName || !playbook.overview || !playbook.weeks) {
      console.error('Invalid structure:', Object.keys(playbook));
      return res.status(500).json({ error: 'Invalid playbook structure' });
    }

    return res.status(200).json({ playbook });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: 'Internal error', message: error.message });
  }
}
