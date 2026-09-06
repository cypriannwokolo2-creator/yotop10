import { Schema, Document } from 'mongoose';
import { registerModel } from '../lib/modelRegistry';

export interface IQuery extends Document {
  user_id: string;
  username: string;
  type: 'feature' | 'bug';
  message: string;
  status: 'new' | 'read' | 'archived';
  admin_reply?: string;
  replied_at?: Date;
  created_at: Date;
}

const querySchema = new Schema<IQuery>(
  {
    user_id: { type: String, required: true, index: true },
    username: { type: String, required: true },
    type: { type: String, enum: ['feature', 'bug'], required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['new', 'read', 'archived'], default: 'new', index: true },
    admin_reply: { type: String },
    replied_at: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

querySchema.index({ status: 1, created_at: -1 });

export const Query = registerModel<IQuery>('Query', querySchema);
