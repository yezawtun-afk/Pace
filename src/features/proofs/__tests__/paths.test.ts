import { buildProofPath, shouldAskForProof } from '../paths';

describe('buildProofPath', () => {
  it('starts with the user id', () => {
    const path = buildProofPath('user-123', new Date(2026, 10, 11));
    expect(path.startsWith('user-123/')).toBe(true);
  });

  it('contains a yyyy-mm folder', () => {
    const path = buildProofPath('user-123', new Date(2026, 10, 11));
    expect(path).toMatch(/user-123\/2026-11\//);
  });

  it('ends with .jpg', () => {
    const path = buildProofPath('user-123', new Date(2026, 10, 11));
    expect(path.endsWith('.jpg')).toBe(true);
  });

  it('generates unique paths', () => {
    const a = buildProofPath('user-123', new Date(2026, 10, 11));
    const b = buildProofPath('user-123', new Date(2026, 10, 11));
    expect(a).not.toBe(b);
  });

  it('throws without a user id', () => {
    expect(() => buildProofPath('')).toThrow();
  });
});

describe('shouldAskForProof', () => {
  it('is true only when ask_for_proof is exactly true', () => {
    expect(shouldAskForProof({ ask_for_proof: true })).toBe(true);
    expect(shouldAskForProof({ ask_for_proof: false })).toBe(false);
    expect(shouldAskForProof({ ask_for_proof: null })).toBe(false);
    expect(shouldAskForProof({})).toBe(false);
  });
});
