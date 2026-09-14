# DB Restore — plug a dump archive into a fresh server

Companion to a `mongodump --archive` file (e.g. `yotop10-db.archive`) taken from
the production `mongodb` container. The archive holds the whole `yotop10`
database: users, posts, articles, categories, comments, notifications, audit
trail, system config.

## Prerequisites (new server)

1. Repo cloned, `docker compose` available.
2. `.env` and `secrets/*.txt` copied verbatim from the old server.
   Passwords MUST match — the app authenticates to Mongo with them.
   Never commit these files.
3. The archive file copied over (transfer method is the operator's choice).

## Restore steps

1. Start only the database so the app cannot write mid-restore:
   `docker compose up -d mongodb` (wait ~30s for healthy).
2. Restore, replacing the fresh empty collections:
   `cat yotop10-db.archive | docker exec -i <mongo-container> mongorestore -u <MONGO_USERNAME> -p '<MONGO_PASSWORD>' --authenticationDatabase admin --nsInclude='yotop10.*' --drop --archive`
3. Start everything: `docker compose up -d --build`.

## Why this order is safe

- `seedPresets()` returns early when presets exist — no duplicate permissions.
- `initConfig()` creates the global config only when absent — restored
  settings (feature flags, rate limits) are preserved.
- `runAdminMigration()` only backfills missing `role` fields — it never
  touches password hashes. A rotated admin password survives the move.
- Redis and Elasticsearch are NOT part of the dump and must not be:
  Redis is throwaway cache, search re-indexes itself within minutes of boot.

## Uploads (separate from the DB)

`backend/uploads/` on the old host holds the newest files; older ones live in
the `uploads_data` volume. Merge both, newest wins, and load the merged set
into the new server's `uploads_data` volume before starting the backend.

## Verify after boot

- Collection counts match the source (at migration time: 5 users, 24 posts,
  5 articles, 341 categories — re-count the source if time has passed).
- Owner profile loads, admin login works with the current password.
- The pending-review queues show the same items as the old server.

## After a host change — visitors will strand

New origins mean new empty identities for everyone (cookies never cross
hosts). Do NOT treat the resulting stranger accounts as an attack. Reconnect
each reporter per [relink.md](./relink.md), owner first. Then delete the
transferred archive file — it contains password hashes and must not linger.
