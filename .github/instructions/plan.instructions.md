---
applyTo: '**'
---

# plan

Task Planning - Create atomic task GitHub Issues for implementation workflow.

## Usage

```
/plan [task description]
```

**Note**: This is a Claude Code slash command using `/` prefix. Legacy `=plan` commands are still supported for backward compatibility.

## Examples

```bash
/plan Add payment webhook handler for Stripe
/plan Implement user authentication with LINE LIFF
/plan Create referral system with reward tracking
/plan Fix database migration performance issue
```

## Implementation

When creating a task issue:

### Phase 1: Hallucination Prevention Analysis
1. **Codebase Analysis**:
   - Scan existing components and patterns
   - Check `Cargo.toml` for declared dependencies
   - Verify available technologies and tools
   - Review current architecture and file structure

2. **Context7 Research**:
   - Document chosen technologies with official docs
   - Verify best practices and implementation patterns
   - Validate proposed solutions against documentation

3. **Previous Issue Context Check**:
   - Read all related issues for dependency context
   - Verify sequential task relationships
   - Check that referenced components actually exist/will exist
   - Validate implementation order and prerequisites

4. **Hallucination Prevention Checklist**:
   - ✅ Codebase components analyzed?
   - ✅ Dependencies verified in `Cargo.toml`?
   - ✅ Previous issue context checked?
   - ✅ Technology stack validated?
   - ✅ Implementation patterns reviewed?
   - ✅ File structure existence confirmed?
   - ✅ Sequential dependencies verified?
   - ✅ Context7 documentation consulted?
   - ✅ Assumptions vs reality checked?
   - ✅ MVP-appropriate scope confirmed?

### Phase 2: Task Creation
5. **Check Dependencies**:
   - Validate GitHub CLI (`gh`) availability
   - Verify `docs/TASK-ISSUE-TEMP.md` template exists
   - Get current execution mode from `/mode`

6. **Setup .tmp folder**: `mkdir -p .tmp && echo ".tmp/" >> .gitignore`

7. **Create temporary content**:
   - Generate issue body in `.tmp/task-content.md`
   - Replace placeholders: `{{TASK_DESCRIPTION}}`, `{{EXECUTION_MODE}}`, `{{DATE}}`, `{{ASSIGNEE}}`
   - Include validated context and verified dependencies

8. **Create Task Issue**:
   - Title: `[TASK] {task description}`
   - Labels: `task`, `{mode}-assignment` (manual/copilot)
   - Body: Use `--body-file .tmp/task-content.md`

9. **Cleanup temporary files**: `rm .tmp/task-content.md`

10. **Mode-Based Assignment**:
    - **MANUAL**: Tasks assigned to human developer
    - **COPILOT**: Tasks assigned to @copilot

11. **Display Results**:
    - Show issue URL and number
    - Provide mode-specific next steps
    - List implementation requirements
    - **Enhanced**: Show validation context and verified dependencies

## Template Integration

Uses `docs/TASK-ISSUE-TEMP.md` template which includes:
- Task description and requirements
- Execution mode assignment
- 100% validation requirements (build, lint, type-check)
- Implementation workflow steps
- Quality standards checklist
- **NEW**: Test-first requirements and test specifications

## 🧪 TEST-FIRST REQUIREMENTS (MANDATORY)

All task planning must include explicit test-first requirements:

### Test Specification Template
```markdown
### 🧪 TEST-FIRST REQUIREMENTS (MANDATORY)
**Tests to write BEFORE code implementation:**
- [ ] Unit test: [test name] - [what should pass]
- [ ] Integration test: [test name] - [API/service behavior]
- [ ] Edge case test: [test name] - [boundary condition]

**Test Acceptance Criteria:**
- Tests must fail initially (Red phase)
- Tests document expected behavior
- All tests pass after implementation (Green phase)
- Code is refactored while tests remain passing (Refactor phase)
```

### Examples with Test-First Planning

**Before (No Test-First):**
```bash
/plan Add authentication module
```

**After (Test-First Integrated):**
```bash
/plan Add authentication module with unit tests for auth validation and integration tests for API endpoints
```

**Full Example Task Description:**
```markdown
### 🎯 SINGLE OBJECTIVE
- Implement question filter agent that validates tarot questions before processing

### 🧪 TEST-FIRST REQUIREMENTS (MANDATORY)
Tests to write BEFORE code implementation:
- [ ] Unit test: `test_empty_question_rejected` - empty questions should return FilterError::EmptyQuestion
- [ ] Unit test: `test_valid_question_accepted` - valid questions should pass validation
- [ ] Unit test: `test_whitespace_trimming` - questions with only whitespace should be rejected
- [ ] Integration test: `test_api_endpoint_validation` - POST /api/tarot validates question before processing
- [ ] Edge case test: `test_special_characters_thai` - Thai characters should be accepted

**Test Acceptance Criteria:**
- [ ] All tests fail initially (Red phase - before implementation)
- [ ] Tests pass after implementation (Green phase)
- [ ] Code is refactored for quality while tests remain passing (Refactor phase)
```

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

All tasks require 100% validation (Rust/Cargo project):
- **Build validation**: `cargo build --release`
- **Lint validation**: `cargo clippy -- -D warnings`
- **Format validation**: `cargo fmt -- --check`
- **Type check validation**: `cargo check`
- **Test validation**: `cargo test` (if available)

### Test-First Requirements
- All tasks MUST specify which tests need to be written first
- Test case specification is part of task description
- Tests must be written BEFORE code implementation (Red phase)
- Test coverage must be comprehensive for new/modified code

### Enhanced Validation Context
- **Dependencies verified**: Based on actual `Cargo.toml` analysis
- **Components confirmed**: Referenced components exist in codebase
- **Patterns validated**: Follow established codebase patterns
- **Scope realistic**: MVP-appropriate implementation requirements
- **Test-First**: Tests written before code implementation

## Workflow Integration

1. **Initialization Phase**: Use `/init` to set up project workflow (MANDATORY first step)
2. **Context Phase**: Use `/fcs [topic]` to create context discussion
3. **Planning Phase**: Use `/plan [task]` when context is ready
4. **Implementation Phase**: Use `/impl [issue-number]` to execute
5. **Review Phase**: Use `/pr [feedback]` to create pull request

## Files

- `docs/TASK-ISSUE-TEMP.md` - Task issue template
- GitHub Issues - Stores task definitions and requirements
- `.claude/current_mode` - Determines task assignment

## Notes

- Always creates GitHub Issues (NEVER local .md files)
- Tasks are atomic and focused on specific implementation
- Current mode affects task assignment and implementation workflow
- Ensure context is ready before creating tasks
- **TEST-FIRST MANDATORY**: All tasks must include explicit test-first requirements
- Tests must be written BEFORE code implementation
- Test coverage is mandatory, not optional

### Hallucination Prevention Features
- **Reality-based planning**: All requirements validated against actual codebase
- **Dependency verification**: Components and libraries verified before task creation
- **Sequential validation**: Previous issue context checked for continuity
- **Pattern compliance**: Tasks follow existing codebase architecture and patterns
- **Scope realism**: MVP-appropriate requirements based on project maturity
- **Test-First Approach**: All tasks require explicit test-first specifications

### Alternative: Rapid Planning

For simple tasks, consider using `/plan2` instead:
- **Faster creation**: Quick complexity validation (5-10 seconds)
- **Same template**: Uses identical `docs/TASK-ISSUE-TEMP.md` template
- **Simplified workflow**: Basic validation, essential testing only
- **Auto-protection**: Stops complex tasks with clear warnings
- **Force option**: `--force` available when absolutely necessary

Use `/plan2` for bug fixes, small UI changes, and simple improvements.
Use `/plan` for complex features requiring detailed analysis.