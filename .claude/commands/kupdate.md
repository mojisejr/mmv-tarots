# kupdate

Knowledge Update - Create knowledge GitHub Issues with structured learning and automatic ID generation.

## Usage

```
/kupdate [category] "[topic]"
```

## Categories

- `device` - CU12, KU16, SerialPort, hardware integration
- `database` - SQLite, Sequelize, migrations, queries
- `architecture` - Design patterns, structural decisions
- `debug` - Error solutions, troubleshooting, workarounds
- `workflow` - Process improvements, automation
- `frontend` - React, Electron, UI components
- `backend` - Node.js, APIs, services

## Examples

```bash
/kupdate device 'CU12 lock-back solution'
/kupdate database 'SQLite migration performance fix'
/kupdate debug 'Actix-web async deadlock resolution'
/kupdate workflow 'Git branch cleanup automation'
```

## Implementation

### Pre-Creation Validation

1. **Setup .tmp folder**: `mkdir -p .tmp && echo ".tmp/" >> .gitignore`

2. **Check Dependencies**:
   - Validate GitHub CLI (`gh`) availability
   - Verify `docs/KNOWLEDGE-TEMP.md` template exists

3. **Category Validation**:
   - Validate category is in allowed list
   - Provide error with valid categories if invalid

4. **Critical: Duplicate Prevention**:
   - **MANDATORY**: Prompt user to run `/khub` first
   - Show pre-creation checklist
   - Explain common mistakes to avoid
   - Provide correct workflow example

### Knowledge ID Generation

1. **Discover Existing Knowledge**:
   - Search for existing `knowledge-{category}` issues
   - Extract existing KNOW-[CATEGORY]-XXX numbers
   - Find highest number in category

2. **Generate Next ID**:
   - Calculate next sequential number
   - Format with leading zeros (3 digits)
   - Example: KNOW-DEVICE-003

3. **Ensure Knowledge Label**:
   - Check if `knowledge-{category}` label exists
   - Create label if missing with appropriate color
   - Apply label to knowledge issue

### Issue Creation

1. **Create temporary content**:
   - Generate issue body in `.tmp/knowledge-content.md`
   - Process `docs/KNOWLEDGE-TEMP.md` template
   - Replace placeholders:
     - `{{KNOWLEDGE_ID}}` - Generated ID (e.g., KNOW-DEVICE-003)
     - `{{CATEGORY}}` - Category name
     - `{{TOPIC}}` - User-provided topic
     - `{{DATE}}` - Current date

2. **Create GitHub Issue**:
   - Title: `{knowledge-id}: {topic}`
   - Labels: `knowledge`, `knowledge-{category}`
   - Body: Use `--body-file .tmp/knowledge-content.md`
   - Repository: Current repository

3. **Cleanup temporary files**: `rm .tmp/knowledge-content.md`

4. **Display Results**:
   - Show issue URL and number
   - Display generated knowledge ID
   - Show category and topic information

### Auto-Linking Workflow

After issue creation:

1. **Prompt for Hub Linking**:
   ```
   🔗 Link to Knowledge Hub #102? (y/n)
   Your choice:
   ```

2. **Handle User Response**:
   - **Yes**: Automatically run `/klink [issue-number]`
   - **No**: Skip linking, provide manual linking instructions
   - **Error**: Show manual linking alternative

3. **Completion Summary**:
   - Show knowledge entry details
   - Provide discovery commands
   - Offer next steps

## Template Structure

Uses `docs/KNOWLEDGE-TEMP.md` which includes sections:
- Problem Statement - Clear description of what was solved
- Solution Implementation - Step-by-step working solution
- AI Honest Feedback - What worked, what didn't, lessons learned
- Things to Avoid - Common pitfalls and their consequences
- Prerequisites - What to check before starting
- AI Self-Improvement - Insights for future problem-solving
- Links & References - Connections to source issues/PRs/code
- Verification Status - Testing and validation state

## Error Handling

- **Invalid category**: Show valid categories list
- **Template missing**: Error with template file path
- **GitHub CLI missing**: Installation instructions
- **Issue creation failure**: Retry with detailed error
- **Duplicate prevention**: Strong warnings about running `/khub` first

## Integration

- **Before**: `/khub` (MANDATORY) to check existing entries
- **After**: `/klink` to connect entry to Knowledge Hub
- **Related**: `/ksearch` to find entries, `/kcategory` to browse
- **Discovery**: `/krecent` to show recent entries

## Duplicate Prevention Examples

**❌ WRONG** (creates duplicate):
```bash
/kupdate device "SHT30 sensor fix"  # Creates KNOW-DEVICE-001 (duplicate!)
```

**✅ RIGHT** (prevents duplicates):
```bash
/khub                              # Read Knowledge Hub #102
# See: KNOW-DEVICE-001, KNOW-DEVICE-002 exist
/kupdate device "SHT30 sensor fix" # Creates KNOW-DEVICE-003 (correct!)
```

## Files

- `docs/KNOWLEDGE-TEMP.md` - Knowledge issue template
- GitHub Issues - Individual knowledge entries
- GitHub Labels - Category organization
- Knowledge Hub #102 - Central index

## Notes

- **CRITICAL**: Always run `/khub` before `/kupdate`
- Never creates local .md files - always GitHub Issues
- Auto-generates unique knowledge IDs
- Automatically creates category labels if missing
- Prompts for hub linking after creation
- Builds structured knowledge base for future reference