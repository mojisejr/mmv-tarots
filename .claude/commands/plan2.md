# plan2

Rapid Task Planning - Create tasks quickly with complexity validation. Uses the same template as `/plan` but in rapid mode for faster iteration.

## Usage

```
/plan2 [task description]          # Create task with complexity check
/plan2 [task description] --force  # Force creation even if complex
```

**Note**: This is a Claude Code slash command using `/` prefix. Uses `docs/TASK-ISSUE-TEMP.md` template for consistency.

## Examples

```bash
/plan2 fix button color issue                 # Quick task
/plan2 add loading spinner                    # Simple component
/plan2 fix typo in README.md                  # Small fix
/plan2 implement user authentication --force   # Force complex task
```

## Implementation

The `/plan2` command uses the same `docs/TASK-ISSUE-TEMP.md` template as `/plan` but operates in "rapid mode" with additional complexity validation.

### Quick Complexity Analysis

1. **Setup .tmp folder**: `mkdir -p .tmp && echo ".tmp/" >> .gitignore`

2. **Complexity Check** (5-10 seconds max):
   ```javascript
   const complexityRules = [
     { keywords: ['authentication', 'security', 'password', 'token', 'jwt'],
       reason: 'Security-critical features need detailed planning' },
     { keywords: ['database', 'migration', 'schema', 'sql'],
       reason: 'Database changes need careful analysis' },
     { keywords: ['api', 'endpoint', 'rest', 'graphql'],
       reason: 'API design needs comprehensive planning' },
     { keywords: ['payment', 'stripe', 'transaction', 'billing'],
       reason: 'Payment processing requires detailed planning' },
     { keywords: ['architecture', 'system', 'infrastructure'],
       reason: 'System architecture changes need thorough planning' }
   ];
   ```

3. **Decision Logic**:
   - **Simple Task** → Create task with `task-rapid` label
   - **Complex Task** → Show warning and stop
   - **Force Override** → `--force` flag bypasses complexity check

### Rapid Task Creation

1. **Generate Task Body**:
   - Use `docs/TASK-ISSUE-TEMP.md` template
   - Add `IS_RAPID_TASK: true` flag
   - Include rapid mode notes
   - Simplify test requirements (but keep TDD principles)

2. **Create GitHub Issue**:
   ```bash
   # Create temporary content in .tmp folder
   echo "Task content" > .tmp/rapid-task-content.md

   # Create issue with rapid label
   gh issue create \
     --title "[TASK-RAPID] ${taskDescription}" \
     --label "task-rapid" \
     --label "{mode}-assignment" \
     --body-file .tmp/rapid-task-content.md

   # Cleanup
   rm .tmp/rapid-task-content.md
   ```

3. **Cleanup temporary files**: Always clean .tmp folder immediately

### Template Integration

**Uses the same template as `/plan**:**
- `docs/TASK-ISSUE-TEMP.md` - Main task template
- **Rapid Mode Adaptation**: Template includes conditional sections for rapid vs detailed mode

**Rapid Mode Features in Template:**
- Simplified test requirements
- Basic validation checklist
- Focus on core functionality
- Minimal documentation overhead

### Complexity Rules (Auto-Stop)

#### 🟢 **Safe for Rapid Planning:**
- Bug fixes: `fix`, `bug`, `error`, `issue`
- Small UI changes: `add button`, `update style`, `change color`
- Simple components: `create component`, `add validation`
- Quick improvements: `optimize function`, `refactor small`
- Text updates: `fix typo`, `update documentation`

#### 🔴 **Too Complex for Rapid (Auto-Stop):**
- **Security**: `authentication`, `authorization`, `security`, `password`
- **Database**: `database`, `migration`, `schema`, `sql`, `query`
- **API**: `api`, `endpoint`, `rest`, `graphql`, `webhook`
- **Payment**: `payment`, `stripe`, `transaction`, `billing`
- **Architecture**: `architecture`, `system`, `infrastructure`, `design`

### User Experience Examples

#### **Case 1: Simple Task (Proceeds)**
```bash
/plan2 fix button color issue

# Output:
✅ Task safe for rapid planning
Creating issue: #156 [TASK-RAPID] Fix button color issue
🚀 Ready for implementation with /impl 156
```

#### **Case 2: Complex Task (Auto-Stop with Warning)**
```bash
/plan2 implement user authentication

# Output:
⚠️  Task too complex for /plan2: Security-critical features need detailed planning
💡 Use /plan "implement user authentication" instead
💡 Or force with: /plan2 "implement user authentication" --force
```

#### **Case 3: Force Override**
```bash
/plan2 implement user authentication --force

# Output:
🔒 Forcing rapid planning (not recommended)
Creating issue: #157 [TASK-RAPID] Implement user authentication
⚠️  Consider using /plan next time for security features
```

### Template Content for Rapid Mode

The `docs/TASK-ISSUE-TEMP.md` template includes conditional sections:

```markdown
## 🚀 TASK MODE: RAPID
**Current Mode: RAPID**
- Focus on speed and core functionality
- Basic validation and testing
- Minimal documentation overhead

### 🧪 TEST-FIRST REQUIREMENTS (RAPID MODE)
**Essential tests only (focus on core functionality):**
- [ ] Core function test: Main functionality works
- [ ] Basic error handling test: Edge cases covered
- [ ] Integration test: Connects properly to existing system

**Rapid Test Acceptance Criteria:**
- [ ] Tests fail initially (Red phase)
- [ ] Core functionality passes (Green phase)
- [ ] Basic refactoring completed (Refactor phase)
- [ ] Focus on essential scenarios only

### ✅ ACCEPTANCE CRITERIA (RAPID MODE - BASIC)
- [ ] Build command passes ([build command]) - Basic validation
- [ ] Lint command passes with critical fixes only ([lint command])
- [ ] Core tests pass ([test command]) - Essential coverage
- [ ] Basic functionality works end-to-end
- [ ] No critical errors or regressions

**Rapid Mode Notes:**
- Focus on delivering core functionality quickly
- Skip extensive documentation and edge case handling
- Essential testing only (comprehensive testing optional)
- Follow project patterns but prioritize speed
```

### Mode-Based Assignment

**Rapid tasks follow the same mode system:**
- **MANUAL Mode**: Rapid tasks assigned to human developer
- **COPILOT Mode**: Rapid tasks assigned to @copilot
- **Labels**: `task-rapid` + `{mode}-assignment`

### Integration with Existing Workflow

**Seamless integration:**
- Uses same template system as `/plan`
- Same `/impl` workflow for implementation
- Same `/pr` workflow for pull requests
- Same validation requirements (but simplified for rapid mode)

**Workflow Compatibility:**
```bash
# Rapid planning
/plan2 "add loading button"

# Same implementation workflow
/impl 156  # Uses same implementation process

# Same PR workflow
/pr "Ready for review"
```

### Files

- `docs/TASK-ISSUE-TEMP.md` - Shared task template (used by both /plan and /plan2)
- `.claude/utils/rapid-planner.js` - /plan2 implementation
- `.claude/commands/plan2.md` - Command documentation
- GitHub Issues - Stores both regular and rapid tasks with different labels

### Error Handling

**Complexity Override Protection:**
- Always warns before allowing complex tasks
- Recommends `/plan` for complex features
- `--force` flag available for experienced developers
- Logs force usage for team awareness

**Template Validation:**
- Verifies `docs/TASK-ISSUE-TEMP.md` exists
- Validates placeholder replacement
- Ensures rapid mode sections are properly generated

### Notes

- **Same Convention**: Uses identical template and workflow as `/plan`
- **Rapid Label**: Tasks labeled with `task-rapid` for easy identification
- **Safety First**: Auto-stops on complex tasks with clear warnings
- **Force Option**: Available but discouraged for complex features
- **Template Consistency**: Ensures all tasks follow same standards regardless of planning method