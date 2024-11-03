const { MongoClient } = require('mongodb');
const redis = require('./redis');

let client;
let db;

async function connectToDatabase() {
  if (db) return db;

  client = await MongoClient.connect(process.env.MONGODB_URI, {
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

module.exports = { connectToDatabase, getDb: () => db };