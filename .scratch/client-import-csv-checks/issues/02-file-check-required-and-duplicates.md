# 02: File check: required fields and duplicate Emails

**What to build:** The File check also fails the file when a required field is blank or an Email appears more than once. The Step 2 error screen groups the errors by rule with the Figma layout and tells the admin to correct the file and upload again.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A blank First Name, Last Name or Email is reported as `Row N: <column name>`
- [ ] Every row sharing an Email is reported, with Emails compared after trimming and ignoring case
- [ ] Two rows with the same name but different Emails pass
- [ ] Row numbers match the spreadsheet, with the header as row 1; blank rows are ignored but still count toward numbering
- [ ] The screen shows the total at the top, a red heading per rule, the affected rows and offending values, and no per-rule "Fix:" lines
- [ ] Each group shows its first ten rows, with "Show N more rows" revealing the rest
- [ ] The screen shows one generic instruction to correct the file and upload again, and says nothing was created
- [ ] Tests cover each of the above through the modal with real CSV content
