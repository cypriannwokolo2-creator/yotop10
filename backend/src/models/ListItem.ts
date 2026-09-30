import mongoose, { Schema, Document } from 'mongoose';
import { registerModel } from '../lib/modelRegistry';

export interface IListItem extends Document {
  post_id: mongoose.Types.ObjectId;
  rank: number;
  title: string;
  justification?: string;
  image_url?: string;
  source_url?: string;
  fire_count: number;
  created_at: Date;
  updated_at: Date;
}

const listItemSchema = new Schema<IListItem>(
  {
    post_id: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    rank: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    justification: {
      type: String,
      default: '',
    },
    image_url: {
      type: String,
    },
    source_url: {
      type: String,
    },
    // Community fire votes on this item (see routes/reactions.ts). Mongoose
    // strict mode silently drops $inc on paths absent from the schema — the
    // field MUST exist here for the reaction counter to work.
    fire_count: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes for efficient queries
listItemSchema.index({ post_id: 1, rank: 1 });

export const ListItem = registerModel<IListItem>('ListItem', listItemSchema);
