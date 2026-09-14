# Re-link Runbook — reconnect a stranded visitor to their account

## Prerequisites — the database comes first

This runbook operates on the LIVE database. If you are standing up a new
server, restore it first per [db-restore.md](./db-restore.md): a
`mongodump --archive` file (conventionally named `yotop10-db.archive`) is
transferred to the new machine out-of-band and restored with `mongorestore
--drop` before the app boots. The archive is NEVER stored in the repo (it
contains password hashes) — expect it as a hand-delivered file, typically
outside the repo tree (e.g. `/root/` or `/tmp/`), and delete it after a
verified restore. Every query below assumes that restore is done and the
stack is up.

## Why this exists

Identity on this platform is a cookie (`device_fingerprint`). The cookie is
locked to the exact host that set it, and the browser's backup fingerprint
store is locked to the exact origin too. After a host change (new server,
apex → www cutover), every visitor arrives empty-handed: the server cannot
tell them apart from a first-timer, so the welcome flow silently mints a
brand-new empty account for them. Nothing is deleted — posts, names, and
standing stay attached to the OLD identity — but the visitor is stuck looking
at a stranger account (a random `a_xxxx_xxxx` name).

Re-linking points the visitor's CURRENT cookie at their REAL account. It takes
minutes and is fully verified at each step.

## Key facts (do not skip)

- Source of truth: MongoDB, database `yotop10`, collection `users`.
- Identity fields: `user_id` (never changes), `device_fingerprint` (current
  cookie), `device_fingerprint_aliases` (retired cookies that still resolve).
- Lookup order per request: direct cookie match → alias match → linked device
  → anonymous. An alias match re-binds the cookie automatically.
- Resolution code: `findUserByFingerprint()` in
  `backend/src/middleware/fingerprint.ts`.
- The owner's account: `user_id 54f39ac86e1f07ab`, custom name `a_cutiee`
  (verify with the query in step 1 — names can change, `user_id` cannot).

## Procedure (one stranded visitor at a time)

### 0. Get the stranger name from the human

Ask them to open the site and read you the random account name they see
(e.g. `a_7c7f_81a8`). Do nothing until you have it. If they see their real
name, they are NOT stranded — stop.

### 1. Inspect the stranger account (read-only)

Run against the live database (credentials from `.env`, never written down
anywhere else):

```
docker exec -i <mongo-container> mongosh --quiet \
  -u "$MONGO_USERNAME" -p "$MONGO_PASSWORD" --authenticationDatabase admin \
  --eval '
const db0 = db.getSiblingDB("yotop10");
const s = db0.users.findOne({username: "<STRANGER>"},
  {user_id: 1, device_fingerprint: 1, trust_score: 1, created_at: 1});
print(JSON.stringify(s));
print("posts: " + db0.posts.countDocuments({author_id: s.user_id}) +
      " comments: " + db0.comments.countDocuments({author_id: s.user_id}));
print("owner: " + JSON.stringify(db0.users.findOne(
  {user_id: "54f39ac86e1f07ab"},
  {username: 1, custom_display_name: 1, device_fingerprint_aliases: 1})));'
```

### 2. Safety checks — ALL must pass, no exceptions

1. The stranger has **zero posts and zero comments**. If it owns content, STOP
   and escalate to the human — it may be a real second account, not debris.
2. The stranger's fingerprint is a plausible issued cookie (32 hex chars from
   the grace generator). It MUST NOT be a known hand-set abuse value
   (denylist lives in `isDeniedFingerprint()`,
   `backend/src/middleware/fingerprint.ts`). A denied value means a script is
   holding that credential — merging it would hand the target account to the
   script. Delete such accounts; never alias them.
3. The target account exists and its `user_id` matches what the human expects
   (name + standing + post count cross-check).

### 3. Delete the stranger, alias the cookie

```
docker exec -i <mongo-container> mongosh --quiet \
  -u "$MONGO_USERNAME" -p "$MONGO_PASSWORD" --authenticationDatabase admin \
  --eval '
const db0 = db.getSiblingDB("yotop10");
print("deleted stranger: " +
  db0.users.deleteOne({username: "<STRANGER>"}).deletedCount);
print("aliased: " + db0.users.updateOne(
  {user_id: "<TARGET_USER_ID>"},
  {$addToSet: {device_fingerprint_aliases: "<STRANGER_FP_FROM_STEP_1>"}}
).modifiedCount);'
```

### 4. Prove it before telling the human

Simulate their next visit with their cookie. The response MUST show the
target's `user_id`:

```
curl -sk https://<canonical-host>/api/users/me \
  -b 'device_fingerprint=<STRANGER_FP_FROM_STEP_1>' | head -c 200
```

Only when the `user_id` matches, tell the human to reload — they will be home,
and the visit also heals their cookie to the canonical value permanently.

## After a host cutover (batch mode)

Expect EVERYONE to strand at once. Do not pre-alias anything (you cannot know
future cookie values). Instead: announce that visits will look new, collect
each report (`current stranger name` + `who they claim to be`), and run steps
1–4 per report. Owner first, then anyone else who asks. Unclaimed stranger
accounts with zero content can be swept after a week; anything with content is
kept until its human speaks up.

## Never rules

- NEVER alias a denied/hand-set fingerprint to any account.
- NEVER delete an account that owns posts or comments as "cleanup".
- NEVER "fix" stranding by renaming the stranger to the real name — that
  squats the handle on the wrong identity and orphans the real posts.
- NEVER write credentials, cookie values, or dumps into docs, chat logs, or
  git. Commands above use shell variables and placeholders only.
