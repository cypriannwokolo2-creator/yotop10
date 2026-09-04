import mongoose from 'mongoose';
import crypto from 'crypto';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { Category } from '../models/Category';
import { createPost } from '../services/posts';

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yotop10';

const whoIsBetterPosts = [
  {
    title: 'Who Is Better: Jordan vs LeBron vs Kobe — The Final Verdict',
    intro: 'Three legends, one debate that has divided basketball fans for decades. Who is the true GOAT? We compare Jordan, LeBron, and Kobe across championships, stats, and impact.',
    category_slug: 'sports/basketball',
    items: [
      { rank: 1, title: 'Michael Jordan', justification: '6-0 in Finals, 5 MVPs, 10 scoring titles, perfect Finals record, cultural icon who made basketball global.' },
      { rank: 2, title: 'LeBron James', justification: 'All-time scoring leader, 4 MVPs, longevity record, versatility as playmaker and scorer, 20+ seasons elite.' },
      { rank: 3, title: 'Kobe Bryant', justification: '5 championships, 81-point game, Mamba Mentality, 2 Finals MVPs, inspired generation with work ethic.' },
    ],
  },
  {
    title: 'Who Is Better: Messi vs Ronaldo vs Pelé vs Maradona — Ultimate Ranking',
    intro: 'Four football gods, one crown. We settle the greatest footballer debate across eras with honest analysis of each legend.',
    category_slug: 'sports/football-soccer',
    items: [
      { rank: 1, title: 'Lionel Messi', justification: '8 Ballon dOr, World Cup 2022, most complete playmaker and scorer, vision and dribbling unmatched.' },
      { rank: 2, title: 'Cristiano Ronaldo', justification: '5 Champions Leagues, all-time Champions League scorer, 5 Ballon dOr, physical dominance across 3 leagues.' },
      { rank: 3, title: 'Pelé', justification: '3 World Cups, 1000+ goals, global ambassador who made football the world game.' },
    ],
  },
];

const hiddenGemsPosts = [
  {
    title: 'Top 10 Hidden Gems: Underrated Sci-Fi Movies Everyone Missed',
    intro: 'Beyond the blockbusters, these sci-fi masterpieces flew under the radar but deserve a spot in your watchlist.',
    category_slug: 'lifestyle/movies-tv-shows',
    items: [
      { rank: 1, title: 'Coherence (2013)', justification: 'Micro-budget mind-bender about parallel realities at a dinner party. One location, brilliant script.' },
      { rank: 2, title: 'Prospect (2018)', justification: 'Indie sci-fi western with stunning worldbuilding and Pedro Pascal before Mandalorian.' },
      { rank: 3, title: 'Under the Skin (2013)', justification: 'Scarlett Johansson as alien, haunting and visceral, unlike any sci-fi before.' },
      { rank: 4, title: 'The Man from Earth (2007)', justification: 'Single room, pure dialogue sci-fi about a man who claims to be 14,000 years old. Thought-provoking.' },
      { rank: 5, title: 'Midnight Special (2016)', justification: 'Jeff Nichols emotional sci-fi about a father protecting his powered son. Underrated Jeff Nichols.' },
      { rank: 6, title: 'Annihilation (2018)', justification: 'Alex Garland adaptation, divisive and beautiful, explores identity and self-destruction.' },
      { rank: 7, title: 'Primer (2004)', justification: 'Ultimate time-travel puzzle, made for $7,000, requires multiple viewings.' },
      { rank: 8, title: 'Moon (2009)', justification: 'Sam Rockwell alone on lunar base, existential and moving, Duncan Jones debut.' },
      { rank: 9, title: 'The Vast of Night (2019)', justification: '1950s New Mexico, 90-minute single-take sci-fi, atmospheric and clever.' },
      { rank: 10, title: 'Enemy (2013)', justification: 'Villeneuve and Gyllenhaal double, surreal and hypnotic, demands interpretation.' },
    ],
  },
  {
    title: 'Top 10 Hidden Gems: Secret Travel Destinations No One Talks About',
    intro: 'Skip the crowds. These breathtaking destinations are still off the radar but offer experiences that rival any tourist hotspot.',
    category_slug: 'lifestyle/travel-destinations',
    items: [
      { rank: 1, title: 'Matera, Italy', justification: 'Ancient cave city, European Capital of Culture, stunning Sassi districts carved into limestone.' },
      { rank: 2, title: 'Lencois Maranhenses, Brazil', justification: 'White sand dunes filled with turquoise lagoons. Looks like another planet during rainy season.' },
      { rank: 3, title: 'Bhutan', justification: 'Himalayan kingdom measuring Gross National Happiness, limited tourism, pristine monasteries.' },
      { rank: 4, title: 'Faroe Islands', justification: 'Dramatic cliffs, waterfalls into ocean, Nordic isolation with 50k people and 70k sheep.' },
      { rank: 5, title: 'Socotra, Yemen', justification: 'Alien bottle trees, 37% plant species found nowhere else, UNESCO World Heritage isolation.' },
      { rank: 6, title: 'Oman', justification: 'Desert wadis, frankincense trails, empty beaches, authentic Arabian culture without Dubai crowds.' },
      { rank: 7, title: 'Kyrgyzstan', justification: 'Nomadic yurts, Tian Shan mountains, Issyk-Kul lake, Silk Road history.' },
      { rank: 8, title: 'Azores, Portugal', justification: 'Volcanic calderas, hot springs, whale watching, mid-Atlantic green paradise.' },
      { rank: 9, title: 'Patagonia, Chile/Argentina', justification: 'Towers of Paine, Perito Moreno glacier, end-of-world wilderness still wild.' },
      { rank: 10, title: 'Georgia (Country)', justification: 'Wine birthplace 8000 years ago, Caucasus mountains, Tbilisi old town, supra feasts.' },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    let user = await User.findOne({ username: 'any_seed' });
    if (!user) {
      user = await User.create({
        user_id: crypto.randomBytes(4).toString('hex'),
        username: 'any_seed',
        custom_display_name: 'ContentCurator',
        device_fingerprint: 'seed_fp_general',
        is_admin: false,
      });
      console.log(`Created user: ${user.username}`);
    }

    // Seed who_is_better
    let wibCount = 0;
    for (const p of whoIsBetterPosts) {
      const existing = await Post.findOne({ title: p.title });
      if (existing) {
        console.log(`Exists who_is_better: ${p.title}`);
        continue;
      }
      const cat = await Category.findOne({ slug: p.category_slug });
      if (!cat) {
        console.log(`Category not found: ${p.category_slug}, trying fallback`);
        continue;
      }
      const post = await createPost({
        author_id: user.user_id,
        author_username: user.username,
        author_display_name: user.custom_display_name || user.username,
        title: p.title,
        post_type: 'who_is_better',
        intro: p.intro,
        category_slug: cat.slug,
        status: 'approved',
        items: p.items,
        view_count: Math.floor(Math.random() * 3000) + 500,
        published_at: new Date(),
      });
      console.log(`Created who_is_better: ${post.title} -> /${post.slug}`);
      wibCount++;
    }

    // Seed hidden_gems
    let hgCount = 0;
    for (const p of hiddenGemsPosts) {
      const existing = await Post.findOne({ title: p.title });
      if (existing) {
        console.log(`Exists hidden_gems: ${p.title}`);
        continue;
      }
      const cat = await Category.findOne({ slug: p.category_slug });
      if (!cat) {
        console.log(`Category not found: ${p.category_slug}`);
        continue;
      }
      const post = await createPost({
        author_id: user.user_id,
        author_username: user.username,
        author_display_name: user.custom_display_name || user.username,
        title: p.title,
        post_type: 'hidden_gems',
        intro: p.intro,
        category_slug: cat.slug,
        status: 'approved',
        items: p.items,
        view_count: Math.floor(Math.random() * 3000) + 500,
        published_at: new Date(),
      });
      console.log(`Created hidden_gems: ${post.title} -> /${post.slug}`);
      hgCount++;
    }

    // Seed counter_list (needs parent)
    const parentPosts = await Post.find({ post_type: 'top_list', status: 'approved' }).limit(2).lean();
    let counterCount = 0;
    for (let i = 0; i < parentPosts.length; i++) {
      const parent = parentPosts[i] as any;
      const title = `Top 10 Greatest Football Players Ever — My Counter List ${i + 1}`;
      const existing = await Post.findOne({ title });
      if (existing) {
        console.log(`Exists counter_list: ${title}`);
        continue;
      }
      const counterIntro = `I respect the original list "${parent.title}" but I disagree with the order. Here is my counter-ranking with different justifications.`;
      const post = await Post.create({
        author_id: user.user_id,
        author_username: user.username,
        author_display_name: user.custom_display_name || user.username,
        title,
        normalized_title: title.toLowerCase(),
        post_type: 'counter_list',
        intro: counterIntro,
        category_slug: parent.category_slug,
        status: 'approved',
        parent_id: parent._id.toString(),
        view_count: Math.floor(Math.random() * 2000) + 300,
        comment_count: 0,
        published_at: new Date(),
      });
      // Need to create ListItems for counter_list as well (required for display)
      const counterItems = [
        { rank: 1, title: 'Diego Maradona', justification: 'Counter rank 1: peak performance higher than consensus.' },
        { rank: 2, title: 'Lionel Messi', justification: 'Counter rank 2: longevity vs peak debate.' },
        { rank: 3, title: 'Pelé', justification: 'Counter rank 3: era-adjusted dominance.' },
        { rank: 4, title: 'Cristiano Ronaldo', justification: 'Counter rank 4: big-game performance.' },
        { rank: 5, title: 'Johan Cruyff', justification: 'Counter rank 5: tactical influence.' },
        { rank: 6, title: 'Franz Beckenbauer', justification: 'Counter rank 6: defensive revolution.' },
        { rank: 7, title: 'Zinedine Zidane', justification: 'Counter rank 7: tournament clutch.' },
        { rank: 8, title: 'Alfredo Di Stefano', justification: 'Counter rank 8: complete player.' },
        { rank: 9, title: 'Michel Platini', justification: 'Counter rank 9: midfield elegance.' },
        { rank: 10, title: 'Ronaldo Nazário', justification: 'Counter rank 10: pre-injury peak.' },
      ];
      // Import ListItem dynamically to avoid circular
      const { ListItem } = await import('../models/ListItem');
      await ListItem.insertMany(
        counterItems.map((item) => ({
          post_id: post._id,
          rank: item.rank,
          title: item.title,
          justification: item.justification,
          fire_count: 0,
        }))
      );
      console.log(`Created counter_list: ${post.title} -> parent ${parent.slug} -> /${post.slug}`);
      counterCount++;
    }

    // If not enough parents, create generic counters
    if (counterCount < 2) {
      for (let i = counterCount; i < 2; i++) {
        const title = `Top 10 Hidden Gems: Underrated Foods — Counter Argument ${i + 1}`;
        const existing = await Post.findOne({ title });
        if (existing) continue;
        const post = await Post.create({
          author_id: user.user_id,
          author_username: user.username,
          author_display_name: user.custom_display_name || user.username,
          title,
          normalized_title: title.toLowerCase(),
          post_type: 'counter_list',
          intro: 'Counter point to popular food rankings, challenging the consensus with local favorites.',
          category_slug: 'lifestyle/food-restaurants',
          status: 'approved',
          view_count: 400,
          published_at: new Date(),
        });
        const { ListItem } = await import('../models/ListItem');
        await ListItem.insertMany([
          { post_id: post._id, rank: 1, title: 'Counter Item 1', justification: 'Justification' },
          { post_id: post._id, rank: 2, title: 'Counter Item 2', justification: 'Justification' },
        ]);
        console.log(`Created generic counter_list: ${post.title}`);
        counterCount++;
      }
    }

    console.log(`\n✅ Seed completed! who_is_better: ${wibCount}, hidden_gems: ${hgCount}, counter_list: ${counterCount}`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
