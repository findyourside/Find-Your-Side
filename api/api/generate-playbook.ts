import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.VITE_BOLT_DATABASE_URL!,
  process.env.VITE_BOLT_DATABASE_ANON_KEY!
);

interface PlaybookRequest {
  email: string;
  businessIdea: string;
  ideaDescription: string;
  timeAvailable: string;
  budget: string;
  skills: string[];
}

interface DailyTask {
  day: number;
  title: string;
  description: string;
  timeEstimate: string;
  resources: string[];
}

interface WeeklyPlan {
  week: number;
  theme: string;
  tasks: DailyTask[];
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data: PlaybookRequest = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    const { email, businessIdea, ideaDescription, timeAvailable, budget, skills } = data;

    if (!email || !businessIdea) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: emailLimit } = await supabase
      .from('playbooks')
      .select('id')
      .eq('email', email);

    if (emailLimit && emailLimit.length >= 2) {
      return res.status(429).json({
        error: 'Email limit reached',
        message: 'You have reached the maximum of 2 playbook generations per email.'
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: ipLimit } = await supabase
      .from('ip_rate_limits')
      .select('*')
      .eq('ip_address', clientIp)
      .eq('last_reset', today)
      .maybeSingle();

    if (ipLimit && ipLimit.playbooks_today >= 10) {
      return res.status(429).json({
        error: 'IP limit reached',
        message: 'Daily limit of 10 playbook generations per IP reached.'
      });
    }

    const { data: monthlySpend } = await supabase
      .from('api_usage')
      .select('total_spend')
      .eq('month', new Date().toISOString().slice(0, 7))
      .maybeSingle();

    if (monthlySpend && monthlySpend.total_spend >= 50) {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'Monthly API budget reached. Service will resume next month.'
      });
    }

    const prompt = `You are a business launch strategist. Create a detailed 30-day launch playbook for this business idea.

Business Idea: ${businessIdea}
Description: ${ideaDescription || 'Not provided'}
Time Available: ${timeAvailable || 'Not specified'}
Budget: ${budget || 'Not specified'}
Skills: ${skills?.join(', ') || 'Not specified'}

Create a 30-day launch plan organized into 4 weeks + 2 days. Each day should have:
- A specific, actionable task
- Detailed description (2-3 sentences explaining what to do and why)
- Time estimate (realistic, e.g., "2-3 hours", "30 minutes", "4-5 hours")
- Helpful resources (tools, websites, templates, or specific guidance)

Week themes should be:
Week 1: Foundation & Validation
Week 2: Setup & Infrastructure
Week 3: Marketing & Content
Week 4: Launch Preparation
Days 29-30: Launch & Initial Sales

Make tasks progressive, building on previous days. Be specific and actionable.

Return your response as a JSON array with exactly this structure:
[
  {
    "week": 1,
    "theme": "Foundation & Validation",
    "tasks": [
      {
        "day": 1,
        "title": "Task Title",
        "description": "Detailed description of what to do",
        "timeEstimate": "2-3 hours",
        "resources": ["Resource 1", "Resource 2"]
      }
    ]
  }
]

Respond ONLY with valid JSON array, no other text.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    let playbook: WeeklyPlan[];

    try {
      playbook = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    await supabase.from('playbooks').insert({
      email,
      business_idea: businessIdea,
      playbook_json: playbook,
    });

    if (ipLimit) {
      await supabase
        .from('ip_rate_limits')
        .update({ playbooks_today: ipLimit.playbooks_today + 1 })
        .eq('ip_address', clientIp)
        .eq('last_reset', today);
    } else {
      await supabase.from('ip_rate_limits').insert({
        ip_address: clientIp,
        ideas_today: 0,
        playbooks_today: 1,
        last_reset: today,
      });
    }

    const estimatedCost = 1.0;
    const currentMonth = new Date().toISOString().slice(0, 7);

    if (monthlySpend) {
      await supabase
        .from('api_usage')
        .update({
          total_spend: monthlySpend.total_spend + estimatedCost,
          last_updated: new Date().toISOString()
        })
        .eq('month', currentMonth);
    } else {
      await supabase.from('api_usage').insert({
        month: currentMonth,
        total_spend: estimatedCost,
        last_updated: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      playbook,
      playbooksRemaining: 2 - (emailLimit?.length || 0) - 1
    });

  } catch (error) {
    console.error('Error generating playbook:', error);
    return res.status(500).json({
      error: 'Failed to generate playbook',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
