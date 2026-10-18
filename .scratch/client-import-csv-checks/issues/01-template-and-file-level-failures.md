# 01: Real Import Template and file-level failures

**What to build:** The Import Template downloads with exactly `First Name,Last Name,Email Address`. Continuing parses the real CSV instead of using placeholder validation. A file with wrong, missing or extra headers (matched case-insensitively), an empty file, or a malformed CSV fails on the Step 2 "File check" error screen as a file-level error. Entirely blank rows are ignored. The stepper reads "File check" and "Format check". Existing validation tests are rewritten for the real rules.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [x] The downloaded template's header row is exactly `First Name,Last Name,Email Address`
- [x] Headers match case-insensitively; a missing, extra or misnamed column fails the file with a clear file-level message
- [x] An empty file, and a file with only blank rows after the header, fails with a clear message
- [x] A malformed CSV fails as a file-level error; quoted fields, embedded commas, a byte-order mark and CRLF line endings are accepted
- [x] The file-level error reuses the Step 2 error layout, the bar is red, and nothing is created
- [x] "Back to file upload" returns to the very beginning, including the Advisor
- [x] Step labels read "File check" and "Format check"
- [x] Tests drive the modal with real CSV content and cover each of the above
