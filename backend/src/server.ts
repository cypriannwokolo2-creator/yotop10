import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
// DNS import removed - using direct URIs only
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { setRedisClient } from './lib/redis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';

// Load environment variables from root .env (then fallback to backend/.env)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const maskMongoUri = (uri: string) => {
  try {
    const u = new URL(uri);
    if (u.password) u.password = '*****';
    if (u.username && u.username.length > 20) u.username = u.username.slice(0, 20) + '...';
    return u.toString();
  } catch (_e) {
    return uri.replace(/:(.*)@/, ':*****@');
  }
};

// Simple connection URIs from env
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/yotop10';
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200';

let mongoConnected = false;

const connectMongo = async () => {
  if (MONGODB_URI.includes('<') || MONGODB_URI.includes('>')) {
    throw new Error('MongoDB URI contains placeholder tokens - please provide a valid URI');
  }

  console.log('🔎 Connecting to MongoDB:', maskMongoUri(MONGODB_URI));
  
  await mongoose.connect(MONGODB_URI);
  
  // Set up connection event handlers for auto-reconnect
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
    mongoConnected = true;
  });
  
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected - will auto-reconnect when available');
    mongoConnected = false;
  });
  
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });
  
  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
    mongoConnected = true;
  });
  
  mongoConnected = true;
};

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value == null) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let redisConnected = false;
let esConnected = false;

const connectRedisWithRetry = async () => {
  const maxConnectAttempts = Number(process.env.REDIS_CONNECT_RETRIES || 10);
  const baseDelayMs = Number(process.env.REDIS_RETRY_DELAY_MS || 1500);

  const redisClient = createClient({
    url: REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        const delay = Math.min(30_000, 500 * Math.pow(2, retries));
        console.log(`🔁 Redis auto-reconnect attempt ${retries}, next retry in ${delay}ms`);
        return delay;
      },
      connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 10_000),
    },
  });

  redisClient.on('connect', () => {
    console.log('🔌 Redis client connecting...');
  });
  
  redisClient.on('ready', () => {
    console.log('✅ Redis ready');
    redisConnected = true;
  });
  
  redisClient.on('reconnecting', () => {
    console.warn('⚠️ Redis reconnecting...');
    redisConnected = false;
  });
  
  redisClient.on('end', () => {
    console.warn('⚠️ Redis connection ended');
    redisConnected = false;
  });
  
  redisClient.on('error', (err) => {
    console.error('❌ Redis Client Error:', err.message);
  });

  for (let attempt = 1; attempt <= maxConnectAttempts; attempt++) {
    try {
      console.log(`🔎 Redis connect attempt ${attempt}/${maxConnectAttempts}: ${REDIS_URL}`);
      await redisClient.connect();
      return redisClient;
    } catch (error) {
      if (attempt === maxConnectAttempts) throw error;
      const delay = Math.min(30_000, baseDelayMs * attempt);
      console.warn(`⚠️ Redis connect failed (attempt ${attempt}). Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw new Error('Redis connection retries exhausted');
};

const connectElasticsearchWithRetry = async () => {
  const maxRetries = Number(process.env.ELASTICSEARCH_CONNECT_RETRIES || 20);
  const baseDelayMs = Number(process.env.ELASTICSEARCH_RETRY_DELAY_MS || 2000);
  const esRequired = parseBoolean(
    process.env.ELASTICSEARCH_REQUIRED,
    process.env.NODE_ENV === 'production'
  );

  const esClient = new ElasticsearchClient({
    node: ELASTICSEARCH_URL,
    requestTimeout: Number(process.env.ELASTICSEARCH_REQUEST_TIMEOUT_MS || 30_000),
    maxRetries: Number(process.env.ELASTICSEARCH_CLIENT_MAX_RETRIES || 5),
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await esClient.ping();
      console.log('✅ Connected to Elasticsearch');
      esConnected = true;
      
      // Set up periodic health check for auto-reconnect detection
      const healthCheckInterval = setInterval(async () => {
        try {
          await esClient.ping();
          if (!esConnected) {
            console.log('✅ Elasticsearch reconnected');
            esConnected = true;
          }
        } catch (err) {
          if (esConnected) {
            console.warn('⚠️ Elasticsearch connection lost - will retry automatically');
            esConnected = false;
          }
        }
      }, 30000); // Check every 30 seconds
      
      // Store interval for cleanup if needed
      (esClient as any)._healthCheckInterval = healthCheckInterval;
      
      return esClient;
    } catch (error) {
      if (attempt === maxRetries) {
        if (esRequired) {
          throw new Error(`Failed to connect to Elasticsearch after ${maxRetries} attempts`);
        }
        console.warn('⚠️ Elasticsearch unavailable, continuing without hard failure (ELASTICSEARCH_REQUIRED=false).');
        esConnected = false;
        return esClient;
      }

      const delay = Math.min(30_000, baseDelayMs * Math.pow(1.5, attempt - 1));
      console.warn(`⚠️ Elasticsearch connection attempt ${attempt}/${maxRetries} failed, retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }
};

const app: Application = express();
const PORT = process.env.PORT || 8000;

// Global service references for health checks and route access
let esClientRef: any = null;

// Middleware
app.use(helmet());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3100', 'http://127.0.0.1:3100'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fingerprint middleware - runs on all API routes
import { fingerprintMiddleware } from './middleware/fingerprint';
app.use('/api', fingerprintMiddleware);

// Health check endpoint - basic
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Enhanced health check with service status
app.get('/api/health/detailed', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: {
        connected: mongoConnected,
        state: mongoose.connection.readyState === 1 ? 'connected' : 
               mongoose.connection.readyState === 2 ? 'connecting' :
               mongoose.connection.readyState === 3 ? 'disconnecting' : 'disconnected'
      },
      redis: {
        connected: redisConnected,
      },
      elasticsearch: {
        connected: esConnected,
      }
    }
  });
});

// API Routes (to be implemented)
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import postsRoutes from './routes/posts';
import listingsRoutes from './routes/listings';
import categoriesRoutes from './routes/categories';
import searchRoutes from './routes/search';
import reviewsRoutes from './routes/reviews';
import commentsRoutes from './routes/comments';
import reactionsRoutes from './routes/reactions';
import adminRoutes from './routes/admin';
import exploreRoutes from './routes/explore';
import uploadRoutes from './routes/upload';

import notificationsRoutes from './routes/notifications';

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/reactions', reactionsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/upload', uploadRoutes); // Admin protected upload route
app.use('/api/explore', exploreRoutes);
app.use('/api', commentsRoutes);

// Serve static uploaded files locally
app.use('/uploads', express.static(path.resolve(__dirname, '../../public/uploads')));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Database connections
const connectDatabases = async () => {
  const mongoRequired = parseBoolean(
    process.env.MONGO_REQUIRED,
    process.env.NODE_ENV === 'production'
  );
  const redisRequired = parseBoolean(
    process.env.REDIS_REQUIRED,
    process.env.NODE_ENV === 'production'
  );

  // MongoDB connection
  try {
    await connectMongo();
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    if (mongoRequired) {
      console.error('❌ Failed to connect to MongoDB.');
      console.error('Error:', err instanceof Error ? err.message : err);
      console.error('Hints:');
      console.error('- Check MONGODB_URI environment variable');
      console.error('- Ensure MongoDB container is running: docker-compose ps');
      throw err;
    }
    console.warn('⚠️ MongoDB unavailable, continuing without hard failure (MONGO_REQUIRED=false).');
  }

  // Redis connection
  try {
    const redisClient = await connectRedisWithRetry();
    setRedisClient(redisClient as any);
    console.log('✅ Connected to Redis');
  } catch (redisError) {
    if (redisRequired) {
      throw redisError;
    }
    console.warn('⚠️ Redis unavailable, continuing without hard failure (REDIS_REQUIRED=false).');
  }

  // Elasticsearch connection
  try {
    esClientRef = await connectElasticsearchWithRetry();
  } catch (esError) {
    // ES already handles its own required/non-required logic inside the function
    esClientRef = null;
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDatabases();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Export helpers for checking service status from other files
export const isMongoReady = () => mongoConnected;
export const isRedisReady = () => redisConnected;
export const isElasticsearchReady = () => esConnected;
export const getElasticsearchClient = () => esClientRef;

export default app;
