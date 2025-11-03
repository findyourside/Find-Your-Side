import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import puppeteer from "npm:puppeteer@23.11.1";

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

interface PDFRequest {
  playbook: Playbook;
}

function generatePlaybookHTML(playbook: Playbook): string {
  const weeksHTML = playbook.weeks.map(week => `
    <div style="margin-bottom: 30px; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; page-break-inside: avoid;">
      <div style="display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #f3f4f6;">
        <div>
          <h3 style="color: #111827; font-size: 24px; font-weight: bold; margin: 0 0 5px 0;">Week ${week.week}</h3>
          <p style="color: #4f46e5; font-size: 18px; font-weight: 600; margin: 0;">${week.title}</p>
        </div>
      </div>
      
      <h4 style="color: #111827; font-size: 16px; font-weight: bold; margin-top: 0; margin-bottom: 12px;">Daily Tasks</h4>
      <div style="margin-bottom: 20px;">
        ${week.dailyTasks.map(task => `
          <div style="margin-bottom: 12px; padding: 12px; background-color: #f9fafb; border-radius: 8px; display: flex; align-items: flex-start;">
            <div style="min-width: 80px; flex-shrink: 0;">
              <strong style="color: #4f46e5;">${task.day}</strong>
            </div>
            <div style="flex: 1;">
              <p style="color: #111827; margin: 0 0 4px 0;">${task.task}</p>
              ${task.timeEstimate ? `<p style="color: #6b7280; font-size: 13px; margin: 0;">⏱ ${task.timeEstimate}</p>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      
      <div style="background-color: #d1fae5; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
        <h4 style="color: #065f46; font-size: 13px; font-weight: bold; margin: 0 0 8px 0;">Success Metric for Week ${week.week}</h4>
        <ul style="margin: 0; padding-left: 20px;">
          ${week.metrics.map(metric => `<li style="color: #047857; margin-bottom: 4px;">${metric}</li>`).join('')}
        </ul>
      </div>
      
      ${week.resources.length > 0 ? `
        <div>
          <h4 style="color: #111827; font-size: 13px; font-weight: bold; margin: 0 0 8px 0;">Resources Needed</h4>
          <ul style="margin: 0; padding-left: 20px;">
            ${week.resources.map(resource => `<li style="color: #374151; margin-bottom: 4px;">${resource}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your 30-Day Launch Plan</title>
      <style>
        @page {
          margin: 40px;
        }
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
      </style>
    </head>
    <body>
      <div style="text-align: center; margin-bottom: 40px;">
        <svg width="200" height="60" viewBox="0 0 200 60" style="margin-bottom: 20px;">
          <text x="100" y="35" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#4f46e5" text-anchor="middle">Find Your Side</text>
        </svg>
      </div>
      
      <div style="background: linear-gradient(to right, #4f46e5, #6366f1); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
        <h1 style="margin: 0 0 10px 0; font-size: 32px; font-weight: bold;">Your 30-Day Launch Plan</h1>
        <h2 style="margin: 0 0 15px 0; font-size: 26px;">${playbook.businessName}</h2>
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
      
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          © 2025 Find Your Side. All rights reserved.<br>
          Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
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
    const { playbook }: PDFRequest = await req.json();

    if (!playbook) {
      throw new Error('Playbook data is required');
    }

    const htmlContent = generatePlaybookHTML(playbook);

    // Launch Puppeteer browser
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    await browser.close();

    // Create filename
    const sanitizedBusinessName = playbook.businessName
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
    const filename = `FindYourSide-${sanitizedBusinessName}-30DayPlan.pdf`;

    return new Response(pdf, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
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
