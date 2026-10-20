Status: ready-for-agent

Summary: the Import Template grows from three columns to the 24 fields of the "Client Import Fields MVP" document, and one Import File now creates Clients and their Companions together. Rows are linked through a Group #: each Group has exactly one Client row and any number of Companion rows, and a row is a Companion row when Relationship to Client is filled in. The File check gains the Group and Profile Type rules; the Format check gains a rule and error message for every field.

Supersedes, for the parts it covers: `.scratch/client-import-csv-checks/spec.md` (the three-column Import Template, "Clients only", the 50-character name limit, and the Review table's columns). Everything else in that spec, including the error screens, row numbering, CSV parsing and Advisor search, still applies.

## Problem Statement

The Import Template only carries First Name, Last Name and Email Address. An admin migrating profiles from TRAMS has far more on each traveller (profile type, title, date of birth, phone, address, passport) and has to re-enter all of it by hand after the import. Worse, Companions cannot be imported at all: a family or a corporate group has to be imported as unrelated Clients and linked one by one. The admin cannot hand the system a single file that describes who travels with whom.

## Solution

The admin downloads an Import Template with 24 columns, the required ones marked with `*`. Each row is either a Client row (Relationship to Client left blank) or a Companion row (Relationship to Client filled in), and every row carries a Group #. All rows sharing a Group # belong together: the Group's one Client row creates the Client, and each of its Companion rows creates a Companion linked to that Client. A Client travelling alone is a Group of one.

The File check now also rejects a Group with no Client or more than one Client, a Companion whose Profile Type differs from its Client's, and a Corporate Name that is missing on a Corporate Client row or present where it does not belong. The Format check validates every field against the rules and error messages in the fields document. As before, any failure rejects the whole file and nothing is created (ADR 0001). The Review screen shows each row's Group # and Relationship to Client so the admin can see the Groups before finalising.

## User Stories

### Template

1. As an admin, I want the downloaded Import Template to list all 24 columns in a fixed order, so that I know every field the import accepts.
2. As an admin, I want required columns marked with `*` in the template header, so that I can see at a glance what I must fill in.
3. As an admin, I want the required columns to be Group #, Profile Type, First Name, Last Name and Email Address, so that I am not forced to collect optional data before importing.
4. As an admin, I want the template to contain the header row only, so that no example data is accidentally uploaded.
5. As an admin, I want my uploaded file's headers accepted with or without the `*`, so that removing the marker in my spreadsheet does not reject the file.
6. As an admin, I want headers matched ignoring capitalisation, so that a capitalisation slip does not reject the file.
7. As an admin, I want a file whose columns are missing, extra, misnamed or out of order rejected with a message listing the expected columns, so that I can fix the header.
8. As an admin, I want the modal's guidance text to describe Client rows, Companion rows and Groups, so that I understand how to fill the template before downloading it.

### Client rows, Companion rows and Groups

9. As an admin, I want a row with Relationship to Client left blank treated as a Client row, so that I create a Client by simply not naming a relationship.
10. As an admin, I want a row with Relationship to Client filled in treated as a Companion row, so that I can add a Companion in the same file as their Client.
11. As an admin, I want each Companion row linked to the Client row with the same Group #, so that families and corporate groups are created already linked.
12. As an admin, I want a Client with no Companions accepted as a Group of one, so that solo travellers need no extra effort.
13. As an admin, I want a Group's rows to be allowed anywhere in the file, not only next to each other, so that sorting my spreadsheet does not break the import.
14. As an admin, I want Group numbers allowed in any order and with gaps (1, 2, 7), so that I do not have to renumber after deleting rows.
15. As an admin, I want a Group # that is not a whole number of 1 or more reported with the row and value, so that I can correct it.
16. As an admin, I want a Group with two or more Client rows rejected and every row in that Group listed, so that I can decide which one is the Client.
17. As an admin, I want a Group with Companion rows but no Client row rejected and every row in that Group listed, so that no Companion is created without a Client to link to.
18. As an admin, I want Relationship to Client limited to Spouse, Partner, Child, Parent, Sibling, Friend or Other, ignoring capitalisation, so that relationships are recorded consistently.
19. As an admin, I want a Companion row whose Profile Type differs from its Group's Client row rejected, so that a Corporate Client's Companions are not created as Leisure (and vice versa).

### Profile Type and Corporate Name

20. As an admin, I want Profile Type to accept `L` (Leisure) or `C` (Corporate), ignoring capitalisation, so that each profile is categorised correctly.
21. As an admin, I want a Corporate Client row without a Corporate Name rejected, so that every Corporate Client names its company.
22. As an admin, I want a Companion row with a Corporate Name rejected, so that the company is only ever recorded on the Client.
23. As an admin, I want a Leisure Client row with a Corporate Name rejected, so that a Corporate Name always means a Corporate Client.
24. As an admin, I want a Corporate Name over 20 characters, or with characters other than letters, spaces and `- ' . ,`, reported, so that it fits ADX.

### Names

25. As an admin, I want First Name limited to 20 characters, Middle Name to 30 and Last Name to 29, so that names fit ADX's own limits.
26. As an admin, I want names limited to the letters A to Z, spaces and `- ' . ,`, so that nothing ADX would reject at creation slips through the checks.
27. As an admin, I want a name with an accented letter reported with the row and value, so that I can replace it before creation fails.

### Contact details

28. As an admin, I want an Email Address that is not a valid address of up to 254 characters reported with the message "Email Address must contain an '@' symbol, and any '.' must be followed by additional characters.", so that I know how to fix it.
29. As an admin, I want Email Address still to be unique across the whole file, Clients and Companions alike, so that duplicate people are never created.
30. As an admin, I want Email Description limited to Personal or Work, ignoring capitalisation, so that it matches ADX's options.
31. As an admin, I want Primary Phone Number limited to 10 to 15 digits, numbers only, so that only dialable numbers are imported.
32. As an admin, I want Phone Description limited to Home, Work or Cell, ignoring capitalisation, so that it matches ADX's options.
33. As an admin, I want a Phone Description accepted even when Primary Phone Number is blank, so that a harmless leftover does not reject my file.

### Personal details

34. As an admin, I want Title limited to Mr., Mrs., Ms., Dr., Mstr or Miss, with or without the period and ignoring capitalisation, so that common spellings are accepted.
35. As an admin, I want Gender limited to `M` or `F`, ignoring capitalisation, so that it matches ADX's options.
36. As an admin, I want Date of Birth in MM/DD/YYYY and not in the future, so that impossible birthdays are caught.
37. As an admin, I want a date that is not a real date in MM/DD/YYYY (such as 02/30/1990 or 1990-02-01) reported, so that I know the expected format.
38. As an admin, I want Nationality to match a country name or two-letter country code, ignoring capitalisation, so that spelling mistakes are caught.

### Address

39. As an admin, I want Address Line 1, Address Line 2 and City each limited to 80 characters with no character restrictions, so that real addresses are never blocked.
40. As an admin, I want Country to match a country name or two-letter code, ignoring capitalisation, so that spelling mistakes are caught.
41. As an admin, I want State/Province checked against the US states or Canadian provinces when Country is the US or Canada, by name or two-letter code, so that it is valid for that country.
42. As an admin, I want State/Province left unchecked when Country is another country or blank, so that international addresses are not blocked.
43. As an admin, I want a US Zip Code checked as `12345` or `12345-6789` and a Canadian Postal Code as `A1A 1A1`, so that postal codes are valid for their country.
44. As an admin, I want Zip/Postal Code left unchecked for other countries or when Country is blank, so that international addresses are not blocked.

### Passport

45. As an admin, I want Passport Number limited to 15 characters, so that it fits ADX.
46. As an admin, I want Passport Issuing Country to match a country name or two-letter code, ignoring capitalisation, so that spelling mistakes are caught.
47. As an admin, I want a Passport Expiry Date before today rejected but today accepted, so that expired passports are not imported.

### Checks, errors and Review

48. As an admin, I want blank optional cells ignored entirely, so that I only fill in what I have.
49. As an admin, I want the Group, Profile Type and Corporate Name rules reported in the File check, so that I fix the file's structure before individual values.
50. As an admin, I want every field's own rule reported in the Format check, with the error message from the fields document, so that the guidance matches what ADX shows elsewhere.
51. As an admin, I want each failing rule shown once with all its rows and values, as today, so that I can fix one rule across many rows.
52. As an admin, I want the Review table to show Group # and Relationship to Client next to the names and Email Address, so that I can check each Group before creating anything.
53. As an admin, I want the Review screen's total to count every row, Clients and Companions, so that I can compare it with my file.
54. As an admin, I want Success and Partial Success to behave as before after I finalise, so that creation reporting is unchanged.

## Implementation Decisions

- **Columns.** The Import Template header, in this order, with `*` on required columns:
  `Group #*, Relationship to Client, Profile Type*, Title, Corporate Name, First Name*, Middle Name, Last Name*, Gender, Date of Birth, Nationality, Email Description, Email Address*, Phone Description, Primary Phone Number, Address Line 1, Address Line 2, City, State/Province, Zip/Postal Code, Country, Passport Number, Passport Issuing Country, Passport Expiry Date`.
  The fields document's "Primary Address" is named Address Line 1 to pair with Address Line 2 and match its error message. Relationship to Client is not in the fields document; it is added because it decides the row type.
- **Header matching.** A header cell matches when it equals the expected name after trimming, dropping a trailing `*` and lower-casing. The order is fixed. Anything else is the existing file-level columns failure, whose message lists the expected columns.
- **Field definitions in one place.** Each column is described once: its header name, whether it is required, and its Format check rule and message. The template, header matching, required-field check and Format check are all driven from that list, so adding or changing a field is a single edit.
- **Row type.** Relationship to Client blank → Client row; filled → Companion row. Nothing else decides the type.
- **Required fields.** Group #, Profile Type and Email Address on every row; First Name and Last Name on every row except a Corporate Client row, which needs only its Corporate Name (its Companion rows still need both names). All five keep their `*` in the template. Missing fields are reported under the existing "Required fields missing" rule naming the column. Corporate Name's conditional requirement is a separate rule (below), not part of this one.
- **File check (Step 2)** runs, in addition to its existing rules, these rules. Each is its own error group listing every affected row:
  - "Group # must be a whole number of 1 or more." (a filled Group # that is not a positive whole number)
  - "Each Group must have only one Client." (every row of a Group with two or more Client rows)
  - "Each Group must have a Client. Companions must share a Group # with one row that has no Relationship to Client." (every row of a Group with no Client row)
  - "Companions must have the same Profile Type as the Client in their Group." (only Companion rows that differ; not reported when the Group already failed one of the two Group rules)
  - "Corporate Name is required when Profile Type is 'C' (Corporate)." (Corporate Client rows only)
  - "Corporate Name must be blank for Companions."
  - "Corporate Name must be blank when Profile Type is 'L' (Leisure)." (Leisure Client rows)
  
  The duplicate Email Address rule is unchanged and applies across Client and Companion rows alike. The Group, Profile Type and Corporate Name rules are evaluated only on rows whose Group # and Profile Type are valid; invalid values in those cells are reported by the rules above or by the Format check.
- **Format check (Step 3)** checks only filled-in cells. Rules and messages:

  | Field | Rule | Message |
  | --- | --- | --- |
  | Relationship to Client | Spouse, Partner, Child, Parent, Sibling, Friend, Other | Relationship to Client must be one of: Spouse, Partner, Child, Parent, Sibling, Friend, Other. |
  | Profile Type | L or C | Profile Type must be either 'L' (Leisure) or 'C' (Corporate). |
  | Title | Mr., Mrs., Ms., Dr., Mstr, Miss; period optional | Title must be one of: Mr., Mrs., Ms., Dr., Mstr, or Miss |
  | Corporate Name | ≤ 20, name characters | Corporate name must be 20 characters or fewer and can only contain letters, spaces, and - ' . , characters. |
  | First Name | ≤ 20, name characters | First Name must be 20 characters or fewer and can only contain letters, spaces, and - ' . , characters. |
  | Middle Name | ≤ 30, name characters | Middle Name must be 30 characters or fewer and can only contain letters, spaces, and - ' . , characters. |
  | Last Name | ≤ 29, name characters | Last Name must be 29 characters or fewer and can only contain letters, spaces, and - ' . , characters. |
  | Gender | M or F | Gender must be either 'M' (Male) or 'F' (Female). |
  | Date of Birth | real MM/DD/YYYY date, not after today | Date of Birth must be a real date in MM/DD/YYYY format. / Date of Birth cannot be a future date. |
  | Nationality | country | Nationality must match one of the valid dropdown options exactly. |
  | Email Description | Personal or Work | Email Description must be either 'Personal' or 'Work'. |
  | Email Address | existing pattern, ≤ 254 | Email Address must contain an '@' symbol, and any '.' must be followed by additional characters. |
  | Phone Description | Home, Work or Cell | Phone Description must be 'Home', 'Work', or 'Cell'. |
  | Primary Phone Number | 10–15 digits only | Phone Number must contain 10 to 15 digits, numbers only. |
  | Address Line 1 | ≤ 80, any characters | Address 1 cannot exceed 80 characters. |
  | Address Line 2 | ≤ 80, any characters | Address Line 2 cannot exceed 80 characters. |
  | City | ≤ 80, any characters | City cannot exceed 80 characters. |
  | State/Province | US state or Canadian province for that Country; unchecked otherwise | State must match one of the valid dropdown options. |
  | Zip/Postal Code | US `^[0-9]{5}(-[0-9]{4})?$`, CA `^[A-Za-z][0-9][A-Za-z] [0-9][A-Za-z][0-9]$`; unchecked otherwise | Zip Code must match the required format for the selected country (e.g., 12345 or 12345-6789 for US, A1A 1A1 for Canada). |
  | Country | country | Country must match one of the valid dropdown options exactly. |
  | Passport Number | ≤ 15 | Passport Number cannot exceed 15 characters. |
  | Passport Issuing Country | country | Passport Issuing Country must match one of the valid dropdown options exactly. |
  | Passport Expiry Date | real MM/DD/YYYY date, not before today | Passport Expiry Date must be a real date in MM/DD/YYYY format. / Passport Expiry Date cannot be before today's date. |

  "Name characters" are the letters A–Z and a–z, space and `- ' . ,`. Accented and other non-ASCII letters are rejected, replacing the current Unicode-letter rule. Messages come from the fields document. The exceptions are the phone message (the stray email-format text is removed and the 15-digit maximum added), the Zip message ("or needs to be entered" removed), and the date-format messages, which are new.
- **Pick-list matching.** All pick-list fields ignore capitalisation and surrounding spaces. Title also matches without its trailing period.
- **Reference lists.** Country fields (Nationality, Country, Passport Issuing Country) accept an ISO 3166 English short country name or its two-letter code. State/Province accepts the US states (with DC) and Canadian provinces and territories by name or two-letter code. These lists live in the data folder next to the dummy Advisors, so the real ADX lists can replace them without touching the rules.
- **"Today".** Date comparisons use the admin's local calendar date. An expiry date of today is valid. A date of birth of today is valid.
- **Validation result shape.** A passing validation returns one parsed record per row, with every field plus its row type and Group #. Review and creation are built from these records, not by re-reading the file.
- **Review screen.** The table columns become number, Group #, Relationship to Client, Corporate Name, First Name, Last Name, Email Address. The total counts all rows. Other fields stay off the table.
- **Import service boundary.** Unchanged: advisor search, whole-file validation and creation. Creation stays mocked; it receives the validated rows (Clients and Companions with their Groups) and can still simulate a Partial Success.
- **Modal copy.** The upload step's hint changes from "list each Client's name and email address" to explain Client rows, Companion rows and Group #.

## Testing Decisions

- **What a good test is.** Drive the modal as a user would and assert on what they see and can do: text, which screen is shown, which controls are enabled. Do not test the rules module, field list or reference lists directly.
- **One seam: the Client Import modal, opened from the Clients page.** This is unchanged from the previous specs. Tests upload real CSV content, and the real rules run; only Advisor search results and creation outcomes are faked.
- **Test helpers.** The shared header constant and the "valid Import File" helper move to the 24-column header. A helper that builds a row from a few named fields (the rest blank) keeps each test focused on the cells it is about.
- **Behaviours to cover through that seam:**
  - **Template:** the downloaded header; `*` optional on upload; wrong order rejected.
  - **Row types and Groups:** Client row vs Companion row; Group of one; Group rows split across the file; Group numbers with gaps; non-numeric, zero and negative Group #; two Clients in a Group; Companions with no Client; Companion Profile Type mismatch.
  - **Corporate Name:** missing on a Corporate Client row; present on a Companion row; present on a Leisure Client row.
  - **Per-field rules:** each field's rule at its boundary (for example 20/21 characters for First Name, 9/10 and 15/16 digits for phone, today/yesterday for passport expiry, today/tomorrow for date of birth); capitalisation and Title-without-period accepted; State and Zip checked for US and CA and ignored for other countries; accented names rejected.
  - **Messages and blanks:** each message as written above; blank optional cells never reported.
  - **Review:** Group # and Relationship to Client columns, and a total covering Companions.
- **Existing tests.** Tests that build three-column files, or assert on the 50-character limit or accented names passing, are rewritten for the new header and limits rather than patched.
- **Prior art.** The existing Vitest and React Testing Library suites (File check, Format check, Review) with their fake timers and shared flow helpers.

## Out of Scope

- Calling the real Clients service (Clients/Post, ClientsCompanion/Post); creation remains mocked.
- Checking against Clients that already exist in ADX.
- The real ADX dropdown lists; standard lists stand in until they are provided.
- More than one phone number, email or address per row.
- Linking a Companion to a Client that already exists in ADX rather than one in the same file.
- `.xlsx` upload and editing existing profiles (unchanged from the PRD).

## Further Notes

- The source for the fields, rules and messages is the "Client Import Fields MVP" document. Decisions made beyond it (Relationship to Client, Group rules, date format, phone maximum, header and pick-list matching, reference lists) came from a design session with the product owner.
- Rejecting a Corporate Name on a Leisure Client row was confirmed by the product owner.
- Dates accept a single-digit month or day (1/5/1990) as well as MM/DD/YYYY, because spreadsheets often save dates that way; confirmed by the product owner.
- Country fields also accept each country's official ISO short name and common alternatives (such as Burma, Ivory Coast, Turkey), and ignore accents and apostrophe style.
- A row with a bad Group # or a bad or missing Profile Type is reported for that alone: its Group's rules and its Corporate Name are checked after it is fixed, so the admin sees one clear message.
- ADR 0001 (reject the whole file on any Validation Failure) still holds and matters more now: skipping a bad Client row would orphan its Companions.
- The Figma frames show the three-column Review table; `docs/design.md` and the frames need updating to the new columns.
