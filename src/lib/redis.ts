import Redis from 'ioredis';
import { getMockRedis } from './redis-mock';

// Check if Redis is disabled, URL is empty, or we're in build mode
const isRedisDisabled =
  process.env.REDIS_DISABLED === 'true' ||
  process.env.SKIP_REDIS === 'true' ||
  process.env.NETLIFY === 'true' ||
  !process.env.REDIS_URL ||
  process.env.NODE_ENV === 'production' && !process.env.REDIS_URL;

let redis: Redis | any = null;

// Only initialize Redis if not disabled and not in build mode
if (!isRedisDisabled && process.env.REDIS_URL && typeof window === 'undefined') {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    });

    // Add error handling
    redis.on('error', (error: any) => {
      console.error('Redis connection error:', error);
      // Fallback to mock Redis on error
      redis = getMockRedis();
    });

    // Optional: Add connection success logging
    redis.on('connect', () => {
      console.log('Connected to Redis successfully');
    });
  } catch (error) {
    console.log('Failed to initialize Redis, using mock Redis:', error);
    redis = getMockRedis();
  }
} else {
  console.log('Redis is disabled or in build mode - using mock Redis');
  redis = getMockRedis();
}

export default redis;
