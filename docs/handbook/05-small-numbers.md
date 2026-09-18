# Small Numbers, Honestly Told

*Where the platform stands — September 2026.*

Early-stage numbers, stated plainly. The platform relaunched on fresh infrastructure in September 2026; what follows is the honest starting line, not a growth story yet.

| Measure | Count |
|---|---|
| Registered identities (devices) | 42 |
| Published lists | 25 (all approved) |
| Published articles | 5 |
| Ranked items in the catalog | 160 |
| Categories | 341 |
| Comments | 1 |
| Page visits tracked | 258 |

Read these correctly: 25 approved lists with zero backlog means moderation is keeping pace with submissions. 341 categories against 25 lists means the taxonomy was built ahead of demand — the shelves are stocked before the goods arrive, which is exactly the right order for a catalog. The comment count of one is the clearest signal of what comes next: the audience debates by voting and counter-listing today; threaded argument is the frontier.

What would change the story: the first hundred lists (proof the funnel converts strangers at volume), the first thousand votes in a week (proof the game loop holds attention), the first list that arrives unprompted from someone the team has never met (proof of discovery working). Watch those three, in that order.

## How it was built

Two phases, March to September 2026. **Phase one (~3 months)** raised the working platform: publishing, feeds, debates, identity, search. **Phase two (~3–4 months)** hardened it into premium tier: the moderator system, trust and anti-abuse machinery, the SEO and social-card platform, admin tooling, and production operations — several hundred tracked improvements across 863 commits. The pattern matters more than the totals: ship the thing, then make it unbreakable before asking the world to care.

## What it runs on

Commodity, boring, proven: a Next.js web frontend, an Express API, MongoDB for data, Redis for speed limits and sessions, Elasticsearch for search — all orchestrated by Docker Compose on a single virtual server. One command starts the entire stack. The whole database exports as one portable archive file; uploads merge with a newest-wins rule. Moving hosts is an afternoon's work, documented checklist and all. There is no exotic infrastructure to inherit and no vendor you cannot leave.
