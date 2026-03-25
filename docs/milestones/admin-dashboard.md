# Admin Dashboard Documentation

## Overview

The Admin Dashboard is a comprehensive management system for YoTop10. It provides granular control over all platform aspects with role-based permissions.

---

## Admin Roles

### Super Admin (Owner)
- Full access to everything
- Can create/edit/remove other admins
- Can manage permissions
- Can view all analytics
- Cannot be removed (sole owner)

### Admin
- Assigned specific permissions via checkboxes
- Can be created/edited by Super Admin
- Cannot add or remove other admins
- Can have limited or full permissions

---

## Permission Categories

### Content Moderation
- [ ] Approve/Reject posts
- [ ] Feature posts (pin to top)
- [ ] Delete posts
- [ ] Moderate comments
- [ ] Manage reported content

### User Management
- [ ] View users (limited data)
- [ ] Edit user roles
- [ ] Ban users
- [ ] View trust scores

### Community Management
- [ ] Create communities
- [ ] Edit communities
- [ ] Delete communities
- [ ] Manage community moderators

### Analytics
- [ ] View basic analytics
- [ ] View full analytics
- [ ] Export reports

### System Management
- [ ] Manage categories
- [ ] Manage auto-hide rules
- [ ] Manage strike thresholds
- [ ] Manage other admins (Super Admin only)

---

## Dashboard Pages

### 1. Overview (Home)
Metrics cards with toggles on/off:
- Daily Active Users
- Weekly Active Users
- Monthly Active Users
- New registrations today
- Posts pending review
- Reports pending
- Recent activity feed

### 2. User Management
**Columns:**
- User ID
- Username
- Trust Score
- Joined Date
- Account Status

**Actions:**
- View profile
- Edit roles (username, role)
- Ban/Unban user
- View posts
- View strike history
- View connections

**Privacy:**
- Normal admins: See only ID + username
- Super admin: See email (masked: j***@gmail.com)
- Password reset: Via token email (no admin access)

### 3. Post Management
**Filters:**
- Status (pending, approved, rejected)
- Author
- Category
- Date range

**Actions:**
- Quick approve
- Quick reject
- Feature post
- Hide post
- Change category
- View reports

### 4. Report Queue
**Unified queue** for all reports:
- Post reports
- Comment reports

**Filters:**
- Status (pending, resolved)
- Type (post, comment)
- Community

**Actions:**
- Dismiss report
- Warn author
- Remove content
- Issue strike

### 5. Category Management
- Create new category
- Edit category
- Delete category (with replacement)
- Set parent/child relationships
- Add icons
- Feature on homepage

### 6. Community Management
**Actions:**
- Create community
- Edit community details
- Delete community
- Add/remove moderators
- View community stats

**Delete behavior:**
- Posts deleted with community
- Members notified with reason

### 7. Analytics Dashboard

**User Analytics:**
- DAU/WAU/MAU
- New registrations
- Growth rate
- Anonymous vs registered ratio
- Session duration
- Bounce rate

**Content Analytics:**
- Total posts
- Pending review
- Approved today/week/month
- Rejected today/week/month
- Popular categories
- Active authors

**Engagement Analytics:**
- Total reactions
- Total comments
- Total challenges
- Avg reactions per post
- Most reacted posts

**Community Analytics:**
- Total communities
- Popular communities
- Community growth

**Moderation Analytics:**
- Total reports
- Reports resolved vs pending
- Avg resolution time
- Most reported users
- Strike statistics

### 8. Strike Management
- Issue strike
- View all strikes
- Edit strike thresholds
- Auto-strike rules

### 9. Auto-Hide Rules
- Keyword filter management
- Anonymous spam limits
- Rate limit settings

### 10. Platform Settings
- Feature flags (Super Admin only)
- Content policy
- Email templates

---

## Email Privacy

### Admin View
- Normal admin: No email access
- Super admin: See masked email (j***@gmail.com)

### Password Reset
- Admin clicks "send reset email"
- System sends token-based reset
- Admin never sees or handles password

---

## Audit Logging

All admin actions logged:
- Who did what
- When
- Previous value
- New value

Accessible in database, visible to Super Admin.

---

## Timeline Settings (Reference)

Not admin-specific, but related:
- Users can filter timeline by category
- Settings icon (bottom-right) opens modal
- Full settings page: /settings/timeline
