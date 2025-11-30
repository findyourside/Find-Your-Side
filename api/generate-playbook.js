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

  console.log('Request body:', JSON.stringify(req.body, null, 2));

  const ideaFormData = req.body.ideaFormData;
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
  const budget = req.body.budget || ideaFormData?.budget || '';
  const skillsExperience = req.body.skillsExperience || ideaFormData?.skillsExperience || '';

  if (!businessIdea || businessIdea === 'Unknown Business') {
    return res.status(400).json({ error: 'Missing business idea' });
  }

  const prompt = `Create a 4-week launch playbook for: ${businessIdea}
Time commitment: ${timeCommitment}
${budget ? `Budget: ${budget}` : ''}
${skillsExperience ? `Skills/Experience: ${skillsExperience}` : ''}

Generate exactly 4 weeks with 5 daily tasks per week (20 tasks total, days 1-20).
Each task needs: day number, title, detailed description (under 100 words), time estimate, and 2-3 resources.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "businessName": "A short, creative business name",
  "overview": "A 1-2 sentence overview of the launch strategy tailored to this specific business",
  "weeks": [
    {
      "week": 1,
      "title": "Week 1 title",
      "focusArea": "What this week focuses on",
      "successMetric": "How to measure success this week",
      "totalTime": "Total hours for the week",
      "dailyTasks": [
        {"day": 1, "title": "Task title", "description": "Detailed description under 100 words", "timeEstimate": "X hours", "resources": ["Resource 1", "Resource 2", "Resource 3"]}
      ]
    }
  ]
}

Important: Make the overview personalized to "${businessIdea}" - not generic. Use actual details about this specific business type.`;

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
        max_tokens: 3500,
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

    const pdfData = generatePDFData(playbook);

    return res.status(200).json({ playbook, pdfData });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: 'Internal error', message: error.message });
  }
}

function generatePDFData(playbook) {
  let content = `${playbook.businessName}\n\n`;
  content += `${playbook.overview}\n\n`;
  
  playbook.weeks.forEach(week => {
    content += `\nWEEK ${week.week}: ${week.title}\n`;
    content += `Focus: ${week.focusArea}\n`;
    content += `Success Metric: ${week.successMetric}\n`;
    content += `Total Time: ${week.totalTime}\n\n`;
    
    week.dailyTasks.forEach(task => {
      content += `Day ${task.day}: ${task.title}\n`;
      content += `${task.description}\n`;
      content += `Time: ${task.timeEstimate}\n`;
      content += `Resources: ${task.resources.join(', ')}\n\n`;
    });
  });
  
  return content;
}
