import mongoose, { Schema, Document } from 'mongoose';

export interface IUserNotification extends Document {
  author_id: string; // The Scholar/User ID (fingerprint or unique id)
  type: 'approved' | 'rejected' | 'info';
  post_title: string;
  message: string;
  reason?: string;
  read: boolean;
  created_at: Date;
}

const userNotificationSchema = new Schema<IUserNotification>({
  author_id: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['approved', 'rejected', 'info'] },
  post_title: { type: String, required: true },
  message: { type: String, required: true },
  reason: { type: String },
  read: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

export const UserNotification = mongoose.model<IUserNotification>('UserNotification', userNotificationSchema);
