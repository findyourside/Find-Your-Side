import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const forbiddenWords = [
  'damn', 'hell', 'crap', 'suck', 'screw', 'shit', 'fuck', 'ass', 'bastard',
  'bitch', 'piss', 'dick', 'cock', 'pussy', 'douche', 'douchebag', 'asshole'
];

function filterProfanity(text: string): string {
  let filteredText = text;
  forbiddenWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filteredText = filteredText.replace(regex, '***');
  });
  return filteredText;
}

interface BusinessIdea {
  name: string;
  whyItFits: string;
  timeRequired: string;
  firstStep: string;
}

interface IdeaFormData {
  businessType: string;
  businessTypeOther: string;
  problemSolving: string;
  targetCustomer: string;
  timeCommitment: string;
  skillsExperience: string;
  email: string;
}

interface PlaybookRequest {
  idea?: BusinessIdea;
  ideaFormData?: IdeaFormData;
  timeCommitment?: string;
  budget?: string;
  skills?: string[];
  userEmail?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { idea, ideaFormData, timeCommitment, budget, skills, userEmail }: PlaybookRequest = await req.json();

    let businessName: string;
    let businessDescription: string;
    let userSkills: string[];
    let userTimeCommitment: string;
    let userBudget: string;
    let email: string;

    if (ideaFormData) {
      const businessType = ideaFormData.businessType === 'Other'
        ? ideaFormData.businessTypeOther
        : ideaFormData.businessType;

      businessName = `${businessType} Business`;
      businessDescription = `A ${businessType.toLowerCase()} business that ${ideaFormData.problemSolving.toLowerCase()} for ${ideaFormData.targetCustomer.toLowerCase()}`;
      userSkills = ideaFormData.skillsExperience ? [ideaFormData.skillsExperience] : [];
      userTimeCommitment = ideaFormData.timeCommitment;
      userBudget = '$0-100';
      email = ideaFormData.email;
    } else if (idea) {
      businessName = idea.name;
      businessDescription = idea.whyItFits;
      userSkills = skills || [];
      userTimeCommitment = timeCommitment || '10 hours/week';
      userBudget = budget || '$0-100';
      email = userEmail || '';
    } else {
      throw new Error('Either idea or ideaFormData must be provided');
    }

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const clientIP = req.headers.get("x-forwarded-for")?.split(',')[0].trim() ||
                     req.headers.get("x-real-ip") ||
                     "unknown";
    console.log("Client IP:", clientIP);

    const currentDate = new Date().toISOString().slice(0, 10);
    const IP_PLAYBOOK_LIMIT = 10;

    const { data: ipLimits, error: ipError } = await supabase
      .from("ip_rate_limits")
      .select("playbooks_today, last_reset")
      .eq("ip_address", clientIP)
      .maybeSingle();

    if (ipError && ipError.code !== 'PGRST116') {
      console.error("Error checking IP limits:", ipError);
    }

    let playbooksToday = 0;
    if (ipLimits) {
      if (ipLimits.last_reset !== currentDate) {
        await supabase
          .from("ip_rate_limits")
          .update({
            ideas_today: 0,
            playbooks_today: 0,
            last_reset: currentDate,
            updated_at: new Date().toISOString()
          })
          .eq("ip_address", clientIP);
        playbooksToday = 0;
      } else {
        playbooksToday = ipLimits.playbooks_today || 0;
      }
    }

    if (playbooksToday >= IP_PLAYBOOK_LIMIT) {
      console.log("IP has reached daily playbook generation limit");
      return new Response(
        JSON.stringify({
          error: "Too many requests from your network. Please try again tomorrow."
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const MONTHLY_LIMIT = 50;
    const PLAYBOOK_COST = 0.013;

    const { data: usageData, error: usageError } = await supabase
      .from("api_usage")
      .select("total_spend, idea_sets_generated, playbooks_generated")
      .eq("month", currentMonth)
      .maybeSingle();

    if (usageError && usageError.code !== 'PGRST116') {
      console.error("Error checking API usage:", usageError);
    }

    const currentSpend = usageData?.total_spend || 0;

    if (currentSpend >= MONTHLY_LIMIT) {
      console.log("Monthly spending limit reached");
      return new Response(
        JSON.stringify({
          blocked: true,
          reason: 'monthly_limit',
          message: "We've reached capacity this month"
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: limitsData, error: limitsError } = await supabase
      .from("user_generation_limits")
      .select("playbooks_generated")
      .eq("email", email)
      .maybeSingle();

    if (limitsError && limitsError.code !== 'PGRST116') {
      console.error("Error checking limits:", limitsError);
    }

    const playbooksGenerated = limitsData?.playbooks_generated || 0;

    if (playbooksGenerated >= 2) {
      console.log("User has reached playbook generation limit");
      return new Response(
        JSON.stringify({
          blocked: true,
          reason: 'playbook_limit',
          message: "You've used both of your free playbook generations."
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const firstStep = idea?.firstStep || 'Talk to potential customers to validate the problem';

    const prompt = `IMPORTANT: You are a professional business coach. Use clean, professional language appropriate for all audiences. No profanity, curse words, or inappropriate language. Keep tone encouraging and professional.

You are an experienced business coach who has helped 500+ people launch side businesses while working full-time. You give SPECIFIC, TACTICAL advice - not generic theory. You understand real constraints: limited time, limited budget, fear of failure, impostor syndrome.

Create a detailed 30-day launch playbook for this business idea:

BUSINESS IDEA: ${businessName}
WHY IT FITS THEM: ${businessDescription}
TIME AVAILABLE: ${userTimeCommitment}
BUDGET: ${userBudget}
THEIR SKILLS: ${userSkills.join(", ") || "general skills"}
FIRST VALIDATION STEP: ${firstStep}

STRUCTURE YOUR PLAYBOOK AS 5 WEEKS:
- Week 1 (Days 1-7): VALIDATE - Low-risk validation (just talking to people)
- Week 2 (Days 8-14): SETUP - Minimum commitment setup (free/cheap tools)
- Week 3 (Days 15-21): BUILD MVP - Create something real but imperfect
- Week 4 (Days 22-28): LAUNCH - Put it in front of real customers
- Week 5 (Days 29-30): OPTIMIZE & REFLECT - Learn and iterate

CRITICAL: BE HIGHLY SPECIFIC AND ACTIONABLE

For EACH of the 30 days, you MUST:

1. **Task Title**: Action-oriented and specific (not "Research market" but "Interview 10 Target Customers About Their Biggest Pain Point")

2. **Description**: Write 3-4 sentences that are TACTICAL and SPECIFIC:
   - EXACT actions with NUMBERS (e.g., "Message 10 people", "Create 3 pricing tiers", "Write 5 headline options")
   - SPECIFIC TOOLS by name (e.g., "Use Carrd.co free tier, not 'website builder'")
   - CONCRETE OUTCOMES (e.g., "You'll have a spreadsheet with 20 prospect names and their top pain points")
   - CONDITIONAL ADVICE based on their profile:
     * If skills include specific skill: reference how to use it (e.g., "Use your design skills to create a simple logo in 20 minutes")
     * If time is limited (5-10 hrs/week): make tasks 30-45 min each
     * If time is ample (15+ hrs/week): tasks can be 2-3 hours
     * If budget is low: emphasize free tools and scrappy approaches
   - Include "Stuck? Here's the minimal version:" when relevant
   - Include "Common mistake:" when helpful

3. **Time Estimate**: Match their available time per week. If they have ${userTimeCommitment}, ensure daily tasks fit within that divided by 6-7 days.

4. **Resources**: NAME SPECIFIC TOOLS, not categories:
   - ❌ "project management tool"
   - ✅ "Notion (free tier), Trello, or Google Sheets"
   - ❌ "email service"
   - ✅ "Gmail, Superhuman trial, or your current email"

QUALITY EXAMPLES:

❌ BAD: "Research your target market"
✅ GOOD: "Search LinkedIn for 20 people with job title 'Marketing Director at B2B SaaS companies (50-200 employees)'. Save their profiles in a spreadsheet. Notice patterns in their recent posts about pain points. You're looking for repeated phrases they use - this is your marketing language."

❌ BAD: "Create a website"
✅ GOOD: "Build a one-page site using Carrd.co (free tier, takes 15 min to set up). Use their 'Agency' template. Include: one headline (use the pain point language from Day 3), three benefits (not features), your pricing, and a 'Contact Me' button that links to your email. Don't overthink design - you can improve it after your first customer."

❌ BAD: "Post on social media"
✅ GOOD: "Post about your journey on LinkedIn (not selling yet, just sharing). Example: 'I'm testing a side business idea - helping [target customer] with [problem]. Day 5 of building it. What would you want to know before trying something like this?' This builds an audience before you need customers. Aim for 50+ views and 3+ comments."

PERSONALIZATION REQUIREMENTS:

1. EXPLICITLY reference their skills in tasks:
   - If "Writing" is a skill: "Use your writing ability to craft a compelling value proposition in 20 minutes"
   - If "Marketing" is a skill: "Your marketing background will help here - think about positioning"
   - If "Design" is a skill: "Use your design eye to create a simple but polished landing page"

2. Adapt to their TIME COMMITMENT:
   - 5 hrs/week: Max 6-7 tasks per week, each 30-45 minutes
   - 10 hrs/week: 7 tasks per week, each 45-90 minutes
   - 15+ hrs/week: 7-8 tasks per week, can be 2-3 hours each

3. Adapt to their BUDGET:
   - Under $100: Emphasize 100% free tools, scrappy validation
   - $100-500: Can suggest paid tools ($10-20/month), but with free alternatives
   - $500+: Can suggest premium tools but still recommend starting free

4. INCLUDE the validated first step (${firstStep}) as Day 1 or Day 2 task, expanded with specifics

5. Include encouragement that references THEIR situation:
   - "Remember, you have ${userTimeCommitment} available - this task should take about [X% of that]"
   - Reference their skills: "Your [skill] background makes you perfect for this"

TONE:
- Confident but realistic (acknowledge it's hard)
- Encouraging but not fake-positive
- Direct and tactical (assume they want ACTION)
- Mentor-like (you've helped 500+ people do this)

For each WEEK provide:
- Week number (1-5) and title
- Focus area (specific, not vague)
- Success metric (must be MEASURABLE with exact numbers)
- Total estimated time (calculate based on daily tasks)

RESPOND IN JSON:
{
  "playbook": {
    "businessName": "${businessName}",
    "overview": "2-3 sentences about what they'll accomplish, referencing their specific skills and time available",
    "weeks": [
      {
        "week": 1,
        "title": "Validate",
        "focusArea": "Specific description of what gets validated this week",
        "successMetric": "Measurable goal with exact number (e.g., '10 customer conversations with 5+ saying they would pay')",
        "totalTime": "X-Y hours total",
        "dailyTasks": [
          {
            "day": 1,
            "title": "Specific action-oriented title with numbers",
            "description": "3-4 tactical sentences with specific tools, exact numbers, conditional advice, and concrete outcomes. Include 'Stuck?' or 'Common mistake:' when helpful.",
            "timeEstimate": "30-45 minutes",
            "resources": ["Specific Tool Name 1 (with pricing/tier)", "Specific Tool Name 2", "Specific Template/Example"]
          }
        ]
      }
    ]
  }
}

Generate all 30 days with this level of tactical specificity and personalization.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 8192,
        messages: [
          {
            role: "user",
            content: prompt + "\n\nRespond with ONLY valid JSON, no other text.",
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Anthropic API error:", error);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.content[0].text;
    const filteredText = filterProfanity(rawText);
    const playbook = JSON.parse(filteredText);

    let playbookId = null;

    if (email && playbook.playbook) {
      const { data: savedPlaybook, error: dbError } = await supabase
        .from("playbooks")
        .insert({
          user_email: email,
          business_name: playbook.playbook.businessName || businessName,
          playbook_data: playbook.playbook,
          day1_nudge_opted_in: false,
          day1_nudge_sent: false,
        })
        .select()
        .single();

      if (dbError) {
        console.error("Database error saving playbook:", dbError);
      } else if (savedPlaybook) {
        playbookId = savedPlaybook.id;
      }

      if (limitsData) {
        await supabase
          .from("user_generation_limits")
          .update({
            playbooks_generated: playbooksGenerated + 1
          })
          .eq("email", email);
      } else {
        await supabase
          .from("user_generation_limits")
          .insert({
            email: email,
            idea_sets_generated: 0,
            playbooks_generated: 1
          });
      }

      if (usageData) {
        await supabase
          .from("api_usage")
          .update({
            total_spend: Number(currentSpend) + PLAYBOOK_COST,
            playbooks_generated: (usageData.playbooks_generated || 0) + 1,
            last_updated: new Date().toISOString()
          })
          .eq("month", currentMonth);
      } else {
        await supabase
          .from("api_usage")
          .insert({
            month: currentMonth,
            total_spend: PLAYBOOK_COST,
            idea_sets_generated: 0,
            playbooks_generated: 1
          });
      }

      if (ipLimits) {
        await supabase
          .from("ip_rate_limits")
          .update({
            playbooks_today: playbooksToday + 1,
            updated_at: new Date().toISOString()
          })
          .eq("ip_address", clientIP);
      } else {
        await supabase
          .from("ip_rate_limits")
          .insert({
            ip_address: clientIP,
            ideas_today: 0,
            playbooks_today: 1,
            last_reset: currentDate
          });
      }
    }

    return new Response(
      JSON.stringify({ ...playbook, playbookId }),
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