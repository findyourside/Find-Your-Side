const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Missing API key' });

  // Extract data from different sources
  const ideaFormData = req.body.ideaFormData;
  const idea = req.body.idea;

  // Get the business idea text
  const businessIdea = 
    req.body.businessIdea ||
    ideaFormData?.businessIdea ||
    idea?.name ||
    'Unknown Business';

  // Get time commitment
  const timeCommitment = 
    req.body.timeCommitment ||
    ideaFormData?.timeCommitment ||
    '10 hours/week';

  const budget = req.body.budget || ideaFormData?.budget || '';
  const skillsExperience = req.body.skillsExperience || ideaFormData?.skillsExperience || '';

  if (!businessIdea || businessIdea === 'Unknown Business') {
    return res.status(400).json({ error: 'Missing business idea' });
  }

  const prompt = `Create a detailed 30-day launch playbook for "${businessIdea}".
Time commitment: ${timeCommitment}
${budget ? `Budget: ${budget}` : ''}
${skillsExperience ? `Skills/Experience: ${skillsExperience}` : ''}

Create EXACTLY 4 weeks with 5 daily tasks EACH week (20 tasks total, days 1-20).
Each daily task MUST have: day number, title, detailed description, time estimate, and 2-3 specific resources.

CRITICAL: Return ONLY this JSON format with NO markdown or code blocks:
{
  "businessName": "Business Name Here",
  "overview": "2-3 sentence overview of what this 30-day playbook covers",
  "weeks": [
    {
      "week": 1,
      "title": "Week 1 Title",
      "focusArea": "Main focus for this week",
      "successMetric": "How you'll know you succeeded this week",
      "totalTime": "Total hours for the week",
      "dailyTasks": [
        {
          "day": 1,
          "title": "Day 1 Task Title",
          "description": "Detailed description of what to do",
          "timeEstimate": "2 hours",
          "resources": ["Resource 1", "Resource 2", "Resource 3"]
        }
      ]
    }
  ]
}

Example for reference (customize for their business):
{
  "businessName": "Social Media Management Agency",
  "overview": "This 30-day playbook walks you through launching a social media management business. You'll validate your idea, build your first client package, and land your first paying customer.",
  "weeks": [
    {
      "week": 1,
      "title": "Foundation & Validation",
      "focusArea": "Validate your business idea and understand your market",
      "successMetric": "Interviewed 5 potential clients and understand their pain points",
      "totalTime": "12 hours",
      "dailyTasks": [
        {
          "day": 1,
          "title": "Research your target market",
          "description": "Spend 2 hours researching who needs social media management. Look at LinkedIn, small business directories, and local business groups. Write down 3 types of businesses that struggle with social media.",
          "timeEstimate": "2 hours",
          "resources": ["LinkedIn", "Google Local Business", "Facebook Groups"]
        },
        {
          "day": 2,
          "title": "Create ideal client profile",
          "description": "Write a detailed description of your ideal client. Include: industry, business size, pain points, budget, location. Be specific. This will guide everything else.",
          "timeEstimate": "1.5 hours",
          "resources": ["Google Docs", "Pen and paper", "Customer avatar template"]
        },
        {
          "day": 3,
          "title": "Find 5 potential clients",
          "description": "Search LinkedIn and local directories for 5 businesses that match your ideal client profile. Write down their name, industry, size, and contact info. Note what their social media looks like.",
          "timeEstimate": "2 hours",
          "resources": ["LinkedIn", "Google Maps", "Yelp", "Local business directories"]
        },
        {
          "day": 4,
          "title": "Draft outreach message",
          "description": "Write a short, personalized message to reach out to these 5 businesses. Don't sell yet. Just ask if they have time for a quick conversation about their social media. Keep it under 100 words.",
          "timeEstimate": "1.5 hours",
          "resources": ["Google Docs", "Email templates", "LinkedIn messaging"]
        },
        {
          "day": 5,
          "title": "Send first outreach",
          "description": "Send personalized messages to 2 of your 5 prospects. Use LinkedIn messaging or email. Be genuine. Ask about their biggest social media challenge. Don't pitch anything.",
          "timeEstimate": "1 hour",
          "resources": ["LinkedIn", "Gmail", "Outreach script"]
        }
      ]
    },
    {
      "week": 2,
      "title": "Package & Pricing",
      "focusArea": "Create your service offering and pricing",
      "successMetric": "Have a clear service package and pricing page created",
      "totalTime": "14 hours",
      "dailyTasks": [
        {
          "day": 6,
          "title": "Interview 3 more prospects",
          "description": "Follow up with your outreach. If you got responses, have quick phone or video calls. Ask about their biggest social media struggles, how much they'd spend, what results they want. Take detailed notes.",
          "timeEstimate": "2.5 hours",
          "resources": ["Zoom", "Phone", "Interview questions template", "Google Docs"]
        },
        {
          "day": 7,
          "title": "Research competitor pricing",
          "description": "Find 5 social media management agencies in your area or online. Note their service packages and pricing. Look for what they include and what gaps exist.",
          "timeEstimate": "1.5 hours",
          "resources": ["Google search", "Fiverr", "Upwork", "Agency websites"]
        },
        {
          "day": 8,
          "title": "Create your service package",
          "description": "Based on what you learned from interviews, create 2-3 service tiers: Starter ($500/month), Professional ($1000/month), Premium ($2000/month). Write what each includes: posts per week, platforms managed, reporting, revisions.",
          "timeEstimate": "2 hours",
          "resources": ["Google Docs", "Pricing template", "Canva"]
        },
        {
          "day": 9,
          "title": "Build pricing page",
          "description": "Create a simple pricing page on your website showing your 3 packages. Include what's included, testimonials placeholder, FAQ about services. Make it easy to understand.",
          "timeEstimate": "2.5 hours",
          "resources": ["Wix", "Webflow", "Carrd", "Canva"]
        },
        {
          "day": 10,
          "title": "Create client onboarding guide",
          "description": "Write a simple 1-page guide for new clients about what to expect when they hire you. Include: timeline, deliverables, how you'll communicate, how they provide feedback.",
          "timeEstimate": "1.5 hours",
          "resources": ["Google Docs", "Notion", "Onboarding template"]
        }
      ]
    },
    {
      "week": 3,
      "title": "Launch & Outreach",
      "focusArea": "Get your first customer",
      "successMetric": "Send proposals to 3 prospects and get at least 1 yes",
      "totalTime": "16 hours",
      "dailyTasks": [
        {
          "day": 11,
          "title": "Create portfolio/samples",
          "description": "If you don't have client work, create sample social media posts for 2 fictional businesses. Show your style and quality. Organize these nicely in Google Docs or Canva portfolio.",
          "timeEstimate": "3 hours",
          "resources": ["Canva", "Adobe Express", "Figma", "Google Docs"]
        },
        {
          "day": 12,
          "title": "Reach out to all 5 prospects",
          "description": "Send a second message to any who didn't respond. If you got interest from interviews, send them your pricing package and portfolio. Make it personal. Explain why you're perfect for them.",
          "timeEstimate": "2 hours",
          "resources": ["Email", "LinkedIn", "Google Docs"]
        },
        {
          "day": 13,
          "title": "Follow up with warm leads",
          "description": "If someone showed interest, send a simple proposal. Include: what you'll do, timeline, pricing, next steps. Ask when they want to start.",
          "timeEstimate": "2.5 hours",
          "resources": ["Google Docs", "Proposal template", "Email"]
        },
        {
          "day": 14,
          "title": "Expand your network",
          "description": "Post about your new service on LinkedIn. Join 2 Facebook groups for your target market. Comment helpfully on 5 posts. Don't sell, just add value.",
          "timeEstimate": "2 hours",
          "resources": ["LinkedIn", "Facebook", "LinkedIn post ideas"]
        },
        {
          "day": 15,
          "title": "Set up business operations",
          "description": "Open a business bank account. Set up invoicing using Wave or Stripe. Create a simple contract template. Set up a folder system for client files.",
          "timeEstimate": "2.5 hours",
          "resources": ["Your bank", "Wave", "Stripe", "Google Drive", "Contract template"]
        }
      ]
    },
    {
      "week": 4,
      "title": "Close & Optimize",
      "focusArea": "Land your first customer and prepare for delivery",
      "successMetric": "Have signed contract and first payment from a customer",
      "totalTime": "14 hours",
      "dailyTasks": [
        {
          "day": 16,
          "title": "Close first customer",
          "description": "Follow up with anyone who didn't respond yet. If they're interested, set up a quick call. Answer questions. Send contract and payment link. Make it easy to say yes.",
          "timeEstimate": "2.5 hours",
          "resources": ["Phone/Zoom", "Contract", "Stripe or PayPal", "Email"]
        },
        {
          "day": 17,
          "title": "Prepare client workspace",
          "description": "Once you have a signed contract, create a folder system for that client. Set up a communication method (Slack, email, or shared doc). Prepare your work templates for their social content.",
          "timeEstimate": "1.5 hours",
          "resources": ["Google Drive", "Slack", "Trello", "Content calendar template"]
        },
        {
          "day": 18,
          "title": "Onboard your first client",
          "description": "Schedule onboarding call. Get their branding guidelines, brand voice, target audience info. Understand their goals for the first month. Take detailed notes.",
          "timeEstimate": "1.5 hours",
          "resources": ["Zoom", "Onboarding checklist", "Google Docs", "Brand guidelines template"]
        },
        {
          "day": 19,
          "title": "Create first month content calendar",
          "description": "Map out what you'll post for the first 30 days. Include posting days, times, content types (tips, behind-the-scenes, promotions). Get client approval.",
          "timeEstimate": "2.5 hours",
          "resources": ["Google Sheets", "Content calendar template", "Canva", "Later or Buffer"]
        },
        {
          "day": 20,
          "title": "Launch and plan next steps",
          "description": "Publish your first batch of content for the client. Set up any scheduling tools. Plan when you'll check analytics and optimize. Schedule the first check-in meeting with your client.",
          "timeEstimate": "2 hours",
          "resources": ["Meta Business Suite", "Buffer", "Later", "Google Analytics", "Email"]
        }
      ]
    }
  ]
}

Now create the playbook for "${businessIdea}" with 4 weeks, 5 tasks per week (20 total tasks).`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 28000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
       model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      return res.status(500).json({ error: 'API failed', details: errorText.substring(0, 200) });
    }

    const data = await response.json();
    const text = data.content[0].text.trim();
    
    // Remove markdown if present
    let jsonText = text;
    if (text.includes('```json')) {
      jsonText = text.split('```json')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
      jsonText = text.split('```')[1].split('```')[0].trim();
    }

    // Parse and validate
    let playbook;
    try {
      playbook = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('Parse error:', parseErr.message);
      console.error('Text:', jsonText.substring(0, 300));
      // Return fallback playbook
      return res.status(200).json(createFallbackPlaybook(businessIdea));
    }

    // Validate structure
    if (!playbook.businessName || !playbook.overview || !playbook.weeks || playbook.weeks.length < 4) {
      console.error('Invalid structure:', Object.keys(playbook));
      return res.status(200).json(createFallbackPlaybook(businessIdea));
    }

    return res.status(200).json(playbook);

  } catch (error) {
    console.error('Error:', error.message);
    // Return fallback playbook on any error
    return res.status(200).json(createFallbackPlaybook(businessIdea));
  }
}

// Fallback playbook generator
function createFallbackPlaybook(businessName) {
  return {
    businessName: businessName,
    overview: `This 30-day launch playbook guides you through launching your ${businessName} business. Follow the daily tasks to validate your idea, build your offering, get your first customer, and establish operations.`,
    weeks: [
      {
        week: 1,
        title: "Foundation & Validation",
        focusArea: "Validate your business idea and understand your market",
        successMetric: "Talked to 5 potential customers about their needs",
        totalTime: "12 hours",
        dailyTasks: [
          {
            day: 1,
            title: "Research your market",
            description: `Spend time understanding who needs your ${businessName} service. Look at competitors, search online communities, and identify customer pain points. Write down 3 types of customers who would benefit.`,
            timeEstimate: "2 hours",
            resources: ["Google search", "Facebook groups", "Reddit", "LinkedIn"]
          },
          {
            day: 2,
            title: "Define your ideal customer",
            description: "Write a detailed description of your ideal customer: industry, size, location, budget, main problem. Be specific so you know exactly who to target.",
            timeEstimate: "1.5 hours",
            resources: ["Google Docs", "Customer avatar template", "Pen and paper"]
          },
          {
            day: 3,
            title: "Find 5 potential customers",
            description: `Search for 5 specific people or businesses that match your ideal customer profile. Note their names, contact info, and what you noticed about them.`,
            timeEstimate: "2 hours",
            resources: ["LinkedIn", "Google Maps", "Local directories", "Facebook"]
          },
          {
            day: 4,
            title: "Write your outreach message",
            description: "Create a short, personal message (under 100 words) to reach out to these prospects. Don't try to sell. Just ask for a quick conversation about their biggest challenge.",
            timeEstimate: "1.5 hours",
            resources: ["Email", "LinkedIn message", "Email template"]
          },
          {
            day: 5,
            title: "Send your first outreach",
            description: "Send personalized messages to 2-3 prospects. Be genuine. Ask about their pain points. Listen for what matters to them.",
            timeEstimate: "1 hour",
            resources: ["Email", "LinkedIn", "Phone"]
          }
        ]
      },
      {
        week: 2,
        title: "Create Your Offer",
        focusArea: "Build your service/product package",
        successMetric: "Have a clear offer and pricing",
        totalTime: "14 hours",
        dailyTasks: [
          {
            day: 6,
            title: "Get customer feedback",
            description: "Have conversations with anyone who responded. Ask about their biggest challenge, what they'd pay for a solution, what results matter to them.",
            timeEstimate: "2.5 hours",
            resources: ["Phone", "Zoom", "Email", "Interview notes"]
          },
          {
            day: 7,
            title: "Research competitor pricing",
            description: "Find 5 competitors offering similar services. Note their pricing, packages, and what's included. Identify gaps.",
            timeEstimate: "1.5 hours",
            resources: ["Google search", "Competitor websites", "Fiverr", "Upwork"]
          },
          {
            day: 8,
            title: "Create your service package",
            description: `Design 2-3 package options for your ${businessName} offering. Include what's in each tier and the price. Make it easy to understand.`,
            timeEstimate: "2 hours",
            resources: ["Google Docs", "Pricing template", "Spreadsheet"]
          },
          {
            day: 9,
            title: "Build pricing page",
            description: "Create a simple page showing your packages. Include benefits, what's included, and how to get started.",
            timeEstimate: "2.5 hours",
            resources: ["Wix", "Webflow", "Carrd", "Canva"]
          },
          {
            day: 10,
            title: "Create simple contract",
            description: "Write a basic one-page agreement covering: what you'll do, timeline, pricing, payment terms, and how communication works.",
            timeEstimate: "1.5 hours",
            resources: ["Google Docs", "Contract template", "Word"]
          }
        ]
      },
      {
        week: 3,
        title: "Launch Your Marketing",
        focusArea: "Get your first customer",
        successMetric: "Send proposals to 3+ prospects",
        totalTime: "16 hours",
        dailyTasks: [
          {
            day: 11,
            title: "Create portfolio or samples",
            description: `Create 2-3 sample projects showing your work for ${businessName}. Make it professional and polished.`,
            timeEstimate: "3 hours",
            resources: ["Canva", "Adobe Express", "Google Docs", "Portfolio template"]
          },
          {
            day: 12,
            title: "Follow up with prospects",
            description: "Reach out to all 5 people you contacted. If they showed interest, send your pricing and portfolio. Explain why you're the right fit.",
            timeEstimate: "2 hours",
            resources: ["Email", "LinkedIn", "Proposal template"]
          },
          {
            day: 13,
            title: "Send proposals",
            description: "Create personalized proposals for interested prospects. Include: what you'll do, timeline, cost, next steps. Make it easy to say yes.",
            timeEstimate: "2.5 hours",
            resources: ["Google Docs", "Proposal template", "Email"]
          },
          {
            day: 14,
            title: "Expand your reach",
            description: "Post about your new service on social media. Join relevant communities. Comment helpfully on posts. Don't hard sell.",
            timeEstimate: "2 hours",
            resources: ["LinkedIn", "Facebook", "Twitter", "Reddit"]
          },
          {
            day: 15,
            title: "Set up business foundation",
            description: "Open a business bank account. Set up simple invoicing. Create organized folders for client files. Get organized.",
            timeEstimate: "2.5 hours",
            resources: ["Bank", "Wave", "Google Drive", "Stripe"]
          }
        ]
      },
      {
        week: 4,
        title: "Close & Deliver",
        focusArea: "Get your first paying customer",
        successMetric: "Signed contract and payment received",
        totalTime: "14 hours",
        dailyTasks: [
          {
            day: 16,
            title: "Close your first customer",
            description: "Follow up with interested prospects. Answer their questions. Send contract and payment link. Make it simple to get started.",
            timeEstimate: "2.5 hours",
            resources: ["Phone", "Email", "Contract", "Stripe"]
          },
          {
            day: 17,
            title: "Prepare for delivery",
            description: `Set up systems to deliver your ${businessName} service. Create checklists, templates, and workflows.`,
            timeEstimate: "1.5 hours",
            resources: ["Google Drive", "Notion", "Trello", "Templates"]
          },
          {
            day: 18,
            title: "Onboard your customer",
            description: "Have a detailed kickoff call. Get all the information you need. Set clear expectations. Build good rapport.",
            timeEstimate: "1.5 hours",
            resources: ["Zoom", "Email", "Onboarding checklist", "Google Docs"]
          },
          {
            day: 19,
            title: "Start delivery",
            description: `Begin delivering your service. Follow your process. Track results. Stay in close communication with your customer.`,
            timeEstimate: "2.5 hours",
            resources: ["Your delivery tools", "Communication platform", "Project tracker"]
          },
          {
            day: 20,
            title: "Reflect and plan next steps",
            description: "Review your first customer experience. What went well? What can you improve? Plan your next 3 customers. Celebrate your win!",
            timeEstimate: "2 hours",
            resources: ["Spreadsheet", "Reflection notes", "Growth plan"]
          }
        ]
      }
    ]
  };
}
