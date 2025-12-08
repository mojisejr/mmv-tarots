# khub

Knowledge Hub - Access Knowledge Hub #102 to view all knowledge entries and prevent duplicate IDs.

## Usage

```
/khub
```

## Implementation

### Validation

1. **Check Dependencies**:
   - Validate GitHub CLI (`gh`) availability
   - Verify jq is available for JSON parsing

2. **Validate Knowledge Hub**:
   - Check Knowledge Hub #102 exists
   - Verify issue is accessible
   - Extract hub content and metadata

### Display Information

1. **Knowledge Hub Summary**:
   - Total knowledge entries count
   - Available categories and descriptions
   - Last updated timestamp

2. **Category Distribution**:
   - device - CU12, KU16, SerialPort, hardware integration
   - database - SQLite, Sequelize, migrations, queries
   - architecture - Design patterns, structural decisions
   - debug - Error solutions, troubleshooting, workarounds
   - workflow - Process improvements, automation
   - frontend - React, Electron, UI components
   - backend - Node.js, APIs, services

3. **Recent Entries** (Last 5):
   - Issue number and title
   - Category and creation date
   - Brief preview of content

4. **Usage Guidelines**:
   - **MANDATORY**: Always read Knowledge Hub first
   - Check existing KNOW-[CATEGORY]-XXX numbers
   - Prevent duplicate knowledge IDs
   - Use `/kupdate` to create new entries

5. **Knowledge Creation Workflow**:
   ```
   1. /khub - Read Knowledge Hub (MANDATORY first step)
   2. Check existing KNOW-[CATEGORY]-XXX numbers
   3. /kupdate [category] '[topic]' - Create knowledge entry
   4. System prompts: 'Link to Knowledge Hub #102? (y/n)'
   5. If 'y': Automatic linking via /klink
   ```

### Browser Integration

- Attempt to open Knowledge Hub #102 in default browser
- Provide manual URL if browser opening fails
- Support for macOS (`open`) and Linux (`xdg-open`)

## Error Handling

- **Hub not found**: Clear error with Knowledge Hub #102
- **Access denied**: Check GitHub CLI authentication
- **Network issues**: Retry with exponential backoff
- **Parsing errors**: Graceful degradation of display

## Integration

- **Before**: Use `/khub` before creating any knowledge entries
- **After**: Use `/kupdate` to create new knowledge entries
- **Related**: `/ksearch`, `/kcategory`, `/krecent` for knowledge discovery
- **Linking**: Use `/klink` to connect entries to hub

## Knowledge ID System

Format: `KNOW-[CATEGORY]-[NUMBER]`

Examples:
- `KNOW-DEVICE-001` - First device knowledge entry
- `KNOW-DATABASE-015` - 15th database knowledge entry
- `KNOW-DEBUG-003` - Third debug knowledge entry

## Duplicate Prevention

**Critical**: Always run `/khub` before `/kupdate` to:
- Check existing knowledge IDs in each category
- Identify next available number
- Prevent creating duplicate IDs
- Maintain knowledge hub consistency

## Files

- GitHub Issue #102 - Knowledge Hub content and structure
- `.claude/` - Local state and tracking (if needed)

## Notes

- Knowledge Hub #102 is the central index for all knowledge
- Categories are auto-discovered from knowledge labels
- Knowledge entries are GitHub Issues with structured content
- Hub is automatically synchronized with `/ksync` command
- Access is mandatory before creating knowledge entries