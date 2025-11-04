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

interface QuizResponse {
  email: string;
  skills: string[];
  timeAvailable: string;
  budget: string;
  interests: string[];
  goal: string;
  experienceLevel: string;
}

interface BusinessIdea {
  name: string;
  description: string;
  whyItFits: string;
  startupCost: string;
  timeToRevenue: string;
  incomePotential: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const quizData: QuizResponse = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    const { email, skills, timeAvailable, budget, interests, goal, experienceLevel } = quizData;

    if (!email || !skills || !timeAvailable || !budget || !interests || !goal || !experienceLevel) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: emailLimit } = await supabase
      .from('idea_generations')
      .select('id')
      .eq('email', email);

    if (emailLimit && emailLimit.length >= 2) {
      return res.status(429).json({
        error: 'Email limit reached',
        message: 'You have reached the maximum of 2 idea generations per email.'
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: ipLimit } = await supabase
      .from('ip_rate_limits')
      .select('*')
      .eq('ip_address', clientIp)
      .eq('last_reset', today)
      .maybeSingle();

    if (ipLimit && ipLimit.ideas_today >= 20) {
      return res.status(429).json({
        error: 'IP limit reached',
        message: 'Daily limit of 20 idea generations per IP reached.'
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

    const prompt = `You are a business idea generator. Based on the user's profile, generate 5 specific, actionable business ideas.

User Profile:
- Skills: ${skills.join(', ')}
- Time Available: ${timeAvailable}
- Budget: ${budget}
- Interests: ${interests.join(', ')}
- Goal: ${goal}
- Experience Level: ${experienceLevel}

Generate 5 business ideas that match this profile. Each idea should be:
1. Specific and actionable (not vague concepts)
2. Realistic given their constraints
3. Aligned with their skills and interests
4. Achievable with their time and budget

Return your response as a JSON array with exactly this structure:
[
  {
    "name": "Business Name",
    "description": "2-3 sentence description of the business",
    "whyItFits": "Why this matches their profile (skills, interests, time, budget)",
    "startupCost": "$X - $Y or specific amount",
    "timeToRevenue": "X weeks/months",
    "incomePotential": "$X - $Y per month potential"
  }
]

Respond ONLY with valid JSON array, no other text.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    let ideas: BusinessIdea[];

    try {
      ideas = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    await supabase.from('quiz_responses').insert({
      email,
      skills,
      time_available: timeAvailable,
      budget,
      interests,
      goal,
      experience_level: experienceLevel,
    });

    await supabase.from('idea_generations').insert({
      email,
      ideas_json: ideas,
    });

    if (ipLimit) {
      await supabase
        .from('ip_rate_limits')
        .update({ ideas_today: ipLimit.ideas_today + 1 })
        .eq('ip_address', clientIp)
        .eq('last_reset', today);
    } else {
      await supabase.from('ip_rate_limits').insert({
        ip_address: clientIp,
        ideas_today: 1,
        playbooks_today: 0,
        last_reset: today,
      });
    }

    const estimatedCost = 0.50;
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
      ideas,
      generationsRemaining: 2 - (emailLimit?.length || 0) - 1
    });

  } catch (error) {
    console.error('Error generating ideas:', error);
    return res.status(500).json({
      error: 'Failed to generate ideas',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
