# Multi-Account Device Management

> **Goal**: Allow users to add multiple accounts on a single device and switch between them without re-entering credentials. This feature enables users to manage personal, work, or other personas from one device.

---

## User Requirements

### Session Rules
| Rule | Value |
|------|-------|
| Session Duration | 90 days |
| Inactivity Timeout | 30 days (must use app within 30 days to stay logged in) |
| Device Binding | Strict - sessions tied to device fingerprint |
| Logout Behavior | Logging out one account does NOT affect other accounts on the device |
| Max Accounts per Device | 5 |
| Max Devices per Account | 3 |

### Security Rules
- **HttpOnly Cookies**: Tokens stored in HttpOnly, Secure, SameSite cookies (XSS protected)
- **Password Change**: Does NOT force logout from other devices
- **Session Tracking**: Each session tracked in database with device info

---

## UI/UX Specification

### Mobile (Hamburger Menu)
```
┌─────────────────────────────┐
│ ☰ Menu                 [⚙️] │
├─────────────────────────────┤
│ 👤 nekwasar               │ ← Current active account
│ 👤 johndoe                │ ← Other account
│ 👤 testuser               │ ← Other account
├─────────────────────────────┤
│ + Add Account             │ ← Opens login
└─────────────────────────────┘
```

### Desktop (Account Dropdown)
```
┌─────────────────────────────────────────┐
│ [Avatar] Display Name            [▼]  │
├─────────────────────────────────────────┤
│ ● nekwasar (Active)                   │
│ ○ johndoe                              │
│ ○ testuser                             │
├─────────────────────────────────────────┤
│ + Add Account                          │
│ ───────────────────────────────────────│
│ ⚙️ Manage Accounts                     │
└─────────────────────────────────────────┘
```

### Retro Mode
```
┌─────────────────────────────────────────┐
│ HOME | SEARCH | Switch to nekwasar ▼   │
├─────────────────────────────────────────┤
│ [Dropdown shows all accounts]            │
└─────────────────────────────────────────┘
```

### Settings/Account Page
```
┌─────────────────────────────────────────┐
│ Manage Accounts                         │
├─────────────────────────────────────────┤
│ 👤 nekwasar                             │
│    johndoe@example.com                 │
│    Last active: 2 hours ago            │
│    [Remove from Device]                 │
├─────────────────────────────────────────┤
│ 👤 johndoe                              │
│    testuser@example.com                │
│    Last active: 3 days ago             │
│    [Remove from Device]                 │
├─────────────────────────────────────────┤
│ + Add Account                           │
└─────────────────────────────────────────┘
```

---

## Technical Implementation

### Session Model Updates
```python
class Session(Base):
    id = Column(UUID, primary_key=True)
    user_id = Column(UUID, ForeignKey("users.id"))
    device_fingerprint = Column(String(64))  # Strict device binding
    
    # Token fingerprint (hash of token)
    token_fingerprint = Column(String(64))
    
    # Session metadata
    device_name = Column(String(255))
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    
    # Timing
    expires_at = Column(DateTime)
    last_used_at = Column(DateTime)
    is_revoked = Column(Boolean, default=False)
```

### Device Tracking
- Generate device fingerprint on first login
- Store in HttpOnly cookie (30 day expiry)
- Validate on each request
- Fingerprint algorithm: SHA256(user_agent + screen_resolution + timezone)

### Session Rules Implementation
```python
# 1. Session duration: 90 days
session_expires = datetime.utcnow() + timedelta(days=90)

# 2. Inactivity: 30 days - check last_used_at
if session.last_used_at < datetime.utcnow() - timedelta(days=30):
    # Force re-login
    
# 3. Max 5 accounts per device
# Count unique user_ids for this device_fingerprint
if account_count >= 5:
    raise error("Maximum 5 accounts per device")

# 4. Max 3 devices per account
# Count unique device_fingerprints for this user_id
if device_count >= 3:
    raise error("Maximum 3 devices per account")
```

### Account Switching Flow
```
1. User clicks "Add Account"
2. Show login form
3. On successful login:
   a. Check if device already has 5 accounts → error if full
   b. Check if account already on device → switch to existing
   c. Check if account on 3 devices → error if full
   d. Create new session with device fingerprint
   e. Store tokens in HttpOnly cookies
   f. Update active account in UI
```

### Removing Account from Device
```
1. User clicks "Remove from Device"
2. Confirm dialog: "Remove [username] from this device?"
3. On confirm:
   a. Revoke session in database
   b. If last account → redirect to login
   c. Switch to next available account
   d. Clear cookies for removed account
```

---

## API Endpoints

### New Endpoints Required

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/device-register | No | Register device, get fingerprint |
| POST | /auth/login-device | No | Login with device context |
| GET | /auth/accounts | Yes | List accounts on current device |
| DELETE | /auth/accounts/{user_id} | Yes | Remove account from device |
| POST | /auth/switch-account | Yes | Switch active account |

### Session Validation
All authenticated endpoints validate:
1. Token is valid and not expired
2. Session exists in database
3. Session is not revoked
4. Device fingerprint matches
5. Session not expired (90 days)
6. Not inactive > 30 days

---

## Database Schema

### Sessions Table (Already Implemented)
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    device_fingerprint VARCHAR(64),
    token_fingerprint VARCHAR(64),
    device_name VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX ix_sessions_user_id ON sessions(user_id);
CREATE INDEX ix_sessions_device ON sessions(device_fingerprint);
```

---

## Implementation Priority

1. **Phase 1**: Device fingerprint generation & storage
2. **Phase 2**: Session management with device limits
3. **Phase 3**: Account switching UI
4. **Phase 4**: Settings/Account management page
5. **Phase 5**: Retro mode integration

---

## Testing Checklist

- [ ] Can add up to 5 accounts on one device
- [ ] Cannot add 6th account (shows error)
- [ ] Can switch between accounts
- [ ] Logging out one account keeps others logged in
- [ ] Removing account works correctly
- [ ] Session expires after 90 days
- [ ] Inactive > 30 days forces re-login
- [ ] Same account on 3 devices works
- [ ] Cannot add 4th device for same account
- [ ] Private/connections_only profiles respect viewer relationship
