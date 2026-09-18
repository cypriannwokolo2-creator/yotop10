# Running the Machine

*The operator's checklists — for the content manager and the buyer.*

You do not need to be an engineer to run YoTop10. You need this chapter and one afternoon.

## Daily: the queues

Open the admin dashboard. Work the pending lists, then the pending articles: approve, reject with a reason, or edit (edits require a stated reason, and the author is told what it was). Check the notifications and flagged comments. Done well, this is under an hour a day at current volume.

## Weekly: trust and hygiene

Glance at new identities for abuse patterns (bursts of empty accounts are the classic signal — the system flags and throttles them, you confirm). Adjust rate limits if legitimate contributors complain. Review the audit log sample. Check search Console and index status monthly, not weekly.

## Moving or recovering the server

1. Copy the environment secrets from the old machine (they must match exactly).
2. Copy the database archive file and restore it into the database container.
3. Merge the uploads folders, newest file wins.
4. Start the stack with one command; verify the owner profile loads and the review queues match.
5. Delete the transferred archive (it contains password hashes — it must never linger).

After a host change, every visitor will briefly appear as a stranger (browser cookies don't cross hosts). Reconnect them one by one: confirm their old identity, retire the empty stranger account, link their new visit to their real account. Owner first. The full procedure is documented step by step in the operations manual.

## Staying safe

TLS certificates renew automatically. Backups are the database archive plus the uploads folder — take both on whatever schedule lets you sleep. Admin sessions expire; passwords rotate through the setup flow. Never commit secrets to the code repository; never store the database archive inside it.
