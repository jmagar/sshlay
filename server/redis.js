import Redis from 'ioredis';

console.log('Initializing Redis connection...');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost', // Use localhost since we're connecting from host
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    console.log(`Redis retry attempt ${times}`);
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: null
});

redis.on('connect', () => {
  console.log('Connected to Redis successfully');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

redis.on('ready', () => {
  console.log('Redis client ready');
});

redis.on('reconnecting', () => {
  console.log('Redis client reconnecting');
});

// Test connection
redis.ping().then(() => {
  console.log('Redis PING successful');
}).catch(err => {
  console.error('Redis PING failed:', err);
});

export default redis;
