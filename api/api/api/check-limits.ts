import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_BOLT_DATABASE_URL!,
  process.env.VITE_BOLT_DATABASE_ANON_KEY!
);

interface LimitCheckResult {
  ideas: {
    allowed: boolean;
    remaining: number;
    total: number;
  };
  playbooks: {
    allowed: boolean;
    remaining: number;
    total: number;
  };
  ipLimits: {
    ideasToday: number;
    playbooksToday: number;
  };
  monthlyBudget: {
    spent: number;
    remaining: number;
    limit: number;
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { data: ideaGenerations } = await supabase
      .from('idea_generations')
      .select('id')
      .eq('email', email);

    const ideasCount = ideaGenerations?.length || 0;
    const ideasRemaining = Math.max(0, 2 - ideasCount);

    const { data: playbookGenerations } = await supabase
      .from('playbooks')
      .select('id')
      .eq('email', email);

    const playbooksCount = playbookGenerations?.length || 0;
    const playbooksRemaining = Math.max(0, 2 - playbooksCount);

    const today = new Date().toISOString().split('T')[0];
    const { data: ipLimit } = await supabase
      .from('ip_rate_limits')
      .select('*')
      .eq('ip_address', clientIp)
      .eq('last_reset', today)
      .maybeSingle();

    const ideasToday = ipLimit?.ideas_today || 0;
    const playbooksToday = ipLimit?.playbooks_today || 0;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: monthlySpend } = await supabase
      .from('api_usage')
      .select('total_spend')
      .eq('month', currentMonth)
      .maybeSingle();

    const spent = monthlySpend?.total_spend || 0;
    const monthlyLimit = 50;
    const budgetRemaining = Math.max(0, monthlyLimit - spent);

    const result: LimitCheckResult = {
      ideas: {
        allowed: ideasRemaining > 0 && ideasToday < 20 && budgetRemaining > 0,
        remaining: ideasRemaining,
        total: 2,
      },
      playbooks: {
        allowed: playbooksRemaining > 0 && playbooksToday < 10 && budgetRemaining > 0,
        remaining: playbooksRemaining,
        total: 2,
      },
      ipLimits: {
        ideasToday,
        playbooksToday,
      },
      monthlyBudget: {
        spent: parseFloat(spent.toFixed(2)),
        remaining: parseFloat(budgetRemaining.toFixed(2)),
        limit: monthlyLimit,
      },
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error checking limits:', error);
    return res.status(500).json({
      error: 'Failed to check limits',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
