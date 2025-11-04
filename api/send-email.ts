import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_BOLT_DATABASE_URL!,
  process.env.VITE_BOLT_DATABASE_ANON_KEY!
);

interface WeeklyPlan {
  week: number;
  theme: string;
  tasks: Array<{
    day: number;
    title: string;
    description: string;
    timeEstimate: string;
    resources: string[];
  }>;
}

function generatePlaybookHTML(businessIdea: string, playbook: WeeklyPlan[]): string {
  const tasksHTML = playbook.map(week => `
    <div style="margin-bottom: 32px; border-left: 4px solid #3b82f6; padding-left: 16px;">
      <h2 style="color: #1e40af; font-size: 20px; margin-bottom: 8px;">
        Week ${week.week}: ${week.theme}
      </h2>
      ${week.tasks.map(task => `
        <div style="margin-bottom: 24px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="background: #3b82f6; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600; margin-right: 12px;">
              Day ${task.day}
            </span>
            <h3 style="color: #111827; font-size: 16px; font-weight: 600; margin: 0;">
              ${task.title}
            </h3>
          </div>
          <p style="color: #4b5563; margin: 8px 0; line-height: 1.6;">
            ${task.description}
          </p>
          <div style="display: flex; align-items: center; margin-top: 12px;">
            <span style="color: #6b7280; font-size: 14px; margin-right: 16px;">
              ⏱️ ${task.timeEstimate}
            </span>
          </div>
          ${task.resources.length > 0 ? `
            <div style="margin-top: 12px;">
              <strong style="color: #374151; font-size: 14px;">Resources:</strong>
              <ul style="margin: 4px 0; padding-left: 20px; color: #6b7280;">
                ${task.resources.map(resource => `<li style="margin: 4px 0;">${resource}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your 30-Day Launch Playbook</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 12px; text-align: center; margin-bottom: 32px;">
          <h1 style="color: white; font-size: 32px; margin: 0 0 12px 0;">
            🚀 Your 30-Day Launch Playbook
          </h1>
          <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0;">
            ${businessIdea}
          </p>
        </div>

        <div style="background: white; padding: 24px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827; font-size: 20px; margin-top: 0;">Welcome to Your Journey! 🎯</h2>
          <p style="color: #4b5563; margin: 12px 0;">
            This playbook will guide you through the next 30 days to launch your business. Each day builds on the previous one, so follow along step by step.
          </p>
          <p style="color: #4b5563; margin: 12px 0;">
            <strong>Tips for Success:</strong>
          </p>
          <ul style="color: #4b5563; margin: 8px 0; padding-left: 20px;">
            <li>Set aside dedicated time each day</li>
            <li>Don't skip steps - each one is important</li>
            <li>Adjust time estimates based on your schedule</li>
            <li>Use the resources provided - they're there to help</li>
            <li>Track your progress and celebrate small wins</li>
          </ul>
        </div>

        ${tasksHTML}

        <div style="background: #f0fdf4; padding: 24px; border-radius: 8px; margin-top: 32px; border: 1px solid #86efac;">
          <h2 style="color: #15803d; font-size: 20px; margin-top: 0;">🎉 Ready to Launch!</h2>
          <p style="color: #166534; margin: 12px 0;">
            You've got this! Remember, the most important step is Day 1. Start today and build momentum.
          </p>
          <p style="color: #166534; margin: 12px 0;">
            Good luck on your journey!
          </p>
          <p style="color: #166534; margin: 12px 0; font-style: italic;">
            - The Find Your Side Team
          </p>
        </div>

        <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 32px;">
          <p>Find Your Side - Idea to Execution</p>
          <p>Need help? Reply to this email anytime.</p>
        </div>
      </body>
    </html>
  `;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, businessIdea, playbook, optInDay1 } = req.body;

    if (!email || !businessIdea || !playbook) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const htmlContent = generatePlaybookHTML(businessIdea, playbook);

    // Send email via Loops.so API
    const response = await fetch('https://app.loops.so/api/v1/transactional', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        transactionalId: 'playbook-delivery', // You'll create this in Loops dashboard
        dataVariables: {
          businessIdea: businessIdea,
          playbookHtml: htmlContent,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Loops error:', error);
      return res.status(500).json({ error: 'Failed to send email', details: error });
    }

    const data = await response.json();

    if (optInDay1) {
      await supabase.from('accountability_optins').insert({
        email,
        opted_in: true,
        reminder_day: 1,
      });
    }

    return res.status(200).json({ success: true, messageId: data.id });

  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({
      error: 'Failed to send email',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
