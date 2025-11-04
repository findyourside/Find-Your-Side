import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_BOLT_DATABASE_URL!,
  process.env.VITE_BOLT_DATABASE_ANON_KEY!
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({ error: 'Missing type or data' });
    }

    let result;

    switch (type) {
      case 'quiz_response':
        result = await supabase.from('quiz_responses').insert({
          email: data.email,
          skills: data.skills,
          time_available: data.timeAvailable,
          budget: data.budget,
          interests: data.interests,
          goal: data.goal,
          experience_level: data.experienceLevel,
        });
        break;

      case 'idea_submission':
        result = await supabase.from('idea_submissions').insert({
          email: data.email,
          business_idea: data.businessIdea,
          time_available: data.timeAvailable,
          budget: data.budget,
          skills: data.skills,
        });
        break;

      case 'waitlist':
        result = await supabase.from('waitlist').insert({
          email: data.email,
          features_interested: data.featuresInterested,
          urgency_level: data.urgencyLevel,
        });
        break;

      case 'feedback':
        result = await supabase.from('feedback').insert({
          email: data.email,
          rating: data.rating,
          feedback_text: data.feedbackText,
          playbook_id: data.playbookId,
        });
        break;

      case 'interest':
        result = await supabase.from('interests').insert({
          email: data.email,
          interest_type: data.interestType,
          details: data.details,
        });
        break;

      case 'accountability_optin':
        result = await supabase.from('accountability_optins').insert({
          email: data.email,
          opted_in: data.optedIn,
          reminder_day: data.reminderDay,
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid type' });
    }

    if (result.error) {
      console.error('Supabase error:', result.error);
      return res.status(500).json({ error: 'Database error', details: result.error.message });
    }

    return res.status(200).json({ success: true, data: result.data });

  } catch (error) {
    console.error('Error saving data:', error);
    return res.status(500).json({
      error: 'Failed to save data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
