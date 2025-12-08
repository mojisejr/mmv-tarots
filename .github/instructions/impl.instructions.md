---
applyTo: '**'
---

# impl

Implementation Workflow - Execute GitHub issue implementation based on current mode.

## Usage

```
/impl [issue-number] [optional message]
```

**Note**: This is a Claude Code slash command using `/` prefix. Legacy `=impl` commands are still supported for backward compatibility.

## Examples

```bash
/impl 123                    # Implement issue #123
/impl 123 with extra context # Implement with additional context
/impl 456                    # Implement issue #456
```

## Language & Response Policy

- **User asks in Thai** → Respond in Thai (ยกเว้น technical terms)
- **User asks in English** → Respond in English
- **Mixed language** → Follow the primary language
- **Technical terms** → Always use English (Rust, Cargo, etc.)

## Implementation

### Pre-Implementation Validation

1. **Setup .tmp folder**: `mkdir -p .tmp && echo ".tmp/" >> .gitignore`

2. **Check Dependencies**:
   - Validate GitHub CLI (`gh`) availability
   - Verify Git tools are available

3. **Validate Issue**:
   - Check issue exists and is open
   - Verify issue has `task` label
   - Extract issue title and metadata to `.tmp/issue-details.md`

4. **Validate Environment**:
   - Ensure clean git working directory
   - Verify we're in a git repository

5. **Cleanup temporary files**: `rm .tmp/issue-details.md` (only if no other temp files exist)

### Implementation Steps

1. **Sync Staging Branch**:
   ```bash
   git checkout staging
   git pull origin staging
   ```

2. **Create Feature Branch**:
   ```bash
   git checkout -b feature/task-[issue-number]-[description]
   ```
   - Extract description from issue title
   - Use naming convention: `feature/task-{issue}-{description}`

3. **Step 0: Write Tests First (Red Phase)** ⚠️ MANDATORY:
   ```bash
   # Create test files BEFORE implementing code
   # Tests should fail initially (Red phase)
   [test command]  # e.g., npm test, cargo test, pytest
   # Expected: Tests fail (no implementation yet)
   ```
   - Write comprehensive unit tests for the new functionality
   - Write integration tests for API endpoints or service integrations
   - Tests document the expected behavior before code exists
   - This ensures Test-Driven Development (TDD) workflow

4. **Mode-Specific Execution**:

   **MANUAL Mode**:
   - Agent (Claude) implements directly using code editing tools
   - Execute all implementation steps automatically
   - Handle all validation requirements
   - Create commit with proper format
   - Push branch to remote (NO PR creation)

   **COPILOT Mode**:
   - GitHub Copilot handles implementation automatically
   - Execute all validation steps
   - Create commit with proper format
   - Push branch to remote (NO PR creation)

5. **Validation Requirements** (100% required):
   ```bash
   ✅ Test must be written BEFORE code implementation (Red Phase)
   ✅ Test coverage must be comprehensive for new/modified code
   ✅ Tests must PASS (Green Phase complete)
   [build command]     # Build validation (e.g., npm run build, cargo build --release)
   [lint command]      # Lint validation (e.g., npm run lint, cargo clippy -- -D warnings)
   [format command]    # Format validation (e.g., prettier --check, cargo fmt -- --check)
   [typecheck command] # Type check validation (e.g., tsc --noEmit, cargo check)
   [test command]      # Test validation (MANDATORY)
   ```

6. **Commit Format**:
   ```bash
   git commit -m "feat: [feature description]

   - Address #[issue-number]: [task title]
   - Test-first implemented: Tests written before code implementation
   - Red-Green-Refactor cycle followed (Red → Green → Refactor)
   - Build validation: 100% PASS ([build command])
   - Lint validation: 100% PASS ([lint command])
   - Format validation: 100% PASS ([format command])
   - Type validation: 100% PASS ([typecheck command])

   🤖 Generated with Claude Code
   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

## 🔴🟢🔵 Red-Green-Refactor Cycle (TDD)

The Red-Green-Refactor cycle is the core of Test-Driven Development:

### 🔴 Red Phase (Tests First)
- **Write failing tests** for the functionality you want to implement
- Tests document the expected behavior
- Run tests: `[test command]` → tests FAIL (because code doesn't exist yet)
- Examples (adapt to your language):
  - **JavaScript/TypeScript**: Write test file using Jest/Vitest
  - **Python**: Write test file using pytest
  - **Rust**: Write test file in tests/ directory
  - **Go**: Write test file using testing package

### 🟢 Green Phase (Minimal Implementation)
- **Write minimal code** to make the failing tests pass
- Don't implement extra features yet
- Focus only on passing the tests you wrote
- Run tests: `[test command]` → tests PASS

### 🔵 Refactor Phase (Improve Code)
- **Refactor the code** for clarity, performance, and maintainability
- Keep tests passing while improving code quality
- Run tests: `[test command]` → tests still PASS
- Run linter: `[lint command]` → zero warnings/errors
- Run formatter: `[format command]` → consistent style

### Complete TDD Workflow Example
```bash
# Step 1: RED - Create failing tests
# Write comprehensive test file for new functionality
[test command]                              # → FAILS (no implementation)

# Step 2: GREEN - Implement minimal code
# Write minimal code to make tests pass
[test command]                              # → PASSES
[build command]                             # → Success

# Step 3: REFACTOR - Improve code quality
# Improve implementation while keeping tests passing
[lint command]                              # → Zero warnings
[format command]                            # → Formatted
[test command]                              # → Still PASSES

# Final validation
[build command]                             # ✅ 100% SUCCESS
[lint command]                              # ✅ 100% SUCCESS
[test command]                              # ✅ 100% SUCCESS
```

**Language-Specific Examples**:
- **Node.js**: `npm test`, `npm run build`, `npm run lint`, `prettier --check`
- **Python**: `pytest`, `python -m build`, `ruff check`, `black --check`
- **Rust**: `cargo test`, `cargo build --release`, `cargo clippy`, `cargo fmt`
- **Go**: `go test ./...`, `go build ./...`, `golangci-lint run`, `gofmt -d`

## Mode-Specific Behavior

### MANUAL Mode

**Agent (Claude) Execution**:
- Read and analyze task requirements from GitHub issue
- Implement code changes directly using editing tools (Read/Edit/Write)
- Run all validation steps automatically (build, lint, type-check)
- Create commit with proper format and push to feature branch
- **NO PR creation** - ends with branch push

### COPILOT Mode

**GitHub Copilot Execution**:
- Trigger GitHub Copilot to handle implementation workflow
- Monitor all validation steps completion
- Ensure proper commit formatting and branch push
- **NO PR creation** - ends with branch push

## Error Handling

- **Issue not found**: Clear error with issue number
- **Invalid environment**: Git status and directory checks
- **Validation failures**: Stop workflow and report errors
- **Mode-specific**: Provide appropriate guidance per mode

## Integration

- **Prerequisite**: Use `/init` to set up project workflow (MANDATORY first step)
- **Before**: Use `/plan [task]` OR `/plan2 [task]` to create task issues
- **After**: Use `/pr [feedback]` to create pull request
- **Mode**: Use `/mode [manual|copilot]` to set execution mode
- **Context**: Use `/fcs [topic]` for context discussions

## Files

- Feature branches: `feature/task-{issue}-{description}`
- `.claude/current_mode` - Determines execution behavior
- GitHub Issues - Task definitions and requirements

## Notes

- Always works from staging branch as base
- Feature branch naming is strictly enforced
- 100% validation is mandatory before commits
- Mode affects who performs implementation steps
- Never merge PRs yourself - wait for team approval