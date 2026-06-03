import { describe, it, expect } from 'vitest';
import { buildCoverPrompt } from '../images/cover.js';

describe('buildCoverPrompt', () => {
  it('fills the scene deterministically from week context, leaving no placeholder', () => {
    const prompt = buildCoverPrompt({ topRepo: 'trx', languages: ['Rust', 'TypeScript'], highlight: '50 issues open' });
    expect(prompt).toContain('rainy');
    expect(prompt).toContain('Discord');
    expect(prompt).toContain('trx');
    expect(prompt).toContain('Rust');
    expect(prompt).toContain('50 issues open');
    expect(prompt).not.toContain('{context}');
  });

  it('falls back gracefully with no context', () => {
    const prompt = buildCoverPrompt({});
    expect(prompt).not.toContain('{context}');
    expect(prompt).toContain('rainy');
  });
});
