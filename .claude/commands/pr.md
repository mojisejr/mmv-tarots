# pr

Pull Request Creation - Create Pull Request from feature branch to staging.

## Usage

```
/pr [optional feedback]
```

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

5. **Check for PR Template**:
   - Check if `docs/PR-TEMP.md` exists
   - If exists: Use template structure for PR body
   - If not: Use default PR body format

6. **Create PR Body Template**:
   - Generate PR body content in `.tmp/pr-body.md`
   - Include all validation results and issue information
   - If template exists: Fill template sections appropriately

7. **Create Pull Request**:
   - Use `--body-file .tmp/pr-body.md` for PR creation

8. **Cleanup temporary files**: `rm .tmp/issue-info.md .tmp/pr-body.md`

### Pre-PR Validations (100% Required)

```bash
[build command]                 # Build validation (from project config)
[lint command]                  # Lint validation (from project config)
[format command] --check        # Format validation (from project config)
[typecheck command]             # Type check validation (from project config)
[test command]                  # Test validation (from project config)
```

Note: Commands are automatically detected from project configuration during `/init`

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

## PR Body Templates

### Template-Based PR Body (Preferred)

If `docs/PR-TEMP.md` exists, the command will:

1. **Read Template**: Load PR template structure
2. **Fill Sections**: Auto-populate template sections with:
   - Issue information from GitHub API
   - Validation results from pre-PR checks
   - Branch and commit information
   - User feedback (if provided)
3. **Generate Body**: Create PR body following template format
4. **Highlight Focus Areas**: Emphasize TDD compliance and agent context

### Default PR Body (Fallback)

If no template exists, use this format:

```markdown
## Summary

This PR implements: **{task description}**

- Resolves #{issue-number}: {task title}
- Created from feature branch: `{branch-name}`

## TDD Implementation Details

- **RED Phase**: Tests written first and validated to fail
- **GREEN Phase**: Minimal implementation to satisfy tests
- **REFACTOR Phase**: Code quality improvements while maintaining test coverage

## Changes

- [ ] Implementation completed according to task requirements
- [ ] Code follows project standards and conventions
- [ ] Tests added where applicable
- [ ] Documentation updated if needed

## Validation

- ✅ Build validation: 100% PASS (`[build command]`)
- ✅ Lint validation: 100% PASS (`[lint command]`)
- ✅ Format validation: 100% PASS (`[format command]`)
- ✅ Type check validation: 100% PASS (`[typecheck command]`)
- ✅ Test validation: 100% PASS (`[test command]`)

## Agent Learning Context

- **Approach Decision**: Implementation chosen based on {reasoning}
- **Knowledge Capture**: Consider creating `/kupdate` for new learnings

## Test Plan

- [ ] Manual testing completed
- [ ] Automated tests pass
- [ ] Integration with existing systems verified
- [ ] Performance impact assessed (if applicable)

## Workflow Integration

- **Task Issue**: #{issue-number}
- **Context Issues**: Links to relevant discussions (if applicable)

## Additional Notes

{user feedback}

---

🤖 Generated with [PROJECT_NAME] Workflow Template
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Error Handling

- **Not on feature branch**: Clear error with current branch
- **Branch not pushed**: Instructions to push branch first
- **Validation failures**: Stop and report specific failures
- **Issue not found**: Validate issue exists before PR creation
- **Staging branch missing**: Error with available branches

## Integration

- **Before**: Use `/impl [issue-number]` to complete implementation
- **After**: Wait for team review and approval
- **Target**: Always creates PR to `staging` branch (never `main`)
- **Context**: PR resolves specific GitHub issue

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