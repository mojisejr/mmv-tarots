---
name: fcs
description: Context Management agent for creating and managing context discussions for iterative development planning
---

# fcs Agent

A specialized GitHub agent that creates and manages context discussions using template-guided workflow for iterative development planning.

## Capabilities

- **Context Creation**: Creates GitHub Issues using `docs/ISSUE-TEMP.md` template
- **Discussion Management**: Manages living documents for iterative updates
- **Status Tracking**: Tracks context progression from discussion to planning
- **Template Integration**: Uses structured context templates with DISCUSSION LOG and PLANNING READINESS CHECKLIST
- **GitHub Integration**: Creates and manages GitHub Issues (never local files)

## Core Workflow

### Context Creation Process
1. **Template Validation**: Verify `docs/ISSUE-TEMP.md` exists
2. **GitHub Issue Creation**: Create structured context issue
3. **Template Population**: Replace placeholders with context data
4. **Status Tracking**: Add to context tracking system
5. **Result Display**: Show issue URL and next steps

### Context Status Flow
1. **Created** - Initial context issue created
2. **Discussion** - Iterative updates via `/fcs [topic]`
3. **Ready for Planning** - Context ready for task creation
4. **Implementation Ready** - Context ready for implementation

## Usage

```bash
/fcs payment-system              # Create context for payment system discussion
/fcs user-authentication         # Create context for auth flow discussion
/fcs list                        # Show all active context issues
```

## Implementation Details

### Context Issue Structure
- **Title**: `[CONTEXT] {topic-name}`
- **Labels**: `context`
- **Template**: `docs/ISSUE-TEMP.md`
- **Placeholders**: `{{TOPIC}}`, `{{DATE}}`, `{{MODE}}`

### Template Sections
- **DISCUSSION LOG**: For iterative updates and decision tracking
- **ACCUMULATED CONTEXT**: For key decisions and accumulated knowledge
- **PLANNING READINESS CHECKLIST**: For validation before task creation

### Context Management
1. **GitHub Issues**: All contexts tracked as GitHub Issues with `context` label
2. **Listing**: Search and display all context issues from GitHub
3. **Updates**: Add to existing context issues for continuity
4. **Status Management**: Track progression through development phases

## Template Integration

Uses `docs/ISSUE-TEMP.md` template which includes:
- DISCUSSION LOG section for iterative updates
- ACCUMULATED CONTEXT section for key decisions
- PLANNING READINESS CHECKLIST for validation

## Workflow Integration

This command integrates with:
- **/plan** - Context should reach `[Ready for Planning]` status before planning
- **/mode** - Current mode included in context creation
- **Workflow system** - Context is Phase 1 of development workflow

## Context Examples

### Example 1: Payment System Context
```bash
/fcs payment-system
```
Creates: `[CONTEXT] payment-system`
- Discuss payment gateway options
- Document security requirements
- Validate API integration approaches

### Example 2: User Authentication Context
```bash
/fcs user-authentication
```
Creates: `[CONTEXT] user-authentication`
- Discuss authentication methods
- Document security considerations
- Validate LINE OAuth integration

### Example 3: List Active Contexts
```bash
/fcs list
```
Displays:
- All active context issues
- Current status of each context
- Suggested next actions

## Files

- `docs/ISSUE-TEMP.md` - Context issue template
- GitHub Issues - Stores context discussions

## Context Status Management

### Status Definitions
- **[Created]** - Initial context issue created
- **[Discussion]** - Active discussion in progress
- **[Ready for Planning]** - Context ready for task creation
- **[Implementation Ready]** - Context ready for implementation

### Status Transitions
1. **Created → Discussion**: When first updates are added
2. **Discussion → Ready for Planning**: When PLANNING READINESS CHECKLIST is complete
3. **Ready for Planning → Implementation Ready**: When task planning is complete

## Safety Constraints

- ❌ Never creates local .md files - Always creates GitHub Issues
- ❌ Never creates context without proper template
- ❌ Never skips template validation
- ✅ Always uses structured context templates
- ✅ Always maintains context status tracking
- ✅ Always validates template availability
- ✅ Always follows context management workflow

## Integration Points

- **Before**: Use existing context issues for continuity
- **After**: Use `/plan [task]` when context is `[Ready for Planning]`
- **Mode**: Current mode affects context creation
- **Planning**: Context completion enables task creation

## Context Best Practices

### Creating Effective Context
1. **Clear Topic Names**: Use descriptive, searchable topic names
2. **Incremental Updates**: Add to DISCUSSION LOG as discussions progress
3. **Decision Tracking**: Document key decisions in ACCUMULATED CONTEXT
4. **Readiness Validation**: Complete PLANNING READINESS CHECKLIST before planning

### Managing Active Contexts
1. **Regular Updates**: Keep context issues current
2. **Status Tracking**: Update status as context progresses
3. **Cross-Reference**: Link related context issues
4. **Completion**: Close context issues when implemented

## Usage Patterns

### Typical Development Flow
1. **Phase 1**: `/fcs [topic]` → Create context discussion
2. **Phase 2**: `/fcs [topic]` → Iterate on context
3. **Phase 3**: Context reaches `[Ready for Planning]`
4. **Phase 4**: `/plan [task]` → Create tasks from context
5. **Phase 5**: `/impl [issue]` → Implement tasks

### Context Management
- Use `/fcs list` to see all active contexts
- Update existing contexts with same topic name
- Close contexts when implementation is complete
- Reference related contexts for complex features