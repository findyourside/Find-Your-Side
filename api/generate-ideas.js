export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, limitType } = req.body; // limitType: 'ideas' or 'playbooks'

  // Email exemption for testing
  const EXEMPT_EMAIL = 'hello.findyourside@gmail.com';
  if (email === EXEMPT_EMAIL) {
    return res.status(200).json({
      canGenerate: true,
      remainingGenerations: 999,
      isExempt: true,
      message: 'Exempt account - unlimited access'
    });
  }

  // ===== LIMIT 1: IP ADDRESS - 10 requests per day =====
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const today = new Date().toISOString().split('T')[0];
  const ipRateLimitKey = `limit-ip-${clientIP}-${today}`;

  global.ipRateLimitStore = global.ipRateLimitStore || {};

  if (!global.ipRateLimitStore[ipRateLimitKey]) {
    global.ipRateLimitStore[ipRateLimitKey] = 0;
  }

  if (global.ipRateLimitStore[ipRateLimitKey] >= 10) {
    return res.status(429).json({
      canGenerate: false,
      remaining: 0,
      message: 'Daily IP limit reached (10 requests/day). Please try again tomorrow.',
      limitType: 'ip_daily',
      blocked: true
    });
  }

  // ===== LIMIT 2: EMAIL ADDRESS - Monthly limits =====
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const emailLimitKey = `limit-${email}-${currentMonth}-${limitType || 'ideas'}`;

  global.emailLimitStore = global.emailLimitStore || {};

  if (!global.emailLimitStore[emailLimitKey]) {
    global.emailLimitStore[emailLimitKey] = 0;
  }

  const monthlyLimit = 2; // 2 ideas OR 2 playbooks per month
  const used = global.emailLimitStore[emailLimitKey];
  const remaining = Math.max(0, monthlyLimit - used);

  if (used >= monthlyLimit) {
    const limitName = limitType === 'playbooks' ? 'action plans' : 'idea sets';
    return res.status(429).json({
      canGenerate: false,
      remaining: 0,
      message: `You've used up your free 2 ${limitName} this month. Come back next month for 2 more free ${limitName}.`,
      limitType: 'email_monthly',
      blocked: true,
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
    });
  }

  // All limits passed
  return res.status(200).json({
    canGenerate: true,
    remaining: remaining,
    used: used,
    monthlyLimit: monthlyLimit,
    message: `${remaining} ${limitType === 'playbooks' ? 'action plans' : 'idea sets'} remaining this month`
  });
}
