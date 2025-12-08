# GitHub Agents Directory

This directory contains GitHub agents that implement the Jaothui ID-Trace workflow system with hallucination prevention, comprehensive validation, and structured knowledge management.

## Available Agents

### Core Development Workflow Agents

| Agent | Command | Description |
|-------|---------|-------------|
| **[plan.agents.md](plan.agents.md)** | `/plan` | Task planning with hallucination prevention and codebase analysis |
| **[impl.agents.md](impl.agents.md)** | `/impl` | Implementation workflow with validation requirements |
| **[pr.agents.md](pr.agents.md)** | `/pr` | Pull request creation with comprehensive validation |
| **[fcs.agents.md](fcs.agents.md)** | `/fcs` | Context management for iterative development planning |
| **[mode.agents.md](mode.agents.md)** | `/mode` | Execution mode management (MANUAL/COPILOT) |

### Knowledge Management Agents

| Agent | Command | Description |
|-------|---------|-------------|
| **[khub.agents.md](khub.agents.md)** | `/khub` | Central Knowledge Hub navigation and duplicate prevention |
| **[kupdate.agents.md](kupdate.agents.md)** | `/kupdate` | Knowledge entry creation with automatic ID generation |

## Agent Features

### Hallucination Prevention System
- **Codebase Analysis**: All agents scan existing components and dependencies
- **Previous Issue Context**: Agents validate against existing GitHub issues
- **Realistic Requirements**: Tasks based on actual project capabilities
- **10-Point Checklist**: Comprehensive reality validation before task creation

### Comprehensive Validation
- **Rust Project**: Correct validation commands (`cargo build --release`, `cargo clippy`, etc.)
- **100% Success Rate**: Mandatory validation passing before commits/PRs
- **Type Safety**: `cargo check` for type checking
- **Testing**: `cargo test` when available

### Structured Workflow
- **Template-Guided**: All agents use structured templates for consistency
- **GitHub Integration**: Creates proper GitHub Issues (never local files)
- **Mode-Based**: MANUAL/COPILOT execution modes affect behavior
- **Quality Standards**: Consistent formatting and documentation

### Knowledge Management
- **Duplicate Prevention**: Mandatory `/khub` check before creating entries
- **Automatic ID Generation**: KNOW-[CATEGORY]-XXX format with sequential numbering
- **Category Organization**: Structured knowledge domains with automatic labeling
- **Hub Integration**: Central Knowledge Hub #32 for knowledge discovery

## Validation Commands (Next.js Project)

### Build and Quality
```bash
cargo build --release  # Build validation (Rust)
cargo clippy -- -D warnings  # Clippy linting (treat warnings as errors)
cargo check            # Type checking
cargo test             # Test validation (if available)
```

### Git Workflow
```bash
git status             # Clean working directory check
git checkout main && git pull origin main  # Sync with main
git checkout -b feature/task-[issue]-[description]  # Feature branch
git add .              # Stage changes
git commit -m "feat: [description]"  # Commit with format
git push -u origin [branch]  # Push to remote
```

## Agent Workflow Examples

### Complete Development Flow
```bash
# 1. Create context discussion
/fcs [topic]

# 2. Plan tasks with hallucination prevention
/plan [task description]

# 3. Set execution mode
/mode manual    # or /mode copilot

# 4. Implement tasks
/impl [issue-number]

# 5. Create pull request
/pr [feedback]
```

### Knowledge Management Flow
```bash
# 1. Check existing knowledge (Mandatory)
/khub

# 2. Create new knowledge entry
/kupdate [category] "[topic]"

# 3. Link to Knowledge Hub
/klink [issue-number]

# 4. Synchronize if needed
/ksync
```

## Agent Safety Constraints

### Forbidden Actions
- ❌ Never work on main/staging branches directly
- ❌ Never merge PRs yourself
- ❌ Never create local .md files instead of GitHub Issues
- ❌ Never skip validation requirements
- ❌ Never assume components exist without verification

### Required Actions
- ✅ Always sync main branch before implementation
- ✅ Always use feature branch naming convention
- ✅ Always run 100% validation before commits
- ✅ Always analyze codebase before suggesting implementations
- ✅ Always validate dependencies and patterns
- ✅ Always follow template-guided workflow

## Agent Configuration

### Execution Modes
- **MANUAL Mode**: Tasks assigned to human developer
- **COPILOT Mode**: Tasks assigned to @copilot for automatic implementation

### Template Integration
- **Task Issues**: Uses `docs/TASK-ISSUE-TEMP.md`
- **Context Issues**: Uses `docs/ISSUE-TEMP.md`
- **Knowledge Issues**: Uses `docs/KNOWLEDGE-TEMP.md`

### GitHub Integration
- **Issue Creation**: Always creates GitHub Issues
- **Label Management**: Automatic label creation and application
- **Pull Requests**: Structured PR creation to staging branch


### Agent Dependencies

### Required Tools
- **GitHub CLI**: `gh` command for GitHub operations
- **Git**: Version control operations
- **Rust toolchain**: `cargo`, `rustc`, and optional `sqlx-cli` or migration tools

### Required Files
- **Templates**: `docs/` directory templates
- **Configuration**: `.claude/` directory for mode and context
- **Knowledge Base**: GitHub Issue #32 (Knowledge Hub)

## Agent Maintenance

### Regular Updates
- **Validation Commands**: Update when project tooling changes
- **Templates**: Maintain consistent template structure
- **Dependencies**: Update agent dependencies as project evolves

### Quality Assurance
- **Template Validation**: Ensure templates exist and are accessible
- **Command Testing**: Validate agent commands work correctly
- **Integration Testing**: Test agent workflow end-to-end

## Agent Usage Examples

### Plan Agent with Hallucination Prevention
```bash
/plan "Add user authentication with LINE OAuth"
```
Agent will:
1. Analyze existing auth system
2. Check LINE OAuth dependencies
3. Verify authentication patterns
4. Create realistic task requirements

### Implementation Agent with Validation
```bash
/impl 123
```
Agent will:
1. Sync with main branch
2. Create feature branch
3. Run all validation commands
4. Provide implementation guidance

### Knowledge Agent with Duplicate Prevention
```bash
/khub                              # Check existing entries
/kupdate device "SHT30 sensor fix" # Create new entry
```
Agent will:
- **Knowledge Base**: GitHub Issue #32 (Knowledge Hub)

## Agent Maintenance

### Regular Updates
- **Validation Commands**: Update when project tooling changes
- **Templates**: Maintain consistent template structure
- **Dependencies**: Update agent dependencies as project evolves

### Quality Assurance
- **Template Validation**: Ensure templates exist and are accessible
- **Command Testing**: Validate agent commands work correctly
- **Integration Testing**: Test agent workflow end-to-end

## Agent Usage Examples

### Plan Agent with Hallucination Prevention
```bash
/plan "Add user authentication with LINE OAuth"
```
Agent will:
1. Analyze existing auth system
2. Check LINE OAuth dependencies
3. Verify authentication patterns
4. Create realistic task requirements

### Implementation Agent with Validation
```bash
/impl 123
```
Agent will:
1. Sync with main branch
2. Create feature branch
3. Run all validation commands
4. Provide implementation guidance

### Knowledge Agent with Duplicate Prevention
```bash
/khub                              # Check existing entries
/kupdate device "SHT30 sensor fix" # Create new entry
```
Agent will:
1. Read Knowledge Hub #32
2. Generate KNOW-DEVICE-003 ID
3. Create knowledge issue
4. Prompt for hub linking
2. Generate KNOW-DEVICE-003 ID
3. Create knowledge issue
4. Prompt for hub linking

## Agent Development

### Creating New Agents
1. **Follow Template**: Use existing agent structure
2. **Include Validation**: Add appropriate validation requirements
3. **Safety Constraints**: Include forbidden/required actions
4. **Integration Points**: Define workflow integration
5. **Documentation**: Comprehensive usage examples

### Agent Testing
1. **Command Validation**: Test agent commands with various inputs
2. **Error Handling**: Test error scenarios and recovery
3. **Integration Testing**: Test agent workflow with other agents
4. **Edge Cases**: Test boundary conditions and unusual inputs

## Agent Benefits

### Improved Development Workflow
- **Realistic Planning**: Tasks based on actual codebase capabilities
- **Consistent Quality**: Standardized validation and formatting
- **Knowledge Preservation**: Structured learning and documentation
- **Efficient Collaboration**: Clear workflow and responsibilities

### Reduced Errors and Issues
- **Hallucination Prevention**: Unrealistic requirements caught early
- **Validation Enforcement**: 100% quality gate prevents issues
- **Duplicate Prevention**: Knowledge base remains organized
- **Template Consistency**: Standardized formatting and structure

### Team Productivity
- **Clear Guidance**: Step-by-step instructions for all workflows
- **Automated Workflows**: COPILOT mode handles repetitive tasks
- **Knowledge Access**: Quick access to solutions and learning
- **Quality Assurance**: Consistent high-quality deliverables

## Agent Troubleshooting

### Common Issues
- **GitHub CLI**: Install and authenticate `gh` command
- **Template Files**: Ensure templates exist in `docs/` directory
- **Permissions**: Verify GitHub repository access
- **Network**: Check internet connectivity for GitHub operations

### Validation Failures
- **Build Errors**: Fix code issues before proceeding (`cargo build`)
- **Lint Warnings**: Resolve all Clippy warnings (`cargo clippy`)
- **Type Errors**: Fix type errors (`cargo check`)
- **Test Failures**: Resolve failing tests (`cargo test`)

### Knowledge Base Issues
- **Duplicate IDs**: Always run `/khub` before `/kupdate`
- **Broken Links**: Use `/ksync` to fix Knowledge Hub links
- **Category Errors**: Validate category before creating entries
- **Format Issues**: Maintain consistent entry formatting

## Agent Roadmap

### Future Enhancements
- **Advanced Validation**: More comprehensive code quality checks
- **Automation**: Enhanced COPILOT mode capabilities
- **Integration**: Additional tool and service integrations
- **Analytics**: Workflow and productivity metrics

### Continuous Improvement
- **User Feedback**: Incorporate user experience improvements
- **Performance**: Optimize agent execution speed
- **Reliability**: Enhance error handling and recovery
- **Documentation**: Maintain comprehensive agent documentation