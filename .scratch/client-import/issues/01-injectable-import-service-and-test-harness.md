# 01: Injectable import service and test harness

**What to build:** The Client Import modal can be driven end to end in tests. The mocked advisor search and import results sit behind one swappable import service, and the test tooling is in place. As a first slice, the Client Import button appears next to "Create New Client" only for admins on the Operations team, and the modal opens at its first step with nothing carried over from an earlier open, and closes with Cancel.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Advisor search and import validation/creation go through a single import service that tests can replace with a fake
- [ ] Vitest and React Testing Library run with fake timers
- [ ] Test: the Client Import button is visible for an admin on the Operations team and hidden for any other role
- [ ] Test: opening the modal shows the first step with no Advisor or file left over from a previous open
- [ ] Test: Cancel closes the modal
