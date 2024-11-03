import { MongoClient } from 'mongodb';
import redis from './redis.js';

let client;
let db;

async function connectToDatabase() {
  if (db) return db;

  const uri = process.env.MONGODB_URI || 'mongodb://sshlay:sshlay_password@localhost:27017';

  client = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  db = client.db();

  // Test Redis connection
  try {
    await redis.ping();
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }

  console.log('Connected to MongoDB');
  return db;
}

const getDb = () => db;

export { connectToDatabase, getDb };
