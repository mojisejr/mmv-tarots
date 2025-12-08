# klink

Knowledge Link - Link knowledge entry to Knowledge Hub #102 with automatic section placement and statistics updates.

## Usage

```
/klink [knowledge-issue-number]
```

## Examples

```bash
/klink 116      # Link knowledge issue #116 to Knowledge Hub
/klink 243      # Link knowledge issue #243 to Knowledge Hub
```

## Implementation

### Validation

1. **Check Dependencies**:
   - Validate GitHub CLI (`gh`) availability
   - Verify jq is available for JSON parsing

2. **Validate Knowledge Issue**:
   - Check issue exists and is accessible
   - Verify issue has `knowledge` label
   - Extract category from `knowledge-{category}` label
   - Validate category is recognized

3. **Validate Knowledge Hub**:
   - Check Knowledge Hub #102 exists
   - Extract current hub content and structure

### Category Detection

Extract category from issue labels:
- `knowledge-device` → `device`
- `knowledge-database` → `database`
- `knowledge-architecture` → `architecture`
- `knowledge-debug` → `debug`
- `knowledge-workflow` → `workflow`
- `knowledge-frontend` → `frontend`
- `knowledge-backend` → `backend`

### Content Processing

1. **Extract Knowledge Information**:
   - Knowledge ID from issue title (e.g., KNOW-DEVICE-001)
   - Clean title (remove ID prefix)
   - Issue number and URL
   - Brief summary from issue body

2. **Generate Entry Format**:
   ```
   **KNOW-[CATEGORY]-[NUMBER]**: [Clean Title](../../issues/[issue-number]) - [Brief Description]
   ```

3. **Summary Extraction**:
   - Try "Problem Statement" section first
   - Fall back to "Problem:" line
   - Default to generic description if needed
   - Limit to 100 characters with ellipsis

### Hub Update Process

1. **Parse Current Hub Structure**:
   - Identify existing category sections
   - Locate "Recent Entries" section
   - Extract current statistics

2. **Find Insertion Point**:
   - **Category exists**: Add to existing category section
   - **Category missing**: Create new section before Device Knowledge
   - **No sections**: Add before Recent Entries section

3. **Update Content**:
   - Insert new entry in appropriate location
   - Update total entries count if statistics exist
   - Maintain markdown formatting

4. **Apply Changes**:
   - Update Knowledge Hub #102 with new content
   - Validate successful update
   - Handle conflicts gracefully

### Statistics Updates

If hub contains "Total Knowledge Entries:" line:
- Extract current total count
- Increment by 1
- Update line with new total

## Error Handling

- **Issue not found**: Clear error with issue number
- **Not a knowledge issue**: Error about missing labels
- **Hub access denied**: Authentication or permission error
- **Category missing**: Error about category label
- **Update failure**: Retry with conflict resolution

## Section Placement Logic

1. **Existing Category Section**:
   ```
   ### Device Knowledge

   **KNOW-DEVICE-001**: [Title](link) - Description
   **KNOW-DEVICE-002**: [Title](link) - Description
   [NEW ENTRY INSERTED HERE]
   ```

2. **New Category Section**:
   ```
   ### New Category Knowledge

   **KNOW-NEW-001**: [Title](link) - Description

   ### Device Knowledge
   ```

3. **Before Recent Entries**:
   ```
   [NEW CATEGORY SECTION HERE]

   ## Recent Entries
   ```

## Integration

- **Before**: `/kupdate` to create knowledge entry
- **After**: Hub automatically updated with new entry
- **Related**: `/khub` to browse updated hub, `/ksync` for full sync
- **Discovery**: Entry becomes discoverable via `/ksearch` and `/kcategory`

## Linking Benefits

- **Centralized Discovery**: All knowledge accessible from hub
- **Automatic Statistics**: Entry counts and distribution
- **Consistent Formatting**: Standardized entry presentation
- **Category Organization**: Proper section placement
- **Real-time Updates**: Hub reflects current knowledge state

## Files

- GitHub Issue #102 - Knowledge Hub content
- Knowledge Issues - Individual entries being linked
- Category Labels - Organization and classification

## Notes

- Automatically detects category from issue labels
- Maintains proper markdown formatting in hub
- Updates statistics counters automatically
- Places entries in appropriate sections
- Handles missing categories gracefully
- Preserves existing hub content and structure