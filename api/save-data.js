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

  // Table ID mappings
  const TABLE_IDS = {
    quiz: 'tblEdTSqfMjgtTnbi',
    idea_form: 'tblNlieDwuh3Fuf2e',
    action_plan_feedback: 'tbla9clfyA1JnbiFM',
    idea_limit_feedback: 'tbloywxKj8pZ8mrhJ'
  };

  try {
    let tableId;
    let fields;

    switch (type) {
      case 'quiz':
        tableId = TABLE_IDS.quiz;
        fields = {
          Email: email,
          Skills: Array.isArray(data.skills) ? data.skills.join(', ') : '',
          'Skills (Other)': data.skillsOther || '',
          'Time Commitment': data.timeCommitment || '',
          'Time Commitment (Other)': data.timeCommitmentOther || '',
          Interests: Array.isArray(data.interests) ? data.interests.join(', ') : '',
          'Interests (Other)': data.interestsOther || '',
          Goal: data.goal || '',
          'Goal (Other)': data.goalOther || '',
          Experience: data.experience || '',
          Timestamp: new Date().toISOString(),
          Type: 'quiz'
        };
        break;

      case 'idea_form':
        tableId = TABLE_IDS.idea_form;
        fields = {
          Email: email,
          'Business Type': data.businessType || '',
          'Business Type (Other)': data.businessTypeOther || '',
          'Problem Solving': data.problemSolving || '',
          'Target Customer': data.targetCustomer || '',
          'Time Commitment': data.timeCommitment || '',
          'Time Commitment (Other)': data.timeCommitmentOther || '',
          'Skills Experience': data.skillsExperience || '',
          Timestamp: new Date().toISOString(),
          Type: 'idea_form'
        };
        break;

      case 'action_plan_feedback':
        tableId = TABLE_IDS.action_plan_feedback;
        fields = {
          Email: email,
          'Selected Feedback': Array.isArray(data.selectedFeedback) ? data.selectedFeedback.join(', ') : data.selectedFeedback || '',
          'Additional Comments': data.additionalComments || '',
          Timestamp: new Date().toISOString(),
          Type: 'action_plan_feedback'
        };
        break;

      case 'idea_limit_feedback':
        tableId = TABLE_IDS.idea_limit_feedback;
        fields = {
          Email: email,
          'Selected Feedback': Array.isArray(data.selectedFeedback) ? data.selectedFeedback.join(', ') : data.selectedFeedback || '',
          'Other Feedback': data.otherFeedback || '',
          Timestamp: new Date().toISOString(),
          Type: 'idea_limit_feedback'
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}`,
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
