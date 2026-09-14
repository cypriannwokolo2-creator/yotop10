// Proof-of-effort solver: finds a nonce such that
// SHA-256("<challenge_id>:<nonce>") has `difficulty` leading zero bits.
// Runs in small batches so the page stays responsive; a 20-bit challenge
// solves silently in ~1-3s once per device. Throws when SubtleCrypto is
// unavailable so callers fall back to guest mode.

export function hasLeadingZeroBits(digest: Uint8Array, bits: number): boolean {
  const fullBytes = Math.floor(bits / 8);
  for (let i = 0; i < fullBytes; i++) {
    if (digest[i] !== 0) return false;
  }
  const remaining = bits % 8;
  if (remaining === 0) return fullBytes <= digest.length;
  const next = digest[fullBytes];
  if (next === undefined) return false;
  return (next >> (8 - remaining)) === 0;
}

export async function solvePowChallenge(challenge_id: string, difficulty: number): Promise<string> {
  const subtle = typeof crypto !== 'undefined' ? crypto.subtle : undefined;
  if (!subtle) throw new Error('SubtleCrypto unavailable');
  const enc = new TextEncoder();
  let nonce = 0;
  for (;;) {
    for (let i = 0; i < 1000; i++, nonce++) {
      const digest = await subtle.digest('SHA-256', enc.encode(`${challenge_id}:${nonce}`));
      if (hasLeadingZeroBits(new Uint8Array(digest), difficulty)) return String(nonce);
    }
    await new Promise((r) => setTimeout(r, 0));
  }
}
