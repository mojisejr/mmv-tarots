# init

Project Initialization - Automatically integrate workflow template into any project by analyzing project context and updating all template configurations.

## Usage

```
/init
```

**Note**: This is a Claude Code slash command using `/` prefix. This command should be run once after cloning the workflow template into any project.

## Examples

```bash
/init                          # Initialize workflow for current project
```

## Implementation

The `/init` command is implemented using the Node.js utility script at `.claude/utils/project-init.js`.

### Execution

```bash
node .claude/utils/project-init.js
```

### Project Analysis Phase

1. **Check Project Type**:
   - **New Project**: Look for `PRD.md` in root directory
   - **Existing Project**: Analyze codebase structure and existing files
   - **Template Detection**: Identify project language, framework, and architecture

2. **PRD Analysis** (if available):
   - Read and parse PRD.md for project requirements
   - Extract: project name, tech stack, features, architecture
   - Parse technology stack section for automatic configuration

3. **Codebase Analysis** (for existing projects):
   - Analyze package.json, Cargo.toml, requirements.txt, go.mod, etc.
   - Detect: language, frameworks, dependencies, build systems
   - Identify: existing patterns, conventions, project structure

### Template Configuration Phase

1. **Update CLAUDE.md**:
   - Replace `[PROJECT_NAME]` with actual project name
   - Replace `[REPOSITORY_URL]` with Git repository URL
   - Replace `[AUTHOR_NAME]` and `[EMAIL]` from Git config
   - Update tech stack sections based on detected technologies

2. **Update Build Commands**:
   - Auto-detect build commands from package files
   - Update all `[build command]`, `[lint command]`, `[test command]` placeholders
   - Configure language-specific validation steps

3. **Configure Project Structure**:
   - Update project structure documentation
   - Set appropriate file paths and patterns
   - Configure database schemas and API patterns

4. **Update Task Template**:
   - Update `docs/TASK-ISSUE-TEMP.md` with detected commands
   - Ensure consistency across all workflow templates

### Workflow Integration Phase

1. **Initialize Git Workflow**:
   ```bash
   # Create staging branch if not exists
   git checkout -b staging 2>/dev/null || git checkout staging
   git push -u origin staging 2>/dev/null || true
   ```

2. **Setup Environment**:
   - Configure development environment
   - Set up knowledge management system
   - Validate tool availability

3. **Validate Environment**:
   - Check required dependencies
   - Validate GitHub CLI availability
   - Verify development environment setup
   - Test language-specific tool availability

## Project Type Detection

### New Projects (with PRD.md)

**Detection**:
- `PRD.md` exists in root directory
- Contains project requirements and specifications

**Actions**:
- Parse PRD for project metadata
- Extract technology stack requirements
- Set up workflow based on specifications

**PRD Format Expected**:
```markdown
# Project Requirements Document

## Project Name: [PROJECT_NAME]

## Technology Stack
- **Language**: [LANGUAGE] (e.g., TypeScript, Rust, Python)
- **Framework**: [FRAMEWORK] (e.g., React, Actix-web, FastAPI)
- **Database**: [DATABASE] (e.g., PostgreSQL, SQLite)
- **Deployment**: [PLATFORM] (e.g., Vercel, Render, AWS)

## Project Description
[BRIEF PROJECT DESCRIPTION]

## Key Features
[LIST OF MAIN FEATURES]
```

### Existing Projects (without PRD.md)

**Detection**:
- No `PRD.md` found
- Existing source code detected
- Package files present (package.json, Cargo.toml, etc.)

**Actions**:
- Analyze package files for technology detection
- Scan source code for patterns and architecture
- Infer project requirements from existing structure

**Technology Detection**:
- **Node.js**: `package.json` → npm/yarn commands
- **Rust**: `Cargo.toml` → cargo commands
- **Python**: `requirements.txt` or `pyproject.toml` → pip/poetry commands
- **Go**: `go.mod` → go commands
- **Database**: Detect migrations, schemas, ORM usage

## Automatic Template Updates

### CLAUDE.md Configuration

**Project Metadata**:
```markdown
**Project Name**: [ACTUAL_PROJECT_NAME]
**Repository**: [ACTUAL_REPO_URL]
**Author**: [GIT_USER_NAME] <[GIT_USER_EMAIL]>
```

**Technology Stack**:
```markdown
### Core Stack

- **Language**: [DETECTED_LANGUAGE]
- **Web Framework**: [DETECTED_FRAMEWORK]
- **Database**: [DETECTED_DATABASE]
- **Deployment**: [DETECTED_PLATFORM]
```

### Command Placeholders Replacement

**Language-Specific Commands**:

**Node.js/TypeScript**:
- `[build command]` → `npm run build` or `yarn build`
- `[lint command]` → `npm run lint` or `yarn lint`
- `[format command]` → `prettier --check .`
- `[test command]` → `npm test` or `yarn test`
- `[typecheck command]` → `tsc --noEmit`

**Rust**:
- `[build command]` → `cargo build --release`
- `[lint command]` → `cargo clippy --all-targets --all-features`
- `[format command]` → `cargo fmt -- --check`
- `[test command]` → `cargo test`
- `[typecheck command]` → `cargo check`

**Python**:
- `[build command]` → `python -m build`
- `[lint command]` → `ruff check`
- `[format command]` → `black --check .`
- `[test command]` → `pytest`
- `[typecheck command]` → `mypy`

**Go**:
- `[build command]` → `go build ./...`
- `[lint command]` → `golangci-lint run`
- `[format command]` → `gofmt -d .`
- `[test command]` → `go test ./...`
- `[typecheck command]` → `go vet ./...`

### Project Structure Documentation

**Auto-Generated Structure**:
```markdown
### Project Structure

```
[project-name]/
├── README.md                   # [DETECTED_README_PURPOSE]
├── src/                        # [DETECTED_SOURCE_STRUCTURE]
│   ├── main.[ext]              # [DETECTED_ENTRY_POINT]
│   ├── config.[ext]            # [DETECTED_CONFIG_MGMT]
│   └── [detected-dirs]/        # [DETECTED_COMPONENTS]
├── [detected-migrations]/      # [DETECTED_DB_MIGRATIONS]
└── [detected-config]/          # [DETECTED_CONFIG_FILES]
```
```

## Environment Setup

### Required Dependencies Validation

**GitHub CLI**:
```bash
# Check gh CLI availability
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is required. Install from: https://cli.github.com/"
    exit 1
fi
```

**Language-Specific Tools**:
```bash
# Node.js
node --version && npm --version

# Rust
rustc --version && cargo --version

# Python
python --version && pip --version

# Go
go version
```

### Git Configuration

**Author Information**:
```bash
# Extract from Git config
GIT_USER_NAME=$(git config user.name)
GIT_USER_EMAIL=$(git config user.email)
GIT_REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "Not set")
```

## Initialization Results

### Success Output

```bash
✅ Project initialized successfully!

📋 Project Configuration:
- Name: [PROJECT_NAME]
- Language: [DETECTED_LANGUAGE]
- Framework: [DETECTED_FRAMEWORK]
- Repository: [REPOSITORY_URL]

🔧 Workflow Commands Updated:
- Build command: [ACTUAL_BUILD_COMMAND]
- Lint command: [ACTUAL_LINT_COMMAND]
- Format command: [ACTUAL_FORMAT_COMMAND]
- Test command: [ACTUAL_TEST_COMMAND]

📚 Next Steps:
1. Use /fcs [topic] to create context discussions
2. Use /plan [task] to create implementation tasks
3. Use /impl [issue-number] to implement features
4. Use /pr [feedback] to create pull requests

🎉 Your workflow is ready to use!
```

### Error Handling

**Missing PRD.md for New Project**:
```bash
❌ New project detected but PRD.md not found.
Please create PRD.md with project requirements or use /init on an existing project.
```

**Unsupported Technology Stack**:
```bash
⚠️  Warning: Could not auto-detect build commands for [LANGUAGE].
Manual configuration may be required in CLAUDE.md.
```

**Git Not Initialized**:
```bash
❌ Git repository not found. Please run: git init
```

## Integration with Existing Workflow

### Post-Initialization Workflow

1. **Context Creation**: `/fcs project-overview` - Create initial project context
2. **Task Planning**: `/plan "Setup development environment"` - Plan initial tasks
3. **Implementation**: `/impl [issue-number]` - Start implementing features
4. **Pull Requests**: `/pr [feedback]` - Create PRs for review

### Template Maintenance

**Manual Overrides**:
- After `/init` completes, you can manually adjust any settings
- Update CLAUDE.md with project-specific requirements
- Modify command templates as needed
- Add custom project structure documentation

**Re-initialization**:
- Safe to run `/init` multiple times
- Will update configurations based on current project state
- Preserves manual customizations

## Files Modified

### Primary Files

- **CLAUDE.md**: Project configuration and workflow settings
- **docs/TASK-ISSUE-TEMP.md**: Task template with project-specific commands
- **.claude/commands/**: Updated with project-specific commands

### Git Operations

- Creates `staging` branch if not exists
- Pushes staging branch to remote
- Sets up proper branch tracking

## Best Practices

### Before Running /init

1. **Ensure Git Repository**: Project should be a git repository
2. **Install Dependencies**: Required language tools should be installed
3. **GitHub CLI**: Install and authenticate with GitHub CLI
4. **Clean State**: Commit or stash any pending changes

### After Running /init

1. **Review Configuration**: Check CLAUDE.md for accuracy
2. **Test Commands**: Verify build/test commands work
3. **Create Context**: Use `/fcs` to establish project context
4. **Plan First Task**: Use `/plan` to create initial implementation task

### Project Evolution

- **Technology Changes**: Re-run `/init` after major tech stack changes
- **New Dependencies**: Update build commands as needed
- **Workflow Adjustments**: Modify templates based on team preferences

## Troubleshooting

### Common Issues

**GitHub CLI Not Authenticated**:
```bash
gh auth login
```

**Build Commands Not Detected**:
- Check if package files exist in expected locations
- Verify language tools are installed and accessible
- Manually update CLAUDE.md with correct commands

**Staging Branch Issues**:
```bash
git checkout -b staging
git push -u origin staging
```

**Permission Issues**:
- Ensure write permissions for project directory
- Check GitHub repository access permissions

## Notes

- **One-Time Setup**: `/init` should be run once when cloning the template
- **Safe Operation**: Command is idempotent and can be re-run safely
- **Template Flexibility**: Works with new projects and existing codebases
- **Language Agnostic**: Supports Node.js, Rust, Python, Go, and custom setups
- **Git Integration**: Automatically sets up staging-first workflow
- **Context Awareness**: Analyzes project structure for intelligent configuration