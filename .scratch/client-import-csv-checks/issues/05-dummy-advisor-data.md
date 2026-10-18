# 05: Dummy Advisor data folder

**What to build:** Advisor search runs against a dedicated data folder of about 20 dummy Advisors, each with name, email and office, instead of the four inline Advisors. Search behaviour is unchanged.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [x] About 20 dummy Advisors live in their own data folder, separate from the search code
- [x] Searching by name or email finds them, starting at two characters
- [x] Each result shows name, email and office
- [x] Adding an Advisor to the data folder makes it searchable with no code change
- [x] Existing Advisor tests keep passing, with new coverage for the larger set
