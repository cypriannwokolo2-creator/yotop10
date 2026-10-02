import { Schema, Document } from 'mongoose';
import { registerModel } from '../lib/modelRegistry';

export interface IUser extends Document {
  user_id: string;
  username: string;
  custom_display_name?: string;
  short_username?: string;
  // Robust separate model: default never changes, custom is flexible 3-32
  default_username?: string;
  default_short?: string;
  custom_short?: string;
  device_fingerprint?: string;
  device_fingerprint_aliases?: string[];
  // M41.1 auth fields (docs/plans-auth-m41.md §3)
  email?: string;
  password_hash?: string;
  email_verified_at?: Date;
  token_version: number;
  trusted_devices: Array<{
    id_hash: string;
    created_at: Date;
    last_seen_at: Date;
  }>;
  two_factor: {
    enabled: boolean;
    secret?: string;
    recovery_codes_hash?: string[];
  };
  legacy_anonymous: boolean;
  trust_score: number;
  trust_version: number;
  trust_locked: boolean;
  trust_level?: 'newbie' | 'ghost' | 'troll' | 'neutral' | 'scholar';
  is_admin: boolean;
  authority_id?: string;
  public_key_hash?: string;
  seed_generated_at?: Date;
  profile_image_url?: string;
  bio?: string;
  links?: {
    medium?: string;
    x?: string;
    github?: string;
  };
  rate_limit_override?: {
    posts_per_hour?: number | null;
    comments_per_hour?: number | null;
  };
  active_boost?: {
    posts: number;
    comments: number;
    expires_at: Date;
  };
  last_boost_granted_at?: Date;
  restricted_until?: Date | null;
  last_50_reviews: Array<{
    status: 'approved' | 'rejected';
    timestamp: Date;
  }>;
  created_at: Date;
  updated_at: Date;
}

const userSchema = new Schema<IUser>(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    custom_display_name: {
      type: String,
      sparse: true,
      // ROM 2.8: canonical display-name slot. Unique so two
      // concurrent renames to the same name cannot both commit
      // (the route's findOne availability check alone is racy).
      // Enforced at boot by the userAuth migration so it exists
      // even when autoIndex is off.
      unique: true,
    },
    short_username: {
      type: String,
      sparse: true,
      // ROM 2.8: canonical short-handle slot. Unique for the
      // same reason as custom_display_name.
      unique: true,
    },
    default_username: {
      type: String,
      sparse: true,
    },
    default_short: {
      type: String,
      sparse: true,
    },
    custom_short: {
      type: String,
      sparse: true,
    },
  device_fingerprint: {
    type: String,
    // M41.1: optional + non-unique. Auth users have no fingerprint, so
    // the M11/M15 unique constraint is dropped by the userAuth boot
    // migration (lib/migrations/userAuth.ts). The field remains for the
    // legacy fingerprint middleware until M41.2 removes it.
  },
    // Retired fingerprints that still resolve to this user (e.g. after a
    // security rotation). Looked up on every request; the cookie is then
    // re-bound to device_fingerprint, so aliases are strictly transitional.
    device_fingerprint_aliases: {
      type: [String],
      default: [],
    },
    // M41.1 auth fields (docs/plans-auth-m41.md §3)
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password_hash: {
      type: String,
    },
    email_verified_at: {
      type: Date,
    },
    token_version: {
      type: Number,
      default: 0,
    },
    trusted_devices: {
      type: [
        {
          id_hash: { type: String },
          created_at: { type: Date },
          last_seen_at: { type: Date },
        },
      ],
      default: [],
    },
    two_factor: {
      enabled: { type: Boolean, default: false },
      // TOTP secret, AES-256-GCM encrypted at rest (lib/totp.ts)
      secret: { type: String },
      // Hashed recovery codes (SHA-256); each is single-use
      recovery_codes_hash: [{ type: String }],
    },
    legacy_anonymous: {
      type: Boolean,
      default: false,
    },
    is_admin: {
      type: Boolean,
      default: false,
    },
    authority_id: {
      type: String,
      sparse: true,
      index: true,
    },
    public_key_hash: {
      type: String,
    },
    seed_generated_at: {
      type: Date,
    },
    profile_image_url: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
      trim: true,
    },
    links: {
      medium: { type: String, maxlength: 32, trim: true, match: /^[a-z0-9_]+$/i },
      x: { type: String, maxlength: 32, trim: true, match: /^[a-z0-9_]+$/i },
      github: { type: String, maxlength: 39, trim: true, match: /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i },
    },
    trust_score: {
      type: Number,
      default: 1.0,
      min: 0.1,
      max: 2.0,
    },
    trust_version: {
      type: Number,
      default: 0,
    },
    trust_locked: {
      type: Boolean,
      default: false,
    },
    trust_level: {
      type: String,
      enum: ['newbie', 'ghost', 'troll', 'neutral', 'scholar'],
      default: 'newbie',
    },
    last_50_reviews: {
      type: [{
        status: { type: String, enum: ['approved', 'rejected'] },
        timestamp: { type: Date },
      }],
      default: [],
    },
    rate_limit_override: {
      posts_per_hour: { type: Number, default: null },
      comments_per_hour: { type: Number, default: null },
    },
    active_boost: {
      posts: { type: Number },
      comments: { type: Number },
      expires_at: { type: Date },
    },
    last_boost_granted_at: { type: Date },
    restricted_until: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes for efficient queries
userSchema.index({ updated_at: -1 });
userSchema.index({ trust_score: 1 });
// short_username's index comes from the field-level unique
// declaration above; declaring it again here would collide on
// the index name with different options.
userSchema.index({ default_short: 1 }, { sparse: true });
userSchema.index({ custom_short: 1 }, { sparse: true });
userSchema.index({ default_username: 1 }, { sparse: true });

export const User = registerModel<IUser>('User', userSchema);
