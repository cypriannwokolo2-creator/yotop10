import mongoose, { Schema, Document } from 'mongoose';

export interface IQuickReply extends Document {
  label: string;
  message: string;
}

const quickReplySchema = new Schema<IQuickReply>({
  label: { type: String, required: true },
  message: { type: String, required: true },
});

export const QuickReply = mongoose.model<IQuickReply>('QuickReply', quickReplySchema);
