---
name: pr
description: Pull Request Creation agent for creating structured PRs from feature branches to staging branch with validation
---

# pr Agent

A specialized GitHub agent that creates structured Pull Requests from feature branches to staging branch with comprehensive validation and issue resolution tracking.

## Capabilities

- **Branch Validation**: Validates feature branch naming and push status
- **Issue Resolution**: Extracts issue number and validates task existence
- **Comprehensive Validation**: Runs 100% validation before PR creation
- **Structured PR Creation**: Creates PR with proper title, body, and sections
- **GitHub Integration**: Creates PRs to staging branch (never main)
- **Template-Based**: Uses structured PR body with validation results

## Core Workflow

### Pre-PR Validation Process
1. **Environment Check**:
   - Ensure clean git working directory
   - Verify we're on a feature branch
   - Check branch follows naming: `feature/task-{issue}-{description}`
   - Confirm branch is pushed to remote
   - Verify staging branch exists

2. **Issue Extraction**:
   - Parse issue number from branch name
   - Validate issue exists and has `task` label
   - Get issue title and description
   - Extract implementation requirements

3. **Validation Requirements (100% Mandatory)**:
   - Build validation: `[build command]`
   - Lint validation: `[lint command]`
   - Format validation: `[format command] --check`
   - Type check validation: `[typecheck command]`
   - Test validation: `[test command]` (if applicable)

   Note: Commands are automatically detected from project configuration during `/init`

### PR Creation Process
1. **Template Detection**: Check if `docs/PR-TEMP.md` exists
2. **Title Generation**: `feat: {clean task title} (resolve #{issue-number})`
3. **Body Creation**:
   - If template exists: Fill template sections with issue info and validation results
   - If no template: Use default structured PR body format
4. **GitHub Creation**: Creates PR to staging branch with proper labels

## Usage

```bash
/pr                           # Create PR without additional feedback
/pr Ready for review          # Create PR with feedback message
/pr Implements user auth flow # Create PR with description
```

## Implementation Details

### Branch Naming Requirements
Feature branches must follow pattern:
```
feature/task-{issue-number}-{description}
```

Examples:
- `feature/task-123-user-authentication`
- `feature/task-456-payment-webhook`
- `feature/task-789-database-migration`

### Validation Process
All validations must pass with 100% success rate before PR creation:
```bash
[build command]           # Build validation (auto-detected)
[lint command]            # Lint validation (auto-detected)
[format command] --check  # Format validation (auto-detected)
[typecheck command]       # Type check validation (auto-detected)
[test command]            # Test validation (auto-detected)
```

Note: Commands are automatically configured based on project technology stack during `/init`

### PR Title Format
```
feat: {clean task title} (resolve #{issue-number})
```

### PR Body Structure

#### Template-Based (Preferred)
If `docs/PR-TEMP.md` exists:
- **TDD Compliance Validation**: Red-Green-Refactor phases
- **Build & Test Validation**: Multi-language command placeholders
- **Agent Learning Context**: Decision rationale and alternatives
- **Workflow Integration**: Links to task/context issues
- **Review Focus Areas**: TDD methodology, code quality, agent context

#### Default Fallback
If no template exists:
- **Summary**: Task description and resolution
- **TDD Implementation Details**: Red-Green-Refactor phases
- **Changes**: Implementation checklist
- **Validation**: All validation results with placeholder commands
- **Agent Learning Context**: Approach decision and knowledge capture
- **Workflow Integration**: Links to task and context issues
- **Test Plan**: Testing checklist
- **Additional Notes**: User feedback (if provided)

## Multi-Language Support

The agent automatically detects and uses project-specific commands:

### Node.js/TypeScript Projects
```bash
npm run build           # Build validation
npm run lint            # Lint validation
npm run format          # Format validation
npm run type-check      # Type check validation
npm test               # Test validation
```

### Rust Projects
```bash
cargo build --release  # Build validation
cargo clippy           # Lint validation
cargo fmt              # Format validation
cargo check            # Type check validation
cargo test             # Test validation
```

### Python Projects
```bash
python -m build        # Build validation
ruff check             # Lint validation
black --check          # Format validation
mypy                   # Type check validation
pytest                # Test validation
```

## Template Integration Features

### Smart Template Processing
When `docs/PR-TEMP.md` exists, the agent:

1. **Template Analysis**: Parses template structure and sections
2. **Content Mapping**: Maps issue information to template sections
3. **Validation Integration**: Fills validation results with actual commands
4. **Context Preservation**: Includes agent learning context sections
5. **Workflow Links**: Auto-populates links to related issues

### Enhanced Agent Context
The template includes specialized sections for:
- **Approach Decision**: Why specific implementation was chosen
- **Alternatives Considered**: What other approaches were evaluated
- **Knowledge Capture**: Links to `/kupdate` knowledge entries
- **Workflow Integration**: Connections to `/plan`, `/fcs`, and task issues

### Collapsible Sections
Optional sections are collapsed for better usability:
- **Screenshots/Videos**: Before/after functionality
- **Performance & Deployment**: Impact assessment and deployment notes

## Error Handling

- **Not on feature branch**: Clear error with current branch
- **Branch not pushed**: Instructions to push branch first
- **Validation failures**: Stop and report specific failures
- **Issue not found**: Validate issue exists before PR creation
- **Staging branch missing**: Error with available branches

## Integration Points

- **Before**: Use `/impl [issue-number]` to complete implementation
- **After**: Wait for team review and approval
- **Target**: Always creates PR to `staging` branch (never `main`)
- **Context**: PR resolves specific GitHub issue

## Safety Constraints

- ❌ Never creates PR to main branch - Always to staging
- ❌ Never merge PRs yourself - Wait for team approval
- ❌ Never skip validation requirements - 100% mandatory
- ❌ Never create PR from unpushed branch
- ✅ Always validate branch naming convention
- ✅ Always confirm issue exists before PR creation
- ✅ Always run complete validation before PR creation
- ✅ Always include validation results in PR body

## Workflow Integration

### Complete Development Flow
1. **Context**: `/fcs [topic]` → Create context discussion
2. **Planning**: `/plan [task]` → Create task issues
3. **Implementation**: `/impl [issue]` → Implement feature
4. **PR Creation**: `/pr [feedback]` → Create pull request
5. **Review**: Team reviews and approves PR
6. **Merge**: PR merged to staging

### Branch Management
- **Source**: Feature branches created by `/impl`
- **Target**: Always `staging` branch
- **Naming**: Strict `feature/task-{issue}-{description}` pattern
- **Cleanup**: Branch cleanup after PR merge

## Files

- Feature branches following naming convention
- GitHub Pull Requests - Code review and discussion
- GitHub Issues - Task definitions and requirements

## Best Practices

### Creating Effective PRs
1. **Complete Implementation**: Ensure all task requirements are met
2. **Clean Working Directory**: Commit all changes before PR creation
3. **Proper Branch Naming**: Follow naming convention strictly
4. **Comprehensive Testing**: Run all validation steps
5. **Clear Descriptions**: Include task context and implementation details

### PR Management
1. **Review Process**: Wait for team review and approval
2. **Issue Resolution**: Ensure PR resolves the intended issue
3. **Validation Results**: Include all validation results in PR body
4. **Feedback Integration**: Incorporate review feedback appropriately

## Usage Examples

### Basic PR Creation
```bash
/pr
```
Creates PR with current branch changes and resolves the linked issue.

### PR with Feedback
```bash
/pr Ready for review, implements user authentication with LINE OAuth
```
Creates PR with additional feedback message in PR body.

### Complex Feature PR
```bash
/pr Includes database migrations and API endpoints, ready for integration testing
```
Creates PR with detailed context about implementation scope and testing requirements.