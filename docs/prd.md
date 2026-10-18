# PRD: Client Import (ADX only)

Summary of the original PRD with the update that one flow and one CSV template cover Clients and Companions. Where the original text assumed separate Client and Companion flows, the update wins.

The build in `.scratch/client-import-csv-checks/spec.md` narrows this PRD: three columns, no Companions, Email as the duplicate key, a 50-character name limit. See that spec for what is built; this file is the source for what was asked.

## Problem

TRAMS is being decommissioned, and its bulk profile import utility (Clientbase) goes with it. Advisors would have no bulk way to create clients; the existing "Create Client" button only does one record at a time. Onboarding large groups (corporate accounts, group tours, agency migrations) one by one is slow and error-prone. Building this unblocks the TRAMS decommission and the ACAVE migration, cuts hours of entry to minutes, improves data quality via a validated template, and makes ACAVE the source of truth.

## What we are building

A native bulk client upload flow in ADX. A button next to "Create Client" opens a drag-and-drop (or browse) modal for a CSV. A downloadable template marks required fields. Advisors can upload on behalf of an agent and choose which agent.

- One upload flow and one CSV template cover both clients and companions. Companions are linked to a client at upload time.
- Out of scope: editing existing profiles, .xlsx upload (CSV only), export clients, deactivating clients (done internally, no UI).

## Requirements

| Requirement | Priority | MVP |
| --- | --- | --- |
| Bulk Upload button | Must | Yes |
| Upload on behalf of an agent, pick the agent | Must | Yes |
| Drag-and-drop/browse CSV modal | Must | Yes |
| Downloadable CSV template with required columns marked (one template for clients and companions) | Must | Yes |
| Validation + row-level and file-level error report before committing | Must | Yes |
| Client creation via Clients microservice (POST Clients/Post); not confirmed, needs an endpoint that accepts few fields | Must | Yes |
| Companion creation and linking in the same upload; timing now unclear (the PRD delivered companions as technical Phase 3) | Must | Yes |
| Partial success (process valid rows, report failures) | Must | Yes |
| Duplicates (same phone in file or on ADX) surfaced as an error | Must | Yes |
| Internal log for ADX support (admin/manager/IC uploads) | Must | Yes |
| Upload progress indicator (user can leave and keep using ADX, no timeout) | Should | No |
| Upload history/audit log for advisors or admins | Should | No |
| Multiple client imports at once | Could | No |

## Architecture decisions already made

- Async: chunked Hangfire background jobs, 100 rows per batch, scales to 10,000+ rows.
- Two-layer validation. Layer 1 (format, regex, enum, duplicate-in-file) runs synchronously on upload and returns a 422 before any job is created. Layer 2 (system checks like existing-client duplicates) runs per batch in the async job.
- All writes go through the new Clients microservice (Clients/Post, ClientsCompanion/Post), which owns TRAMS-vs-ACAVE routing. Never calls TRAMS, Interbase or ACAVE directly; routes through the DBO API gateway.
- Priority queues in ProviderSync: client-import-high and client-import-default, both below "critical". Uploads of 200 rows or fewer use high priority.
- A new minimal-field DBO endpoint is needed (First + Last Name only) because agents migrating via TravelEdge lack ADX's mandatory fields and re-collecting them would increase churn. Judged low downstream risk: Clientbase already imports minimal fields, and ADX enforces required fields at booking time.
- These were designed around separate client and companion jobs. With one flow, the job design may need to change.

## CSV fields

- Current state, Client: AgentId, FirstName, LastName, Gender, Phone Number.
- Current state, Companion: ClientId, FirstName, LastName, Phone Number, Relationship, Gender (not null).
- Future state, Client: Interface ID, FirstName, LastName.
- Future state, Companion: Interface ID, Agent Interface ID, FirstName, LastName.
- All else optional (phone, email, address encouraged). Others in the catalog: Middle Name, Gender, Title, Primary Phone/Email, Date of Birth, Passport Expiry, Loyalty Type, Seating Preference, Address, Country, State/Province.
- The single template's column layout was not defined in the PRD.

## Error handling

Three categories, from the original PRD.

- **File-level, blocks upload:** not .csv; over 5MB; too many rows (10,000 proposed, final open); empty file; missing required headers; malformed CSV.
- **Row-level blocking, row skipped:** missing mandatory field; bad date (MM/DD/YYYY); bad email; bad phone (digits, spaces, hyphens, parentheses, max 15 chars); name over 50 chars; invalid enum; duplicate phone within file (all flagged, advisor fixes before re-upload); client already exists (409, no update); companion's client not found; API failure for the row; bad country code; state/province invalid for country.
- **Row-level warnings, row created and flagged:** passport expiry in the past; missing optional email/address; companion linked to a client under a different agent (advisor confirms).
- The companion-related errors above assumed a separate companion file and need rework for a single flow.

## Success metrics

99%+ creation rate for valid rows (north star); under 1 minute for a 100-row file; adoption vs single create (baseline at launch); 0 duplicate records created (guardrail); validation error rate under 5% of rows (guardrail).

## Dependencies

Clients/Post must be stable and handle ~10k POSTs per large upload; ClientsCompanion/Post must support linking at creation; service-to-service auth for background jobs (blocks Phase 1 sign-off); TRAMS decommission timeline; Hangfire worker capacity in ProviderSync; UX design for the modal and error states (needed before dev).
