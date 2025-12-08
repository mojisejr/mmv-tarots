---
applyTo: '**'
---

# pr

Pull Request Creation - Create Pull Request from feature branch to staging.

## Usage

```
/pr [optional feedback]
```

**Note**: This is a Claude Code slash command using `/` prefix. Legacy `=pr` commands are still supported for backward compatibility.

## Examples

```bash
/pr                           # Create PR without additional feedback
/pr Ready for review          # Create PR with feedback message
/pr Implements user auth flow # Create PR with description
```

## Implementation

### Pre-PR Validation

1. **Setup .tmp folder**: `mkdir -p .tmp && echo ".tmp/" >> .gitignore`

2. **Check Dependencies**:
   - Validate GitHub CLI (`gh`) availability
   - Verify Git tools are available

3. **Validate Environment**:
   - Ensure clean git working directory
   - Verify we're on a feature branch
   - Check branch follows naming: `feature/task-{issue}-{description}`
   - Confirm branch is pushed to remote
   - Verify staging branch exists

4. **Extract Issue Information**:
   - Parse issue number from branch name
   - Validate issue exists and is a task
   - Get issue title and description to `.tmp/issue-info.md`

5. **Create PR Body Template**:
   - Generate PR body content in `.tmp/pr-body.md`
   - Include all validation results and issue information

6. **Create Pull Request**:
   - Use `--body-file .tmp/pr-body.md` for PR creation

7. **Cleanup temporary files**: `rm .tmp/issue-info.md .tmp/pr-body.md`

### Pre-PR Validations (100% Required)

```bash
[build command]     # Build validation (e.g., npm run build, cargo build --release)
[lint command]      # Lint validation (e.g., npm run lint, cargo clippy)
[format command]    # Format validation (e.g., prettier --check, cargo fmt)
[typecheck command] # Type check validation (e.g., tsc --noEmit, cargo check)
[test command]      # Test validation (MANDATORY)
```

### PR Creation

1. **Generate PR Title**:
   ```
   feat: {clean task title} (resolve #{issue-number})
   ```

2. **Create PR Body** with sections:
   - **Summary**: Task description and resolution
   - **Changes**: Implementation checklist
   - **Validation**: All validation results
   - **Test Plan**: Testing checklist
   - **Additional Notes**: User feedback (if provided)

3. **Create Pull Request**:
   ```bash
   gh pr create \
     --title "{title}" \
     --base staging \
     --head "{feature-branch}" \
     --body "{body}" \
     --label "auto-pr"
   ```

## PR Body Template

```markdown
## Summary

This PR implements: **{task description}**

- Resolves #{issue-number}: {task title}
- Created from feature branch: `{branch-name}`

## Changes

- [ ] Implementation completed according to task requirements
- [ ] Code follows project standards and conventions
- [ ] Tests added where applicable
- [ ] Documentation updated if needed

## Validation

- ✅ Build validation: 100% PASS (`cargo build --release`)
- ✅ Clippy validation: 100% PASS (`cargo clippy`)
- ✅ Format validation: 100% PASS (`cargo fmt`)
- ✅ Type check validation: 100% PASS (`cargo check`)

## Test Plan

- [ ] Manual testing completed
- [ ] Automated tests pass
- [ ] Integration with existing systems verified
- [ ] Performance impact assessed (if applicable)

## Additional Notes

{user feedback}

---

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Error Handling

- **Not on feature branch**: Clear error with current branch
- **Branch not pushed**: Instructions to push branch first
- **Validation failures**: Stop and report specific failures
- **Issue not found**: Validate issue exists before PR creation
- **Staging branch missing**: Error with available branches

## Integration

- **Prerequisite**: Use `/init` to set up project workflow (MANDATORY first step)
- **Before**: Use `/impl [issue-number]` to complete implementation
- **After**: Wait for team review and approval
- **Target**: Always creates PR to `staging` branch (never `main`)
- **Context**: PR resolves specific GitHub issue (created via `/plan` or `/plan2`)

## Branch Naming Requirements

Feature branches must follow pattern:
```
feature/task-{issue-number}-{description}
```

Examples:
- `feature/task-123-user-authentication`
- `feature/task-456-payment-webhook`
- `feature/task-789-database-migration`

## Important Notes

- **ALWAYS** creates PR to staging branch (never to main)
- **NEVER** merge PRs yourself - wait for team approval
- **100% validation** required before PR creation
- Feature branch must be pushed to remote
- Working directory must be clean
- PR must resolve a specific task issue

## Files

- Feature branches following naming convention
- GitHub Pull Requests - Code review and discussion
- GitHub Issues - Task definitions and requirements