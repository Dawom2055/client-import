> **Superseded in part by `.scratch/client-import-csv-checks/spec.md`.** Read that spec first for the Import Template (three columns: First Name, Last Name, Email Address), Companions (not created for now), the two checks that replace Validation Failure's single pass, and the Review step that replaces the confirm step. The rest of this spec still holds: Advisor selection, file upload rules, roles, close behaviour, creation, Success and Partial Success.
>
> Summary: a button next to "Create New Client" opens a modal where an admin picks an Advisor, downloads the Import Template and uploads one CSV. The whole file is checked before anything is created (ADR 0001). If it passes, the admin confirms and Clients are created, ending in Success or Partial Success.

## Problem Statement

TRAMS is being decommissioned, and its bulk profile import utility (Clientbase) goes with it. Advisors in ADX would be left with the "Create New Client" button, which creates one Client at a time. Onboarding large groups (corporate accounts, group tours, agency migrations) one record at a time is slow and error-prone, and it blocks the TRAMS decommission and the ACAVE migration.

## Solution

Add **Client Import** to ADX: a button next to "Create New Client" that opens a modal where an admin chooses an Advisor, downloads the single Import Template, and uploads one CSV Import File that creates both Clients and their Companions. The Import File is fully validated before anything is created. If any row or the file itself fails, the whole file is rejected with a grouped, readable error report and nothing is created (see ADR 0001). If everything passes, the admin confirms, the Clients are created, and the modal reports Success or Partial Success.

## User Stories

1. As an admin on the Operations team, I want a "Client Import" button next to "Create New Client", so that I can start a bulk import from the Clients page.
2. As a user in any other role, I want the Client Import button hidden, so that I am not offered a feature I cannot use yet.
3. As an admin, I want the modal to open at the first step with nothing half-filled from a previous session, so that each import starts clean.
4. As an admin, I want to search for an Advisor by name or email, so that I can import Clients on that Advisor's behalf.
5. As an admin, I want search to start after I type two characters, so that I do not trigger a lookup for a single letter.
6. As an admin, I want a Search button as well as search-as-you-type, so that I can trigger a lookup explicitly.
7. As an admin, I want to see a loading indicator while advisors are being searched, so that I know the system is working.
8. As an admin, I want a "No advisors found" message when nothing matches, so that I know to refine my search.
9. As an admin, I want a clear error with a Retry action when the advisor lookup fails, so that I can recover without closing the modal.
10. As an admin, I want each advisor result to show name, email and office, so that I can tell two advisors with similar names apart.
11. As an admin, I want to pick an advisor with the mouse or keyboard, so that the control is accessible.
12. As an admin, I want to clear my chosen Advisor and pick another, so that I can correct a mistake.
13. As an admin who is already using ADX as another Advisor, I want that Advisor preselected, so that I do not repeat a choice I already made.
14. As an admin, I want to change a preselected Advisor, so that preselecting never locks me in.
15. As an admin, I want the file upload area disabled until an Advisor is chosen, so that I cannot upload a file with no owner.
16. As an admin, I want the disabled upload area to explain why it is disabled, so that I know what to do next.
17. As an admin, I want a single "Download Import Template" link, so that I use one template for both Clients and Companions.
18. As an admin, I want to drag and drop a CSV into the upload area, so that adding a file is fast.
19. As an admin, I want to browse for a file instead, so that I can upload without drag and drop.
20. As an admin, I want a file that is not a .csv rejected immediately with an inline message, so that I do not wait for a later step to learn it is the wrong type.
21. As an admin, I want a file over 5 MB rejected immediately with an inline message, so that I know to split it.
22. As an admin, I want to see the file name and "Ready to import" once a file is added, so that I know the right file is loaded.
23. As an admin, I want a Replace file action, so that I can swap the file without starting over.
24. As an admin, I want Continue disabled until both an Advisor and a file are present, so that I cannot start an incomplete import.
25. As an admin, I want a Cancel action, so that I can leave the modal without importing.
26. As an admin, I want a five-step progress display with a step label and a filling bar, so that I understand where I am in the import.
27. As an admin, I want the percentage shown for timed steps, so that I can gauge how long is left.
28. As an admin, I want the file format check and the external data validation to happen before anything is created, so that a bad file never produces half an import.
29. As an admin, I want a "Checking for conflicting data" message during external validation, so that I know duplicates against existing Clients are being checked.
30. As an admin, I want a Validation Failure screen that groups errors by rule, so that I can fix one rule across many rows at once.
31. As an admin, I want each error group to list the affected rows and the offending value, so that I can find the cells to fix.
32. As an admin, I want only the first ten rows of each group shown with a "Show N more rows" action, so that a large file does not produce an unreadable wall of text.
33. As an admin, I want the total number of issues shown, so that I know how large the clean-up is.
34. As an admin, I want a plain instruction to correct the rows and upload again, together with a statement that nothing was created, so that I know my data is safe.
35. As an admin, I want "Back to file upload" on a Validation Failure to return me to the very beginning, so that I can start the corrected import cleanly.
36. As an admin, I want a confirm step stating how many Clients will be created for which Advisor, so that I can catch a wrong file or Advisor before anything is written.
37. As an admin, I want to cancel at the confirm step, so that a passed validation does not force a creation.
38. As an admin, I want a creating step with progress, so that I know the import is running.
39. As an admin, I want the close button disabled while Clients are being created, with a hint, so that I do not abandon an import I cannot undo.
40. As an admin, I want to close the modal freely during steps one to four, so that I can back out before anything is created.
41. As an admin, I want a Success screen with the number of Clients created, so that I know the whole file was imported.
42. As an admin, I want a Partial Success screen that says how many were created and how many failed, so that I know exactly where I stand.
43. As an admin, I want the failed rows listed with row number, name and reason in readable form, so that I can build a new file of just those rows.
44. As an admin, I want the created Clients on a Partial Success kept, so that a few failures do not undo the rest.
45. As an admin, I want a way to contact support from the Partial Success screen, so that I have a next step if the problem persists.
46. As an admin, I want "Done" to close the modal and return me to the ADX Clients page, so that I can carry on working.
47. As an admin, I want "Back to file upload" on Success and Partial Success to reset the modal to the beginning, so that I can run another import.
48. As an admin, I want to be able to press Escape to close the modal whenever closing is allowed, so that keyboard use is natural.
49. As a keyboard or screen reader user, I want the modal to take focus when it opens and announce status and errors, so that the flow is accessible.
50. As an Advisor, I want my imported Clients to appear as mine, so that I can book travel for them immediately.
51. As an admin, I want Companions created and linked to their Client in the same upload, so that I do not run a second import.
52. As ADX support, I want an internal log of every import by admins, managers and ICs, so that I can investigate problems.
53. As the business, I want no duplicate Clients created by an import, so that data quality does not degrade.
54. As the business, I want an import to finish quickly (under a minute for 100 rows), so that bulk import actually saves time.

## Implementation Decisions

- **One flow, one template.** Clients and Companions share one Client Import flow and one Import Template. There is no record-type choice in the modal and no second upload. A Companion is linked to its Client at upload time.
- **Required fields at launch:** First name, Last name and Email. All other fields are optional. This replaces the PRD's mandatory First Name, Last Name, Gender and Primary Phone, and it relies on the minimal-field Clients endpoint (still not confirmed; the fallback to the current-state set is decided at sign-off).
- **Whole-file rejection** (ADR 0001). Every validation step, including checks against existing Clients, completes before any record is created. Any failure rejects the file and nothing is created. Partial Success is reserved for creation-time failures after validation passed.
- **Five-step modal flow.** Step 1 Select advisor and file (no stepper shown), step 2 File format check, step 3 External data validation, step 4 Confirm, step 5 Finalize and upload. Steps 2, 3 and 5 are timed and show a progress bar; step 4 is a confirm screen. The progress bar fills consistently across states and is red on Validation Failure and amber on Partial Success.
- **Blocking modal.** The progress display is part of the MVP, but the modal blocks while it runs. Leaving the modal and continuing to use ADX mid-import, multiple imports, and import history are Phase 2.
- **Close behaviour.** The close control and Escape work on steps 1 to 4 and on all result screens, and are disabled during step 5.
- **Advisor selection.** The Advisor is a required field before the file area is enabled. It is preselected from "Using ADX as" when set, and remains changeable. Search begins at two characters, supports an explicit Search action, and handles loading, empty and error-with-retry states.
- **Roles.** At MVP the button is shown only to admins on the Operations team at TEN. Other roles do not see it. Managers and ICs follow in Phase 3.
- **File checks in the modal.** A non-.csv file or a file over 5 MB is refused inline at selection, before Continue.
- **Error report.** Validation errors are grouped by rule, ten rows shown per group with "Show N more rows", a total count, and a single generic instruction. There is no downloadable error report: the PRD's requirement for one is removed.
- **Partial Success report.** Failed rows are shown in a readable list of row number, name and reason, not raw record text.
- **End-state actions.** "Done" closes the modal and returns to the Clients page. "Back to file upload" resets the modal fully, including the Advisor, to the preselected value.
- **Copy corrections to the Figma frames.** The intro reads "Choose the advisor, download the template, and upload your file." The dropzone shows the real file name. The template link reads "Download Import Template". The frames' "Fix:" lines are replaced by one generic instruction.
- **Button label.** "Client Import", as in the frames, not "Bulk Upload Clients".
- **Import service boundary.** The UI talks to one import service with three capabilities: advisor search, whole-file validation, and creation. The prototype implements it with mocks that simulate success, partial success and validation failure. The real implementation routes through the Clients microservice via the DBO gateway, which owns TRAMS-versus-ACAVE routing, and the UI never calls TRAMS, Interbase or ACAVE directly.
- **Phase sketch from the prototype** (encodes the flow more precisely than prose):

  ```
  select -> format -> external -> ( invalid | confirm -> create -> ( success | partial ) )
  ```

- **Backend revisit required.** The PRD's chunked background-job design assumed separate Client and Companion jobs and per-batch Layer 2 validation. A single flow with a pre-creation validation gate means the job design must be reworked. That work is out of this spec.

## Testing Decisions

- **What a good test is.** Drive the modal as a user would and assert on what the user sees and can do: text, enabled and disabled controls, which screen is shown. Do not assert on component structure, internal state or timers beyond advancing them.
- **One seam: the Client Import modal, opened from the Clients page.** Tests open it, choose an Advisor, add a file, move through the steps, and check each end state. The import service is replaced with a fake that returns the chosen outcome and can be made to fail.
- **Behaviours covered through that seam:** button visible only to the right role; Advisor preselect and change; file upload disabled until an Advisor is chosen; advisor search loading, empty and error-with-retry states; inline refusal of non-CSV and oversize files; Continue enabled only with both inputs; step progression and labels; Validation Failure grouping, ten-row preview and "Show more"; confirm step wording and cancel; close disabled during creation and allowed otherwise; Success and Partial Success content; "Done" returning to the Clients page; "Back to file upload" resetting everything.
- **Prior art.** None; the repository has no tests yet. Use Vitest with React Testing Library and fake timers for the timed phases.

## Out of Scope

- Editing existing profiles, .xlsx upload, exporting Clients, and deactivating Clients (done internally with no UI).
- Downloadable error reports.
- Leaving the modal and continuing in ADX mid-import, multiple concurrent imports, and import history or audit UI for advisors (Phase 2).
- Access for Managers and ICs (Phase 3).
- The CSV column layout, the meaning of Profile Type, name-length and row-count limits, the match key for duplicates, the rule for the same phone under two Advisors, and row-level warnings. These are parked.
- The backend job design, queue priorities and service-to-service authentication.

## Further Notes

- **Figma gaps.** Frames are needed for step 2 (file format check), step 4 (confirm), and a file-level error state. The prototype designs them from the decisions above.
- **Parked items to return to**, from the original brief: the match key for duplicates (First, Last and phone today, Interface ID in future state), the same phone under two Advisors, and the row cap (10,000 proposed). Email now being required means the PRD's "missing optional email" warning no longer applies.
- **Brief corrections to confirm.** The TRAMS decommission date is February 2027, since August 31, 2026 has passed. The "Export Clients" row in the out-of-scope table is a copy error for deactivating Clients.
- **Dependencies unchanged:** a stable Clients endpoint that accepts the minimal fields, Companion creation with linking, and service-to-service authentication for any background work.
