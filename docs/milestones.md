# YoTop10 — Build Milestones

> **Platform**: Open anonymous top 10 lists platform. No login required. Admin-only review.
> **Stack**: MERN — MongoDB + Express + Next.js + Elasticsearch
> **Note**: All styling deferred until after MVP. Platform functions with minimal styling until launch.

---

## Overview

This is the simplified roadmap based on the [revert.md](./revert.md) plan. The platform transforms from a full social platform into an open Wikipedia-style platform:

- **Anyone** can submit top 10 lists (anonymous, device fingerprint tracked)
- **Anyone** can comment with nested threading (up to 3 levels like Twitter/X)
- **Categories** are fully organized (10 parents, 300 children)
- **Only you** (admin) can approve/reject posts
- **Smart rate limiting**: 50 comments/hour per user (device fingerprint)
- **Shadow Trust Score**: Rewards "scholars" (2x limits), chokes "trolls"

---

## CORE SPECIFICATIONS

### Anonymous User Identity
- **Username Format**: `any_XXXX` (e.g., `any_9Gh7`)
  - `any_` + last 4 characters of 8-character alphanumeric user ID
  - Example: User ID `xyza1b2c3d4` → Username `any_1b2c`
- **Display Name Customization**: Users can change last 4 characters
  - Example: `any_9Gh7` → `any_nekw` (must be unique, keep `any_` prefix)
- **Profile Page**: `/any_XXXX` shows all posts (Approved/Rejected/Pending with badges)

### Device Fingerprinting
Track anonymous users using:
- Canvas fingerprint (GPU rendering hash)
- WebGL fingerprint (graphics capabilities hash)
- Audio context fingerprint (audio hardware hash)
- Screen resolution (Width x Height + color depth)
- Timezone (UTC offset)
- Language (browser language)
- Installed fonts (font detection)

### Rate Limiting (Per User, Not IP)
| Action | Limit |
|-------|-------|
| General Comments | 50 per hour per user |
| Item-Anchored Comments | 45 per hour per user |
| Posts | 4 posts per hour per user |
| Burst Protection | Max 5 comments per 5 minutes |

### Shadow Trust Score
| User Type | Last 5 Posts | Comment Limit Multiplier |
|-----------|--------------|------------------------|
| Scholar | ≥7 approved | 2x (40/hr) |
| Neutral | Mixed | 1x (20/hr) |
| Troll | ≤3 rejected | 0.1x (2/hr) |

---

## PHASE 1 — MVP LAUNCH (V1)

### M1 — Project Foundation
- [ ] Monorepo structure (`/frontend` + `/backend`)
- [ ] Next.js 14 frontend (App Router)
- [ ] Express.js backend
- [ ] MongoDB setup (local + connection)
- [ ] Elasticsearch setup
- [ ] Redis setup (rate limiting, caching)
- [ ] Docker Compose (frontend, backend, MongoDB, Redis, Elasticsearch)
- [ ] Environment configuration

### M2 — Database Schema
- [ ] `users` collection (anonymous: user_id, username, custom_display_name, device_fingerprint, is_admin)
- [ ] `posts` collection (author_id, author_username, author_display_name, title, post_type, intro, status, category_id, fire_count, comment_count, view_count, created_at, updated_at)
- [ ] `list_items` collection (post_id, rank, title, justification, image_url, source_url, fire_count)
- [ ] `comments` collection (post_id, list_item_id, parent_comment_id, depth, author_id, author_username, author_display_name, content, fire_count, reply_count, created_at, updated_at)
- [ ] `reactions` collection (user_device_fingerprint, target_type, target_id, reaction_type, created_at)
- [ ] `categories` collection (name, slug, description, icon, parent_id, post_count, is_featured, is_archived)
- [ ] `admin_user` collection (username, password_hash)
- [ ] MongoDB indexes for performance
- [ ] Seed 10 parent + 300 child categories

### M3 — Anonymous Post Submission
- [ ] `POST /api/posts` — Submit post (no auth)
  - Body: `{ title, post_type, intro, category_id (EXACTLY 1), items, author_display_name }`
  - All posts default to `pending_review`
  - Generate `any_XXXX` username from device fingerprint
  - Rate limit: 4 posts/hour per fingerprint

### M4 — Public Feed
- [ ] `GET /api/posts` — Approved posts only
  - Filter: `status=approved`
  - Sort: newest first
  - Filter by category (exactly 1)
  - Pagination (20 per page)
- [ ] `GET /api/posts/:id` — Single post with items + comments

### M5 — Post Detail Page
- [ ] Frontend: `/post/[id]`
- [ ] Full post display with ranked list items
- [ ] Item-anchored comments (highlight specific item)
- [ ] Nested comments (max 3 levels)
- [ ] Fire reactions (toggle on/off)
- [ ] "Submit a Counter-List" button
- [ ] Post history/changelog

### M6 — Categories System
- [ ] `GET /api/categories` — All categories
- [ ] `GET /api/categories/:slug` — Single category
- [ ] Category hierarchy (10 parents, 300 children)
- [ ] Frontend: `/categories` and `/c/[slug]`
- [ ] Admin CRUD for categories

### M7 — Comment System
- [x] `GET /api/posts/:id/comments` — Get comments
- [x] `POST /api/posts/:id/comments` — Add comment (anonymous)
  - Two modes: Full Post Comment OR Item-Anchored Comment
  - Nested replies (max 3 levels)
- [x] `PATCH /api/comments/:id` — Edit (within 2hr window)
- [x] `DELETE /api/comments/:id` — Delete own comment
- [x] Rate limit: 50 comments/hour per user

### M8 — Fire Reactions
- [ ] `POST /api/reactions` — Toggle fire
- [ ] `GET /api/reactions/state` — Check reaction status
- [ ] Works on posts, list items, comments

### M9 — Admin Authentication
- [ ] `POST /api/admin/login` — Admin login
- [ ] JWT token for admin only
- [ ] Protect all `/api/admin/*` routes

### M10 — Admin Dashboard (Industry Standard)

> The admin dashboard is the command center for YoTop10. This is where you control everything. It's designed like a professional CMS.

#### M10.1 — Admin Authentication & Security
- [ ] `POST /api/admin/login` — Login with username/password
  - Request: `{ username, password }`
  - Response: JWT token (httpOnly cookie) + admin user info
- [ ] `POST /api/admin/logout` — Invalidate session
- [ ] `GET /api/admin/me` — Get current admin user
- [ ] `POST /api/admin/refresh` — Refresh JWT token
- [ ] JWT stored in httpOnly, secure cookie
- [ ] Token expiry: 24 hours
- [ ] Rate limit: 5 login attempts per 15 minutes per IP
- [ ] Audit log: login attempts (success/failed, IP, timestamp)

#### M10.2 — Dashboard Overview / Stats
- [ ] `GET /api/admin/stats` — Real-time platform statistics
  - **Posts Stats**:
    - Total posts (all time)
    - Posts today / this week / this month
    - Pending review count
    - Approved today / this week / this month
    - Rejected today / this week / this month
  - **Comments Stats**:
    - Total comments (all time)
    - Comments today / this week / this month
  - **Users Stats**:
    - Total unique device fingerprints (anonymous users)
    - New users today / this week / this month
  - **Engagement Stats**:
    - Total fire reactions
    - Total views
    - Average comments per post
  - **Category Stats**:
    - Categories with most posts
    - Categories needing attention (no posts)
- [ ] Charts/graphs: Posts over time, Comments over time, Top categories
- [ ] Quick actions: Go to review queue, Create category

#### M10.3 — Review Queue (Pending Posts)
- [ ] `GET /api/admin/posts/pending` — List pending posts
  - Query params: `page`, `limit`, `category`, `post_type`, `date_from`, `date_to`, `sort`
  - Default sort: oldest first (oldest submissions first)
- [ ] `GET /api/admin/posts/pending/:id` — Full preview of pending post
- [ ] `PATCH /api/admin/posts/:id/approve` — Approve post
  - Auto-generates slug from title
  - Sets status to `approved`
  - Sets `published_at` timestamp
  - Indexes in Elasticsearch
  - Optional: send notification (future)
- [ ] `PATCH /api/admin/posts/:id/reject` — Reject post
  - Request: `{ reason }` (required)
  - Common reasons: "Spam", "Inappropriate content", "Duplicate", "Low quality", "Incorrect category", "Misleading title"
  - Sets status to `rejected`
  - Stores rejection reason for analytics
- [ ] `PATCH /api/admin/posts/:id/request_changes` — Request changes (keep pending)
  - Request: `{ feedback }` — specific feedback for author
  - Status remains `pending_review`
  - Author can see feedback in their profile
- [ ] Bulk actions:
  - `POST /api/admin/posts/bulk/approve` — Approve multiple
  - `POST /api/admin/posts/bulk/reject` — Reject multiple
- [ ] Filters:
  - By category (dropdown)
  - By post type (dropdown)
  - By date submitted (date range picker)
  - By author (search by username)
- [ ] Quick preview: Click to expand inline without leaving page
- [ ] Keyboard shortcuts: A=Approve, R=Reject, E=Request Changes

#### M10.4 — All Posts Management
- [ ] `GET /api/admin/posts` — All posts with full data
  - Query params: `page`, `limit`, `status`, `category`, `post_type`, `author`, `date_from`, `date_to`, `sort`, `search`
- [ ] Table columns:
  - Checkbox (for bulk actions)
  - ID (short)
  - Title (truncated)
  - Author (username)
  - Category
  - Post Type
  - Status (badge: Pending/Approved/Rejected)
  - Fire Count
  - Comment Count
  - Views
  - Created Date
  - Published Date
  - Actions (View/Edit/Delete)
- [ ] Actions per post:
  - **View**: Open in new tab (public view)
  - **Edit**: Inline edit or modal (title, category, items)
  - **Delete**: Soft delete (archive) or hard delete
  - **Feature**: Add to Hall of Fame
  - **Unfeature**: Remove from Hall of Fame
  - **Lock**: Prevent comments
  - **Bump**: Move to top of feed
- [ ] Bulk actions:
  - Select all / Select none
  - Bulk approve (only pending)
  - Bulk reject (only pending)
  - Bulk delete
  - Bulk feature
  - Bulk change category
- [ ] Search: Full-text search in title, intro, list items
- [ ] Export: CSV/Excel export of filtered results

#### M10.5 — All Comments Management
- [ ] `GET /api/admin/comments` — All comments
  - Query params: `page`, `limit`, `post_id`, `author`, `status`, `date_from`, `date_to`, `sort`, `search`
- [ ] Table columns:
  - ID (short)
  - Content (truncated)
  - Author (username)
  - Post (title, link to post)
  - Type (Post Comment / Item-Anchored)
  - If Item-Anchored: show item rank #
  - Fire Count
  - Reply Count
  - Created Date
  - Actions
- [ ] Actions:
  - **View Post**: Go to post page
  - **Edit**: Edit comment content
  - **Delete**: Remove comment
  - **Highlight**: Pin comment to top
  - **Hide**: Hide from public (soft delete)
- [ ] Search: Full-text search in comment content
- [ ] Filters:
  - By post
  - By author (device fingerprint or username)
  - By type (post comment / item-anchored)
  - By date range
  - By has replies (yes/no)
- [ ] Moderation flags:
  - Auto-flag: High fire count negative (controversial)
  - Auto-flag: Very long comments (potential spam)
  - Auto-flag: Many replies in short time (brigading)

#### M10.6 — Users Management (Anonymous)
- [ ] `GET /api/admin/users` — All anonymous users
- [ ] Table columns:
  - Username (any_XXXX)
  - Custom Display Name (if set)
  - Device Fingerprint (truncated)
  - Total Posts (Approved/Rejected/Pending breakdown)
  - Total Comments
  - Trust Score (Scholar/Neutral/Troll)
  - First Seen
  - Last Active
- [ ] Actions:
  - **View Profile**: See all their posts/comments
  - **Ban**: Prevent from posting (by fingerprint)
  - **Whitelist**: Mark as trusted (bypass rate limits)
  - **Shadow Ban**: Can post but only they see it
- [ ] Search: By username, by fingerprint
- [ ] Filters:
  - By trust score
  - By post count (high/low)
  - By ban status
  - By date range

#### M10.7 — Categories Management
- [ ] `GET /api/admin/categories` — All categories (tree view)
- [ ] `POST /api/admin/categories` — Create category
  - Request: `{ name, slug, description, icon, parent_id, is_featured }`
  - Auto-generate slug from name if not provided
  - Validate: unique name, unique slug
- [ ] `PATCH /api/admin/categories/:id` — Update category
  - Edit any field
  - Reorder within parent
- [ ] `DELETE /api/admin/categories/:id` — Archive category
  - Soft delete (is_archived: true)
  - Require: select replacement category for all posts
  - Move all posts to replacement category
- [ ] Tree structure:
  - Drag-and-drop reordering
  - Expand/collapse parent categories
  - View subcategories under parent
- [ ] Bulk actions:
  - Bulk feature/unfeature
  - Bulk archive
- [ ] Stats per category:
  - Post count
  - Pending posts
  - Approved posts
  - Most active authors

#### M10.8 — Hall of Fame Management
- [ ] `GET /api/admin/hall-of-fame` — All featured posts
- [ ] `POST /api/admin/hall-of-fame` — Add to Hall of Fame
  - Request: `{ post_id, editorial_note, featured_date }`
  - Editorial note: Short text explaining why featured
- [ ] `DELETE /api/admin/hall-of-fame/:id` — Remove from Hall of Fame
- [ ] `PATCH /api/admin/hall-of-fame/reorder` — Reorder featured posts
- [ ] Auto-candidate suggestions:
  - Posts with 50+ item-anchored comments
  - Posts active for 3+ months
  - Low controversy (more CONFIRMED than CONTESTED)
- [ ] Featured badge customization

#### M10.9 — Reactions Management
- [ ] `GET /api/admin/reactions` — All reactions
- [ ] `GET /api/admin/reactions/fire` — Fire reactions breakdown
  - By post, by list item, by comment
  - Top fired posts
  - Most fired items
- [ ] `DELETE /api/admin/reactions/:id` — Remove reaction (admin can delete any)
- [ ] Anti-fraud:
  - Detect bulk voting (same fingerprint multiple votes)
  - Detect coordinated voting (multiple fingerprints from same IP)
  - Auto-remove suspicious reactions

#### M10.10 — Search & Elasticsearch Management
- [ ] `GET /api/admin/search/status` — Elasticsearch connection status
  - Cluster health
  - Index existence
  - Document counts per index
  - Index sizes
- [ ] `POST /api/admin/search/reindex/posts` — Reindex all posts
  - Progress indicator
  - Error log if any
- [ ] `POST /api/admin/search/reindex/comments` — Reindex all comments
- [ ] `POST /api/admin/search/reindex/all` — Full reindex
- [ ] `DELETE /api/admin/search/index` — Delete and recreate index
- [ ] Index mappings viewer
- [ ] Test search query tool

#### M10.11 — Rate Limiting & Trust Scores
- [ ] `GET /api/admin/rate-limits` — View rate limit settings
- [ ] `PATCH /api/admin/rate-limits` — Adjust rate limits
  - General comments per hour
  - Item-anchored comments per hour
  - Posts per hour
  - Burst limit
- [ ] `GET /api/admin/trust-scores` — View trust score distribution
  - Count of Scholars
  - Count of Neutrals
  - Count of Trolls
  - Recently flagged users
- [ ] Manual trust score override:
  - `PATCH /api/admin/users/:fingerprint/trust` — Set trust level manually
  - Options: scholar, neutral, troll

#### M10.12 — Audit Logs
- [ ] `GET /api/admin/audit-logs` — All admin actions
  - Actions: login, approve_post, reject_post, delete_comment, etc.
  - Log: admin_id, action, target_id, timestamp, IP
- [ ] Filters:
  - By action type
  - By admin user
  - By date range
- [ ] Retention: 90 days default
- [ ] Export: CSV export for compliance

#### M10.13 — Frontend Admin Pages
- [ ] `/admin` — Redirect to dashboard (or login if not authenticated)
- [ ] `/admin/login` — Login page
  - Username input
  - Password input
  - "Remember me" checkbox
  - Forgot password link (future)
- [ ] `/admin/dashboard` — Overview with stats cards and charts
- [ ] `/admin/posts/pending` — Review queue
- [ ] `/admin/posts` — All posts management
- [ ] `/admin/comments` — Comments management
- [ ] `/admin/users` — Anonymous users management
- [ ] `/admin/categories` — Categories CRUD
- [ ] `/admin/hall-of-fame` — Featured posts
- [ ] `/admin/reactions` — Reactions overview
- [ ] `/admin/search` — Search management
- [ ] `/admin/settings` — Rate limits, trust scores
- [ ] `/admin/audit` — Audit logs

#### M10.14 — Admin UI Components
- [ ] `AdminLayout` — Sidebar navigation + header
- [ ] `AdminSidebar` — Collapsible, icons + labels
- [ ] `StatsCard` — Metric with trend indicator
- [ ] `StatsChart` — Line/bar charts (use Recharts)
- [ ] `DataTable` — Sortable, filterable, paginated
- [ ] `BulkActionsBar` — Appears when items selected
- [ ] `ReviewCard` — Pending post preview card
- [ ] `ApprovalModal` — Approve with optional note
- [ ] `RejectionModal` — Reject with reason dropdown + custom reason
- [ ] `CategoryTree` — Drag-drop tree view
- [ ] `UserBadge` — Trust score badge (Scholar/Neutral/Troll)
- [ ] `SearchInput` — Global admin search
- [ ] `DateRangePicker` — Filter by date
- [ ] `ExportButton` — CSV/Excel export
- [ ] `Toast` — Success/error notifications
- [ ] `ConfirmDialog` — Destructive action confirmation

---

### M11 — User Profiles
- [ ] `GET /api/users/:username` — Profile data
- [ ] `GET /api/users/:username/posts` — User's posts
- [ ] `PATCH /api/users/:username` — Update display name
- [ ] Frontend: `/any_XXXX` — Profile page
- [ ] Show Approved/Rejected/Pending posts with badges

### M12 — Search & Discovery
- [ ] Elasticsearch indexes for posts + comments
- [ ] `GET /api/search` — Full search
- [ ] `GET /api/search/autocomplete` — Autocomplete
- [ ] Filters: category, post type, author, date range
- [ ] Sort: relevance, newest, most fired
- [ ] Frontend: `/search`

### M13 — Arguments Page
- [ ] `GET /api/arguments` — Hot debates
- [ ] Most active item-anchored comments
- [ ] Filter by category, time range
- [ ] Frontend: `/arguments`

### M14 — Hall of Fame
- [ ] `GET /api/hall-of-fame` — Featured lists
- [ ] Admin curation controls
- [ ] Frontend: `/hall-of-fame`

---

## V1 MVP — COMPLETION CHECKLIST

- [ ] Anonymous post submission works (no login)
- [ ] Public feed shows only approved posts
- [ ] Post detail with list items + comments
- [ ] Nested comments (max 3 levels, Twitter/X-style)
- [ ] Item-anchored comments (highlight specific item)
- [ ] Fire reactions (toggle)
- [ ] Categories system (10 parents, 300 children)
- [ ] Admin login protects dashboard
- [ ] Review queue: approve/reject posts
- [ ] Submit page: create posts with dynamic list items
- [ ] Device fingerprinting tracks anonymous users
- [ ] Smart rate limiting (per user, not IP)
- [ ] Shadow Trust Score system
- [ ] Elasticsearch search with autocomplete
- [ ] Arguments page (hot debates)
- [ ] Hall of Fame
- [ ] User profiles at `/any_XXXX`
- [ ] Deployed and verified

---

## PHASE 2 — ADVANCED (V2)

After MVP launch. Optional features:

### V2.1 — Design & Styling
- [ ] Futuristic theme (design system)
- [ ] Retro theme (Myspace-style)
- [ ] Dark/light toggle
- [ ] Mobile-first responsive

### V2.2 — Post Changelog/Revisions
- [ ] Version history on posts
- [ ] Compare versions

### V2.3 — Counter-List System
- [ ] Counter List post type
- [ ] Battle View page

### V2.4 — Email Notifications
- [ ] Post approval/rejection
- [ ] Reply notifications

### V2.5 — PWA & Mobile
- [ ] Progressive Web App manifest
- [ ] Offline support

---

## API ENDPOINTS SUMMARY

### Public (No Auth)
```
GET    /api/categories              # List categories
GET    /api/categories/:slug       # Single category
GET    /api/posts                  # Approved posts (paginated)
GET    /api/posts/:id              # Single post with items + comments
POST   /api/posts                  # Submit new post (anonymous)
GET    /api/posts/:id/comments     # Comments for post
POST   /api/posts/:id/comments     # Add comment (anonymous)
PATCH  /api/comments/:id            # Edit own comment (2hr window)
DELETE /api/comments/:id           # Delete own comment
GET    /api/comments/:id/replies   # Get replies
POST   /api/reactions              # Toggle fire reaction
GET    /api/reactions/state        # Get reaction states
GET    /api/search                 # Full search
GET    /api/search/autocomplete    # Autocomplete
GET    /api/arguments              # Hot debates
GET    /api/hall-of-fame           # Featured lists
GET    /api/users/:username        # User profile
GET    /api/users/:username/posts  # User posts
PATCH  /api/users/:username        # Update display name
```

### Admin (Auth Required)
```
POST   /api/admin/login                # Admin login
POST   /api/admin/logout               # Admin logout
GET    /api/admin/me                   # Current admin user
POST   /api/admin/refresh              # Refresh JWT token
GET    /api/admin/stats                # Dashboard stats
GET    /api/admin/posts/pending        # Review queue
GET    /api/admin/posts/pending/:id   # Preview pending post
PATCH  /api/admin/posts/:id/approve    # Approve post
PATCH  /api/admin/posts/:id/reject     # Reject post
PATCH  /api/admin/posts/:id/request_changes  # Request changes
POST   /api/admin/posts/bulk/approve   # Bulk approve
POST   /api/admin/posts/bulk/reject    # Bulk reject
GET    /api/admin/posts                # All posts
PATCH  /api/admin/posts/:id            # Edit post
DELETE /api/admin/posts/:id            # Delete post
POST   /api/admin/posts/:id/feature    # Add to Hall of Fame
POST   /api/admin/posts/:id/unfeature  # Remove from Hall of Fame
GET    /api/admin/comments             # All comments
PATCH  /api/admin/comments/:id        # Edit comment
DELETE /api/admin/comments/:id         # Delete comment
POST   /api/admin/comments/:id/highlight  # Pin comment
GET    /api/admin/users                # All anonymous users
PATCH  /api/admin/users/:fingerprint/ban     # Ban user
PATCH  /api/admin/users/:fingerprint/whitelist  # Whitelist user
PATCH  /api/admin/users/:fingerprint/trust     # Set trust score
GET    /api/admin/categories           # All categories
POST   /api/admin/categories          # Create category
PATCH  /api/admin/categories/:id     # Update category
DELETE /api/admin/categories/:id      # Archive category
GET    /api/admin/hall-of-fame        # Featured posts
POST   /api/admin/hall-of-fame        # Add to Hall of Fame
DELETE /api/admin/hall-of-fame/:id   # Remove from Hall of Fame
PATCH  /api/admin/hall-of-fame/reorder  # Reorder
GET    /api/admin/reactions           # All reactions
DELETE /api/admin/reactions/:id      # Delete reaction
GET    /api/admin/search/status       # ES status
POST   /api/admin/search/reindex/posts    # Reindex posts
POST   /api/admin/search/reindex/comments # Reindex comments
POST   /api/admin/search/reindex/all      # Full reindex
GET    /api/admin/rate-limits         # View rate limits
PATCH  /api/admin/rate-limits        # Update rate limits
GET    /api/admin/trust-scores        # Trust score distribution
GET    /api/admin/audit-logs          # Audit logs
```

---

## FRONTEND ROUTES & PAGE DESCRIPTIONS

### Public Pages

#### 1. Homepage — `/`
**Description**: The main landing page displaying the public feed of approved posts.
- **Features**:
  - Header with logo, search bar, navigation links (Categories, Arguments, Hall of Fame), Submit button
  - Category filter dropdown in sidebar or header
  - Sort controls: Newest (default), Most Fired, Most Commented
  - Responsive grid of PostCards (1-3 columns based on screen)
  - PostCard displays: title, author (any_XXXX), category badge, 🔥 fire count, comment count, relative date
  - Click card → navigate to post detail
  - Pagination or "Load More" button (20 posts per page)
  - Loading skeletons while fetching
  - Empty state when no approved posts exist
- **API Calls**: `GET /api/posts`, `GET /api/categories`

---

#### 2. Submit Post Page — `/submit`
**Description**: Anonymous post submission form for creating top 10 lists.
- **Features**:
  - Post type selector dropdown: Top 10 List, This vs That, Who is Better, Fact Drop, Best Of, Worst Of, Hidden Gems, Counter List
  - Category selector dropdown (EXACTLY 1 category, required)
  - Title input (required, 5-300 chars)
  - Intro/description textarea (optional, max 2000 chars)
  - Dynamic list items section:
    - "Add Item" button to add more items
    - Each item: Rank # (auto), Title (required), Justification/description (required), Image URL (optional), Source URL (optional)
    - Remove item button per row
    - Up/Down arrows to reorder items
    - Minimum 1 item, maximum 25 items
  - Author display name input (required, 3-50 chars)
  - Device fingerprint auto-generated and hidden
  - Submit button with loading state
  - Success toast: "Post submitted! It's now pending review."
  - Error handling with toast notifications
  - Form validation before submit
- **API Calls**: `GET /api/categories`, `POST /api/posts`

---

#### 3. Post Detail Page — `/post/[id]`
**Description**: Full post display with ranked list items and nested comments.
- **Features**:
  - Post header: title (large), post type badge, category badge (links to /c/[slug]), author username (any_XXXX), created date
  - Status badge if viewing own post: Pending/Approved/Rejected
  - Intro/description section
  - List items section:
    - Ranked display (#1, #2, #3...)
    - Each item: rank number, title (bold), justification/description (expandable), image (if provided), source link (if provided)
    - 🔥 Fire button per item with count
    - "Challenge" button to anchor a comment to this specific item
  - Post-level Fire reaction button
  - Total comment count display
  - "Submit a Counter-List" prominent button (links to /submit with counter_list type)
  - "View History" link (shows changelog)
  - Comments section:
    - Toggle: "Comment on this post" vs "Comment on item #X"
    - Comment form: textarea (1-2000 chars), author display name input
    - Nested comment tree (max 3 levels, Twitter/X-style):
      - Level 1: Top-level comment
      - Level 2: Reply to L1
      - Level 3: Reply to L2 (replies go to L2's parent after this)
    - Each comment shows: author username, content, timestamp, reply button
    - If item-anchored: shows "Replying to Item #X" with item title
    - Inline reply form when clicking reply
- **API Calls**: `GET /api/posts/:id`, `GET /api/posts/:id/comments`, `POST /api/comments`, `POST /api/reactions`, `GET /api/reactions/state`

---

#### 4. Post History/Changelog — `/post/[id]/history`
**Description**: Version history page showing all revisions of a post.
- **Features**:
  - List of all versions:
    - Version number (v1, v2, v3...)
    - Date created
    - Author (username)
    - Change summary (if provided)
  - Click version to view that version's full content
  - "Compare with current" button to see diff
  - Side-by-side comparison view
- **API Calls**: `GET /api/posts/:id/history`

---

#### 5. Categories Page — `/categories`
**Description**: Browse all categories in a grid.
- **Features**:
  - Page title: "Categories"
  - Search/filter categories input
  - Grid of CategoryCards:
    - Category name
    - Category icon (emoji)
    - Post count
    - Subcategory count (if parent)
  - Featured categories section at top (is_featured: true)
  - Click card → navigate to category feed
- **API Calls**: `GET /api/categories`

---

#### 6. Category Feed Page — `/c/[slug]`
**Description**: Posts filtered by a specific category.
- **Features**:
  - Category header: name, description, icon
  - Subcategories list (if parent category has children)
  - Same feed layout as homepage (PostCards grid)
  - Sort controls: Newest, Most Fired, Most Commented
  - Breadcrumb: Home > Categories > Category Name
  - Back to all categories link
  - 404 if category not found or archived
- **API Calls**: `GET /api/categories/:slug`, `GET /api/posts?category_id=...`

---

#### 7. Search Results Page — `/search`
**Description**: Full-text search across posts and comments with filters.
- **Features**:
  - Search input at top (pre-filled with query from URL)
  - Results count: "Found X results for 'query'"
  - Tabs: All | Posts | Comments
  - Filters sidebar:
    - Category checkboxes
    - Post type checkboxes
    - Author input (username)
    - Date range picker (From/To with presets: Today, This Week, This Month, This Year)
    - "Clear all filters" button
  - Sort options: Relevance (default), Newest, Oldest, Most Fired
  - Results display:
    - Post results: title (highlighted), excerpt, category badge, author, fire count, comment count, date
    - Comment results: content (highlighted), post title attached to, author, date, reply count
  - Active filters shown as removable tags
  - URL params for shareability: `/search?q=movies&category=tech&sort=newest`
  - Pagination or "Load More"
  - Empty results state: "No results found for 'query'"
  - No query state: Show recent/popular posts
- **API Calls**: `GET /api/search`, `GET /api/search/posts`, `GET /api/search/comments`

---

#### 8. Arguments Page — `/arguments`
**Description**: Hot debates page showing most active item-anchored comments (the "Talk" page).
- **Features**:
  - Page title: "Arguments" or "Hot Debates"
  - Description: "Most active item-anchored discussions"
  - Filter bar:
    - Category dropdown (filter by category)
    - Time range: Today, This Week, This Month, All Time (default)
  - Sort toggle: Most Replies, Recent Activity
  - List of ArgumentItems:
    - Post title
    - List item number and title (e.g., "#4: The Godfather")
    - Comment preview (first 100 chars)
    - Reply count
    - Time since last reply ("2 hours ago")
  - Click item → navigates to post, scrolls to that specific item
- **API Calls**: `GET /api/arguments`

---

#### 9. Hall of Fame Page — `/hall-of-fame`
**Description**: Curated best lists - the "Gold Standard" lists like Wikipedia's Featured Articles.
- **Features**:
  - Page title: "Hall of Fame"
  - Description: "The best lists, confirmed by the community"
  - Featured section (admin-curated):
    - Large featured cards with:
      - Post title
      - Editorial note (if any)
      - Author
      - Category badge
      - 🔥 fire count
      - "Featured" badge
  - Category sections below:
    - Posts organized by category
    - Community-vetted criteria badge:
      - 50+ item-anchored comments
      - Active for 3+ months
      - Low controversy
  - Static display (not algorithm-sorted)
- **API Calls**: `GET /api/hall-of-fame`

---

#### 10. User Profile Page — `/users/[username]`
**Description**: Anonymous user profile showing their posts and customizable display name.
- **Features**:
  - Profile header:
    - Username: `any_XXXX`
    - Custom display name: "also known as: any_nekw" (if set)
    - Edit button (only if viewing own profile - matched by device fingerprint)
    - Stats: Total posts, Approved, Rejected, Pending
  - Tab navigation: Posts | Comments
  - Posts tab:
    - Filter tabs: All | Approved | Rejected | Pending
    - List of user's posts:
      - Post title
      - Category badge
      - Status badge (only visible to author):
        - Green: "Approved"
        - Red: "Rejected" (with rejection reason on hover)
        - Yellow: "Pending"
      - Fire count, Comment count
      - Created date
  - Comments tab:
    - List of comments made by user:
      - Comment content (truncated)
      - Post title it was commented on
      - Date
      - Reply count
  - Edit display name modal (own profile only):
    - Input for new last 4 characters
    - Availability check
    - Save/Cancel buttons
    - Must keep `any_` prefix
- **API Calls**: `GET /api/users/:username`, `GET /api/users/:username/posts`

---

### Admin Pages

#### 11. Admin Login Page — `/admin/login`
**Description**: Admin authentication page.
- **Features**:
  - YoTop10 logo/branding
  - Username input
  - Password input
  - "Remember me" checkbox
  - Login button
  - Error messages for invalid credentials
  - Rate limit message if too many attempts
- **API Calls**: `POST /api/admin/login`

---

#### 12. Admin Dashboard — `/admin/dashboard`
**Description**: Overview of platform statistics.
- **Features**:
  - Sidebar navigation (collapsible)
  - Header: "Admin Dashboard", current admin username, logout button
  - Stats cards row:
    - Total Posts (all time)
    - Pending Review (clickable → review queue)
    - Approved (this month)
    - Rejected (this month)
    - Total Comments
    - Total Users (anonymous)
    - Total Categories
  - Charts section:
    - Posts over time (line chart)
    - Comments over time (line chart)
    - Top categories by posts (bar chart)
  - Recent activity feed
  - Quick action buttons: "Review Queue", "Create Category"
- **API Calls**: `GET /api/admin/stats`

---

#### 13. Review Queue — `/admin/posts/pending`
**Description**: List of posts awaiting approval.
- **Features**:
  - Header: "Pending Reviews", count badge
  - Filters: category, post type, date range, author search
  - Sort: Oldest first (default)
  - List of ReviewCards:
    - Post title
    - Author username
    - Category
    - Post type badge
    - Submitted date
    - Quick preview (expand inline)
  - Actions per card:
    - Approve button (green)
    - Reject button (red) - opens modal
    - Request Changes button (yellow) - opens modal
    - Preview button - shows full post in modal
  - Bulk actions bar (when items selected): Bulk Approve, Bulk Reject
  - Keyboard shortcuts hint: "A: Approve | R: Reject | E: Request Changes"
  - Pagination
- **API Calls**: `GET /api/admin/posts/pending`, `PATCH /api/admin/posts/:id/approve`, `PATCH /api/admin/posts/:id/reject`, `PATCH /api/admin/posts/:id/request_changes`

---

#### 14. All Posts Management — `/admin/posts`
**Description**: Complete posts management table.
- **Features**:
  - Header: "All Posts", search input
  - Filters: status (All/Pending/Approved/Rejected), category, post type, date range
  - Data table columns:
    - Checkbox (bulk select)
    - ID
    - Title (truncated)
    - Author
    - Category
    - Post Type
    - Status (badge)
    - 🔥
    - 💬
    - 👁
    - Created
    - Published
    - Actions
  - Actions dropdown: View, Edit, Delete, Feature, Unfeature, Lock, Bump
  - Bulk actions: Select all, Approve, Reject, Delete, Feature, Change Category
  - Export button: CSV/Excel download
  - Pagination
- **API Calls**: `GET /api/admin/posts`, `PATCH /api/admin/posts/:id`, `DELETE /api/admin/posts/:id`

---

#### 15. Comments Management — `/admin/comments`
**Description**: All comments management with moderation tools.
- **Features**:
  - Header: "Comments", search input
  - Filters: by post, by author, type (Post Comment/Item-Anchored), date range, has replies
  - Data table:
    - ID
    - Content (truncated)
    - Author
    - Post (title, link)
    - Type badge
    - Item # (if anchored)
    - 🔥
    - Replies
    - Created
    - Actions
  - Actions: View Post, Edit, Delete, Highlight, Hide
  - Moderation flags column:
    - ⚠️ Controversial (high negative fires)
    - ⚠️ Potential Spam (very long)
    - ⚠️ Brigading (many rapid replies)
  - Click flag to investigate
- **API Calls**: `GET /api/admin/comments`, `PATCH /api/admin/comments/:id`, `DELETE /api/admin/comments/:id`

---

#### 16. Users Management — `/admin/users`
**Description**: Anonymous users management.
- **Features**:
  - Header: "Users", search by username or fingerprint
  - Filters: trust score (Scholar/Neutral/Troll), post count, ban status, date range
  - Data table:
    - Username (any_XXXX)
    - Custom Display Name
    - Fingerprint (truncated)
    - Posts (Approved/Rejected/Pending breakdown)
    - Comments
    - Trust Score (badge)
    - First Seen
    - Last Active
    - Actions
  - Actions: View Profile, Ban, Whitelist, Shadow Ban
  - Ban modal: confirm, select duration
  - Trust score override dropdown
- **API Calls**: `GET /api/admin/users`, `PATCH /api/admin/users/:fingerprint/ban`

---

#### 17. Categories Management — `/admin/categories`
**Description**: CRUD for categories with tree view.
- **Features**:
  - Header: "Categories", "Add Category" button
  - Tree view:
    - Parent categories expandable
    - Drag-and-drop reordering
    - Expand/collapse children
    - Each item: icon, name, post count, featured badge, archived badge
  - Add/Edit category modal:
    - Name input
    - Slug input (auto-generated from name)
    - Description textarea
    - Icon picker (emoji)
    - Parent category dropdown
    - Featured toggle
  - Archive category modal (when deleting):
    - Select replacement category
    - Confirm move of all posts
  - Bulk actions: Feature, Unfeature, Archive
- **API Calls**: `GET /api/admin/categories`, `POST /api/admin/categories`, `PATCH /api/admin/categories/:id`, `DELETE /api/admin/categories/:id`

---

#### 18. Hall of Fame Management — `/admin/hall-of-fame`
**Description**: Manage featured posts.
- **Features**:
  - Header: "Hall of Fame Management"
  - "Add to Hall of Fame" button → opens modal:
    - Search for post
    - Add editorial note (optional)
    - Set featured date
  - List of featured posts:
    - Post title
    - Editorial note
    - Featured date
    - Actions: Remove, Edit Note, Reorder
  - Reorder via drag-and-drop
  - Auto-candidates section:
    - Suggested posts based on criteria
    - One-click "Add" button
- **API Calls**: `GET /api/admin/hall-of-fame`, `POST /api/admin/hall-of-fame`, `DELETE /api/admin/hall-of-fame/:id`

---

#### 19. Reactions Management — `/admin/reactions`
**Description**: Overview of all fire reactions with anti-fraud.
- **Features**:
  - Header: "Reactions"
  - Stats cards:
    - Total fires
    - Fires on posts
    - Fires on items
    - Fires on comments
  - Tabs: All | Posts | Items | Comments
  - Top lists:
    - Most fired posts
    - Most fired items
    - Most fired comments
  - Suspicious activity section:
    - Bulk voting detected (same fingerprint)
    - Coordinated voting (same IP)
    - Auto-removed suspicious reactions
  - Action: Remove individual reactions
- **API Calls**: `GET /api/admin/reactions`, `GET /api/admin/reactions/fire`

---

#### 20. Search Management — `/admin/search`
**Description**: Elasticsearch management and reindexing.
- **Features**:
  - Header: "Search Management"
  - Connection status card:
    - Cluster health (green/yellow/red)
    - Node count
    - Index existence (posts, comments)
  - Index stats:
    - Posts index: document count, size
    - Comments index: document count, size
  - Actions:
    - "Reindex Posts" button with progress bar
    - "Reindex Comments" button with progress bar
    - "Full Reindex" button
    - "Delete & Recreate Index" (with confirmation)
  - Test search tool:
    - Input query
    - Select index (posts/comments)
    - View results
  - Index mappings viewer (read-only)
- **API Calls**: `GET /api/admin/search/status`, `POST /api/admin/search/reindex/posts`, `POST /api/admin/search/reindex/comments`

---

#### 21. Settings Page — `/admin/settings`
**Description**: Rate limits and trust score configuration.
- **Features**:
  - Header: "Settings"
  - Rate Limiting section:
    - General comments per hour (input, default: 5)
    - Item-anchored comments per hour (input, default: 25)
    - Posts per hour (input, default: 4)
    - Burst limit (input, default: 5 per 5 min)
    - Save button
  - Trust Scores section:
    - Distribution stats: Scholars count, Neutrals count, Trolls count
    - Recent flagged users list
    - Manual override: select user, set trust level
  - Save confirmation toast
- **API Calls**: `GET /api/admin/rate-limits`, `PATCH /api/admin/rate-limits`, `GET /api/admin/trust-scores`

---

#### 22. Audit Logs — `/admin/audit`
**Description**: History of all admin actions.
- **Features**:
  - Header: "Audit Logs"
  - Filters: action type, admin user, date range
  - Data table:
    - Timestamp
    - Admin username
    - Action (login, approve_post, reject_post, delete_comment, etc.)
    - Target (post ID, user ID, etc.)
    - IP Address
    - Details (JSON expandable)
  - Pagination
  - Export CSV button
  - Retention notice: "Logs kept for 90 days"
- **API Calls**: `GET /api/admin/audit-logs`

---

## TECH STACK

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Search | Elasticsearch |
| Cache/Rate Limit | Redis |
| Auth | Admin only (JWT) |
| User Identity | Device fingerprint + `any_XXXX` |
| File Storage | MinIO / Cloudinary |

---

## WHAT WAS REMOVED

These features from the old social platform are NOT part of V1:

| Old Feature | Reason |
|-------------|--------|
| User registration/email auth | Replaced by anonymous |
| Google OAuth | Replaced by anonymous |
| JWT for users | Admin only |
| NextAuth.js | Admin only |
| User profiles (old) | Replaced by `/any_XXXX` |
| Follow system | Not needed |
| Connection system | Not needed |
| Reactions (complex) | Just fire for MVP |
| Strike system | Admin-only platform |
| Report system | Not needed for MVP |
| Communities | Not needed |
| Ephemeral threads | Not needed |
| Badge/Rank system | Not needed |
| Multi-account | Not needed |
| Trust scores (old) | Replaced by Shadow Trust |
