# YoTop10 — Revert to Open Platform Plan

> Transforming YoTop10 from a full social platform to an open Wikipedia-style platform for top 10 lists.

---

## ANONYMOUS USER SYSTEM

### User Identity Format

All users are **anonymous** with this format:

```
Username: any_XXXX
Example: any_9Gh7, any_abc1, any_k4m9
```

- **Format**: `any_` + last 4 characters of 8-character alphanumeric user ID
- **User ID**: 8-character alphanumeric (e.g., `a1b2c3d4`)
- **Example Username**: `any_a1b2` (from user ID `xyza1b2c3d4`)

### Username Customization

Users can **customize** their display name in their profile page:
- Keep `any_` prefix
- Change last 4 characters to anything they want
- Example: `any_9Gh7` → `any_nekw` (if available)
- **Must be unique** - check availability before saving

### Profile Page

Each anonymous user has a public profile at `/any_XXXX`:
- Shows all posts made by user
- Shows **approved** posts
- Shows **rejected** posts (with "Rejected" badge - only visible to author)
- Shows **pending** posts (with "Pending" badge - only visible to author)
- Shows display name customization option
- No password/email needed - identity is device-based

### Device Fingerprinting

For anonymous identity, use **all** of these signals:

| Signal | Description |
|--------|-------------|
| Canvas fingerprint | GPU rendering hash |
| WebGL fingerprint | Graphics capabilities hash |
| Audio context fingerprint | Audio hardware hash |
| Screen resolution | Width x Height + color depth |
| Timezone | UTC offset |
| Language | Browser language |
| Installed fonts | Font detection |

Combine all signals into a **unique device fingerprint hash**.

### Rate Limiting (Smart)

```typescript
// Rate limiting is per user (device fingerprint), NOT by IP

// Comments:
// General Comments: 5 per hour per user
// Item-Anchored Comments: 25 per hour per user
// Velocity Rule: Max 5 comments per 5 minutes (burst protection)

// Posts:
// 3 posts per hour per device fingerprint

// Shadow Trust Score:
// - Scholar (last 5 posts approved): 2x limit = 40 comments/hour
// - Neutral: 1x limit = 20 comments/hour
// - Troll (recent posts rejected): 0.1x limit = 2 comments/hour
```

---

## PHASE 1: DISCONNECT (Comment Out & Disable)

> These features will be commented out, disabled, or hidden - NOT deleted.

### R1 — Disconnect Authentication System
- [ ] Comment out all auth API routes in `backend/app/api/v1/auth.py`
- [ ] Comment out NextAuth.js configuration in `frontend/src/auth.ts`
- [ ] Hide login page `frontend/src/app/login/` (add _disabled suffix)
- [ ] Hide signup page `frontend/src/app/signup/` (add _disabled suffix)
- [ ] Hide forgot-password page `frontend/src/app/forgot-password/` (add _disabled suffix)
- [ ] Hide reset-password page `frontend/src/app/reset-password/` (add _disabled suffix)
- [ ] Hide verify-email page `frontend/src/app/verify-email/` (add _disabled suffix)
- [ ] Comment out Google OAuth provider config
- [ ] Hide NextAuth API routes `frontend/src/app/api/auth/` and `frontend/src/app/nextauth/`

### R2 — Disconnect User Models & Related Tables
- [ ] Comment out `backend/app/models/session.py` (don't delete)
- [ ] Comment out `backend/app/models/user.py` (keep simplified version, don't delete)
- [ ] Comment out session CRUD `backend/app/crud/session.py` (don't delete)
- [ ] Comment out user CRUD `backend/app/crud/user.py` (keep minimal, don't delete)
- [ ] Comment out auth services `backend/app/services/auth.py` (don't delete)
- [ ] Keep all alembic migration files (don't delete any)

### R3 — Disconnect User-Related API Endpoints
- [ ] Comment out `backend/app/api/v1/users.py` (don't delete)
- [ ] Comment out user routes in `backend/app/api/v1/__init__.py`

### R4 — Disconnect Frontend User Components
- [ ] Rebuild profile page at `/any_XXXX` (new format)
- [ ] Keep settings/profile page for display name customization
- [ ] Comment out auth-provider component `frontend/src/components/auth-provider.tsx` (don't delete)
- [ ] Comment out auth-related middleware `frontend/src/middleware.ts` (don't delete)

### R5 — Disconnect JWT & Security Dependencies
- [ ] Comment out JWT logic in `backend/app/core/security.py` (keep password hashing for admin)
- [ ] Comment out get_current_user in `backend/app/core/deps.py` (add device fingerprint instead)
- [ ] Keep rate limiting by user fingerprint (not IP)
- [ ] Keep redis for session management

### R6 — Database (Keep All Tables)
- [ ] Don't drop any tables
- [ ] Add: device_fingerprint field for anonymous tracking
- [ ] Keep all existing migrations (don't delete any)

---

## PHASE 2: SIMPLIFIED DATABASE

### D1 — Simplified Schema

```javascript
// users collection (Anonymous Only)
{
  _id: ObjectId,
  user_id: String,              // 8-char alphanumeric (e.g., "a1b2c3d4")
  username: String,            // Format: "any_XXXX" (e.g., "any_9Gh7")
  custom_display_name: String, // User can customize last 4 chars
  device_fingerprint: String,  // Canvas + WebGL + Audio + Screen + Timezone + Fonts
  created_at: Date,
  is_admin: Boolean            // Only ONE admin (you)
}

// posts collection
{
  _id: ObjectId,
  author_id: String,           // Links to User.user_id
  author_username: String,     // Snapshot: "any_XXXX"
  author_display_name: String, // Snapshot: custom name at post time
  title: String,
  post_type: String,           // top_list, this_vs_that, fact_drop, etc.
  intro: String,
  status: String,              // pending_review, approved, rejected
  category_id: ObjectId,       // EXACTLY 1 category (NOT multiple)
  fire_count: Number,
  comment_count: Number,
  view_count: Number,
  created_at: Date,
  updated_at: Date
}

// list_items collection
{
  _id: ObjectId,
  post_id: ObjectId,
  rank: Number,                // 1, 2, 3...
  title: String,
  justification: String,
  image_url: String,
  source_url: String,
  fire_count: Number
}

// comments collection (Enhanced - like Twitter/X)
{
  _id: ObjectId,
  post_id: ObjectId,
  list_item_id: ObjectId,      // Can anchor to specific item
  parent_comment_id: ObjectId, // For nested replies (max 3 levels)
  depth: Number,               // 0 = top-level, 1 = reply, 2 = reply-to-reply
  author_id: String,           // Links to User.user_id
  author_username: String,     // Snapshot: "any_XXXX"
  author_display_name: String, // Snapshot: custom name at comment time
  content: String,
  fire_count: Number,
  reply_count: Number,
  created_at: Date,
  updated_at: Date
}

// reactions collection
{
  _id: ObjectId,
  user_device_fingerprint: String,
  target_type: String,         // "post", "list_item", "comment"
  target_id: ObjectId,
  reaction_type: String,      // "fire"
  created_at: Date
}

// categories collection
{
  _id: ObjectId,
  name: String,
  slug: String,
  description: String,
  icon: String,                // Emoji
  parent_id: ObjectId,         // For hierarchy
  post_count: Number,
  is_featured: Boolean,
  is_archived: Boolean,
  created_at: Date
}

// admin_user collection (Just you)
{
  _id: ObjectId,
  username: String,
  password_hash: String,
  created_at: Date
}
```

---

## PHASE 3: CORE FEATURES (Build Now)

### C1 — Anonymous Post Submission
- [ ] Create POST `/api/posts` endpoint (no auth required)
- [ ] Request body: `{ title, post_type, intro, category_id, items, author_display_name }`
- [ ] All posts default to `pending_review` status
- [ ] Generate `any_XXXX` username from device fingerprint
- [ ] Rate limit: 3 posts per hour per device fingerprint

### C2 — Public Feed
- [ ] Create GET `/api/posts` endpoint (no auth required)
- [ ] Filter: `status=approved` only
- [ ] Sort: newest first (no algorithm)
- [ ] Filter by category (exactly 1)
- [ ] Pagination (20 posts per page)

### C3 — Post Detail Page
- [ ] GET `/api/posts/:id` endpoint
- [ ] Returns post + list items + comments
- [ ] Frontend: Post detail page at `/post/[id]`

### C4 — Comments System (Twitter/X-style)
- [ ] Two comment modes:
  - **Full Post Comment**: Comment on the list as a whole
  - **Item-Anchored Comment**: Comment on specific list item (item highlighted)
- [ ] Nested replies (max 3 levels):
  ```
  Level 1: Top-level comment
    Level 2: Reply to L1
      Level 3: Reply to L2
        (No more nesting - reply goes to L2's parent)
  ```
- [ ] 2-hour edit window for own comments
- [ ] Rate limiting: 20 comments per hour per user (device fingerprint)

### C5 — Fire Reactions
- [ ] Toggle fire on posts, list items, comments
- [ ] Count display
- [ ] Per-user toggle (device fingerprint)

### C6 — User Profiles (`/any_XXXX`)
- [ ] Profile page shows:
  - Username: `any_XXXX`
  - Custom display name (if set)
  - All posts: Approved, Rejected, Pending (with badges)
  - Edit display name option (keep `any_` prefix)

---

## PHASE 4: ADMIN DASHBOARD (For You Only)

### A1 — Admin Authentication
- [ ] Create simple admin login (username + password)
- [ ] JWT token for admin only
- [ ] Protect admin routes with admin check

### A2 — Review Queue
- [ ] GET `/api/admin/posts/pending` - list posts pending review
- [ ] PATCH `/api/admin/posts/:id/approve` - approve post
- [ ] PATCH `/api/admin/posts/:id/reject` - reject with reason

### A3 — Post Management
- [ ] PATCH `/api/admin/posts/:id` - edit post (title, items)
- [ ] DELETE `/api/admin/posts/:id` - delete post

### A4 — Comment Management
- [ ] DELETE `/api/admin/comments/:id` - delete comment

### A5 — Category Management
- [ ] CRUD for categories
- [ ] Reorder categories
- [ ] Archive categories (soft delete)

---

## PHASE 5: SEARCH & DISCOVERY

### S1 — Elasticsearch Setup
- [ ] Install and configure Elasticsearch
- [ ] Create posts index with mappings
- [ ] Create comments index with mappings
- [ ] Sync posts to Elasticsearch on create/update/delete
- [ ] Sync comments to Elasticsearch on create/update/delete

### S2 — Search API
- [ ] `GET /api/search?q=query` - Full search across posts and comments
- [ ] `GET /api/search/posts?q=query` - Posts only
- [ ] `GET /api/search/comments?q=query` - Comments only
- [ ] `GET /api/search/autocomplete?q=prefix` - Autocomplete suggestions

### S3 — Search Features
- [ ] Filters: category, post type, author, date range
- [ ] Sort: relevance, newest, oldest, most fired
- [ ] Highlight matching text in results

### S4 — Arguments Page (`/arguments`)
- [ ] Page showing most active item-anchored comments
- [ ] Filter by category, time range
- [ ] Sort by: most replies, recent activity
- [ ] Click → navigates to post, scrolls to item

### S5 — Hall of Fame (`/hall-of-fame`)
- [ ] Admin-curated featured lists
- [ ] Community-vetted criteria:
  - 50+ item-anchored comments
  - Active for 3+ months
  - Low controversy
- [ ] Badge display

---

## PHASE 6: FRONTEND PAGES

### F1 — Homepage (Public Feed)
- [ ] `/` - Show approved posts, newest first
- [ ] Category filter dropdown
- [ ] Sort: Newest, Most Fired, Most Commented
- [ ] Pagination

### F2 — Submit Post Page
- [ ] `/submit` - Anonymous post form
- [ ] Display name input
- [ ] Post type selector
- [ ] Title + intro inputs
- [ ] Dynamic list item builder (add/remove/reorder items)
- [ ] Each item: rank, title, justification, image URL, source URL
- [ ] Category selector: EXACTLY 1 (required)
- [ ] Submit button → goes to pending review

### F3 — Post Detail Page
- [ ] `/post/[id]` - Full post with items and comments
- [ ] Comment form (display name input + text area)
- [ ] Nested comment display (max 3 levels)
- [ ] Reply button on each comment
- [ ] Fire reaction buttons
- [ ] "Submit a Counter-List" button
- [ ] "View History" link

### F4 — Search & Categories Pages
- [ ] `/search` - Search results with filters
- [ ] `/categories` - Browse all categories
- [ ] `/c/[slug]` - Category feed
- [ ] `/arguments` - Hot debates
- [ ] `/hall-of-fame` - Featured lists

### F5 — User Profile
- [ ] `/any_XXXX` - User profile page
- [ ] Display all posts: Approved, Rejected, Pending
- [ ] Edit display name

### F6 — Admin Dashboard
- [ ] `/admin` - Admin login (if not logged in)
- [ ] `/admin/dashboard` - Review queue
- [ ] `/admin/posts` - Post management
- [ ] `/admin/comments` - Comment management
- [ ] `/admin/categories` - Category management
- [ ] `/admin/hall-of-fame` - Manage Hall of Fame

---

## API ENDPOINTS (NEW)

### Public (No Auth)
```
GET    /api/categories              # List categories
GET    /api/categories/:slug       # Single category
GET    /api/posts                  # Approved posts (filter by category)
GET    /api/posts/:id              # Single post with items + comments
POST   /api/posts                  # Submit new post (anonymous)
GET    /api/posts/:id/comments     # Comments for post
POST   /api/posts/:id/comments     # Add comment (anonymous)
PATCH  /api/comments/:id           # Edit own comment (within 2hr)
DELETE /api/comments/:id           # Delete own comment
GET    /api/comments/:id/replies   # Get replies
POST   /api/reactions              # Toggle fire reaction
GET    /api/reactions/state        # Get reaction states
GET    /api/search                 # Full search
GET    /api/search/autocomplete    # Autocomplete
GET    /api/arguments               # Hot debates
GET    /api/hall-of-fame           # Featured lists
GET    /api/users/:username         # User profile
GET    /api/users/:username/posts  # User posts
PATCH  /api/users/:username        # Update display name
```

### Admin (Auth Required)
```
POST   /api/admin/login            # Admin login
GET    /api/admin/posts/pending    # Review queue
PATCH  /api/admin/posts/:id/approve
PATCH  /api/admin/posts/:id/reject
DELETE /api/admin/posts/:id
DELETE /api/admin/comments/:id
GET    /api/admin/categories
POST   /api/admin/categories
PATCH  /api/admin/categories/:id
DELETE /api/admin/categories/:id
GET    /api/admin/hall-of-fame
POST   /api/admin/hall-of-fame
DELETE /api/admin/hall-of-fame/:id
POST   /api/admin/search/reindex   # Reindex Elasticsearch
```

---

## FRONTEND ROUTES (NEW)

```
/                            # Homepage (public feed)
/submit                      # Submit new post
/post/:id                    # Post detail + comments
/post/:id/history           # Post changelog
/categories                  # Browse all categories
/c/:slug                    # Category feed
/search                      # Search results
/arguments                   # Hot debates
/hall-of-fame               # Featured lists
/any_XXXX                   # User profile (e.g., /any_9Gh7)
/admin                       # Admin login
/admin/dashboard             # Review queue
/admin/posts                 # Post management
/admin/comments              # Comment management
/admin/categories            # Category management
/admin/hall-of-fame          # Hall of Fame management
```

---

## WHAT TO KEEP

| Component | Action |
|-----------|--------|
| FastAPI backend | Keep, simplify |
| Next.js frontend | Keep, rebuild pages |
| PostgreSQL | Keep, simplify schema |
| Docker setup | Keep |
| **Categories (Section A)** | **KEEP - FULLY IMPLEMENTED** |
| **Comments (Section B)** | **KEEP - FULLY IMPLEMENTED** |
| Posts + List Items | Keep |
| Admin login | Keep (only for you) |

---

## WHAT TO DISABLE/COMMENT

> All of these will be disabled or commented out - NOT deleted.

| Component | Action |
|-----------|--------|
| User registration | DISABLE (comment out) |
| User logins | DISABLE (comment out) |
| Google OAuth | DISABLE (comment out) |
| JWT for users | DISABLE (comment out) |
| User profiles (old) | DISABLE (comment out) |
| Follow system | DISABLE (comment out) |
| Connection system | DISABLE (comment out) |
| Reactions (on posts) | DISABLE (comment out) |
| Strike system | DISABLE (comment out) |
| Report system | DISABLE (comment out) |
| Communities | DISABLE (comment out) |
| Ephemeral threads | DISABLE (comment out) |
| Badges | DISABLE (comment out) |
| Multi-account | DISABLE (comment out) |
| Trust scores (old) | DISABLE (comment out) |
| NextAuth.js | DISABLE (comment out) |

---

## SUMMARY

**Phase 1 (Disconnect):** Disable all auth, users, sessions, NextAuth (comment out, don't delete)
**Phase 2 (Simplify):** Keep posts, comments, categories, admin
**Phase 3 (Build):** Anonymous posting, feed, comments, fire reactions
**Phase 4 (Admin):** Your review queue
**Phase 5 (Search):** Elasticsearch, arguments page, hall of fame
**Phase 6 (Frontend):** All pages

This transforms YoTop10 into an open platform where:
- Anyone can submit top 10 lists (anonymous)
- Anyone can comment with advanced nested threading (anonymous)
- Categories are fully organized (10 parents, 300 children)
- Only YOU can approve/reject posts
- No accounts, no logins needed for regular users
- Smart rate limiting: 20 comments/hour per user based on device fingerprint
- Shadow Trust Score rewards quality contributors automatically
