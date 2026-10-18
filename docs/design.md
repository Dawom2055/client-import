# Design

Figma file: https://www.figma.com/design/6onfb4g0Ji1wzckKg6Ro01/Client-Import

| Screen | Node ID | Notes |
| --- | --- | --- |
| File check failure (required fields, duplicates) | `33:1318` | Shown at Step 2. Drop the "Fix:" lines. |
| Format check failure | `33:1370` | Shown at Step 3. The frame says names are 20 characters; the rule is 50. Drop the "Fix:" lines. |
| Review | `33:333` | Shown at Step 4. The frame shows raw JSON and Group, Relationship and Profile Type; the build shows a three-column table. |

Frames for the file-level error (wrong headers, empty file) do not exist; it reuses the File check layout.

Read a frame with the Figma MCP `get_screenshot` tool, passing the file key `6onfb4g0Ji1wzckKg6Ro01` and the node ID with `-` as `:`.
