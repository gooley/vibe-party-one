// Job type definitions
export enum JobTypes {
  EXAMPLE_JOB = 'example-job',
  // Add more job types as needed
}

// Shared types
export interface ExampleJobData {
  message: string;
  timestamp: Date;
}

export interface JobResult {
  processed: boolean;
  timestamp: string;
}

// Utility functions
export const createJobId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatTimestamp = (date: Date): string => {
  return date.toISOString();
};