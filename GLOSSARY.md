# Client Import

Lets an admin create many Clients in ADX at once from a single CSV file, replacing the TRAMS bulk profile utility (Clientbase).

## Language

**Client Import**:
The feature, and the button and modal in ADX, for creating many Clients from one file in one upload.
_Avoid_: Bulk Upload, Bulk Client Upload, Bulk Upload Clients

**Advisor**:
The ADX user who will own the imported records. An admin performing an import chooses which Advisor it is for.
_Avoid_: Agent

**Client**:
A traveller profile owned by an Advisor.

**Companion**:
A Client who travels with, and is linked to, another Client through a relationship such as husband, wife or daughter. Client Import does not create Companions yet: the Import Template has no way to link one to a Client.
_Avoid_: Traveller, dependant

**Import Template**:
The CSV template downloadable from the modal. Its header row is exactly `First Name,Last Name,Email Address`, and each row after it is one Client.
_Avoid_: Client template, Companion template

**Import File**:
The CSV an admin uploads, built from the Import Template. Entirely blank rows are ignored. Row numbers in errors match the spreadsheet, with the header as row 1.

**Validation Failure**:
The outcome when the Import File fails either check. The whole file is rejected, nothing is created, and the admin fixes the file and uploads it again.

**Partial Success**:
The outcome when every row passed validation but some Clients failed to be created. The created Clients are kept and the failures are reported.

**File check**:
The first check, Step 2. Fails the file if the headers are not the Import Template's, the file is empty, a required field is blank, or an Email Address appears more than once in the file. Every occurrence of a duplicate is reported.

**Format check**:
The second check, Step 3, run only if the File check passed. Fails the file if a name is over 50 characters or has characters other than letters, spaces and `- ' . ,`, or an Email Address is not a valid address of up to 254 characters.

**Review**:
Step 4, shown after both checks pass. Lists every Client in the Import File with its Advisor so the admin can confirm before anything is created.
