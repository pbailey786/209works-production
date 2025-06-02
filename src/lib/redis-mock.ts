// Mock Redis client for development when Redis is disabled
export class MockRedis {
  private data: Map<string, any> = new Map();
  private connected = false;

  constructor() {
    // Simulate connection
    setTimeout(() => {
      this.connected = true;
      console.log('Mock Redis connected (development mode)');
    }, 100);
  }

  // Mock Redis methods
  async ping(): Promise<string> {
    if (!this.connected) throw new Error('Redis not connected');
    return 'PONG';
  }

  async get(key: string): Promise<string | null> {
    return this.data.get(key) || null;
  }

  async set(key: string, value: string): Promise<string> {
    this.data.set(key, value);
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    this.data.set(key, value);
    // In a real implementation, we'd set expiration
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    keys.forEach(key => {
      if (this.data.has(key)) {
        this.data.delete(key);
        deleted++;
      }
    });
    return deleted;
  }

  async exists(...keys: string[]): Promise<number> {
    return keys.filter(key => this.data.has(key)).length;
  }

  async keys(pattern: string): Promise<string[]> {
    // Simple pattern matching for development
    const allKeys = Array.from(this.data.keys());
    if (pattern === '*') return allKeys;
    
    // Convert Redis pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    
    return allKeys.filter(key => regex.test(key));
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    const set = this.data.get(key) || new Set();
    const initialSize = set.size;
    members.forEach(member => set.add(member));
    this.data.set(key, set);
    return set.size - initialSize;
  }

  async smembers(key: string): Promise<string[]> {
    const set = this.data.get(key) || new Set();
    return Array.from(set);
  }

  async expire(key: string, seconds: number): Promise<number> {
    // In development, we'll just ignore expiration
    return this.data.has(key) ? 1 : 0;
  }

  async quit(): Promise<string> {
    this.connected = false;
    this.data.clear();
    console.log('Mock Redis disconnected');
    return 'OK';
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  // Event emitter methods (simplified)
  on(event: string, callback: Function): void {
    if (event === 'connect') {
      setTimeout(callback, 100);
    } else if (event === 'ready') {
      setTimeout(callback, 150);
    }
  }

  // Pipeline mock (simplified)
  pipeline(): MockPipeline {
    return new MockPipeline(this);
  }
}

class MockPipeline {
  private commands: Array<() => Promise<any>> = [];

  constructor(private redis: MockRedis) {}

  setex(key: string, seconds: number, value: string): this {
    this.commands.push(() => this.redis.setex(key, seconds, value));
    return this;
  }

  sadd(key: string, ...members: string[]): this {
    this.commands.push(() => this.redis.sadd(key, ...members));
    return this;
  }

  expire(key: string, seconds: number): this {
    this.commands.push(() => this.redis.expire(key, seconds));
    return this;
  }

  del(...keys: string[]): this {
    this.commands.push(() => this.redis.del(...keys));
    return this;
  }

  async exec(): Promise<any[]> {
    const results = [];
    for (const command of this.commands) {
      try {
        const result = await command();
        results.push([null, result]);
      } catch (error) {
        results.push([error, null]);
      }
    }
    return results;
  }
}

// Export a singleton instance
let mockRedisInstance: MockRedis | null = null;

export function getMockRedis(): MockRedis {
  if (!mockRedisInstance) {
    mockRedisInstance = new MockRedis();
  }
  return mockRedisInstance;
}

export default getMockRedis();
