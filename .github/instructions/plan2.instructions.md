---
applyTo: '**'
---

# plan2

Rapid Task Planning - Create tasks quickly with complexity validation using same template as `/plan`.

## Usage

```
/plan2 [task description]          # Create task with complexity check
/plan2 [task description] --force  # Force creation even if complex
```

**Note**: This is a Claude Code slash command using `/` prefix. Uses `docs/TASK-ISSUE-TEMP.md` template for consistency with `/plan`.

## Examples

```bash
/plan2 fix button color issue                 # Simple task
/plan2 add loading spinner                    # Component creation
/plan2 fix typo in README.md                  # Text fix
/plan2 implement user authentication --force   # Force complex task
```

## Implementation

### Complexity Validation (5-10 seconds)

1. **Setup .tmp folder**: `mkdir -p .tmp && echo ".tmp/" >> .gitignore`

2. **Quick Complexity Analysis**:
   ```javascript
   const complexityRules = [
     { keywords: ['authentication', 'security', 'password', 'token'],
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
   - **Complex Task** → Show warning and stop execution
   - **Force Override** → `--force` flag bypasses complexity check

### Task Creation

4. **Generate Task Content**:
   - Use `docs/TASK-ISSUE-TEMP.md` template (same as `/plan`)
   - Add `IS_RAPID_TASK: true` flag
   - Simplify test requirements while maintaining TDD principles
   - Add rapid mode specific sections

5. **Create GitHub Issue**:
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

6. **Cleanup temporary files**: Always clean .tmp folder immediately after use

### Template Integration

**Same Template as `/plan`:**
- Uses `docs/TASK-ISSUE-TEMP.md` for consistency
- **Rapid Mode Adaptation**: Template includes conditional sections
- **Shared Convention**: All tasks follow same standards

**Rapid Mode Template Features:**
- Simplified test requirements (essential coverage only)
- Basic validation checklist (core functionality)
- Focus on speed over extensive documentation
- Maintains TDD principles but streamlined

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

### Mode-Based Assignment

**Same Mode System as `/plan`:**
- **MANUAL Mode**: Tasks assigned to human developer
- **COPILOT Mode**: Tasks assigned to @copilot
- **Labels**: `task-rapid` + `{mode}-assignment`

### Workflow Integration

**Seamless Integration with Existing Workflow:**
- Uses same template system as `/plan`
- Same `/impl` workflow for implementation
- Same `/pr` workflow for pull requests
- Same validation requirements (simplified for rapid mode)

**Workflow Compatibility:**
```bash
# Rapid planning
/plan2 "add loading button"

# Same implementation workflow
/impl 156  # Uses identical implementation process

# Same PR workflow
/pr "Ready for review"
```

### Files

- `docs/TASK-ISSUE-TEMP.md` - Shared task template (used by both /plan and /plan2)
- `.claude/utils/rapid-planner.js` - /plan2 implementation
- `.github/instructions/plan2.instructions.md` - This documentation
- GitHub Issues - Stores both regular and rapid tasks with `task-rapid` labels

### Integration with Other Commands

- **Prerequisite**: Use `/init` to set up project workflow (MANDATORY first step)
- **Context**: Use `/fcs` for context discussions before planning
- **Before**: Use `/plan2` for simple tasks, `/plan` for complex tasks
- **After**: Use `/impl [issue-number]` for implementation
- **Final**: Use `/pr [feedback]` for pull request creation

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