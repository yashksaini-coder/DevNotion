import { describe, it, expect } from 'vitest';
import { weeklyDispatchWorkflow } from '../workflows/weekly-dispatch.workflow.js';

describe('weeklyDispatchWorkflow', () => {
  it('has correct workflow metadata', () => {
    expect(weeklyDispatchWorkflow.id).toBe('weekly-dispatch');
  });

  it('is a committed, defined workflow', () => {
    expect(weeklyDispatchWorkflow).toBeDefined();
  });
});
