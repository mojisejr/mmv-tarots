# /commit Command - Simple Comprehensive Git Commit

## Description
Creates comprehensive commit messages with detailed change tracking for easy rollback and progress monitoring.

## Usage
```bash
/commit [optional-custom-message]
```

## Command Execution Flow

### Phase 1: Analysis
1. **Check Branch Safety**
   - Verify NOT on main branch
   - Confirm on staging or feature branch

2. **Analyze Changes**
   ```bash
   # Get git status
   git status --porcelain

   # Show diff summary
   git diff --stat --cached
   git diff --stat
   ```

3. **Quality Checks**
   ```bash
   npm run build && npm run lint && npx tsc --noEmit
   ```

### Phase 2: Generate Commit Message

1. **Categorize Changes**
   - 🎨 **UI**: Components, styles, layouts
   - 🔧 **API**: Routes, workflows, database
   - ⚙️ **Config**: Dependencies, config files
   - 📚 **Docs**: README, documentation

2. **Create Comprehensive Message**
   ```bash
   # Example commit message structure:
   #
   # feat(ui): add card flip animation with 3D effect
   #
   # 📁 Changed Files:
   # - components/Card.tsx: Add flip animation logic
   # - app/globals.css: Add 3D transform styles
   # - types/card.ts: Update Card interface
   #
   # 🔄 Rollback: git reset --hard HEAD~1
   #
   # 🧪 Tests: Build ✅ Lint ✅ Types ✅
   #
   # Co-Authored-By: Claude <noreply@anthropic.com>
   ```

### Phase 3: Execute Commit
```bash
git add .
git commit -m "$GENERATED_MESSAGE"
```

## Commit Message Template

The commit message includes:
1. **Conventional Type**: feat/fix/refactor/docs/etc
2. **Scope**: ui/api/workflow/config/docs
3. **Brief Description**: What changed
4. **File List**: All modified files with descriptions
5. **Rollback Command**: Easy rollback instruction
6. **Quality Status**: Build/lint/type check results

## Usage Examples

### Auto-Generated Message
```bash
/commit
```

### With Custom Message
```bash
/commit "fix(api): resolve tarot prediction timeout"
```

## Sample Output

```
🔍 Analyzing changes...
📊 3 files changed (🎨 UI: 2, 📚 Docs: 1)
✅ Quality checks passed

📝 Generated commit message:
feat(ui): add tarot card selection with hover effects

📁 Changed Files:
- components/TarotCard.tsx: Add hover state and selection logic
- components/CardGrid.tsx: Implement card selection handler
- README.md: Update usage documentation

🔄 Rollback: git reset --hard HEAD~1
🧪 Tests: Build ✅ Lint ✅ Types ✅

Commit this message? (Y/n)
```

## Benefits

- **Easy Tracking**: Detailed file changes in commit message
- **Simple Rollback**: Clear rollback command included
- **Progress Monitoring**: Quality status visible in git log
- **Searchable**: Easy to find specific changes
- **No Extra Files**: No scripts or temporary files needed

---

_Simplified commit command focusing on comprehensive messages for tracking and rollback._