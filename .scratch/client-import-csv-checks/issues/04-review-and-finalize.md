# 04: Review screen and Finalize and Upload

**What to build:** When both checks pass, the admin sees a Review of every Client and the chosen Advisor, and commits with "Finalize and Upload". This replaces the old confirm step. Creation, Success and Partial Success then work as before.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] The Review screen, titled "Review the client profiles", shows "Total records: N" and the chosen Advisor's name
- [ ] A scrollable, readable table lists number, First Name, Last Name and Email Address for every Client, built from the parsed rows
- [ ] Cancel leaves without creating anything; "Finalize and Upload" starts creation
- [ ] Step 4 is labelled "Review"; the "Create N clients" confirm and the "Checking for conflicting data" wording are gone
- [ ] Success and Partial Success behave as before, including keeping created Clients and "Done" returning to the Clients page
- [ ] Tests cover each of the above, and the old confirm tests are rewritten
