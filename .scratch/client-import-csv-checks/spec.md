Status: ready-for-agent

Supersedes, for the parts it covers: `.scratch/client-import/spec.md` (the Import Template, Validation Failure and confirm step) and ticket 07.

## Problem Statement

Client Import today validates against placeholder rules: the Import Template has no agreed layout, the checks are simulated by the mock service, and the Validation Failure and confirm screens do not match the approved Figma frames. An admin cannot add real rows to the file and learn whether they are wrong, and the Advisor search runs against four hard-coded people. The admin cannot trust that a file which passes will create what they expect.

## Solution

The admin downloads an Import Template with exactly three columns (First Name, Last Name, Email Address), fills it in, and uploads it for a chosen Advisor. The Import File goes through two checks before anything is created. The **File check** (Step 2) catches wrong headers, an empty file, blank required fields and duplicate Emails. The **Format check** (Step 3) catches names and Emails with disallowed content or length, and runs only if the File check passed. Either failure rejects the whole file with the Figma error screens (ADR 0001). When both pass, the admin sees a **Review** of every Client and the chosen Advisor, and confirms with "Finalize and Upload". Advisor search runs against a data folder of about 20 dummy Advisors.

## User Stories

1. As an admin, I want to download an Import Template containing exactly First Name, Last Name and Email Address, so that I know which columns the system accepts.
2. As an admin, I want to add any rows I like to that template and upload it, so that I can find out whether my data has problems.
3. As an admin, I want the template header matched case-insensitively, so that a capitalisation slip in the header does not reject my file.
4. As an admin, I want a file with a missing, extra or misnamed column rejected with a clear file-level message, so that I know the file does not match the template.
5. As an admin, I want an empty file rejected with a clear message, so that I do not wait for a review of nothing.
6. As an admin, I want entirely blank rows ignored, so that trailing empty lines from my spreadsheet do not cause errors.
7. As an admin, I want a row with a blank First Name, Last Name or Email reported as a missing required field, so that I can complete it.
8. As an admin, I want the missing field named in the error (for example "Row 8: Email Address"), so that I can find the empty cell.
9. As an admin, I want every row that shares an Email with another row reported, so that I can decide which to remove or change.
10. As an admin, I want Emails compared ignoring case and surrounding spaces, so that `Jane@x.com` and ` jane@x.com ` count as the same Client.
11. As an admin, I want two different people with the same name but different Emails accepted, so that common names are not blocked.
12. As an admin, I want row numbers in errors to match what I see in my spreadsheet, with the header as row 1, so that I can jump to the right row.
13. As an admin, I want the File check to finish before the Format check begins, so that I fix one class of problem at a time.
14. As an admin, I want the Format check skipped when the File check fails, so that I am not shown two screens' worth of errors at once.
15. As an admin, I want a First Name or Last Name over 50 characters reported with the row and the offending value, so that I can shorten it.
16. As an admin, I want a name containing anything other than letters, spaces and `- ' . ,` reported, so that unsupported characters never reach ADX.
17. As an admin, I want an Email that is not a valid address, or is over 254 characters, reported with the row and value, so that I can correct it.
18. As an admin, I want each error group to show a red rule heading, the affected rows and the offending values, so that I can fix one rule across many rows.
19. As an admin, I want the total number of issues shown at the top of the error screen, so that I know how large the clean-up is.
20. As an admin, I want only the first ten rows of a group shown with "Show N more rows", so that a large file does not produce an unreadable wall of text.
21. As an admin, I want one generic instruction to correct the file and upload again, with no per-rule "Fix:" lines, so that the guidance is never wrong for my case.
22. As an admin, I want to be told nothing was created when a check fails, so that I know my data is safe.
23. As an admin, I want "Back to file upload" to return me to the very beginning, so that I can upload the corrected file cleanly.
24. As an admin, I want the progress bar red on either failure, so that the failure is visible at a glance.
25. As an admin, I want the steps labelled "File check", "Format check" and "Review", so that the labels describe what is being checked.
26. As an admin, I want a Review screen listing every Client as a readable table of number, First Name, Last Name and Email Address, so that I can spot a wrong file before anything is created.
27. As an admin, I want the Review screen to state the total number of records, so that I can compare it with my file.
28. As an admin, I want the Review screen to show which Advisor the Clients will belong to, so that I can catch a wrong Advisor.
29. As an admin, I want the whole list scrollable inside the screen, so that I can review a large file without losing the buttons.
30. As an admin, I want to cancel from the Review screen, so that a passing file does not force a creation.
31. As an admin, I want a "Finalize and Upload" button on the Review screen, so that I explicitly commit the import.
32. As an admin, I want Success and Partial Success to behave as before after I finalise, so that creation reporting is unchanged.
33. As an admin, I want to search for an Advisor by name or email among a realistic set of dummy Advisors, so that I can try the flow with plenty of choices.
34. As an admin, I want Advisor results to show name, email and office, so that I can tell similar Advisors apart.
35. As a developer, I want the dummy Advisors in their own data folder, so that I can add or change them without touching the search code.

## Implementation Decisions

- **Template.** The Import Template has the header row `First Name,Last Name,Email Address` and no data rows. Header matching is case-insensitive. Any other column set is a file-level failure.
- **Clients only.** Every row is an independent Client. Companions are not created and the Import Template carries no Group, Relationship or Profile Type. This supersedes the earlier spec's one-flow-for-Clients-and-Companions and parks the CSV column layout question. The glossary has been updated to match.
- **Required fields.** First Name, Last Name and Email are all required. A blank value is reported as a missing required field naming the column.
- **File check (Step 2).** Fails on: headers not matching the template, an empty file (no rows after the header, ignoring blank rows), a blank required field, or a duplicate Email. A duplicate is the same Email within the file after trimming and lower-casing; every occurrence is listed. There is no check against Clients already in ADX.
- **Format check (Step 3).** Runs only when the File check passed. Fails on: a First Name or Last Name over 50 characters; a name with characters other than letters, spaces and `- ' . ,`; an Email that is not a single `@` with a local part of letters, digits and `. _ % + -`, a domain of letters, digits, `-` and at least one `.`, or is over 254 characters. The 50-character limit comes from the updated PRD and replaces the 20 shown in the Figma frame; the Figma copy is corrected to match.
- **Whole-file rejection.** Per ADR 0001, any failure in either check rejects the whole file and nothing is created. The checks run in order and stop at the first check that fails.
- **Row numbering and blanks.** Row numbers in errors are spreadsheet rows with the header as row 1. Entirely blank rows are ignored and still count toward numbering.
- **Error screens.** Follow the Figma frames: total at the top, red rule heading, `Row N: value` list. Missing-field rows name the column. Per-rule "Fix:" lines are not shown; a single generic instruction and the statement that nothing was created appear at the bottom. Ten rows per group with "Show N more rows". The bar is red.
- **File-level errors.** Header and empty-file failures reuse the Step 2 error screen layout as a single rule group with no row list.
- **Step labels and bar.** Five steps: Select advisor and file (no stepper), File check, Format check, Review, Finalize and upload. The bar fills consistently across states, is red on either failure and amber on Partial Success.
- **Review screen.** Title "Review the client profiles", total records, a scrollable readable table of number, First Name, Last Name and Email Address for every row, and the chosen Advisor's name. Buttons: Cancel and "Finalize and Upload". This replaces the earlier "Create N clients" confirm and the Figma frame's raw JSON.
- **Creation and results.** Step 5 and Partial Success are unchanged. Success no longer says "and their companions", because Companions are not created.
- **Import service boundary.** The UI still talks to one import service with advisor search, whole-file validation and creation. Whole-file validation now runs the real two-check rules over the file's contents and returns which check failed, its grouped errors, or the parsed rows for Review. Creation remains mocked and can still simulate a Partial Success.
- **Validation result shape.** A validation outcome is one of: passed with the parsed Clients; failed at the File check with grouped errors; failed at the Format check with grouped errors. The Review screen is built from the parsed Clients, not by re-reading the file.
- **Advisor data.** The Advisors move from an inline list into a dedicated data folder holding about 20 dummy Advisors with name, email and office. The mock search reads from it; search behaviour (two-character minimum, name or email match) is unchanged.
- **Cells and columns.** Cells are trimmed and normalised so names typed with combining accents count as letters. Empty cells after the last column, as spreadsheets save them, are ignored; text beyond the third column is a file-level columns failure. A file that cannot be read is a file-level failure.
- **CSV parsing.** Quoted fields, embedded commas, a UTF-8 byte-order mark and CRLF line endings are handled. A malformed CSV is a file-level failure.

## Testing Decisions

- **What a good test is.** Drive the modal as a user would and assert on what they see and can do: text, which screen is shown, enabled and disabled controls. Do not assert on component structure, internal state or the rules module directly.
- **One seam: the Client Import modal, opened from the Clients page.** Unchanged from the earlier spec. The difference is that tests upload real CSV content and the real rules run; only advisor search results and creation outcomes are faked.
- **Behaviours covered through that seam:** downloaded template header; wrong, missing, extra and mis-cased headers; empty file; blank rows ignored; each required field blank; duplicate Email with every occurrence listed, case and space variants, same name with different Emails accepted; the Format check not running when the File check fails; name length and character rules, boundary at 50 and 51; Email format and length; error grouping, total, ten-row preview and "Show more"; generic instruction and "nothing was created"; "Back to file upload" resetting; step labels and red bar; Review table content, total, Advisor name, Cancel and "Finalize and Upload"; Success and Partial Success after finalising; Advisor search over the larger dataset.
- **Existing tests.** The tests for the old confirm step, the "Checking for conflicting data" message and fake-driven Validation Failure assume the replaced behaviour and are rewritten rather than patched.
- **Prior art.** The existing Vitest and React Testing Library tests with fake timers and the shared flow helpers.

## Out of Scope

- Companions and linking them to Clients.
- Checks against Clients already in ADX, and duplicate detection on phone.
- Optional fields (phone, gender, date of birth, address and the rest of the PRD catalogue).
- Row-level warnings.
- Row-count limits (the 10,000 proposal stays parked).
- Downloadable error reports.
- The real backend, chunked job design and queue priorities.
- Leaving the modal mid-import, multiple imports and import history.

## Further Notes

- **Figma corrections.** The format-error frame says names are limited to 20 characters; the rule is 50. Its "Fix:" lines are dropped. The Review frame's raw JSON lines and its Group, Relationship and Profile Type content are replaced by the three-column table. Step labels change to File check, Format check and Review.
- **PRD conflicts resolved here.** The PRD's duplicate rule is the same phone; this spec uses Email because the template has no phone. The PRD's validation Layer 2 (existing-Client duplicates) is not part of this revamp.
- **Ticket 07.** The missing frames for step 2, step 4 and a file-level error are largely covered by the supplied frames; the file-level error frame remains a design gap handled by reusing the Step 2 layout.
- **Dependencies unchanged:** a stable Clients endpoint accepting minimal fields and service-to-service authentication for background work.
