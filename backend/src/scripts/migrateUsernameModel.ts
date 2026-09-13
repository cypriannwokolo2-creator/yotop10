import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { toDefaultShort, toCustomShort, isDefaultFormat } from '../lib/username';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || `mongodb://${process.env.MONGO_USERNAME || 'yotop10_admin'}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST || 'mongodb'}:27017/${process.env.MONGO_DB || 'yotop10'}?authSource=admin`;

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to', MONGO_URI.split('@')[1] || MONGO_URI);

  const users = await User.find({}).lean();
  console.log(`Found ${users.length} users`);

  let fixedShort = 0;
  let fixedDefault = 0;

  for (const u of users) {
    const user = u as unknown as Record<string, unknown> & { user_id: string; username: string; custom_display_name?: string; short_username?: string; default_username?: string; default_short?: string; custom_short?: string };
    const updates: Record<string, unknown> = {};

    // Ensure default_username / default_short exist (snapshot of original a_xxxx_xxxx)
    if (!user.default_username) {
      // username at creation is default (a_xxxx_xxxx) — keep it
      const def = user.username;
      if (def && isDefaultFormat(def)) {
        updates.default_username = def;
        updates.default_short = toDefaultShort(def);
        fixedDefault++;
      } else if (def) {
        // Fallback: derive from user_id
        const derived = `a_${user.user_id.slice(0, 4)}_${user.user_id.slice(4, 8)}`;
        updates.default_username = derived;
        updates.default_short = toDefaultShort(derived);
        fixedDefault++;
      }
    } else if (!user.default_short && user.default_username) {
      updates.default_short = toDefaultShort(user.default_username as string);
      fixedDefault++;
    }

    // Fix custom_short / short_username for custom users (e.g. a_cutie was stored as a_cuti)
    if (user.custom_display_name) {
      const custom = user.custom_display_name as string;
      const expectedCustomShort = toCustomShort(custom);
      const expectedShort = expectedCustomShort; // flexible, full
      if (user.custom_short !== expectedCustomShort) {
        updates.custom_short = expectedCustomShort;
        fixedShort++;
      }
      if (user.short_username !== expectedShort) {
        // short_username should be custom_short when custom exists
        updates.short_username = expectedShort;
        fixedShort++;
      }
    } else {
      // No custom — short_username should be default_short
      const expectedDefaultShort = user.default_short ? user.default_short as string : (user.default_username ? toDefaultShort(user.default_username as string) : toDefaultShort(user.username));
      if (user.short_username !== expectedDefaultShort) {
        updates.short_username = expectedDefaultShort;
        fixedShort++;
      }
      if (!user.default_short && !updates.default_short) {
        const defShort = toDefaultShort(user.username);
        if (user.short_username !== defShort) {
          updates.short_username = defShort;
          fixedShort++;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await User.updateOne({ user_id: user.user_id }, { $set: updates });
      console.log(`Fixed ${user.user_id}: ${user.username} ${user.custom_display_name || ''} ->`, updates);
    }
  }

  console.log(`\nDone. fixedDefault: ${fixedDefault}, fixedShort: ${fixedShort}`);

  // Optionally backfill posts author_display_name for custom users (keep historical? Skipping by default)
  // Uncomment to backfill:
  // const posts = await mongoose.connection.db.collection('posts').find({}).toArray();
  // for (const p of posts) { ... }

  await mongoose.disconnect();
}

migrate().catch(e => { console.error(e); process.exit(1); });
