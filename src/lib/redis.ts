import Redis from 'ioredis';
import { getMockRedis } from './redis-mock';

// Check if Redis is disabled or URL is empty
const isRedisDisabled =
  process.env.REDIS_DISABLED === 'true' || !process.env.REDIS_URL;

let redis: Redis | any = null;

if (!isRedisDisabled && process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);

  // Add error handling
  redis.on('error', (error: any) => {
    console.error('Redis connection error:', error);
  });

  // Optional: Add connection success logging
  redis.on('connect', () => {
    console.log('Connected to Redis successfully');
  });
} else {
  console.log('Redis is disabled for development - using mock Redis');
  redis = getMockRedis();
}

export default redis;
