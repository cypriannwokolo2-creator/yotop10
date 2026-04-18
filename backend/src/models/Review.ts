import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  post_id: mongoose.Types.ObjectId;
  author_fingerprint: string;
  rating: number; // 1-5
  created_at: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    post_id: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    author_fingerprint: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

// Prevent duplicate reviews by same device on same post
reviewSchema.index({ post_id: 1, author_fingerprint: 1 }, { unique: true });

export const Review = mongoose.model<IReview>('Review', reviewSchema);
