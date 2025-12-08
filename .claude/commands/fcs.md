# fcs

Context Management - Create and manage context discussions for iterative development planning.

## Usage

```
/fcs [topic-name]    # Create new context issue
/fcs list           # Show all active context issues
```

## Examples

```bash
/fcs payment-system              # Create context for payment system discussion
/fcs user-authentication         # Create context for auth flow discussion
/fcs list                        # Show all active context issues
```

## Implementation

When creating a new context issue:

1. **Validate GitHub CLI**: Ensure `gh` command is available
2. **Check template**: Verify `docs/ISSUE-TEMP.md` exists
3. **Setup .tmp folder**: `mkdir -p .tmp && echo ".tmp/" >> .gitignore`
4. **Create temporary content**:
   - Generate issue body in `.tmp/context-content.md`
   - Replace placeholders: `{{TOPIC}}`, `{{DATE}}`, `{{MODE}}`
5. **Create GitHub Issue**:
   - Title: `[CONTEXT] {topic-name}`
   - Labels: `context`
   - Body: Use `--body-file .tmp/context-content.md`
6. **Cleanup temporary files**: `rm .tmp/context-content.md`
7. **Display results**: Show issue URL and next steps

When listing active contexts:

1. **Search GitHub Issues**: Find all issues with `context` label
2. **Display list**: Show issue numbers and topics
3. **Provide guidance**: Suggest next actions

## Template Integration

Uses `docs/ISSUE-TEMP.md` template which contains:
- DISCUSSION LOG section for iterative updates
- ACCUMULATED CONTEXT section for key decisions
- PLANNING READINESS CHECKLIST for validation

## Files

- `docs/ISSUE-TEMP.md` - Context issue template
- GitHub Issues - Stores context discussions

## Integration

This command integrates with:
- `/plan` - Context should reach `[Ready for Planning]` status before planning
- `/mode` - Current mode included in context creation
- Workflow system - Context is Phase 1 of development workflow

## Context Status Flow

1. **Created** - Initial context issue created
2. **Discussion** - Iterative updates via `/fcs [topic]`
3. **Ready for Planning** - Context ready for task creation
4. **Implementation Ready** - Context ready for implementation

## Notes

- Always creates GitHub Issues (NEVER local .md files)
- Context issues are living documents for discussion
- Use existing context issue when adding to topics
- Context must be ready before creating tasks with `/plan`