# Issue Creation Command

## Usage
```
/issue [title] [description]
/issue
```

## Description
Creates GitHub issues with proper temporary file management using the project's .tmp folder exclusively.

## Implementation Workflow

### 🔍 Phase 1: Environment Setup (.tmp Folder Enforcement)

#### MANDATORY .tmp Folder Setup
```bash
# Step 1: Create .tmp folder if it doesn't exist
mkdir -p .tmp

# Step 2: Ensure .tmp/ is in .gitignore
if ! grep -q "^\.tmp/$" .gitignore 2>/dev/null; then
    echo ".tmp/" >> .gitignore
fi

# Step 3: Verify .tmp folder is ready
ls -la .tmp/
```

#### FORBIDDEN ACTIONS (NEVER ALLOWED)
- ❌ **NEVER use `/tmp/`** or any system temp directory
- ❌ **NEVER create temp files in project root**
- ❌ **NEVER use `$TEMP` or `$TMPDIR` environment variables**
- ❌ **NEVER leave temporary files after command completion**

### 🔍 Phase 2: Issue Content Creation

#### Issue Title and Description
1. **Parse Command Arguments**
   - Extract title from first argument or prompt user
   - Extract description from remaining arguments or prompt user

2. **Create Issue Content File**
   ```bash
   # ALWAYS use .tmp folder
   cat > .tmp/issue-content.md << 'EOF'
   ## Issue Description

   [Description content here]

   ---

   ### Additional Information

   - **Command**: `/issue [arguments]`
   - **Created**: $(date)
   - **Branch**: $(git branch --show-current)
   EOF
   ```

3. **Validate Content**
   - Ensure file is created in `.tmp/` folder ONLY
   - Verify content is not empty
   - Check for proper markdown formatting

### 🔍 Phase 3: GitHub Issue Creation

#### Create Issue Using GitHub CLI
```bash
# Use --body-file with .tmp folder
gh issue create \
    --title "[Issue Title]" \
    --body-file .tmp/issue-content.md \
    --label "enhancement" \
    --assignee @me
```

#### Interactive Mode (if no arguments)
```bash
# Prompt for title and description
read -p "Issue title: " title
read -p "Issue description: " description

# Create temporary file with user input
cat > .tmp/issue-content.md << EOF
## $title

$description

---
### Additional Information

- **Command**: `/issue` (interactive mode)
- **Created**: $(date)
- **Branch**: $(git branch --show-current)
EOF

# Create issue with temporary file
gh issue create \
    --title "$title" \
    --body-file .tmp/issue-content.md \
    --label "enhancement" \
    --assignee @me
```

### 🔍 Phase 4: Cleanup (MANDATORY)

#### Temporary File Cleanup
```bash
# ALWAYS clean up .tmp folder after use
rm -f .tmp/issue-content.md

# Verify cleanup success
if [ -f .tmp/issue-content.md ]; then
    echo "❌ WARNING: Temporary file cleanup failed"
    echo "📁 Manual cleanup required: rm .tmp/issue-content.md"
else
    echo "✅ Temporary file cleanup successful"
fi
```

## Command Execution Examples

### Example 1: With Arguments
```bash
/issue "Add authentication to API" "Need to implement JWT authentication for the /api/predict endpoint"
```

**Execution Flow:**
1. Setup `.tmp/` folder
2. Create `.tmp/issue-content.md` with title and description
3. Run `gh issue create --body-file .tmp/issue-content.md`
4. Clean up `.tmp/issue-content.md`

### Example 2: Interactive Mode
```bash
/issue
```

**Execution Flow:**
1. Setup `.tmp/` folder
2. Prompt user for title and description
3. Create `.tmp/issue-content.md` with user input
4. Run `gh issue create --body-file .tmp/issue-content.md`
5. Clean up `.tmp/issue-content.md`

### Example 3: With Labels
```bash
/issue "Fix card rendering bug" "Cards not displaying correctly on mobile devices"
```

**Execution Flow:**
1. Setup `.tmp/` folder
2. Create `.tmp/issue-content.md` with bug details
3. Run `gh issue create --label bug --body-file .tmp/issue-content.md`
4. Clean up `.tmp/issue-content.md`

## Error Handling

### .tmp Folder Errors
- If `.tmp/` cannot be created: **STOP EXECUTION**
- If `.tmp/` cannot be added to `.gitignore`: **STOP EXECUTION**
- If temporary file cannot be created: **STOP EXECUTION**

### GitHub CLI Errors
- If `gh` is not installed: Prompt user to install GitHub CLI
- If not authenticated: Run `gh auth login`
- If issue creation fails: Preserve `.tmp/issue-content.md` for debugging

### Cleanup Errors
- If cleanup fails: Display manual cleanup instructions
- Never leave temporary files without explicit warning

## Template Files

### Issue Content Template
```markdown
## Issue Title

**Description**: [Detailed description of the issue]

### Steps to Reproduce (if bug)
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Environment
- **Branch**: $(git branch --show-current)
- **Node.js**: $(node --version)
- **OS**: $(uname -s)

---

### Additional Information

- **Command**: `/issue [arguments]`
- **Created**: $(date)
- **Priority**: [High/Medium/Low]
```

## Benefits of .tmp Folder Enforcement

### 🔒 Security
- No temporary files in system directories
- Project-scoped temporary file management
- Automatic .gitignore prevents accidental commits

### 🧹 Cleanliness
- Zero temporary file pollution
- Automatic cleanup after each operation
- Project folder remains organized

### 🔍 Debugging
- Temporary files are project-local for inspection
- Easy to debug failed operations
- Clear file naming convention

## Critical Rules (NEVER VIOLATE)

- **STRICT .tmp FOLDER USAGE**: ALWAYS use `.tmp/` folder for temporary files
- **NO SYSTEM TEMP**: NEVER use `/tmp/`, `$TEMP`, or other system temp directories
- **IMMEDIATE CLEANUP**: ALWAYS clean up temporary files after use
- **GITIGNORE PROTECTION**: ALWAYS ensure `.tmp/` is in `.gitignore`
- **VERIFICATION**: ALWAYS verify cleanup success before completion
- **ERROR HANDLING**: ALWAYS preserve temporary files for debugging if cleanup fails

## Success Criteria

- Issue created successfully with GitHub CLI
- Temporary files created ONLY in `.tmp/` folder
- Temporary files cleaned up successfully
- `.tmp/` folder added to `.gitignore` if not present
- User receives clear feedback on operation status
- Proper error handling with helpful messages