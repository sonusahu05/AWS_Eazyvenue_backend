const redis = require('redis');
const config = require('config');
const logger = require('../utils/logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  async connect() {
    try {
      const redisConfig = config.get('redis') || {};
      const redisUrl = redisConfig.url || process.env.REDIS_URL || 'redis://127.0.0.1:6379';
      
      this.client = redis.createClient({
        url: redisUrl,
        ...redisConfig.options,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.errorLog.error('Redis server refused connection');
            return new Error('Redis server refused connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            logger.errorLog.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > this.maxReconnectAttempts) {
            logger.errorLog.error('Redis max reconnect attempts reached');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('connect', () => {
        logger.infoLog.info('Redis client connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.client.on('ready', () => {
        logger.infoLog.info('Redis client ready');
      });

      this.client.on('error', (err) => {
        logger.errorLog.error('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.infoLog.info('Redis client disconnected');
        this.isConnected = false;
      });

      this.client.on('reconnecting', (attempt) => {
        logger.infoLog.info(`Redis client reconnecting attempt ${attempt}`);
        this.reconnectAttempts = attempt;
      });

      await this.client.connect();
      logger.infoLog.info('Redis connection established');
      
      return this.client;
    } catch (error) {
      logger.errorLog.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      logger.infoLog.info('Redis client disconnected gracefully');
    }
  }

  getClient() {
    return this.client;
  }

  isClientConnected() {
    return this.isConnected && this.client && this.client.isReady;
  }

  // Session management methods
  async setSession(sessionId, sessionData, expireInSeconds = 3600) {
    if (!this.isClientConnected()) {
      throw new Error('Redis client is not connected');
    }
    
    try {
      await this.client.setEx(
        `session:${sessionId}`, 
        expireInSeconds, 
        JSON.stringify(sessionData)
      );
      return true;
    } catch (error) {
      logger.errorLog.error('Error setting session:', error);
      throw error;
    }
  }

  async getSession(sessionId) {
    if (!this.isClientConnected()) {
      throw new Error('Redis client is not connected');
    }
    
    try {
      const sessionData = await this.client.get(`session:${sessionId}`);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      logger.errorLog.error('Error getting session:', error);
      throw error;
    }
  }

  async deleteSession(sessionId) {
    if (!this.isClientConnected()) {
      throw new Error('Redis client is not connected');
    }
    
    try {
      await this.client.del(`session:${sessionId}`);
      return true;
    } catch (error) {
      logger.errorLog.error('Error deleting session:', error);
      throw error;
    }
  }

  // Cache management methods
  async set(key, value, expireInSeconds = null) {
    if (!this.isClientConnected()) {
      throw new Error('Redis client is not connected');
    }
    
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (expireInSeconds) {
        await this.client.setEx(key, expireInSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      logger.errorLog.error('Error setting cache:', error);
      throw error;
    }
  }

  async get(key) {
    if (!this.isClientConnected()) {
      throw new Error('Redis client is not connected');
    }
    
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      
      try {
        return JSON.parse(value);
      } catch {
        return value; // Return as string if not JSON
      }
    } catch (error) {
      logger.errorLog.error('Error getting cache:', error);
      throw error;
    }
  }

  async del(key) {
    if (!this.isClientConnected()) {
      throw new Error('Redis client is not connected');
    }
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.errorLog.error('Error deleting cache:', error);
      throw error;
    }
  }

  async exists(key) {
    if (!this.isClientConnected()) {
      throw new Error('Redis client is not connected');
    }
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.errorLog.error('Error checking key existence:', error);
      throw error;
    }
  }

  async expire(key, seconds) {
    if (!this.isClientConnected()) {
      throw new Error('Redis client is not connected');
    }
    
    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      logger.errorLog.error('Error setting expiration:', error);
      throw error;
    }
  }

  // Rate limiting helper
  async incrementCounter(key, expireInSeconds = 60) {
    if (!this.isClientConnected()) {
      throw new Error('Redis client is not connected');
    }
    
    try {
      const multi = this.client.multi();
      multi.incr(key);
      multi.expire(key, expireInSeconds);
      const results = await multi.exec();
      return results[0]; // Return the incremented value
    } catch (error) {
      logger.errorLog.error('Error incrementing counter:', error);
      throw error;
    }
  }

  // Health check method
  async healthCheck() {
    try {
      if (!this.isClientConnected()) {
        return { status: 'disconnected', error: 'Redis client is not connected' };
      }
      
      await this.client.ping();
      return { 
        status: 'connected', 
        isReady: this.client.isReady,
        reconnectAttempts: this.reconnectAttempts 
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down Redis connection...');
  await redisClient.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down Redis connection...');
  await redisClient.disconnect();
  process.exit(0);
});

module.exports = redisClient;
