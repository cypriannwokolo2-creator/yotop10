export const EDIT_REASONS = [
  'Fixed factual error',
  'Corrected title clarity',
  'Replaced broken or missing image',
  'Added missing sources',
  'Corrected ranking order',
  'Removed policy-violating content',
] as const;

export type EditReasonPreset = (typeof EDIT_REASONS)[number];

export const MAX_EDIT_REASON_LENGTH = 500;

export function normalizeEditReason(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim().replace(/\s+/g, ' ');
  if (trimmed.length === 0 || trimmed.length > MAX_EDIT_REASON_LENGTH) return null;
  return trimmed;
}

export function isValidEditReason(input: unknown): boolean {
  return normalizeEditReason(input) !== null;
}
