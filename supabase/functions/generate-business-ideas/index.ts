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

interface QuizData {
  skills: string[];
  timeCommitment: string;
  budget: string;
  interests: string[];
  goal: string;
  experience: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { quizData }: { quizData: QuizData } = await req.json();
    console.log("Received quiz data:", JSON.stringify(quizData, null, 2));

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const userEmail = quizData.email;

    const clientIP = req.headers.get("x-forwarded-for")?.split(',')[0].trim() ||
                     req.headers.get("x-real-ip") ||
                     "unknown";
    console.log("Client IP:", clientIP);

    const currentDate = new Date().toISOString().slice(0, 10);
    const IP_IDEA_LIMIT = 20;

    const { data: ipLimits, error: ipError } = await supabase
      .from("ip_rate_limits")
      .select("ideas_today, last_reset")
      .eq("ip_address", clientIP)
      .maybeSingle();

    if (ipError && ipError.code !== 'PGRST116') {
      console.error("Error checking IP limits:", ipError);
    }

    let ideasToday = 0;
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
        ideasToday = 0;
      } else {
        ideasToday = ipLimits.ideas_today || 0;
      }
    }

    if (ideasToday >= IP_IDEA_LIMIT) {
      console.log("IP has reached daily idea generation limit");
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
    const IDEA_SET_COST = 0.005;

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
      .select("idea_sets_generated")
      .eq("email", userEmail)
      .maybeSingle();

    if (limitsError && limitsError.code !== 'PGRST116') {
      console.error("Error checking limits:", limitsError);
    }

    const ideaSetsGenerated = limitsData?.idea_sets_generated || 0;

    if (ideaSetsGenerated >= 2) {
      console.log("User has reached idea generation limit");
      return new Response(
        JSON.stringify({
          blocked: true,
          reason: 'idea_limit',
          message: "You've generated your 2 idea sets (10 personalized ideas total!)"
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

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      console.error("CRITICAL: ANTHROPIC_API_KEY environment variable is not set");
      throw new Error("API key not configured. Please check environment variables.");
    }

    console.log("API Key found, length:", anthropicApiKey.length, "starts with:", anthropicApiKey.substring(0, 15));

    const prompt = `IMPORTANT: Generate professional business ideas using clean, appropriate language suitable for all users. No profanity or casual curse words. Keep tone encouraging and professional.

Based on these user inputs:
- Skills: ${quizData.skills.join(", ")}
- Time: ${quizData.timeCommitment}
- Budget: ${quizData.budget}
- Interests: ${quizData.interests.join(", ")}
- Goal: ${quizData.goal}
- Experience: ${quizData.experience}

Generate 5 side business ideas. For each idea provide:

1. Concept Name (clear, specific title, 3-7 words)
2. Why It Fits (2-3 personalized sentences connecting to user's skills/interests/goals)
3. Time Required (hours per week estimate, e.g., "5-10 hours/week")
4. First Step to Validate (one specific, actionable task they can do THIS WEEK to test demand)

DO NOT include:
- Match score percentages
- Income potential estimates
- Difficulty ratings
- Startup cost
- Time to first revenue or revenue timeline projections

Make ideas specific, actionable, and realistic.

Respond in JSON format with this structure:
{
  "ideas": [
    {
      "name": "Business Name",
      "whyItFits": "2-3 personalized sentences connecting to user's profile",
      "timeRequired": "Hours per week estimate",
      "firstStep": "One specific, actionable task to validate this week"
    }
  ]
}`;

    console.log("Calling Anthropic API...");
    const requestBody = {
      model: "claude-3-5-haiku-20241022",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt + "\n\nRespond with ONLY valid JSON, no other text.",
        },
      ],
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("API Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error - Status:", response.status);
      console.error("Anthropic API error - Body:", errorText);

      let errorMessage = `API returned status ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch (e) {
        errorMessage += `: ${errorText.substring(0, 200)}`;
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("API Response received successfully");

    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error("Unexpected API response structure:", JSON.stringify(data));
      throw new Error("Invalid response structure from API");
    }

    const rawText = data.content[0].text;
    console.log("Raw response length:", rawText.length);

    const filteredText = filterProfanity(rawText);

    let ideas;
    try {
      ideas = JSON.parse(filteredText);
      console.log("Successfully parsed JSON, ideas count:", ideas.ideas?.length || 0);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      console.error("Response text (first 500 chars):", filteredText.substring(0, 500));
      throw new Error("Failed to parse API response as JSON");
    }

    if (limitsData) {
      await supabase
        .from("user_generation_limits")
        .update({
          idea_sets_generated: ideaSetsGenerated + 1
        })
        .eq("email", userEmail);
    } else {
      await supabase
        .from("user_generation_limits")
        .insert({
          email: userEmail,
          idea_sets_generated: 1,
          playbooks_generated: 0
        });
    }

    if (usageData) {
      await supabase
        .from("api_usage")
        .update({
          total_spend: Number(currentSpend) + IDEA_SET_COST,
          idea_sets_generated: (usageData.idea_sets_generated || 0) + 1,
          last_updated: new Date().toISOString()
        })
        .eq("month", currentMonth);
    } else {
      await supabase
        .from("api_usage")
        .insert({
          month: currentMonth,
          total_spend: IDEA_SET_COST,
          idea_sets_generated: 1,
          playbooks_generated: 0
        });
    }

    if (ipLimits) {
      await supabase
        .from("ip_rate_limits")
        .update({
          ideas_today: ideasToday + 1,
          updated_at: new Date().toISOString()
        })
        .eq("ip_address", clientIP);
    } else {
      await supabase
        .from("ip_rate_limits")
        .insert({
          ip_address: clientIP,
          ideas_today: 1,
          playbooks_today: 0,
          last_reset: currentDate
        });
    }

    return new Response(
      JSON.stringify(ideas),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("ERROR in generate-business-ideas:", error);
    console.error("Error stack:", error.stack);

    const errorMessage = error.message || "Internal server error";
    console.error("Returning error to client:", errorMessage);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.stack ? error.stack.substring(0, 500) : undefined
      }),
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