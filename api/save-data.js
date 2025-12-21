export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, data, email } = req.body;

  if (!type || !data) {
    return res.status(400).json({ error: 'Missing type or data' });
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Airtable credentials not configured' });
  }

  try {
    let tableName;
    let fields;

    switch (type) {
      case 'quiz':
        tableName = 'quiz_responses';
        fields = {
          email: email,
          skills: Array.isArray(data.skills) ? data.skills.join(', ') : '',
          skillsOther: data.skillsOther || '',
          timeCommitment: data.timeCommitment || '',
          timeCommitmentOther: data.timeCommitmentOther || '',
          interests: Array.isArray(data.interests) ? data.interests.join(', ') : '',
          interestsOther: data.interestsOther || '',
          goal: data.goal || '',
          goalOther: data.goalOther || '',
          experience: data.experience || '',
          timestamp: new Date().toISOString(),
          type: 'quiz'
        };
        break;

      case 'idea_form':
        tableName = 'idea_form';
        fields = {
          email: email,
          businessType: data.businessType || '',
          businessTypeOther: data.businessTypeOther || '',
          problemSolving: data.problemSolving || '',
          targetCustomer: data.targetCustomer || '',
          timeCommitment: data.timeCommitment || '',
          timeCommitmentOther: data.timeCommitmentOther || '',
          skillsExperience: data.skillsExperience || '',
          timestamp: new Date().toISOString(),
          type: 'idea_form'
        };
        break;

      case 'action_plan_feedback':
        tableName = 'action_plan_feedback';
        fields = {
          email: email,
          selectedFeedback: Array.isArray(data.selectedFeedback) ? data.selectedFeedback.join(', ') : data.selectedFeedback || '',
          additionalComments: data.additionalComments || '',
          timestamp: new Date().toISOString(),
          type: 'action_plan_feedback'
        };
        break;

      case 'idea_limit_feedback':
        tableName = 'idea_limit_feedback';
        fields = {
          email: email,
          selectedFeedback: Array.isArray(data.selectedFeedback) ? data.selectedFeedback.join(', ') : data.selectedFeedback || '',
          otherFeedback: data.otherFeedback || '',
          timestamp: new Date().toISOString(),
          type: 'idea_limit_feedback'
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [
            {
              fields: fields
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Airtable error:', errorText);
      return res.status(500).json({ error: 'Failed to save data to Airtable', details: errorText });
    }

    const result = await response.json();
    console.log(`Saved ${type} data to Airtable:`, result.records[0].id);

    return res.status(200).json({
      success: true,
      id: result.records[0].id,
      message: `${type} data saved successfully`
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Failed to save data',
      details: error.message
    });
  }
}
