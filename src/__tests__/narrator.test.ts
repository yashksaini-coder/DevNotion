import { describe, it, expect } from 'vitest';
import { narratorAgent } from '../agents/narrator.agent.js';

describe('narratorAgent', () => {
  it('has correct agent metadata', () => {
    expect(narratorAgent.id).toBe('narrator-agent');
    expect(narratorAgent.name).toBe('narrator-agent');
  });

  it('exports a valid Agent instance', () => {
    expect(narratorAgent).toBeDefined();
    expect(typeof narratorAgent.generate).toBe('function');
  });
});
