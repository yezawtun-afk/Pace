import { format } from 'date-fns';

/**
 * Builds the storage path for a proof photo.
 *
 * Format: `{user_id}/{yyyy-mm}/{uuid}.jpg`
 *
 * The first folder is the user id so the storage RLS policy can compare it to
 * `auth.uid()`. The month folder keeps the bucket tidy; the uuid avoids
 * collisions when a habit is checked off more than once in a month (it
 * cannot be, but tasks can be re-completed).
 */
export function buildProofPath(userId: string, date: Date = new Date()): string {
  if (!userId) throw new Error('A user id is required to build a proof path.');

  const month = format(date, 'yyyy-MM');
  const uuid = generateUuid();
  return `${userId}/${month}/${uuid}.jpg`;
}

/** Small, dependency-free uuid v4. Good enough for file names. */
function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID.
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** True when a habit should offer a proof photo on check-off. */
export function shouldAskForProof(habit: { ask_for_proof?: boolean | null }): boolean {
  return habit.ask_for_proof === true;
}
