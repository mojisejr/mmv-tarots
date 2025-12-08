# plan

Task Planning - Create atomic task GitHub Issues for implementation workflow.

## Usage

```
/plan [task description]
```

## Examples

```bash
/plan Add payment webhook handler for Stripe
/plan Implement user authentication with LINE LIFF
/plan Create referral system with reward tracking
/plan Fix database migration performance issue
```

## Implementation

When creating a task issue:

1. **Check Dependencies**:
   - Validate GitHub CLI (`gh`) availability
   - Verify `docs/TASK-ISSUE-TEMP.md` template exists
   - Get current execution mode from `/mode`

2. **Setup .tmp folder**: `mkdir -p .tmp && echo ".tmp/" >> .gitignore`

3. **Create temporary content**:
   - Generate issue body in `.tmp/task-content.md`
   - Replace placeholders: `{{TASK_DESCRIPTION}}`, `{{EXECUTION_MODE}}`, `{{DATE}}`, `{{ASSIGNEE}}`

4. **Create Task Issue**:
   - Title: `[TASK] {task description}`
   - Labels: `task`, `{mode}-assignment` (manual/copilot)
   - Body: Use `--body-file .tmp/task-content.md`

5. **Cleanup temporary files**: `rm .tmp/task-content.md`

6. **Mode-Based Assignment**:
   - **MANUAL**: Tasks assigned to human developer
   - **COPILOT**: Tasks assigned to @copilot

7. **Display Results**:
   - Show issue URL and number
   - Provide mode-specific next steps
   - List implementation requirements

## Template Integration

Uses `docs/TASK-ISSUE-TEMP.md` template which includes:
- Task description and requirements
- Execution mode assignment
- 100% validation requirements (build, clippy, fmt)
- Implementation workflow steps
- Quality standards checklist

## Mode-Specific Next Steps

### MANUAL Mode
- Human developer will implement the task
- Use `/impl [issue-number]` when ready to implement
- Follow implementation workflow with 100% validation
- Create PR with `/pr [feedback]` after implementation

### COPILOT Mode
- Use `/impl [issue-number]` to trigger automatic implementation
- Copilot handles complete implementation workflow
- Includes PR creation via `/pr` after implementation

## Implementation Requirements

All tasks require 100% validation:
- **Build validation**: `cargo build --release`
- **Clippy validation**: `cargo clippy --all-targets --all-features`
- **Format validation**: `cargo fmt -- --check`
- **Type check validation**: `cargo check`
- **Test validation**: `cargo test` (if applicable)

## Workflow Integration

1. **Context Phase**: Use `/fcs [topic]` to create context discussion
2. **Planning Phase**: Use `/plan [task]` when context is ready
3. **Implementation Phase**: Use `/impl [issue-number]` to execute
4. **Review Phase**: Use `/pr [feedback]` to create pull request

## Files

- `docs/TASK-ISSUE-TEMP.md` - Task issue template
- GitHub Issues - Stores task definitions and requirements
- `.claude/current_mode` - Determines task assignment

## Notes

- Always creates GitHub Issues (NEVER local .md files)
- Tasks are atomic and focused on specific implementation
- Current mode affects task assignment and implementation workflow
- Ensure context is ready before creating tasks