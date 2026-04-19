import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { calculateTrustScore } from '../lib/trustScore';

dotenv.config({ path: '../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yotop10';

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const users = await User.find({});
    console.log(`Found ${users.length} users. Recalculating trust scores...`);

    for (const user of users) {
      const score = await calculateTrustScore(user.user_id);
      console.log(`User ${user.username}: ${score.toFixed(2)}`);
    }

    console.log('Recalculation complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
