# Categories System Documentation

## Overview

Categories help organize content on YoTop10. Every post must be tagged with at least one category. Users can filter their feed by categories to see content they're interested in.

---

## Category Structure

### Hierarchy
- **10 Major Parent Categories**
- **300 Default Child Categories** distributed across parents
- Each child category has one parent
- Example: `Technology → Artificial Intelligence (AI)`

### Default Categories (10 Parents)

1. **Technology & Digital**
2. **Health & Wellness**
3. **Business & Finance**
4. **Lifestyle & Leisure**
5. **Creative Arts & Entertainment**
6. **Education & Self-Development**
7. **Home & Family**
8. **Professional & Industrial**
9. **Social & Global Issues**
10. **Niche Hobbies & Collections**

---

## Category Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Unique identifier |
| name | String | Yes | Display name |
| slug | String | Yes | URL-friendly (unique) |
| icon | String | No | Emoji or icon identifier |
| description | String | No | Short description |
| parent_id | UUID | No | Parent category ID |
| post_count | Integer | Auto | Number of posts |
| is_featured | Boolean | No | Show on homepage |
| is_archived | Boolean | No | Soft delete |

---

## User-Facing Features

### Category Selection (Post Creation)
- Required: Every post must select 1+ categories
- Maximum: 3 categories per post
- Private posts: Automatically tagged as "Personal"

### Category Filtering
- URL: `/c/[slug]` or `/category/[slug]`
- Multiple filter: OR logic (posts with ANY selected category)
- Timeline filter: In timeline settings modal

### Category Display
- Search: Advanced search modal shows category filter
- Timeline: Floating icon (bottom-right) shows when not scrolling
- Browse: `/categories` page lists all

---

## Admin Features

### Category Management
- Create/Edit/Delete categories
- Set parent-child relationships
- Add/edit icons
- Feature categories on homepage
- Archive (soft delete) categories

### Auto-Creation Rule
- When 1000+ users suggest same category name
- System auto-creates with suggested name
- Admin notified for review
- Admin can: delete, replace, edit, assign parent

### Replacement on Delete
When admin deletes/archives a category:
1. Admin selects replacement category
2. All posts retagged to replacement
3. Old category archived

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /categories | List all categories |
| GET | /categories/{slug} | Get category by slug |
| POST | /categories | Create category (admin) |
| PATCH | /categories/{id} | Update category (admin) |
| DELETE | /categories/{id} | Archive category (admin) |
| POST | /categories/suggest | User suggests category |

---

## Seed Data

300 categories distributed across 10 parents:
- Technology & Digital: ~30 categories
- Health & Wellness: ~30 categories
- Business & Finance: ~30 categories
- Lifestyle & Leisure: ~30 categories
- Creative Arts & Entertainment: ~30 categories
- Education & Self-Development: ~30 categories
- Home & Family: ~30 categories
- Professional & Industrial: ~30 categories
- Social & Global Issues: ~30 categories
- Niche Hobbies & Collections: ~30 categories
