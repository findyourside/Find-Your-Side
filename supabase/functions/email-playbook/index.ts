import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DailyTask {
  day: string;
  task: string;
  timeEstimate?: string;
}

interface Week {
  week: number;
  title: string;
  objectives: string[];
  dailyTasks: DailyTask[];
  milestones: string[];
  resources: string[];
  metrics: string[];
}

interface Playbook {
  businessName: string;
  overview: string;
  weeks: Week[];
  timeCommitment?: string;
  budget?: string;
}

interface EmailRequest {
  email: string;
  playbook: Playbook;
}

function generatePlaybookHTML(playbook: Playbook): string {
  const weeksHTML = playbook.weeks.map(week => `
    <div style="margin-bottom: 30px; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px;">
      <h3 style="color: #4f46e5; font-size: 20px; font-weight: bold; margin-bottom: 5px;">Week ${week.week}: ${week.title}</h3>
      
      <h4 style="color: #111827; font-size: 16px; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">Daily Tasks</h4>
      ${week.dailyTasks.map(task => `
        <div style="margin-bottom: 10px; padding: 10px; background-color: #f9fafb; border-radius: 8px;">
          <strong style="color: #4f46e5;">${task.day}:</strong> ${task.task}
          ${task.timeEstimate ? `<br><span style="color: #6b7280; font-size: 14px;">⏱ ${task.timeEstimate}</span>` : ''}
        </div>
      `).join('')}
      
      <h4 style="color: #059669; font-size: 14px; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">Success Metrics</h4>
      <ul style="margin: 0; padding-left: 20px;">
        ${week.metrics.map(metric => `<li style="color: #047857; margin-bottom: 5px;">${metric}</li>`).join('')}
      </ul>
      
      ${week.resources.length > 0 ? `
        <h4 style="color: #111827; font-size: 14px; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">Resources Needed</h4>
        <ul style="margin: 0; padding-left: 20px;">
          ${week.resources.map(resource => `<li style="color: #374151; margin-bottom: 5px;">${resource}</li>`).join('')}
        </ul>
      ` : ''}
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
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(to right, #4f46e5, #6366f1); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
        <h1 style="margin: 0 0 10px 0; font-size: 28px;">Your 30-Day Launch Playbook</h1>
        <h2 style="margin: 0 0 15px 0; font-size: 22px;">${playbook.businessName}</h2>
        <p style="margin: 0 0 20px 0; color: #e0e7ff; font-size: 16px;">${playbook.overview}</p>

        ${(playbook.timeCommitment || playbook.budget) ? `
          <div style="display: grid; grid-template-columns: ${playbook.timeCommitment && playbook.budget ? '1fr 1fr' : '1fr'}; gap: 15px; margin-top: 20px;">
            ${playbook.timeCommitment ? `
              <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 12px;">
                <p style="margin: 0 0 5px 0; font-weight: 600;">⏰ Weekly Time Commitment</p>
                <p style="margin: 0; color: #e0e7ff;">${playbook.timeCommitment}</p>
              </div>
            ` : ''}
            ${playbook.budget ? `
              <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 12px;">
                <p style="margin: 0 0 5px 0; font-weight: 600;">💰 Total Budget Needed</p>
                <p style="margin: 0; color: #e0e7ff;">${playbook.budget}</p>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
      
      ${weeksHTML}
      
      <div style="background-color: #eff6ff; padding: 20px; border-radius: 12px; text-align: center; margin-top: 30px;">
        <p style="color: #1e40af; font-size: 16px; margin: 0;">
          <strong>Ready to launch?</strong><br>
          Follow this plan step by step, and you'll have your side business up and running in 30 days!
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          This playbook was created by Find Your Side<br>
          Good luck with your launch!
        </p>
      </div>
    </body>
    </html>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email, playbook }: EmailRequest = await req.json();

    if (!email || !playbook) {
      throw new Error('Email and playbook are required');
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, logging email instead');
      console.log('Would send email to:', email);
      console.log('Playbook:', playbook.businessName);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Email functionality not configured' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const htmlContent = generatePlaybookHTML(playbook);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Find Your Side <onboarding@resend.dev>',
        to: [email],
        subject: `Your 30-Day Launch Plan for ${playbook.businessName}`,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error('Resend API error:', error);
      throw new Error(`Failed to send email: ${emailResponse.status}`);
    }

    const result = await emailResponse.json();

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
