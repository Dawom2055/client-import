# Design

Figma file: https://www.figma.com/design/6onfb4g0Ji1wzckKg6Ro01/Client-Import

| Screen | Node ID | Notes |
| --- | --- | --- |
| File check failure (required fields, duplicates) | `33:1318` | Shown at Step 2. Drop the "Fix:" lines. |
| Format check failure | `33:1370` | Shown at Step 3. The frame's 20-character name limit matches First Name again; Middle Name is 30 and Last Name 29. Messages for every field are in `.scratch/client-import-fields/spec.md`. Drop the "Fix:" lines. |
| Review | `33:333` | Shown at Step 4. The frame shows raw JSON; the build shows a table of #, Group #, Relationship to Client, First Name, Last Name and Email Address, with Companion rows included in the total. The frame needs updating to that table. |

Frames for the file-level error (wrong headers, empty file) do not exist; it reuses the File check layout. The File check frame also needs the Group, Profile Type and Corporate Name rules, which use the same layout.

The upload step's hint now explains Client rows, Companion rows and Group #; no frame shows that copy yet.

Read a frame with the Figma MCP `get_screenshot` tool, passing the file key `6onfb4g0Ji1wzckKg6Ro01` and the node ID with `-` as `:`.
