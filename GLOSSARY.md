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
A Client who travels with, and is linked to, another Client through a relationship such as husband, wife or daughter. In a Client Import, a Companion is linked to the Client in the same Group.
_Avoid_: Traveller, dependant

**Group**:
A set of rows in one Import File that share a Group number: exactly one Client row and any number of Companion rows. Each Companion row is linked to the Group's Client. A Client with no Companions is a Group of one.

**Profile Type**:
Whether a Client is Leisure (`L`) or Corporate (`C`). A Corporate Client row names its company in Corporate Name; Companion rows never carry a Corporate Name.

**Client row**:
A row in the Import File with no Relationship to Client. It creates a Client.
_Avoid_: Client upload

**Companion row**:
A row in the Import File with a Relationship to Client. It creates a Companion linked to the Client row in the same Group.
_Avoid_: Companion upload

**Import Template**:
The CSV template downloadable from the modal. Its header row lists every column the import accepts, with required columns marked `*`; each row after it is one Client row or Companion row.
_Avoid_: Client template, Companion template

**Import File**:
The CSV an admin uploads, built from the Import Template. Entirely blank rows are ignored. Row numbers in errors match the spreadsheet, with the header as row 1.

**Validation Failure**:
The outcome when the Import File fails either check. The whole file is rejected, nothing is created, and the admin fixes the file and uploads it again.

**Partial Success**:
The outcome when every row passed validation but some Clients failed to be created. The created Clients are kept and the failures are reported.

**File check**:
The first check, Step 2. Checks the shape of the Import File: its headers, that it has rows, that required fields are filled, that no Email Address repeats, and that every Group has exactly one Client row.

**Format check**:
The second check, Step 3, run only if the File check passed. Checks each filled-in cell against its field's own rule, such as a length limit, allowed characters, a date format or a list of allowed values.

**Review**:
Step 4, shown after both checks pass. Lists every Client in the Import File with its Advisor so the admin can confirm before anything is created.
