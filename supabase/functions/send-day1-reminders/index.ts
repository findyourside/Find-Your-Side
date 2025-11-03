import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateReminderHTML(businessName: string, taskTitle: string, taskDescription: string, timeEstimate: string): string {
  const sentences = taskDescription.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const shortDescription = sentences.slice(0, 2).join('. ').trim() + (sentences.length > 2 ? '.' : '');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ready to start Day 1?</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(to right, #4f46e5, #6366f1); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
        <h1 style="margin: 0 0 10px 0; font-size: 28px;">Ready to start Day 1? 🚀</h1>
      </div>
      
      <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
        You got your 30-day launch plan for <strong>${businessName}</strong> yesterday. Today is Day 1!
      </p>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 5px 0; color: #92400e; font-size: 18px;">📋 Day 1: ${taskTitle}</h3>
        <p style="margin: 10px 0 0 0; color: #78350f; font-size: 14px;">
          ⏱️ Time needed: ${timeEstimate}
        </p>
      </div>

      <p style="font-size: 15px; color: #374151; line-height: 1.8; margin-bottom: 25px;">
        ${shortDescription}
      </p>

      <div style="background-color: #eff6ff; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
        <p style="color: #1e40af; font-size: 16px; margin: 0; text-align: center;">
          <strong>Reply to this email if you complete it - we'd love to hear how it goes!</strong>
        </p>
      </div>

      <p style="font-size: 15px; color: #374151; margin-bottom: 10px;">
        - The Find Your Side Team
      </p>

      <p style="font-size: 14px; color: #6b7280; font-style: italic;">
        P.S. This is the only reminder we'll send unless you ask for more. You've got this! 💪
      </p>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          Find Your Side - From Idea to Execution
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: playbooks, error: fetchError } = await supabase
      .from("playbooks")
      .select("*")
      .eq("day1_nudge_opted_in", true)
      .eq("day1_nudge_sent", false)
      .lte("playbook_generated_at", twentyFourHoursAgo);

    if (fetchError) {
      console.error("Database fetch error:", fetchError);
      throw fetchError;
    }

    if (!playbooks || playbooks.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No reminders to send", count: 0 }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    let successCount = 0;
    let errorCount = 0;

    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, logging emails instead");
      console.log(`Would send ${playbooks.length} reminder emails`);

      for (const playbook of playbooks) {
        console.log(`Would send to: ${playbook.user_email} for ${playbook.business_name}`);

        const { error: updateError } = await supabase
          .from("playbooks")
          .update({ day1_nudge_sent: true, day1_nudge_sent_at: new Date().toISOString() })
          .eq("id", playbook.id);

        if (updateError) {
          console.error(`Error updating playbook ${playbook.id}:`, updateError);
          errorCount++;
        } else {
          successCount++;
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Email functionality not configured, marked as sent",
          sent: successCount,
          errors: errorCount
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    for (const playbook of playbooks) {
      try {
        const playbookData = playbook.playbook_data;
        const day1Task = playbookData?.weeks?.[0]?.dailyTasks?.[0];

        if (!day1Task) {
          console.error(`No Day 1 task found for playbook ${playbook.id}`);
          errorCount++;
          continue;
        }

        const htmlContent = generateReminderHTML(
          playbook.business_name,
          day1Task.title,
          day1Task.description,
          day1Task.timeEstimate
        );

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Find Your Side <onboarding@resend.dev>",
            to: [playbook.user_email],
            subject: "Ready to start Day 1? 🚀",
            html: htmlContent,
          }),
        });

        if (!emailResponse.ok) {
          const error = await emailResponse.text();
          console.error(`Failed to send email to ${playbook.user_email}:`, error);
          errorCount++;
          continue;
        }

        const { error: updateError } = await supabase
          .from("playbooks")
          .update({ day1_nudge_sent: true, day1_nudge_sent_at: new Date().toISOString() })
          .eq("id", playbook.id);

        if (updateError) {
          console.error(`Error updating playbook ${playbook.id}:`, updateError);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`Error processing playbook ${playbook.id}:`, error);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        errors: errorCount,
        total: playbooks.length
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});