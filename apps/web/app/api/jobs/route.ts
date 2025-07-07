import { NextRequest, NextResponse } from 'next/server';
import { Queue } from 'bullmq';
import { JobTypes, createJobId, formatTimestamp } from 'shared';

// Create job queue connection
const jobQueue = new Queue('default', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !Object.values(JobTypes).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid job type' },
        { status: 400 }
      );
    }

    const jobId = createJobId(type);
    const job = await jobQueue.add(type, {
      ...data,
      id: jobId,
      timestamp: formatTimestamp(new Date()),
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Job queued successfully',
    });
  } catch (error) {
    console.error('Error queueing job:', error);
    return NextResponse.json(
      { error: 'Failed to queue job' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const waiting = await jobQueue.getWaiting();
    const active = await jobQueue.getActive();
    const completed = await jobQueue.getCompleted();
    const failed = await jobQueue.getFailed();

    return NextResponse.json({
      stats: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      },
      jobs: {
        waiting: waiting.map(job => ({
          id: job.id,
          name: job.name,
          data: job.data,
          timestamp: job.timestamp,
        })),
        active: active.map(job => ({
          id: job.id,
          name: job.name,
          data: job.data,
          timestamp: job.timestamp,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching job stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job stats' },
      { status: 500 }
    );
  }
}