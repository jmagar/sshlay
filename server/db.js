import { MongoClient } from 'mongodb';
import redis from './redis.js';

let client;
let db;

/**
 * Connects to MongoDB and Redis databases
 * Handles connection pooling and authentication
 * @returns {Promise<Db>} MongoDB database instance
 */
async function connectToDatabase() {
  if (db) return db;

  try {
    // MongoDB connection with auth and database name
    const uri = process.env.MONGODB_URI || 'mongodb://sshlay:sshlay_password@localhost:27017/sshlay?authSource=admin';

    client = await MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    db = client.db('sshlay'); // Explicitly specify database name

    console.log('Connected to MongoDB successfully');

    // Test Redis connection
    try {
      await redis.ping();
      console.log('Connected to Redis successfully');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error; // Re-throw to be caught by outer try-catch
    }

    return db;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

/**
 * Gets the current database instance
 * @returns {Db|undefined} MongoDB database instance if connected
 */
const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase() first.');
  }
  return db;
};

/**
 * Closes all database connections
 * Should be called when shutting down the application
 */
async function closeDatabase() {
  try {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }

    // Only try to quit Redis if it's connected
    if (redis && redis.status === 'ready') {
      await redis.quit();
      console.log('Redis connection closed');
    }
  } catch (error) {
    console.error('Error closing database connections:', error);
    // Don't throw the error, just log it
  }
}

export { connectToDatabase, getDb, closeDatabase };
