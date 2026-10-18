# 03: Add a file

**What to build:** With an Advisor chosen, an admin can download the single Import Template and add one CSV by dragging it in or browsing. Wrong files are refused immediately, and Continue is available only when both an Advisor and a file are present.

**Blocked by:** 02

**Status:** ready-for-agent

- [x] One "Download Import Template" link covers Clients and Companions; there is no record-type choice
- [x] A file that is not a .csv, or is over 5 MB, is refused inline with a message and is not added
- [x] An added file shows its real name and "Ready to import", with a Replace file action
- [x] Continue is disabled until both an Advisor and a file are present
- [x] Tests cover drag and drop, browse, refusal, replace and the Continue gate through the modal
