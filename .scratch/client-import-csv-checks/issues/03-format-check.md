# 03: Format check

**What to build:** Once the File check passes, the Format check (Step 3) rejects names and Emails with disallowed content or length. Either check failing rejects the whole file (ADR 0001) and the Format check never runs when the File check fails.

**Blocked by:** 02

**Status:** ready-for-agent

- [x] A First Name or Last Name over 50 characters is reported with its row and value; 50 passes and 51 fails
- [x] A name containing anything other than letters, spaces and `- ' . ,` is reported with its row and value
- [x] An Email that is not a single `@` with text either side, a dot in the domain and no spaces, or is over 254 characters, is reported with its row and value
- [x] A file failing the File check never shows Format check errors
- [x] The Step 3 error screen uses the same grouping, ten-row preview, generic instruction and "nothing was created" statement, with a red bar
- [x] The Figma copy that says names are limited to 20 characters is noted as corrected to 50
- [x] Tests cover each of the above through the modal with real CSV content
