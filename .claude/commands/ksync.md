# ksync

Knowledge Sync - Synchronize Knowledge Hub #102 with all knowledge entries for complete consistency.

## Usage

```
/ksync
```

## Implementation

### Pre-Sync Validation

1. **Check Dependencies**:
   - Validate GitHub CLI (`gh`) availability
   - Verify jq is available for JSON parsing

2. **Validate Knowledge Hub**:
   - Check Knowledge Hub #102 exists
   - Extract current hub content and structure
   - Validate accessibility

### Knowledge Discovery

1. **Comprehensive Scan**:
   - Search all issues with `knowledge` label
   - Include all categories: device, database, architecture, debug, workflow, frontend, backend
   - Retrieve full metadata: number, title, body, created date, URL

2. **Category Processing**:
   - Group entries by category labels
   - Extract knowledge IDs from titles
   - Generate entry summaries from content
   - Sort by creation date (newest first)

3. **Statistics Calculation**:
   - Count entries per category
   - Calculate total knowledge entries
   - Identify latest activity per category
   - Generate distribution metrics

### Hub Reconstruction

1. **Template Generation**:
   ```markdown
   # 🧠 Knowledge Hub

   ## Overview

   This Knowledge Hub serves as the central index for all project knowledge entries...

   **📚 Total Knowledge Entries:** [CALCULATED]
   **🔄 Last Updated:** [TIMESTAMP]

   ## Categories

   - **Device Knowledge** - CU12, KU16, SerialPort, hardware integration
   - **Database Knowledge** - SQLite, Sequelize, migrations, queries
   - **Architecture Knowledge** - Design patterns, structural decisions
   - **Debug Knowledge** - Error solutions, troubleshooting, workarounds
   - **Workflow Knowledge** - Process improvements, automation
   - **Frontend Knowledge** - React, Electron, UI components
   - **Backend Knowledge** - Node.js, APIs, services

   ## Knowledge Sections

   ### [Category] Knowledge

   **KNOW-[CATEGORY]-[NUMBER]**: [Title](../../issues/[number]) - [Summary]

   ## Statistics

   [Category]: [count] entries
   ```

2. **Category Section Building**:
   - Process each category separately
   - Format entries consistently
   - Maintain chronological order
   - Include direct links to issues

3. **Entry Formatting**:
   ```
   **KNOW-DEVICE-003**: [CU12 Lock-Back Solution](../../issues/156) - Solution involves adjusting timing sequence...
   ```

4. **Statistics Generation**:
   ```
   ## Statistics

   device: 5 entries
   database: 3 entries
   architecture: 2 entries
   debug: 4 entries
   workflow: 1 entry
   frontend: 2 entries
   backend: 3 entries
   ```

### Sync Process

1. **Content Assembly**:
   - Combine overview, categories, and sections
   - Insert calculated statistics
   - Add usage guidelines and workflows
   - Include metadata and attribution

2. **Hub Update**:
   - Update Knowledge Hub #102 with rebuilt content
   - Validate successful update
   - Handle merge conflicts if needed
   - Confirm content integrity

3. **Verification**:
   - Verify all knowledge entries are included
   - Check category organization
   - Validate statistics accuracy
   - Test link functionality

## Sync Output

### Successful Sync
```
🔄 Starting Knowledge Hub synchronization...

🔍 Validating Knowledge Hub #102...
✅ Knowledge Hub validated

🔍 Discovering all knowledge entries...
   Scanning categories...
     📂 device: 5 entries
     📂 database: 3 entries
     📂 architecture: 2 entries
     📂 debug: 4 entries
     📂 workflow: 1 entry
     📂 frontend: 2 entries
     📂 backend: 3 entries
✅ Knowledge discovery complete

🔧 Rebuilding Knowledge Hub structure...
📝 Updating Knowledge Hub with rebuilt content...
✅ Knowledge Hub synchronized successfully!
   Total entries synced: 20
   Categories processed: 7

🎉 Knowledge Sync Complete!
==========================
✅ Synchronization Actions:
   • Scanned all knowledge issues with 'knowledge-*' labels
   • Rebuilt Knowledge Hub structure with complete knowledge lists
   • Updated statistics and distribution
   • Fixed formatting and broken links
   • Ensured hub reflects current knowledge base state

🔗 Knowledge Hub: https://github.com/owner/repo/issues/102
```

### No Knowledge Entries
```
🔄 Starting Knowledge Hub synchronization...

🔍 Discovering all knowledge entries...
   📭 No knowledge entries found

⚠️  No knowledge entries found to sync
   Create knowledge entries first with: /kupdate [category] '[topic]'
```

## Error Handling

- **Hub not found**: Clear error with Knowledge Hub #102
- **Access denied**: Authentication or permission issues
- **Update conflicts**: Manual resolution guidance
- **Rate limiting**: Automatic retry with backoff
- **Parsing errors**: Graceful degradation

## Use Cases

- **Bulk knowledge creation**: After creating multiple knowledge entries
- **Hub inconsistency**: When Knowledge Hub becomes out of sync
- **Maintenance**: Regular hub synchronization operation
- **Recovery**: Fix broken links or formatting issues
- **Audit**: Ensure all knowledge is discoverable

## Sync Benefits

- **Complete synchronization**: All knowledge entries included
- **Consistent formatting**: Standardized entry presentation
- **Accurate statistics**: Real-time entry counts and distribution
- **Fixed broken links**: Updated issue references
- **Central discovery**: All knowledge accessible from hub

## Integration

- **Before**: `/kupdate` to create knowledge entries
- **After**: `/khub` to browse synchronized hub
- **Related**: `/ksearch`, `/kcategory`, `/krecent` for discovery
- **Maintenance**: Run periodically to maintain consistency

## Features

- **Comprehensive scan**: All knowledge issues discovered
- **Category organization**: Automatic section placement
- **Statistics calculation**: Real-time entry counts
- **Format standardization**: Consistent markdown structure
- **Link validation**: Verified issue references
- **Content preservation**: Existing knowledge maintained

## Files

- GitHub Issue #102 - Knowledge Hub content
- All Knowledge Issues - Source for synchronization
- Category Labels - Organization and classification

## Notes

- Scans all knowledge issues regardless of category
- Rebuilds entire hub for maximum consistency
- Updates all statistics automatically
- Fixes formatting and broken links
- Ensures hub reflects current knowledge base state
- Safe operation - preserves all existing knowledge