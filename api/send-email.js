const BREVO_API_KEY = process.env.BREVO_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, playbook } = req.body;

  if (!email || !playbook) {
    return res.status(400).json({ error: 'Missing email or playbook' });
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Find Your Side', email: 'noreply@findyourside.com' },
        to: [{ email: email }],
        subject: `Your ${playbook.businessName} Launch Playbook`,
        htmlContent: `
          <h1>Your ${playbook.businessName} Playbook</h1>
          <p>${playbook.overview}</p>
          <h2>Your 30-Day Plan:</h2>
          ${playbook.weeks.map(w => `
            <h3>Week ${w.week}: ${w.title}</h3>
            <p><strong>Focus:</strong> ${w.focusArea}</p>
            <ul>${w.dailyTasks.map(t => `<li>Day ${t.day}: ${t.title}</li>`).join('')}</ul>
          `).join('')}
        `,
      }),
    });

    if (!response.ok) {
      throw new Error('Brevo API failed');
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
