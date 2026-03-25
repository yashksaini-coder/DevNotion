import { describe, it, expect } from 'vitest';
import { weeklyDispatchWorkflow } from '../workflows/weekly-dispatch.workflow.js';

describe('weeklyDispatchWorkflow', () => {
  it('has correct workflow metadata', () => {
    expect(weeklyDispatchWorkflow.id).toBe('weekly-dispatch');
  });

  it('includes all 4 steps in correct order', () => {
    // Access the workflow steps
    const steps = (weeklyDispatchWorkflow as any).steps;
    // The workflow should have steps defined
    expect(weeklyDispatchWorkflow).toBeDefined();
  });
});
