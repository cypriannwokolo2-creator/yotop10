import mongoose, { Schema, Document } from 'mongoose';

export interface IGlobalSettings extends Document {
  min_ranking_items: number;
  max_ranking_items: number;
  allow_guest_submissions: boolean;
  auto_approve_scholars: boolean;
  updated_at: Date;
}

const globalSettingsSchema = new Schema<IGlobalSettings>(
  {
    min_ranking_items: { type: Number, default: 3 },
    max_ranking_items: { type: Number, default: 20 },
    allow_guest_submissions: { type: Boolean, default: true },
    auto_approve_scholars: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: false, updatedAt: 'updated_at' },
  }
);

// Ensure only one settings document exists
export const GlobalSettings = mongoose.model<IGlobalSettings>('GlobalSettings', globalSettingsSchema);

/**
 * Helper to get settings with defaults if none exist
 */
export const getSettings = async (): Promise<IGlobalSettings> => {
  let settings = await GlobalSettings.findOne();
  if (!settings) {
    settings = await GlobalSettings.create({});
  }
  return settings;
};
