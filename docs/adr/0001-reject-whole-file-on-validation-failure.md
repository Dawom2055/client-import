# Reject the whole Import File when any validation fails

The PRD asked for partial success: process valid rows and report the rest. The Import Flow instead validates the entire Import File, including checks against existing ADX Clients, before anything is created. Any Validation Failure rejects the file and the Advisor fixes it and uploads it again. Only rows that fail at creation time produce a Partial Success.

We chose this because Companions are linked to Clients in the same file, so skipping a bad row could silently orphan its Companions. It also matches the Figma frames, which put all validation ahead of the create step.

## Considered Options

- **Skip invalid rows and create the rest (the PRD's original behaviour).** Rejected: harder to reason about links between rows, and an Advisor can end up with half an import and no clear file to correct.

## Consequences

- One bad row in a large file blocks the whole upload, so the error report must make fixing it fast.
- Layer 2 checks (such as existing-client duplicates) now run as a gate before creation, not per batch during it. The PRD's job design needs revisiting.
