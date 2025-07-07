import { Worker } from 'bullmq';
import { createClient } from 'redis';
import { JobTypes } from 'shared';

// Redis connection
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redis.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

// Connect to Redis
redis.connect();

// Job worker
const worker = new Worker(
  'default',
  async (job) => {
    console.log(`Processing job: ${job.name} with data:`, job.data);
    
    switch (job.name) {
      case JobTypes.EXAMPLE_JOB:
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Example job completed');
        return { processed: true, timestamp: new Date().toISOString() };
      
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  },
  { 
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    }
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log('Worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  await redis.quit();
  process.exit(0);
});