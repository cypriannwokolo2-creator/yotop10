# Phase 3: Frontend Pages & Core Features

> **Platform**: Open anonymous top 10 lists platform. No login required for users. Admin-only access.
> **Stack**: MERN — MongoDB + Express + Next.js + Elasticsearch
> **Note**: This phase builds all user-facing pages and the advanced features that make YoTop10 unique.

---

## Overview

Phase 3 transforms the platform from a simple submission system into a fully-featured social publishing platform. This includes:

1. **Public Feed & Homepage** — Browse approved posts with filters
2. **Submit Post Page** — Anonymous post creation with dynamic list items
3. **Post Detail Page** — Full post display with nested comments and fire reactions
4. **Search & Categories** — Elasticsearch-powered search with autocomplete
5. **Arguments Page** — Hot debates aggregation (the "Talk" page)
6. **Hall of Fame** — Curated best lists
7. **User Profiles** — Anonymous profiles at `/any_XXXX`

---

## M3.1: Public Feed & Homepage

**Goal**: Create the main public feed where users browse approved posts

### Description
Build the homepage that displays approved posts in a scrollable feed. This is the landing page users see when they visit the site. Posts are sorted by newest first by default.

### Pages to Build
| Route | Description |
|-------|-------------|
| `/` | Main homepage with public feed |

### Components to Create
| Component | Description | File |
|-----------|-------------|------|
| `PostCard` | Reusable card showing post preview | `components/PostCard.tsx` |
| `PostFeed` | Grid/list of PostCards with pagination | `components/PostFeed.tsx` |
| `CategoryFilter` | Sidebar or dropdown to filter by category | `components/CategoryFilter.tsx` |
| `SortControl` | Toggle between Newest / Most Popular / Most Commented | `components/SortControl.tsx` |
| `SearchBar` | Search input with autocomplete | `components/SearchBar.tsx` |
| `LoadingSpinner` | Skeleton loaders while fetching | `components/LoadingSpinner.tsx` |
| `EmptyState` | Display when no posts available | `components/EmptyState.tsx` |

### API Integration
```typescript
// Frontend API calls needed
GET /api/posts?status=approved&sort=newest&page=1&limit=20
GET /api/categories
GET /api/search/autocomplete?q=prefix
```

### Features List
- [ ] Display posts in responsive grid (1-3 columns based on screen width)
- [ ] Post card shows:
  - Title (truncated to 2 lines)
  - Author username (format: `any_XXXX`)
  - Category badge (single category, required)
  - 🔥 Fire count
  - Comment count
  - Created date (relative: "2 hours ago")
- [ ] Click card → navigate to `/post/[id]`
- [ ] Category filter sidebar or dropdown
- [ ] Sort options: Newest (default), Most Fired, Most Commented
- [ ] Loading skeletons while fetching data
- [ ] Empty state when no posts approved
- [ ] Pagination (20 posts per page) or "Load More" button
- [ ] Search bar with autocomplete in header

### Technical Notes
- Use existing CSS theme (Retro/Futuristic)
- Integrate with existing layout (Topbar, Sidebar)
- Device fingerprint generated client-side on page load
- Store device fingerprint in localStorage for persistence

---

## M3.2: Submit Post Page

**Goal**: Allow anonymous users to create and submit new posts

### Description
Build a form that lets users create top 10 lists and other post types without logging in. Posts go to "pending review" status until admin approves them.

### Pages to Build
| Route | Description |
|-------|-------------|
| `/submit` | Post submission form |

### Components to Create
| Component | Description | File |
|-----------|-------------|------|
| `PostTypeSelector` | Dropdown to select post type | `components/PostTypeSelector.tsx` |
| `CategorySelector` | Single category dropdown (NOT multiple) | `components/CategorySelector.tsx` |
| `ListItemEditor` | Dynamic form to add/remove/reorder list items | `components/ListItemEditor.tsx` |
| `ListItemRow` | Single row for a list item | `components/ListItemRow.tsx` |
| `AuthorNameInput` | Input for display name | `components/AuthorNameInput.tsx` |
| `SubmitButton` | Submit with loading state | `components/SubmitButton.tsx` |
| `PostForm` | Main form container | `components/PostForm.tsx` |

### Post Types
| Type | Value | Description |
|------|-------|-------------|
| Top 10 List | `top_list` | Traditional "Top 10" ranking |
| This vs That | `this_vs_that` | A vs B head-to-head |
| Who is Better | `who_is_better` | Multi-candidate selection |
| Fact Drop | `fact_drop` | Informational/facts |
| Best Of | `best_of` | Curated best selections |
| Worst Of | `worst_of` | Curated worst selections |
| Hidden Gems | `hidden_gems` | Underrated/undiscovered |
| Counter List | `counter_list` | Rebuttal to existing post |

### API Integration
```typescript
// Frontend API calls needed
GET /api/categories  // For category dropdown
POST /api/posts      // Submit new post
```

### Features List
- [ ] Post type dropdown with all 8 types
- [ ] **Category selector: EXACTLY 1 category (required)** — NOT multiple
- [ ] Title input (required, 5-300 characters)
- [ ] Intro/description textarea (optional, max 2000 chars)
- [ ] Dynamic list items section:
  - "Add Item" button
  - Each item fields:
    - Rank # (auto-generated: 1, 2, 3...)
    - Title (required, max 500 chars)
    - Justification/description (required, max 2000 chars)
    - Image URL (optional)
    - Source URL (optional)
  - "Remove" button per item
  - Drag handles or Up/Down buttons to reorder
  - Minimum 1 item required, maximum 25
- [ ] Author display name input:
  - Required, 3-50 characters
  - Will be converted to format: `any_XXXX`
  - User can customize last 4 characters later in profile
- [ ] Device fingerprint (auto-generated, hidden field)
- [ ] Submit button with loading state
- [ ] Success message: "Post submitted! It's now pending review."
- [ ] Error handling with toast notifications
- [ ] Form validation before submit
- [ ] Prevent double submission

### Data Structure Submitted
```json
{
  "title": "Top 10 Best Movies of 2024",
  "post_type": "top_list",
  "category_id": "uuid-of-category",
  "intro": "These are the best movies from this year...",
  "items": [
    {
      "rank": 1,
      "title": "Dune: Part Two",
      "justification": "A masterpiece of cinema...",
      "image_url": "https://...",
      "source_url": "https://..."
    }
  ],
  "author_display_name": "moviebuff",
  "device_fingerprint": "abc123xyz"
}
```

### Technical Notes
- Auto-generate device fingerprint on page load using: Canvas + WebGL + Audio Context + Screen Resolution + Timezone + Language + Fonts
- Store fingerprint in localStorage for persistence across sessions
- Form validation using Zod or similar
- Show all required fields with asterisk
- Mobile-responsive form layout

---

## M3.3: Post Detail & Comments

**Goal**: Display full post content with nested comments and fire reactions

### Description
The full post page shows all list items, allows users to react with fire, and enables commenting with nested replies (up to 3 levels deep like Twitter/X).

### Pages to Build
| Route | Description |
|-------|-------------|
| `/post/[id]` | Individual post detail |
| `/post/[id]/history` | Post changelog/revisions |

### Components to Create
| Component | Description | File |
|-----------|-------------|------|
| `PostHeader` | Title, author, category, date, status | `components/PostHeader.tsx` |
| `PostMeta` | Post metadata (type, date, status) | `components/PostMeta.tsx` |
| `ListItemCard` | Individual list item with rank, title, justification, image | `components/ListItemCard.tsx` |
| `ListItemsSection` | Container for all list items | `components/ListItemsSection.tsx` |
| `FireReaction` | Fire button with count (toggle on/off) | `components/FireReaction.tsx` |
| `CounterListButton` | "Submit a Counter-List" prominent button | `components/CounterListButton.tsx` |
| `CommentSection` | Container for all comments | `components/CommentSection.tsx` |
| `CommentTree` | Nested comment display (recursive) | `components/CommentTree.tsx` |
| `CommentItem` | Single comment with author, content, timestamp | `components/CommentItem.tsx` |
| `CommentForm` | Add new comment textarea + submit | `components/CommentForm.tsx` |
| `ReplyForm` | Inline reply form | `components/ReplyForm.tsx` |
| `ItemAnchor` | Highlight specific list item when commenting | `components/ItemAnchor.tsx` |
| `PostHistory` | Changelog/version history | `components/PostHistory.tsx` |
| `VersionCard` | Single version in history | `components/VersionCard.tsx` |

### API Integration
```typescript
// Frontend API calls needed
GET /api/posts/{id}                           // Fetch single post with items
GET /api/posts/{id}/comments                  // Fetch nested comments
GET /api/posts/{id}/history                   // Fetch version history
POST /api/comments                            // Add comment
PATCH /api/comments/{id}                      // Edit comment (within 2hr)
DELETE /api/comments/{id}                    // Delete comment
POST /api/reactions                           // Add/remove fire reaction
GET /api/reactions/state?target_type=post&target_id={id}  // Check reaction status
GET /api/posts/{id}/counter-lists             // Get counter lists
```

### Features List

#### Post Display
- [ ] Full post header:
  - Title (large heading)
  - Post type badge
  - **Single category badge** (links to `/c/[slug]`)
  - Author username: `any_XXXX`
  - Created date (full: "January 15, 2024 at 3:45 PM")
  - Status badge if viewing own post (Pending/Approved/Rejected)
- [ ] Intro/description section
- [ ] List items section:
  - Ranked list (1, 2, 3... displayed as #1, #2, #3)
  - Each item:
    - Rank number
    - Title (bold)
    - Justification/description (expandable for long text)
    - Image (if provided)
    - Source link (if provided)
  - 🔥 Fire button per item
  - "Challenge" button per item (anchors comment to this item)

#### Fire Reactions
- [ ] Fire emoji button on post
- [ ] Fire count display
- [ ] Toggle on/off (requires device fingerprint)
- [ ] Show "You fired" status if user already reacted
- [ ] Optimistic UI updates (update immediately, revert on error)
- [ ] Fire button per list item as well

#### Comments System (Twitter/X-style)
- [ ] Total comment count display
- [ ] Two comment modes:
  - **Full Post Comment**: Comment on the list as a whole
  - **Item-Anchored Comment**: Comment on a specific list item (item highlighted)
- [ ] Nested display (max 3 levels):
  ```
  Level 1: Top-level comment
    Level 2: Reply to L1
      Level 3: Reply to L2
        (No more nesting - reply goes to L2's parent)
  ```
- [ ] Each comment displays:
  - Author username: `any_XXXX`
  - Content (max 2000 chars)
  - Timestamp (relative: "2h ago")
  - Reply button
  - If item-anchored: shows "Replying to Item #3"
- [ ] Add comment form:
  - Textarea (required, 1-2000 chars)
  - Author display name input
  - Toggle: "Comment on this item" vs "Comment on post"
  - If item selected: show which item
- [ ] Reply to comment:
  - Inline reply form appears below comment
  - Cancel button
  - Auto-fill parent comment ID

#### Counter-List / Rebuttal
- [ ] Prominent "Submit a Counter-List" button
- [ ] If counter lists exist, show them below original post
- [ ] Each counter list shows:
  - Title
  - Author
  - Fire count
  - Link to counter post

#### Post History/Changelog
- [ ] "View History" link on post
- [ ] Shows all versions:
  - Version number
  - Date created
  - Author
  - Change summary (if provided)
- [ ] Click to view any version
- [ ] Compare versions side-by-side

### Rate Limiting (Smart)
```typescript
// Implemented on backend, documented here for reference
- General Comments: 5 per hour per user
- Item-Anchored Comments: 25 per hour per user
- Velocity Rule: Max 5 comments per 5 minutes (burst protection)
- Shadow Trust Score:
  - Scholar (last 5 posts approved): 2x limit = 40 comments/hour
  - Neutral: 1x limit = 20 comments/hour
  - Troll (recent posts rejected): 0.1x limit = 2 comments/hour
```

### Technical Notes
- Use device fingerprint for anonymous user tracking
- Debounce rapid fire clicks (300ms)
- Lazy load comments if >50 comments
- Optimistic UI updates for reactions and comments
- 2-hour edit window for own comments
- Store author display name in localStorage

---

## M3.4: Search & Categories Pages

**Goal**: Advanced search with Elasticsearch, filters, autocomplete, and category browsing

### Description
Build powerful search functionality using Elasticsearch with autocomplete, faceted filters, and sorting. Also create category browsing pages.

### Pages to Build
| Route | Description |
|-------|-------------|
| `/search` | Search results page |
| `/categories` | All categories grid |
| `/c/[slug]` | Posts by category |
| `/arguments` | Hot debates page (most active item-anchored comments) |
| `/hall-of-fame` | Curated best lists |

### Components to Create
| Component | Description | File |
|-----------|-------------|------|
| `SearchBar` | Input with autocomplete dropdown | `components/SearchBar.tsx` |
| `AutocompleteDropdown` | Live suggestions as user types | `components/AutocompleteDropdown.tsx` |
| `SearchResults` | Tabbed results display | `components/SearchResults.tsx` |
| `SearchFilters` | Sidebar with filter options | `components/SearchFilters.tsx` |
| `FilterCheckbox` | Category, post type checkboxes | `components/FilterCheckbox.tsx` |
| `DateRangePicker` | Filter by date range | `components/DateRangePicker.tsx` |
| `ResultCard` | Individual result preview | `components/ResultCard.tsx` |
| `PostResultCard` | Result card for posts | `components/PostResultCard.tsx` |
| `CommentResultCard` | Result card for comments | `components/CommentResultCard.tsx` |
| `Pagination` | Page navigation | `components/Pagination.tsx` |
| `CategoryGrid` | Grid of category cards | `components/CategoryGrid.tsx` |
| `CategoryCard` | Individual category card | `components/CategoryCard.tsx` |
| `ArgumentsList` | List of hot debates | `components/ArgumentsList.tsx` |
| `ArgumentItem` | Single hot debate item | `components/ArgumentItem.tsx` |
| `HallOfFameList` | Featured lists display | `components/HallOfFameList.tsx` |
| `FeaturedBadge` | Featured badge component | `components/FeaturedBadge.tsx` |

### Elasticsearch Setup

#### Index Mappings

**posts index:**
```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "title": { "type": "text", "analyzer": "standard" },
      "intro": { "type": "text", "analyzer": "standard" },
      "items": {
        "type": "nested",
        "properties": {
          "title": { "type": "text" },
          "justification": { "type": "text" }
        }
      },
      "post_type": { "type": "keyword" },
      "category_id": { "type": "keyword" },
      "category_name": { "type": "keyword" },
      "author_username": { "type": "keyword" },
      "author_display_name": { "type": "keyword" },
      "status": { "type": "keyword" },
      "fire_count": { "type": "integer" },
      "comment_count": { "type": "integer" },
      "created_at": { "type": "date" },
      "updated_at": { "type": "date" }
    }
  }
}
```

**comments index:**
```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "post_id": { "type": "keyword" },
      "post_title": { "type": "text" },
      "list_item_id": { "type": "keyword" },
      "list_item_rank": { "type": "integer" },
      "list_item_title": { "type": "text" },
      "parent_comment_id": { "type": "keyword" },
      "depth": { "type": "integer" },
      "content": { "type": "text", "analyzer": "standard" },
      "author_username": { "type": "keyword" },
      "author_display_name": { "type": "keyword" },
      "reply_count": { "type": "integer" },
      "created_at": { "type": "date" }
    }
  }
}
```

### API Integration
```typescript
// Frontend API calls needed
GET /api/search?q=query&filters...           // Full search
GET /api/search/posts?q=query&filters...      // Posts only
GET /api/search/comments?q=query&filters...   // Comments only
GET /api/search/autocomplete?q=prefix        // Autocomplete suggestions
GET /api/categories                           // All categories
GET /api/categories/{slug}                    // Single category with posts
GET /api/arguments                            // Hot debates
GET /api/hall-of-fame                         // Featured lists
```

### Search Features List

#### Search Bar & Autocomplete
- [ ] Search input with placeholder "Search posts, comments, topics..."
- [ ] Autocomplete:
  - Debounced (300ms delay)
  - Minimum 2 characters to trigger
  - Show up to 10 suggestions
  - Suggestions include: post titles, category names, author usernames
  - Click suggestion → full search page
  - Keyboard navigation (up/down arrows, enter to select)

#### Search Results Page
- [ ] Query displayed at top: "Results for 'search term'"
- [ ] Results count: "Found 42 results"
- [ ] Tabs:
  - **All**: Posts and comments mixed
  - **Posts**: Post results only
  - **Comments**: Comment results only

#### Filters Sidebar
- [ ] Category checkboxes (from `/api/categories`)
- [ ] Post type checkboxes (top_list, this_vs_that, etc.)
- [ ] Author filter (input for username)
- [ ] Date range picker:
  - Preset options: Today, This Week, This Month, This Year
  - Custom range: From/To date inputs
- [ ] "Clear all filters" button
- [ ] Active filters displayed as removable tags

#### Sort Options
- [ ] Relevance (default) — Elasticsearch score
- [ ] Newest — created_at descending
- [ ] Oldest — created_at ascending
- [ ] Most Fired — fire_count descending
- [ ] Most Commented — comment_count descending

#### Results Display
- [ ] Post result card shows:
  - Title (highlighted match)
  - Excerpt (with match highlighted)
  - Category badge
  - Author username
  - Fire count, Comment count
  - Date
- [ ] Comment result card shows:
  - Comment content (highlighted match)
  - Post title it's attached to
  - Author username
  - Date
  - Reply count
- [ ] "Load more" button or pagination
- [ ] Empty results state: "No results found for 'query'"
- [ ] No query state: Show recent/popular posts

#### URL Persistence
- [ ] Search params in URL: `/search?q=movies&category=tech&sort=newest`
- [ ] Shareable search URLs
- [ ] Browser back/forward works

### Category Page Features List

#### All Categories Page (`/categories`)
- [ ] Grid of all categories
- [ ] Each card shows:
  - Category name
  - Category icon (emoji)
  - Post count
  - Subcategory count (if parent)
- [ ] Search/filter categories
- [ ] Featured categories section (is_featured)

#### Category Detail Page (`/c/[slug]`)
- [ ] Category name as heading
- [ ] Category description
- [ ] Subcategories list (if parent category)
- [ ] Posts in this category
- [ ] Same feed layout as homepage
- [ ] Sort options
- [ ] Back to all categories link
- [ ] 404 if category not found

### Arguments Page Features List (`/arguments`)

> Also known as "Hot Debates" or "Talk Page"

- [ ] Page title: "Arguments" or "Hot Debates"
- [ ] Description: "Most active item-anchored discussions"
- [ ] List of item-anchored comments sorted by:
  - Most replies
  - Most recent activity
- [ ] Each item shows:
  - Post title
  - List item number and title
  - Comment preview (first 100 chars)
  - Reply count
  - Time since last reply
- [ ] Filter by category
- [ ] Filter by time range:
  - Today
  - This Week
  - This Month
  - All Time
- [ ] Click → navigates to post, scrolls to item

### Hall of Fame Features List (`/hall-of-fame`)

> The "Gold Standard" lists — Wikipedia's "Featured Articles"

- [ ] Page title: "Hall of Fame"
- [ ] Description: "The best lists, confirmed by the community"
- [ ] Featured section (admin-curated):
  - Large cards for featured posts
  - "Featured" badge
  - Admin editorial note (optional)
- [ ] Category sections below:
  - Posts organized by category
  - Community-vetted criteria:
    - 50+ item-anchored comments
    - Majority not challenged
    - Active for 3+ months
    - Low controversy (more CONFIRMED than CONTESTED)
- [ ] Badge: "Hall of Fame" icon
- [ ] Static display (not sorted by algorithm)
- [ ] Admin controls:
  - Manually add/remove lists
  - Feature/unfeature
  - Add editorial notes

---

## M3.5: User Profiles & Anonymous Identity

**Goal**: Allow users to customize their anonymous identity and view their posts

### Pages to Build
| Route | Description |
|-------|-------------|
| `/any_[xxxx]` | User profile (e.g., `/any_9Gh7`, `/any_nekw`) |

### Components to Create
| Component | Description | File |
|-----------|-------------|------|
| `UserProfile` | Profile page container | `components/UserProfile.tsx` |
| `ProfileHeader` | Username, display name, stats | `components/ProfileHeader.tsx` |
| `ProfileNameEditor` | Form to change display name | `components/ProfileNameEditor.tsx` |
| `UserPostList` | List of user's posts | `components/UserPostList.tsx` |
| `PostStatusBadge` | Approved/Rejected/Pending badge | `components/PostStatusBadge.tsx` |
| `TabNavigation` | Posts/Comments toggle | `components/TabNavigation.tsx` |

### API Integration
```typescript
// Frontend API calls needed
GET /api/users/{username}              // Get user profile
GET /api/users/{username}/posts        // Get user's posts
PATCH /api/users/{username}            // Update display name
```

### User Identity System

#### Username Format
- Format: `any_XXXX`
- XXXX = last 4 characters of 8-character alphanumeric user ID
- Example: User ID `xyza1b2c3` → Username `any_1b2c`
- All anonymous users use this format

#### Display Name Customization
- Users can change last 4 characters to anything they want
- Example: `any_1b2c` → `any_nekw` (if available)
- Must be unique — check availability before saving
- Keep `any_` prefix always
- Example: Cannot change to `any_something` → must be `any_xxxx`

#### Device Fingerprinting
Track anonymous users using these signals:
| Signal | Description |
|--------|-------------|
| Canvas fingerprint | GPU rendering hash |
| WebGL fingerprint | Graphics capabilities hash |
| Audio context fingerprint | Audio hardware hash |
| Screen resolution | Width x Height + color depth |
| Timezone | UTC offset |
| Language | Browser language |
| Installed fonts | Font detection |

Combine all signals into unique device fingerprint hash.

### Features List

#### Profile Page (`/any_XXXX`)
- [ ] Username display: `any_XXXX`
- [ ] Custom display name (if set): shown as "also known as: any_nekw"
- [ ] Edit display name button (if viewing own profile)
- [ ] Display name editor:
  - Input for new last 4 characters
  - Availability check
  - Save/Cancel buttons
  - Must keep `any_` prefix
- [ ] Profile tabs:
  - **Posts**: All posts by user
    - Filter: All / Approved / Rejected / Pending
    - Each post shows status badge
- [ ] Stats section:
  - Total posts
  - Approved posts count
  - Rejected posts count
  - Pending posts count

#### Status Badges
- [ ] Approved: Green badge "Approved"
- [ ] Rejected: Red badge "Rejected" (only visible to author)
- [ ] Pending: Yellow badge "Pending" (only visible to author)

### Technical Notes
- Device fingerprint generated on first visit
- Fingerprint stored in localStorage
- Profile URL uses username (any_xxxx format)
- Check ownership via device fingerprint match
- Show edit option only if viewing own profile

---

## M3.6: Admin Dashboard

**Goal**: Complete admin dashboard for managing posts, comments, and categories

### Pages to Build
| Route | Description |
|-------|-------------|
| `/admin` | Admin login (if not authenticated) |
| `/admin/dashboard` | Main dashboard overview |
| `/admin/posts` | All posts management |
| `/admin/comments` | All comments management |
| `/admin/categories` | Category management |
| `/admin/hall-of-fame` | Manage Hall of Fame |

### Components to Create
| Component | Description | File |
|-----------|-------------|------|
| `AdminLayout` | Dashboard layout with sidebar | `components/admin/AdminLayout.tsx` |
| `AdminSidebar` | Navigation sidebar | `components/admin/AdminSidebar.tsx` |
| `StatsCard` | Metric display card | `components/admin/StatsCard.tsx` |
| `ReviewQueue` | Pending posts queue | `components/admin/ReviewQueue.tsx` |
| `PostApprovalCard` | Single post in review queue | `components/admin/PostApprovalCard.tsx` |
| `ApprovalModal` | Approve/reject modal | `components/admin/ApprovalModal.tsx` |
| `PostTable` | All posts data table | `components/admin/PostTable.tsx` |
| `CommentTable` | All comments data table | `components/admin/CommentTable.tsx` |
| `CategoryManager` | Category CRUD interface | `components/admin/CategoryManager.tsx` |
| `HallOfFameManager` | Manage featured lists | `components/admin/HallOfFameManager.tsx` |
| `SearchReindex` | Elasticsearch reindex controls | `components/admin/SearchReindex.tsx` |

### API Integration
```typescript
// Frontend API calls needed (all require admin JWT)
POST /api/admin/login                       // Admin login
GET  /api/admin/stats                       // Dashboard stats
GET  /api/admin/posts/pending               // Pending posts
PATCH /api/admin/posts/{id}/approve         // Approve post
PATCH /api/admin/posts/{id}/reject          // Reject post
GET  /api/admin/posts                        // All posts
PATCH /api/admin/posts/{id}                  // Edit post
DELETE /api/admin/posts/{id}                // Delete post
GET  /api/admin/comments                     // All comments
DELETE /api/admin/comments/{id}             // Delete comment
GET  /api/admin/categories                   // All categories
POST /api/admin/categories                   // Create category
PATCH /api/admin/categories/{id}            // Update category
DELETE /api/admin/categories/{id}           // Archive category
GET  /api/admin/hall-of-fame                // Featured posts
POST /api/admin/hall-of-fame                // Add to Hall of Fame
DELETE /api/admin/hall-of-fame/{id}         // Remove from Hall of Fame
POST /api/admin/search/reindex               // Reindex Elasticsearch
```

### Features List

#### Admin Login (`/admin`)
- [ ] Simple username + password form
- [ ] JWT token stored (httpOnly cookie preferred)
- [ ] Redirect to dashboard on success
- [ ] Show login errors

#### Dashboard Overview (`/admin/dashboard`)
- [ ] Stats cards:
  - Total posts
  - Pending review
  - Approved today/week/month
  - Rejected today/week/month
  - Total comments
  - Total users (anonymous)
  - Total categories
- [ ] Recent activity feed
- [ ] Quick actions:
  - Go to review queue
  - Manage categories

#### Review Queue
- [ ] List all pending posts
- [ ] Each post shows:
  - Title
  - Author
  - Category
  - Submitted date
  - Preview button
- [ ] Actions:
  - **Approve**: One-click approve
  - **Reject**: Opens modal with reason input
  - **Preview**: Shows full post in modal
- [ ] Filters:
  - By category
  - By post type
  - By date range
- [ ] Sorting: Newest first
- [ ] Pagination

#### All Posts Management (`/admin/posts`)
- [ ] Data table with columns:
  - ID
  - Title
  - Author
  - Category
  - Status
  - Fire count
  - Comment count
  - Created date
  - Actions
- [ ] Filters:
  - Status (All/Pending/Approved/Rejected)
  - Category
  - Post type
  - Date range
  - Author
- [ ] Search by title
- [ ] Sorting by any column
- [ ] Bulk actions:
  - Select multiple
  - Approve selected
  - Reject selected
  - Delete selected
- [ ] Actions per row:
  - View
  - Edit
  - Delete

#### Comments Management (`/admin/comments`)
- [ ] Data table with columns:
  - ID
  - Content (truncated)
  - Author
  - Post (link)
  - Type (post/item-anchored)
  - Created date
  - Actions
- [ ] Filters:
  - By post
  - By author
  - By type
  - Date range
- [ ] Search by content
- [ ] Delete comment action

#### Category Management (`/admin/categories`)
- [ ] Tree view of categories (parent/child)
- [ ] Create category:
  - Name (required)
  - Slug (auto-generated from name)
  - Description
  - Icon (emoji)
  - Parent category (optional)
  - Featured toggle
- [ ] Edit category
- [ ] Archive category (soft delete)
- [ ] Reorder categories
- [ ] When archiving:
  - Select replacement category
  - All posts retagged to replacement

#### Hall of Fame Management (`/admin/hall-of-fame`)
- [ ] List all featured posts
- [ ] Add post to Hall of Fame:
  - Search for post
  - Add editorial note (optional)
- [ ] Remove from Hall of Fame
- [ ] Reorder featured posts
- [ ] Set as "Featured" (prominent display)

#### Search Management
- [ ] Elasticsearch connection status
- [ ] Index stats (document counts)
- [ ] Reindex all posts button
- [ ] Reindex all comments button
- [ ] Test search functionality

### Technical Notes
- Admin routes protected by JWT middleware
- Single admin user (you)
- JWT stored in httpOnly cookie
- Rate limiting on admin endpoints
- Audit logging of admin actions

---

## API Endpoints Summary

### Public Endpoints (No Auth Required)
```
GET    /api/posts                                    # Approved posts (paginated)
GET    /api/posts/:id                                # Single post with items
GET    /api/posts/:id/comments                      # Post comments
GET    /api/posts/:id/history                       # Post version history
GET    /api/posts/:id/counter-lists                 # Counter lists
POST   /api/posts                                    # Submit new post
POST   /api/comments                                # Add comment
PATCH  /api/comments/:id                            # Edit comment (2hr window)
DELETE /api/comments/:id                            # Delete comment
POST   /api/reactions                               # Toggle fire reaction
GET    /api/reactions/state                         # Get reaction states
GET    /api/categories                              # All categories
GET    /api/categories/:slug                        # Single category
GET    /api/search                                  # Full search
GET    /api/search/autocomplete                     # Autocomplete
GET    /api/search/posts                             # Posts search
GET    /api/search/comments                         # Comments search
GET    /api/arguments                               # Hot debates
GET    /api/hall-of-fame                            # Featured lists
GET    /api/users/:username                         # User profile
GET    /api/users/:username/posts                   # User posts
```

### Admin Endpoints (Auth Required)
```
POST   /api/admin/login                             # Admin login
GET    /api/admin/stats                            # Dashboard stats
GET    /api/admin/posts/pending                     # Pending posts
PATCH  /api/admin/posts/:id/approve                 # Approve post
PATCH  /api/admin/posts/:id/reject                  # Reject post
GET    /api/admin/posts                             # All posts
PATCH  /api/admin/posts/:id                         # Edit post
DELETE /api/admin/posts/:id                         # Delete post
GET    /api/admin/comments                          # All comments
DELETE /api/admin/comments/:id                      # Delete comment
GET    /api/admin/categories                        # All categories
POST   /api/admin/categories                        # Create category
PATCH  /api/admin/categories/:id                   # Update category
DELETE /api/admin/categories/:id                    # Archive category
GET    /api/admin/hall-of-fame                      # Featured posts
POST   /api/admin/hall-of-fame                      # Add to Hall of Fame
DELETE /api/admin/hall-of-fame/:id                 # Remove from Hall of Fame
POST   /api/admin/search/reindex                    # Reindex Elasticsearch
```

---

## Components Summary

### New Components to Create
| Component | Milestone | File |
|-----------|-----------|------|
| PostCard | M3.1 | `components/PostCard.tsx` |
| PostFeed | M3.1 | `components/PostFeed.tsx` |
| CategoryFilter | M3.1 | `components/CategoryFilter.tsx` |
| SortControl | M3.1 | `components/SortControl.tsx` |
| SearchBar | M3.1, M3.4 | `components/SearchBar.tsx` |
| PostTypeSelector | M3.2 | `components/PostTypeSelector.tsx` |
| CategorySelector | M3.2 | `components/CategorySelector.tsx` |
| ListItemEditor | M3.2 | `components/ListItemEditor.tsx` |
| ListItemRow | M3.2 | `components/ListItemRow.tsx` |
| PostForm | M3.2 | `components/PostForm.tsx` |
| PostHeader | M3.3 | `components/PostHeader.tsx` |
| ListItemCard | M3.3 | `components/ListItemCard.tsx` |
| FireReaction | M3.3 | `components/FireReaction.tsx` |
| CommentTree | M3.3 | `components/CommentTree.tsx` |
| CommentItem | M3.3 | `components/CommentItem.tsx` |
| CommentForm | M3.3 | `components/CommentForm.tsx` |
| ReplyForm | M3.3 | `components/ReplyForm.tsx` |
| CounterListButton | M3.3 | `components/CounterListButton.tsx` |
| PostHistory | M3.3 | `components/PostHistory.tsx` |
| AutocompleteDropdown | M3.4 | `components/AutocompleteDropdown.tsx` |
| SearchResults | M3.4 | `components/SearchResults.tsx` |
| SearchFilters | M3.4 | `components/SearchFilters.tsx` |
| CategoryGrid | M3.4 | `components/CategoryGrid.tsx` |
| CategoryCard | M3.4 | `components/CategoryCard.tsx` |
| ArgumentsList | M3.4 | `components/ArgumentsList.tsx` |
| HallOfFameList | M3.4 | `components/HallOfFameList.tsx` |
| UserProfile | M3.5 | `components/UserProfile.tsx` |
| ProfileNameEditor | M3.5 | `components/ProfileNameEditor.tsx` |
| PostStatusBadge | M3.5 | `components/PostStatusBadge.tsx` |
| AdminLayout | M3.6 | `components/admin/AdminLayout.tsx` |
| ReviewQueue | M3.6 | `components/admin/ReviewQueue.tsx` |
| PostTable | M3.6 | `components/admin/PostTable.tsx` |
| CommentTable | M3.6 | `components/admin/CommentTable.tsx` |
| CategoryManager | M3.6 | `components/admin/CategoryManager.tsx` |
| HallOfFameManager | M3.6 | `components/admin/HallOfFameManager.tsx` |

---

## Implementation Order

| Week | Milestones | Focus |
|------|------------|-------|
| Week 1 | M3.1 | Homepage, PostCard, Feed, Basic navigation |
| Week 2 | M3.2 | Submit Post page, Dynamic form, Validation |
| Week 3 | M3.3 | Post Detail, Comments, Fire reactions |
| Week 4 | M3.4 | Search, Elasticsearch, Categories, Arguments, Hall of Fame |
| Week 5 | M3.5 | User Profiles, Display name editing |
| Week 6 | M3.6 | Admin Dashboard, Testing, Bug fixes |

---

## Dependencies Needed

### Frontend Packages
```json
{
  "dependencies": {
    "@elastic/elasticsearch": "^8.x",
    "react-beautiful-dnd": "^13.x",
    "date-fns": "^3.x",
    "react-hot-toast": "^2.x",
    "zod": "^3.x",
    "@hookform/resolvers": "^3.x",
    "react-hook-form": "^7.x",
    "react-infinite-scroll-component": "^6.x",
    "react-markdown": "^9.x"
  }
}
```

### Backend Services
- Elasticsearch (existing or new install)
- MongoDB (existing)
- Redis (for rate limiting and caching)

---

## Testing Requirements

### Unit Tests
- Component rendering
- Form validation
- API client functions

### Integration Tests
- Post submission flow
- Comment posting flow
- Search functionality
- Admin approval flow

### E2E Tests
- Full user journey: Browse → Submit → Comment → Search
- Admin journey: Login → Review → Approve → View on homepage

---

## Next Steps After Phase 3

After completing Phase 3, the platform will have:

✅ Complete public browsing
✅ Anonymous post submission
✅ Nested comment system (3 levels)
✅ Fire reactions
✅ Advanced Elasticsearch search
✅ Category browsing
✅ Arguments/Hot Debates page
✅ Hall of Fame
✅ User profiles with customization
✅ Full admin dashboard
✅ Search reindexing tools

Future phases can add:
- Counter-List creation flow (already in backend)
- Post revisions comparison UI
- Email notifications
- Social sharing (OG images)
- Design system/theming
- PWA support
