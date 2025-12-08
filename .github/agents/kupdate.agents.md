---
name: kupdate
description: Knowledge Update agent for creating structured knowledge GitHub Issues with automatic ID generation and duplicate prevention
---

# kupdate Agent

A specialized GitHub agent that creates structured knowledge GitHub Issues with automatic ID generation, duplicate prevention, and integration with the Knowledge Hub system.

## Capabilities

- **Knowledge Creation**: Creates GitHub Issues using `docs/KNOWLEDGE-TEMP.md` template
- **Automatic ID Generation**: Generates unique KNOW-[CATEGORY]-XXX identifiers
- **Duplicate Prevention**: Enforces mandatory `/khub` check to prevent duplicates
- **Category Management**: Manages knowledge categories with automatic label creation
- **Hub Integration**: Auto-links entries to Knowledge Hub #32 with user confirmation
- **Structured Learning**: Creates comprehensive knowledge entries with AI feedback

## Knowledge Categories

### Standard Categories
- `device` - CU12, KU16, SerialPort, hardware integration
- `database` - SQLite, Sequelize, migrations, queries
- `architecture` - Design patterns, structural decisions
- `debug` - Error solutions, troubleshooting, workarounds
- `workflow` - Process improvements, automation
- `frontend` - React, Electron, UI components
- `backend` - Node.js, APIs, services

## Core Workflow

### Pre-Creation Validation (Critical)
1. **Dependency Check**: Validate GitHub CLI and template availability
2. **Category Validation**: Ensure category is in allowed list
3. **Duplicate Prevention**:
   - **MANDATORY**: Prompt user to run `/khub` first
   - Show pre-creation checklist
   - Explain common mistakes to avoid
   - Provide correct workflow example

### Knowledge ID Generation
1. **Discovery Phase**:
   - Search for existing `knowledge-{category}` issues
   - Extract existing KNOW-[CATEGORY]-XXX numbers
   - Find highest number in category

2. **ID Generation**:
   - Calculate next sequential number
   - Format with leading zeros (3 digits)
   - Example: KNOW-DEVICE-003

3. **Label Management**:
   - Check if `knowledge-{category}` label exists
   - Create label if missing with appropriate color
   - Apply label to knowledge issue

### Issue Creation Process
1. **Template Processing**:
   - Read `docs/KNOWLEDGE-TEMP.md` template
   - Replace placeholders with generated data
   - `{{KNOWLEDGE_ID}}`, `{{CATEGORY}}`, `{{TOPIC}}`, `{{DATE}}`

2. **GitHub Issue Creation**:
   - Title: `{knowledge-id}: {topic}`
   - Labels: `knowledge`, `knowledge-{category}`
   - Body: Processed template content
   - Repository: Current repository

### Auto-Linking Workflow
1. **Hub Linking Prompt**:
   ```
   🔗 Link to Knowledge Hub #32? (y/n)
   Your choice:
   ```

2. **Response Handling**:
   - **Yes**: Automatically run `/klink [issue-number]`
   - **No**: Skip linking, provide manual linking instructions
   - **Error**: Show manual linking alternative

## Usage

```bash
/kupdate device 'CU12 lock-back solution'
/kupdate database 'SQLite migration performance fix'
/kupdate debug 'Actix-web async deadlock resolution'
/kupdate workflow 'Git branch cleanup automation'
```

## Template Structure

Uses `docs/KNOWLEDGE-TEMP.md` which includes sections:
- **Problem Statement** - Clear description of what was solved
- **Solution Implementation** - Step-by-step working solution
- **AI Honest Feedback** - What worked, what didn't, lessons learned
- **Things to Avoid** - Common pitfalls and their consequences
- **Prerequisites** - What to check before starting
- **AI Self-Improvement** - Insights for future problem-solving
- **Links & References** - Connections to source issues/PRs/code
- **Verification Status** - Testing and validation state

## Duplicate Prevention System

### Critical Pre-Creation Checklist
1. **ALWAYS run `/khub` first** - Read Knowledge Hub #32 completely
2. **Check existing numbers** in your category section
3. **Identify next available number** (if 001, 002 exist, use 003)
4. **Never assume** - always verify existing entries before creating

### Common Mistakes to Avoid
- ❌ Creating KNOW-DEVICE-001 when it already exists
- ❌ Not checking Knowledge Hub #32 before creating entries
- ❌ Assuming numbers without verification
- ❌ Creating duplicate knowledge IDs

### Correct Workflow Example
```bash
# ❌ WRONG (creates duplicate)
/kupdate device "SHT30 sensor fix"  # Creates KNOW-DEVICE-001 (duplicate!)

# ✅ RIGHT (prevents duplicates)
/khub                              # Read Knowledge Hub #32
# See: KNOW-DEVICE-001, KNOW-DEVICE-002 exist
/kupdate device "SHT30 sensor fix" # Creates KNOW-DEVICE-003 (correct!)
```

## Knowledge ID Format

### Structure
```
KNOW-[CATEGORY]-[NUMBER]
```

### Examples
- `KNOW-DEVICE-001` - First device-related knowledge
- `KNOW-DATABASE-015` - Fifteenth database-related knowledge
- `KNOW-DEBUG-003` - Third debugging-related knowledge

### Numbering Rules
- **Sequential**: Numbers increment within each category
- **Zero-padded**: Always 3 digits (001, 002, 003)
- **Category-specific**: Each category has its own numbering sequence
- **Persistent**: Numbers never reset or reuse

## Auto-Label Creation

### Label Generation Process
```bash
# When /kupdate device "CU12 lock-back solution" is used:
# 1. Check if 'knowledge-device' label exists
# 2. If not, create: gh label create knowledge-device --color "1d76db" --description "Device integration knowledge"
# 3. Apply label to knowledge issue
# 4. Auto-generate Knowledge ID: KNOW-DEVICE-001
```

### Label Colors and Descriptions
- `knowledge-device` - Device integration knowledge (blue)
- `knowledge-database` - Database and persistence knowledge (green)
- `knowledge-architecture` - System design and patterns (purple)
- `knowledge-debug` - Debugging and troubleshooting (red)
- `knowledge-workflow` - Development workflow improvements (orange)

## Error Handling

### Validation Errors
- **Invalid category**: Show valid categories list with examples
- **Template missing**: Error with template file path and creation instructions
- **GitHub CLI missing**: Installation instructions and setup guidance
- **Issue creation failure**: Retry with detailed error information

### Duplicate Prevention Errors
- **Hub not checked**: Strong warning about running `/khub` first
- **Duplicate ID detected**: Stop creation and show existing entries
- **Category conflicts**: Provide guidance on correct category selection

## Integration Points

### Required Pre-Integration
- **Before**: `/khub` (MANDATORY) to check existing entries
- **After**: `/klink` to connect entry to Knowledge Hub

### Related Commands
- `/ksearch` - Find entries across knowledge base
- `/kcategory` - Browse knowledge by category
- `/krecent` - Show recent knowledge entries
- `/ksync` - Synchronize Knowledge Hub with all entries

### Workflow Integration
- **Context Creation**: Use after solving technical problems
- **Implementation Learning**: Document lessons learned from tasks
- **Knowledge Capture**: Capture insights from discussions and debugging

## Files

- `docs/KNOWLEDGE-TEMP.md` - Knowledge issue template
- GitHub Issues - Individual knowledge entries
- GitHub Labels - Category organization
- Knowledge Hub #32 - Central knowledge index

## Best Practices

### Creating Effective Knowledge Entries
1. **Clear Problem Statements**: Describe what was solved with specific context
2. **Step-by-Step Solutions**: Include exact working solutions
3. **Honest AI Feedback**: Document what worked and what didn't
4. **Practical Avoidance**: List common pitfalls and consequences
5. **Cross-References**: Link to related issues, PRs, and code

### Category Selection
1. **Primary Focus**: Choose category based on main problem domain
2. **Multi-Domain**: Use most relevant category for complex issues
3. **Consistency**: Maintain category consistency across similar issues
4. **Searchability**: Consider how others might find this knowledge

### Duplicate Prevention
1. **Always Check Hub**: Run `/khub` before any `/kupdate`
2. **Verify Numbers**: Check existing entries in your category
3. **Avoid Assumptions**: Never assume numbers without verification
4. **Use Examples**: Follow provided workflow examples

## Knowledge Structure Examples

### Device Knowledge Entry
```
KNOW-DEVICE-003: SHT30 Sensor I2C Communication Fix

Problem: SHT30 temperature/humidity sensor not responding on I2C bus
Solution: Fixed I2C address conflict and added proper pull-up resistors
Lessons: Always check I2C address conflicts in multi-sensor setups
```

### Database Knowledge Entry
```
KNOW-DATABASE-015: SQLite Migration Performance Optimization

Problem: Database migrations taking 30+ minutes on large datasets
Solution: Implemented incremental migrations with batch processing
Lessons: Always test migrations on realistic data sizes
```

## Usage Patterns

### After Problem Solving
```bash
# After debugging and fixing an issue
/kupdate debug "Authentication timeout resolution in LINE OAuth"

# After implementing a new feature
/kupdate architecture "Microservices communication pattern implementation"

# After learning a new technique
/kupdate workflow "Automated testing pipeline setup with GitHub Actions"
```

### Knowledge Discovery
```bash
/ksearch "I2C communication"          # Find all I2C-related knowledge
/kcategory device                    # Browse device knowledge
/krecent                             # Show last 5 knowledge entries
/khub                                # Read complete Knowledge Hub
```