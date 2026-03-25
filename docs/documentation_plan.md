# YoTop10 — Documentation Plan

> Coverage for both **build-in-public pre-launch** and **post-launch user help center**.

---

## Part 1: Pre-Launch Documentation (Build in Public)

> These are for YOU and your audience — sharing the journey. Written in your voice, based on your experience. Publish as devlogs, GitHub READMEs, or blog posts on YoTop10 itself once it's live.

### 🧠 Concept & Vision
- [ ] **Why I'm building YoTop10** — the problem, the gap, the inspiration
- [ ] **What makes it different** — vs Medium, Reddit, Buzzfeed lists
- [ ] **The philosophy** — no algorithm, no ads, passion-first, debate-native
- [ ] **The name** — why YoTop10, might it change, what it means

### 🗺️ Product Planning
- [ ] **Feature overview** — what the platform does (high-level, non-technical)
- [ ] **Post types explained** — Top List, This vs That, Fact Drop, Counter List, etc.
- [ ] **The feed system** — why no algorithm, how the public/personal feed works
- [ ] **The engagement philosophy** — why Fire > likes, why debates > passive scrolling
- [ ] **Community design choices** — why hand-picked, why not open Reddit-style
- [ ] **The Ephemeral Thread system** — why burn-after-read, design inspiration
- [ ] **Moderation approach** — solo founder mod, strike system, auto-hide logic

### 🎨 Design Decisions
- [ ] **The futuristic theme** — color palette rationale, typography choices
- [ ] **The retro theme** — why Myspace inspiration, what it enables
- [ ] **Custom HTML/CSS profiles** — why it exists, what it enables for expression
- [ ] **Design principles** — clean, premium, debate-forward

### 🛠️ Technical Devlog (publish as you build)
- [ ] **Tech stack choice** — why Next.js + FastAPI + PostgreSQL
- [ ] **Project structure walkthrough** — how the repo is organized
- [ ] **Auth system** — anonymous, email, Google — how it works under the hood
- [ ] **Feed architecture** — newest-first, pagination, no ranking algorithm
- [ ] **Review queue system** — how posts get from submission to public
- [ ] **Verdict Meter** — how community verdicts are calculated
- [ ] **Ephemeral Thread implementation** — burn timers, storage strategy, deletion
- [ ] **OG image generation** — shareable list cards, battle cards, verdict cards
- [ ] **Admin dashboard build** — architecture, real-time stats, permission system
- [ ] **Custom profile sandbox** — how HTML/CSS is safely rendered
- [ ] **Localization setup** — language detection, i18n strategy

### 🚀 Launch Prep
- [ ] **MVP feature list** — what's in v1, what's not
- [ ] **What's coming post-launch** — honest roadmap
- [ ] **How to contribute / report bugs** — if open source
- [ ] **Launch announcement post** — written on YoTop10 itself (meta moment)

---

## Part 2: Post-Launch Documentation (Help Center / User Docs)

> These live on the **in-app Help Page**. Written for users — zero technical jargon. The goal: no user should ever be confused about anything.

### 👤 Account & Profile
- [ ] How to create an account (email, Google, anonymous)
- [ ] Difference between anonymous and named accounts
- [ ] How to set your profile to public / connections-only / private
- [ ] How to customize your profile with HTML & CSS
- [ ] How to change your display name
- [ ] How to delete your account
- [ ] What happens to your posts if you delete your account

### 📋 Creating Content
- [ ] How to write a Top List post
- [ ] How to write a This vs That post
- [ ] How to write a Fact Drop
- [ ] How to add a Counter List (no review needed — publishes instantly)
- [ ] Adding images to your list items
- [ ] How to cite sources in a post
- [ ] Editing your post (2-hour window after approval explained)
- [ ] Why your post might be in the personal feed but not the public feed
- [ ] What happens after you submit a post (review explained)
- [ ] How to earn the Author badge (20 approved posts)

### 🔥 Engagement & Debate
- [ ] What the 🔥 Fire reaction means
- [ ] How to challenge a specific item in a list (per-item debate)
- [ ] How to write a Counter List and link it to an original
- [ ] What the Verdict Meter means (CONFIRMED / CONTESTED / HOT TAKE / DEBUNKED / UNDECIDED)
- [ ] How the Community Version of a list works
- [ ] How Battle View works (rival lists side by side)
- [ ] How to comment on a full post vs a specific item
- [ ] Nested replies in comments — how deep can threads go (3 levels)

### 📡 Feeds & Discovery
- [ ] How the Public Feed works (newest first, no algorithm)
- [ ] How the Personal / Connection Feed works
- [ ] What the Hot Takes page is
- [ ] How Weekly Best and Monthly Best are selected
- [ ] What List of the Year is and how it works
- [ ] How to follow an author
- [ ] How to follow a topic/category
- [ ] How to find posts by category

### 🏘️ Communities
- [ ] What communities are and how they differ from the main feed
- [ ] How to join a community
- [ ] How to post inside a community
- [ ] What community moderators can and can't do
- [ ] Community rules and how they're enforced

### 💬 Ephemeral Threads
- [ ] What a Private Thread is
- [ ] How to create a Private Thread inside a community
- [ ] How to tag/invite someone to a thread
- [ ] What the burn timer does (auto-expire after response / auto-burn before seen)
- [ ] Why threads can't be recovered after they expire
- [ ] What to do if you're threatened or harassed in a thread

### 🛡️ Safety & Moderation
- [ ] What gets a post auto-hidden (and what it means for your visibility)
- [ ] What the strike system is (1=warning, 2=suspension, 3=ban)
- [ ] How to report a post or comment
- [ ] What happens after you submit a report
- [ ] How to appeal a strike or suspension
- [ ] Community bans vs platform bans — the difference
- [ ] What YoTop10's content policies are (link to ToS)

### 🏅 Badges & Ranks
- [ ] Full list of badges and how to earn them
- [ ] What the Author badge means and how to earn it
- [ ] Can badges be removed? (Yes — Author status can be revoked by admin)

### ⚙️ Settings & Privacy
- [ ] Notification preferences
- [ ] Email digest settings (opt in/out)
- [ ] Language settings — how to change your language
- [ ] How anonymous accounts work (what we store and why — ToS)
- [ ] What data YoTop10 stores and why
- [ ] How to request data deletion

### 📱 Themes & Display
- [ ] How to switch between Futuristic and Retro themes
- [ ] How to toggle dark / light mode (futuristic theme only)
- [ ] Why retro mode has no dark/light toggle

---

## Part 3: Help Page Structure (In-App)

> The `/help` page layout. Think Notion Help Center meets Stripe Docs.

```
/help
├── Search bar (full-text search across all docs)
├── Getting Started
│   ├── What is YoTop10?
│   ├── Create your account
│   └── Write your first list
├── Account & Profile
├── Creating Content
├── Engagement & Debate
├── Feeds & Discovery
├── Communities
├── Ephemeral Threads
├── Safety & Moderation
├── Badges & Ranks
├── Settings & Privacy
├── Themes & Display
├── FAQ (see Part 4)
└── Support (see Part 5)
```

---

## Part 4: FAQ (Frequently Asked Questions)

> Pre-written at launch. Expand as real user questions come in.

| Question | Short Answer |
|---|---|
| Why can't I see my post in the public feed? | Posts go through an editorial review. Until approved, they appear in your personal feed only. |
| How long does review take? | Usually within 24-48 hours. Authors get priority. |
| Can I edit my post after publishing? | Yes — for 2 hours after approval. After that, it's locked. |
| Why is there no algorithm? | We believe new posts deserve fair attention. Newest always surfaces first. |
| Can I delete my account? | Yes. Go to Settings → Account → Delete Account. |
| What happens if I get a strike? | 1=Warning, 2=7-day suspension, 3=Permanent ban. |
| How do I earn the Author badge? | Get 20 posts approved for the public feed. |
| Is YoTop10 free? | Yes. Completely free. No ads. No subscriptions. |
| Can I be anonymous? | Yes. Create an account with name + password only. No email required. |
| What are Ephemeral Threads? | Private, burn-after-read threads inside communities. They disappear after a set time. |
| Can I report someone? | You can report posts and comments. You cannot report users directly. |
| Why is my post auto-hidden? | It may have triggered a moderation condition (e.g., multiple reports). Check your notifications. |
| Can I have multiple accounts? | No. Creating multiple accounts to evade a ban is a ToS violation. |
| What data does YoTop10 store? | See our Privacy Policy. For anonymous accounts, only device fingerprint + display name. |
| Is the source code public? | Yes — YoTop10 is open source. [Link to GitHub] |

---

## Part 5: Support

> The support section of `/help`:

- **Contact form** → sends to support email (e.g., `support@yotop10.com`)
- **Fields**: Name, Email (optional for anon users), Subject, Message, Attach screenshot
- **Auto-reply**: Confirmation email that the message was received
- **Response time note**: "We typically respond within 2-3 business days"
- **Appeal link**: A dedicated form for strike/ban appeals (separate from general support)
- **Bug report link**: Points to GitHub Issues (since open source)

---

## Documentation Writing Timeline

| Phase | When | What to Publish |
|---|---|---|
| **Now (planning)** | Before any code | Vision doc, product philosophy, "Why I'm building this" |
| **During build** | Weekly devlog | Tech decisions, architecture posts, design choices |
| **Pre-launch (beta)** | 2-4 weeks before | MVP feature list, launch announcement draft, onboarding copy |
| **Launch day** | Day 0 | Help center goes live with all user docs, FAQ, Support page |
| **Post-launch** | Ongoing | Update FAQ from real user questions, add feature docs as features ship |
