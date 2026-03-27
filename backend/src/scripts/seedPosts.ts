import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { ListItem } from '../models/ListItem';
import { Category } from '../models/Category';

dotenv.config();

const samplePosts = [
  {
    title: 'Top 10 Greatest Football Players Ever',
    post_type: 'top_list',
    intro: 'A definitive ranking of the greatest footballers in history based on individual skill, achievements, and impact on the sport.',
    items: [
      { rank: 1, title: 'Lionel Messi', justification: 'Widely considered the greatest of all time with 8 Ballon d\'Or awards and countless records. His dribbling, vision, and goal-scoring ability are unmatched.' },
      { rank: 2, title: 'Cristiano Ronaldo', justification: 'The ultimate competitor with 5 Champions League titles, all-time leading scorer in football, and unmatched physical attributes and work ethic.' },
      { rank: 3, title: 'Pelé', justification: 'The original king of football with 3 World Cup titles and over 1000 career goals. His talent and achievements span three decades.' },
      { rank: 4, title: 'Diego Maradona', justification: 'The magician who carried Argentina to World Cup glory with his extraordinary dribbling. The 1986 World Cup was his personal masterpiece.' },
      { rank: 5, title: 'Johan Cruyff', justification: 'The total football pioneer whose influence on the sport extends beyond his playing days. His philosophy shaped modern football.' },
      { rank: 6, title: 'Michel Platini', justification: 'The elegant midfielder who dominated European football in the 1980s with three consecutive Ballon d\'Or wins.' },
      { rank: 7, title: 'Franz Beckenbauer', justification: 'The sweeper who revolutionized defending and led West Germany to World Cup glory. A complete player ahead of his time.' },
      { rank: 8, title: 'Alfredo Di Stefano', justification: 'The complete player who defined an era with Real Madrid\'s five consecutive European Cup victories. Played for three nations.' },
      { rank: 9, title: 'Zinedine Zidane', justification: 'The graceful playmaker who delivered in every major tournament for France and Real Madrid. Pure artistry on the ball.' },
      { rank: 10, title: 'Ronaldo Nazário', justification: 'The most complete striker ever, combining pace, skill, and finishing like no one else. Before injuries, he was unstoppable.' }
    ]
  }
];

async function seedPosts() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yotop10';
  
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    // Get the Football (Soccer) child category under Sports & Athletics
    const footballCategory = await Category.findOne({ name: 'Football (Soccer)' });
    if (!footballCategory) {
      console.log('Football category not found. Run seed:categories first!');
      console.log('Looking for Sports & Athletics parent...');
      
      const sportsParent = await Category.findOne({ slug: 'sports-athletics' });
      if (sportsParent) {
        console.log(`Found Sports & Athletics parent: ${sportsParent._id}`);
        console.log('Children:', await Category.find({ parent_id: sportsParent._id }).select('name'));
      }
      return;
    }
    console.log(`Using category: ${footballCategory.name} (${footballCategory._id})`);
    
    // Create sample user
    let user = await User.findOne({ username: 'any_sport' });
    if (!user) {
      user = await User.create({
        user_id: crypto.randomBytes(4).toString('hex'),
        username: 'any_sport',
        custom_display_name: 'FootballFan',
        device_fingerprint: 'seed_fp_sport',
        is_admin: false,
      });
      console.log(`Created user: ${user.username}`);
    }
    
    // Check if post already exists
    const existingPost = await Post.findOne({ title: samplePosts[0].title });
    if (existingPost) {
      console.log(`Post already exists: ${existingPost.title}`);
      console.log('To re-seed, delete the post first or update the seed script to allow overwrites.');
      console.log('\n✅ Seed already done!');
      return;
    }
    
    const postData = samplePosts[0];
    
    const post = await Post.create({
      author_id: user.user_id,
      author_username: user.username,
      author_display_name: user.custom_display_name || user.username,
      title: postData.title,
      post_type: postData.post_type,
      intro: postData.intro,
      status: 'approved',
      category_id: footballCategory._id,
      fire_count: 42,
      comment_count: 0,
      view_count: 156,
      published_at: new Date(),
    });
    
    console.log(`Created post: ${post.title}`);
    console.log(`  Category: ${footballCategory.name} (child of Sports & Athletics)`);
    
    // Create list items
    for (const item of postData.items) {
      await ListItem.create({
        post_id: post._id,
        rank: item.rank,
        title: item.title,
        justification: item.justification,
        fire_count: Math.floor(Math.random() * 20),
      });
    }
    console.log(`  Added ${postData.items.length} list items`);
    
    console.log('\n✅ Seed completed successfully!');
    console.log(`Created 1 post: "${post.title}"`);
    console.log(`Category: ${footballCategory.name} → Sports & Athletics`);
    console.log('\nView at: /post/' + post._id.toString() + ' or /c/football-soccer');
    
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedPosts();