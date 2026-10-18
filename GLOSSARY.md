# Client Import

Lets an advisor create many Clients, and their Companions, in ADX at once from a single CSV file, replacing the TRAMS bulk profile utility (Clientbase).

## Language

**Client Import**:
The feature, and the button and modal in ADX, for creating many Clients and Companions from one file in one upload.
_Avoid_: Bulk Upload, Bulk Client Upload, Bulk Upload Clients

**Advisor**:
The ADX user who will own the imported records. An admin performing an import chooses which Advisor it is for.
_Avoid_: Agent

**Client**:
A traveller profile owned by an Advisor.

**Companion**:
A Client who travels with, and is linked to, another Client through a relationship such as husband, wife or daughter. Companions are created in the same upload as the Client they are linked to.
_Avoid_: Traveller, dependant

**Import Template**:
The single CSV template, downloadable from the modal, used for both Clients and Companions. There is no separate Companion template or upload.
_Avoid_: Client template, Companion template

**Import File**:
The CSV an Advisor uploads, built from the Import Template.

**Validation Failure**:
The outcome when any row or the file itself fails checking. The whole Import File is rejected, nothing is created, and the Advisor fixes the file and uploads it again.

**Partial Success**:
The outcome when every row passed validation but some Clients failed to be created. The created Clients are kept and the failures are reported.
