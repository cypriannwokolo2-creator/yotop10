# YoTop10 Frontend Implementation Plan

## Current State
- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- FingerprintJS for anonymous identity
- API client (`src/lib/api.ts`) with typed endpoints
- All pages exist but are **unstyled** (raw inline styles, no components, no design system)
- No post submission form, no search, admin dashboard is a shell

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Utilities:** clsx, tailwind-merge, date-fns
- **Auth:** FingerprintJS (anonymous), Admin JWT cookie

---

## Phase 1: Foundation & Design System
> Build reusable layout and components before touching pages.

### 1.1 — Global Layout & Theme
- [ ] Set up color palette, typography, spacing tokens in `globals.css`
- [ ] Create a shared `<Header />` component (logo, nav links, user avatar/link)
- [ ] Create a shared `<Footer />` component
- [ ] Create a `<PageContainer />` wrapper (max-width, padding, responsive)
- [ ] Update `layout.tsx` to use Header + Footer globally
- [ ] Dark mode support (CSS variables already started)

### 1.2 — Core UI Components (`src/components/ui/`)
- [ ] `Button` — primary, secondary, ghost, destructive variants + sizes
- [ ] `Card` — container with border, shadow, padding
- [ ] `Badge` — for post types, trust levels, status labels
- [ ] `Input` / `Textarea` — styled form controls
- [ ] `Select` — styled dropdown
- [ ] `Avatar` — user initials/icon circle
- [ ] `Tabs` — for profile posts/comments toggle
- [ ] `Skeleton` — loading placeholders
- [ ] `EmptyState` — icon + message for empty lists
- [ ] `Tooltip` — for spark scores, trust info
- [ ] `cn()` utility (clsx + tailwind-merge) in `src/lib/utils.ts`

---

## Phase 2: Public Pages Redesign
> Restyle every existing page using the new components.

### 2.1 — Home Page (`/`)
- [ ] Hero section with tagline + CTA (browse / submit)
- [ ] Featured/trending posts grid
- [ ] Featured categories row
- [ ] Recent posts feed

### 2.2 — Categories Page (`/categories`)
- [ ] Grid layout of category cards with icons
- [ ] Subcategory chips/links under each parent
- [ ] Post count badges
- [ ] Search/filter categories

### 2.3 — Category Feed (`/c/:slug`)
- [ ] Category header with icon, description, post count
- [ ] Subcategory navigation pills
- [ ] Post list cards (title, author, type badge, comment count, date)
- [ ] Sort dropdown (newest, oldest, most commented)
- [ ] Infinite scroll or "Load More" button
- [ ] Empty state for categories with no posts

### 2.4 — Post Detail (`/:slug`)
- [ ] Post header: title, author link, category link, date, views, post type badge
- [ ] Intro section
- [ ] Ranked list items as numbered cards with:
  - Rank number accent
  - Title, justification
  - Image (if present)
  - Source link
  - "Comment on this item" button
- [ ] Comments section:
  - Comment count header
  - Filter dropdown (all / by list item)
  - New comment form (textarea + submit)
  - Threaded comment tree with:
    - Author name (linked to profile)
    - Spark score indicator
    - Fire reaction button (animated toggle)
    - Reply button + inline reply form
    - Depth indentation (capped + thread indicator)
    - Relative timestamps (date-fns)
  - Comment refresh indicator
- [ ] "View History" link

### 2.5 — Post History (`/:slug/history`)
- [ ] Version list sidebar
- [ ] Version detail panel with diff-style display
- [ ] Clean layout

### 2.6 — User Profile (`/a/:username`)
- [ ] Profile header: username, trust level badge, member since
- [ ] Stats row: posts, comments, approval rate
- [ ] Edit display name (own profile only) — inline form
- [ ] Username history link (own profile only)
- [ ] Tabs: Posts | Comments
- [ ] Post cards in posts tab
- [ ] Comment cards in comments tab

### 2.7 — Username History (`/username-history`)
- [ ] Clean table with styled rows
- [ ] Status badges (Current / Released)

### 2.8 — 404 Page
- [ ] Illustrated/styled 404 with back-home link

---

## Phase 3: New Features

### 3.1 — Post Submission Form (NEW PAGE: `/submit`)
- [ ] Multi-step form or single-page form:
  - Title input
  - Post type selector (visual cards for each type)
  - Category selector (searchable dropdown)
  - Intro textarea
  - List items builder:
    - Add/remove items
    - Drag to reorder (or manual rank)
    - Title + justification per item
    - Optional image URL + source URL
  - Display name field (optional)
- [ ] Client-side validation matching backend rules
- [ ] Rate limit feedback (remaining posts, cooldown timer)
- [ ] Success state with link to pending post
- [ ] Fingerprint auto-attached

### 3.2 — Search (NEW PAGE: `/search`)
- [ ] Search bar with suggestions (when backend is ready)
- [ ] Results page with post cards
- [ ] Filter by category, post type
- [ ] *Note: Backend `/api/search` is a stub — build UI ready for when it's implemented*

---

## Phase 4: Admin Panel Redesign

### 4.1 — Admin Layout
- [ ] Sidebar navigation (Dashboard, Posts, Comments, Categories, Users, Settings)
- [ ] Top bar with admin profile + logout

### 4.2 — Admin Dashboard (`/admin`)
- [ ] Stats cards: total posts, pending posts, total comments, total users
- [ ] Recent pending posts list
- [ ] Quick action buttons

### 4.3 — Admin Post Moderation (NEW: `/admin/posts`)
- [ ] Table of posts with status filter (pending, approved, rejected)
- [ ] Approve / Reject actions
- [ ] View post detail inline

### 4.4 — Admin Categories (NEW: `/admin/categories`)
- [ ] Category list with edit/archive actions
- [ ] Create new category form
- [ ] Recalculate post counts button

### 4.5 — Admin Login & Setup
- [ ] Restyle login form
- [ ] Restyle setup form

---

## Phase 5: Polish & UX

### 5.1 — Responsive Design
- [ ] Mobile-first layouts for all pages
- [ ] Hamburger nav on mobile
- [ ] Touch-friendly comment interactions

### 5.2 — Loading & Error States
- [ ] Skeleton loaders on all data-fetching pages
- [ ] Toast notifications for actions (comment posted, name updated, etc.)
- [ ] Error boundaries with friendly messages

### 5.3 — Animations
- [ ] Page transitions
- [ ] Fire reaction animation
- [ ] Comment appear animation
- [ ] Smooth scroll behaviors

### 5.4 — SEO & Meta
- [ ] Dynamic OG images / meta for posts
- [ ] Sitemap generation
- [ ] Proper canonical URLs on all pages

---

## Execution Order (Priority)
1. **Phase 1** — Foundation (must do first)
2. **Phase 2.4** — Post Detail (most complex, core experience)
3. **Phase 2.1** — Home Page (first impression)
4. **Phase 3.1** — Post Submission (key missing feature)
5. **Phase 2.2 + 2.3** — Categories
6. **Phase 2.6** — User Profile
7. **Phase 4** — Admin Panel
8. **Phase 5** — Polish
9. **Phase 3.2** — Search (blocked on backend)
