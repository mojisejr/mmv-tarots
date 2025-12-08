````markdown
# /pck

Plan Check - Analyze GitHub task issue and show implementation plan with workflow steps

## Usage

```
/pck [issue-number]        # Read GitHub issue #[number] and analyze task
/pck [issue-number] [msg]  # Read GitHub issue with additional context
```

## Examples

```bash
/pck 123                           # Read GitHub issue #123 and show plan
/pck 456 "Use Rust async pattern" # Read GitHub issue #456 with context
```

## GitHub Integration 🔗

### Data Source
- **Repository**: Current repository
- **Source**: GitHub Issues (ONLY) - not local files
- **Access Method**: 
  - Primary: GitHub MCP tools
  - Fallback: `gh` command line tool

### Implementation Flow

1. **Read GitHub Issue**:
   ```bash
   # Using gh command
   gh issue view [issue-number] --json title,body,labels,state
   ```

2. **Verify Issue Type**:
   - Must have `task` label
   - Must NOT be `context` or other types
   - Status must be `OPEN`

3. **Extract Data**:
   - Title: Task description
   - Body: Full requirements and specifications
   - Labels: Task metadata (manual/copilot mode)
   - Links: Related issues and PRs

## Output Format

### 📋 GitHub Issue Summary
- Issue #[number] - [Status: OPEN/CLOSED]
- Title: [Task description]
- Labels: task, [mode-assignment]
- Description: Full task requirements
- Related Issues/PRs: Links if available

### 🔍 Codebase Analysis
- Related files and modules (based on task description)
- Current architecture relevant to this task
- Dependencies and constraints
- Potential impact areas

### 📍 Implementation Steps
For each step:
- **Step N: [Title]**
  - **What**: What to do
  - **How**: How to do it and commands/code patterns
  - **Why**: Reason for this approach
  - **Outcome**: Expected result
  - **Validate**: How to verify

### ✅ Validation Checklist (from GitHub Issue)
- Build validation (cargo build --release)
- Lint validation (cargo clippy -- -D warnings)
- Format check (cargo fmt -- --check)
- Type check (cargo check)
- Test execution
- Integration verification

### 🎯 Expected Result
- What will be delivered
- How to test/verify
- Success criteria

### ⚠️ Risks & Considerations
- Potential blockers
- Dependencies to verify
- Performance implications
- Security considerations

### 📊 Effort Estimate
- Time complexity
- Code changes scope
- Testing requirements

## Integration

- **Source**: GitHub Issues only - read from repository
- **Use Before**: `/impl [issue-number]` - analyze plan before implementing
- **Replaces**: Manual GitHub issue reading process
- **Codebase Context**: Real-time analysis of current codebase
- **Access**: GitHub MCP or `gh` command

## Implementation

### ⚠️ MANDATORY WORKFLOW (must follow sequence - no skipping)

#### Step 1️⃣: Read GitHub Issue (REQUIRED)
```bash
# Using gh command
gh issue view [issue-number] --json title,body,labels,state
```
**Must find:**
- ✅ Issue title and description
- ✅ Task requirements and acceptance criteria
- ✅ Labels (must have `task`)
- ✅ Issue status (must be OPEN)
- ❌ **STOP if not a task issue** - show error

#### Step 2️⃣: Analyze Codebase (REQUIRED)
**After reading GitHub issue successfully, must analyze codebase:**

1. **Scan Related Files**:
   ```bash
   # Search for related code patterns
   grep -r "[search-term-from-issue]" src/
   find src/ -name "*.rs" -type f | grep -E "[pattern]"
   ```

2. **Understand Current Architecture**:
   - Read relevant source files mentioned in issue
   - Check existing implementations
   - Verify dependencies in project manifest
   - Understand existing patterns and conventions

3. **Identify Impact Areas**:
   - Files that will be modified
   - Functions/modules affected
   - Dependencies needed
   - Tests that might be impacted
   - Performance considerations

4. **Extract Implementation Constraints**:
   - Technology stack being used
   - Existing patterns to follow
   - Limitations from architecture
   - Performance requirements from issue

**Must find:**
- ✅ Related source files (specific paths)
- ✅ Current implementation patterns
- ✅ Dependencies and constraints
- ✅ Files that need modification
- ✅ Existing code to reference

#### Step 3️⃣: Answer with Complete Analysis
**Only then can you answer:**
- GitHub issue summary (from step 1)
- Codebase analysis (from step 2)
- Implementation steps that are clear
- Validation checklist
- Expected results

### ⛔ Forbidden Actions:
- ❌ Answer without reading GitHub issue
- ❌ Skip reading GitHub issue and answer directly
- ❌ Give implementation steps without analyzing codebase
- ❌ Example code not from analyzing current codebase
- ❌ Conclusion without codebase context

### Prerequisites Check
1. **GitHub CLI**: Verify `gh` command is available (fallback)
2. **Repository Access**: Can read GitHub issues from repository
3. **Issue Validation**: Verify issue exists and is a task type

### Error Handling
- Issue not found: Clear error with available issues list
- Not a task issue: Warning with correction
- Access denied: Helpful error message
- GitHub MCP unavailable: Use `gh` command as fallback
- Codebase analysis failed: Explain what couldn't be found and why

## Notes

- ✅ **Data from GitHub Issues only** - not local files
- ✅ **Analyze by reading issue directly from GitHub** - use GitHub MCP or `gh` command
- ✅ **Don't update GitHub issue** - just read and analyze
- ✅ **Verify issue type first** - must have task label
- ✅ **Follow response.instructions.md** - stay on point, no out of scope
- ✅ **Works with all task types** - always read from GitHub issue

---

**Last Updated**: November 22, 2025
**GitHub Integration**: Full GitHub support

````