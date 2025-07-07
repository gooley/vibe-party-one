import { describe, it, expect } from 'vitest';
import { JobTypes, createJobId, formatTimestamp } from '../index';

describe('JobTypes', () => {
  it('should export expected job types', () => {
    expect(JobTypes.EXAMPLE_JOB).toBe('example-job');
  });
});

describe('createJobId', () => {
  it('should create a unique job ID with prefix', () => {
    const prefix = 'test';
    const jobId = createJobId(prefix);
    
    expect(jobId).toMatch(new RegExp(`^${prefix}-\\d+-[a-z0-9]+$`));
  });

  it('should create different IDs for subsequent calls', () => {
    const id1 = createJobId('test');
    const id2 = createJobId('test');
    
    expect(id1).not.toBe(id2);
  });
});

describe('formatTimestamp', () => {
  it('should format date as ISO string', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    const formatted = formatTimestamp(date);
    
    expect(formatted).toBe('2023-01-01T00:00:00.000Z');
  });
});