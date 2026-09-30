import { z } from 'zod';

export const REACTION_TARGET_TYPES = ['comment', 'post', 'list_item'] as const;

export const reactionToggleSchema = z.object({
  target_type: z.enum(REACTION_TARGET_TYPES),
  target_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid target ID'),
});

export const reactionStateQuerySchema = z.object({
  targets: z.string()
    .min(1)
    .max(2000, 'Too many targets requested')
    .refine(
      (raw) => {
        try {
          const parsed: unknown = JSON.parse(raw);
          return (
            Array.isArray(parsed) &&
            parsed.length <= 50 &&
            parsed.every(
              (t) =>
                typeof t === 'object' &&
                t !== null &&
                typeof (t as { type?: unknown }).type === 'string' &&
                REACTION_TARGET_TYPES.includes((t as { type: 'comment' | 'post' | 'list_item' }).type) &&
                typeof (t as { id?: unknown }).id === 'string' &&
                /^[0-9a-fA-F]{24}$/.test((t as { id: string }).id)
            )
          );
        } catch {
          return false;
        }
      },
      { message: 'Invalid targets format' }
    ),
});

export const reactionTargetParamsSchema = z.object({
  targetType: z.enum(REACTION_TARGET_TYPES),
  targetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid target ID'),
});

export type ReactionToggleBody = z.infer<typeof reactionToggleSchema>;
export type ReactionTargetParams = z.infer<typeof reactionTargetParamsSchema>;
