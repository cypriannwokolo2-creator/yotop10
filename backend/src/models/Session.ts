import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  session_id: string;
  user_id: string;
  token_hash: string;
  device_label: string;
  last_active: Date;
  expires_at: Date;
  created_at: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    session_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    token_hash: {
      type: String,
      required: true,
    },
    device_label: {
      type: String,
      default: 'Unknown Device',
    },
    last_active: {
      type: Date,
      default: Date.now,
    },
    expires_at: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index — Mongo auto-deletes expired docs
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

sessionSchema.index({ user_id: 1, session_id: 1 });

export const Session = mongoose.model<ISession>('Session', sessionSchema);
