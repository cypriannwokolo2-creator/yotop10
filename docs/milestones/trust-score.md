# Trust Score System

## Overview

Trust Score is a gamification system that determines user privileges on YoTop10. It rewards quality engagement and penalizes negative behavior. The system is designed to be hard to reach 100.

**Starting Score:** 0  
**Maximum Score:** 100  
**Score is dynamic** - increases and decreases based on user activity.

---

## Scoring Formula

### Points GAINED

| Action | Points | Description |
|--------|--------|-------------|
| Email verified | +5 | User verifies their email |
| LinkedIn verified | +10 | User connects LinkedIn account |
| Post approved (public) | +5 | User's post passes review |
| Comment on your post | +2 | Someone comments on your post |
| Argument in your post | +10 | Highest - debate/challenge in your post |
| Reaction given | +0.5 | User gives a fire reaction |
| Valid report submitted | +5 | User's report is validated as correct |
| Per month active | +3 | User is active for 4+ weeks |

### Points LOST

| Action | Points | Description |
|--------|--------|-------------|
| Post rejected | -10 | User's post fails review |
| Strike received | -30 | Highest penalty - user receives strike |
| Per week inactive | -5 | No activity for 7 days |

---

## Trust Thresholds

| Score | Privilege |
|-------|------------|
| 0+ | Basic access |
| 15+ | Post to connections-only feed |
| 30+ | Post to public feed (goes to review) |
| 50+ | Challenge items on lists |
| 65+ | Create counter-lists (rivals) |
| 80+ | Create community |
| 90+ | Auto-unlock verified author status |
| 95+ | Rate limits reduced by 50% |

---

## Special Rules

### New Account Rate Limiting
- Accounts less than 3 months old have slightly higher rate limits
- Rate limiting removed after 3 months of consistent activity
- Active = at least 1 action per week

### Verified Author Auto-Unlock
- Users with 90+ trust score automatically unlock verified author status
- No need to meet manual requirements (500 posts, 1000 quality reviews)

### Verified Author Decay
- Once verified, if user is inactive for 1 month OR doesn't post for 7 days:
  - Loses verified status
  - Posts now go to review queue
  - Trust score decay rate reduced by 10%

### Re-Earning Verified Status
- If user loses verified status, they can re-earn it
- Same process: reach 90+ trust score

---

## Visibility

### User View
- Users can see their own trust score in profile/settings
- Users can toggle "show trust score publicly" on their profile
- If public: score visible to others on profile

### Admin View
- Full trust score history in user details
- All trust score changes logged

---

## Trust Score Display

- Shown as percentage (e.g., "Trust: 75%")
- Color coded:
  - 0-30: Red (Building Trust)
  - 31-60: Yellow (Trusted)
  - 61-90: Green (Highly Trusted)
  - 91-100: Gold (Top Contributor)

---

## Admin Controls

- Admins can manually adjust trust scores
- Admins can view trust score audit trail per user
- Trust score changes are logged in database
