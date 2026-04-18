import mongoose, { Schema, Document } from 'mongoose';

export interface IQuickReply extends Document {
  label: string;
  message: string;
  type: 'approve' | 'reject' | 'edit';
}

const quickReplySchema = new Schema<IQuickReply>({
  label: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true, enum: ['approve', 'reject', 'edit'], default: 'reject' },
});

export const QuickReply = mongoose.model<IQuickReply>('QuickReply', quickReplySchema);
