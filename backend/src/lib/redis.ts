import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

/**
 * Get or create the Redis client singleton.
 * Must be called after the server has connected to Redis.
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  redisClient = createClient({ url: redisUrl }) as RedisClientType;
  redisClient.on('error', (err) => console.error('[Redis Singleton] Error:', err));

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
}

/**
 * Set the Redis client from server.ts (avoids double connection).
 */
export function setRedisClient(client: RedisClientType) {
  redisClient = client;
}
