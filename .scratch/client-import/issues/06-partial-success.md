# 06: Partial Success

**What to build:** When some Clients fail at creation after validation passed, the admin sees how many were created and how many failed, can read exactly which rows failed and why, and knows the created Clients were kept.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] The screen states the total, how many were created and how many failed
- [ ] Failed rows are listed readably with row number, name and reason; no raw record text
- [ ] The screen says the created Clients were kept and offers a way to contact support
- [ ] The progress bar is amber on this screen
- [ ] "Done" and "Back to file upload" behave as on the Success screen
- [ ] Tests cover each of the above through the modal, using a fake that returns a Partial Success
