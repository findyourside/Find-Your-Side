import { MongoClient } from 'mongodb';

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();
  cachedClient = client;
  return client;
}

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

  try {
    const client = await connectToDatabase();
    const db = client.db('findyourside');
    let collection;
    let document;

    switch (type) {
      case 'quiz':
        collection = db.collection('findyourside');
        document = {
          type: 'quiz',
          email,
          skills: data.skills,
          skillsOther: data.skillsOther,
          timeCommitment: data.timeCommitment,
          timeCommitmentOther: data.timeCommitmentOther,
          budget: data.budget,
          interests: data.interests,
          interestsOther: data.interestsOther,
          goal: data.goal,
          goalOther: data.goalOther,
          experience: data.experience,
          timestamp: new Date(),
          source: 'quiz_generator'
        };
        break;

      case 'playbook_feedback':
        collection = db.collection('findyourside');
        document = {
          type: 'playbook_feedback',
          email,
          playbookId: data.playbookId,
          businessName: data.businessName,
          feedback: data.feedback,
          additionalComments: data.additionalComments,
          timestamp: new Date(),
          source: 'playbook_download'
        };
        break;

      case 'idea_limit_feedback':
        collection = db.collection('findyourside');
        document = {
          type: 'idea_limit_feedback',
          email,
          selectedFeedback: data.selectedFeedback,
          otherFeedback: data.otherFeedback,
          timestamp: new Date(),
          source: 'idea_limit_modal',
          ideaSetsUsed: data.ideaSetsUsed
        };
        break;

      case 'playbook_generation':
        collection = db.collection('findyourside');
        document = {
          type: 'playbook_generation',
          email,
          idea: data.idea,
          timeCommitment: data.timeCommitment,
          budget: data.budget,
          skills: data.skills,
          playbookId: data.playbookId,
          timestamp: new Date(),
          source: 'playbook_generator'
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    const result = await collection.insertOne(document);
    console.log(`Saved ${type} data:`, result.insertedId);

    return res.status(200).json({
      success: true,
      id: result.insertedId,
      message: `${type} data saved successfully`
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      error: 'Failed to save data',
      details: error.message
    });
  }
}
