# 04: Validation Failure path

**What to build:** Continuing runs the file format check and external data validation before anything is created. When the file fails, the admin sees every problem grouped by rule, is told nothing was created, and can return to the beginning to upload a corrected file (ADR 0001).

**Blocked by:** 03

**Status:** ready-for-agent

- [x] Steps 2 and 3 show a step label, a filling progress bar and a percentage; the stepper is not shown on the first screen
- [x] A Validation Failure shows the total issue count and errors grouped by rule, with the affected rows and offending values
- [x] Each group shows its first ten rows, with "Show N more rows" revealing the rest
- [x] The screen says to correct the rows and upload again, and that nothing was created
- [x] The progress bar is red on this screen
- [x] "Back to file upload" returns to the very beginning, including the Advisor
- [x] Tests cover each of the above through the modal, using a fake that returns a Validation Failure
