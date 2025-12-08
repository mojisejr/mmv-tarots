````markdown
# /aud

Audit - Analyze codebase, answer questions and suggest fixes

## Usage

```
/aud [question]             # Analyze codebase and answer question
/aud [context] "[question]" # Analyze with additional context
```

## Examples

```bash
/aud "Why is queue failing?"
/aud "Find bottleneck" "Where in the API is it slow"
/aud "Fix error handling" "In which parts of code"
```

## Output Format

### 🔍 Codebase Analysis Summary
- Files analyzed
- Scope of investigation
- Key components found
- Relationships and dependencies

### 📍 Issues Found
For each issue:
- **Issue #**: Clear title
  - **Location**: Which file, which line
  - **Current State**: Current situation
  - **Root Cause**: Real root cause
  - **Why It Happens**: The reason
  - **Impact**: What it affects

### 💡 Fix Recommendations
For each fix:
- **Approach**: How to fix it
- **How to Fix**: Step-by-step fix
- **Code Pattern**: Code patterns to use
- **Why This Fix**: Why this approach works
- **Validation Steps**: How to verify it works

### 📊 Implementation Plan
- Step-by-step guide
- Files to modify
- Code changes needed
- Dependencies to consider
- Breaking changes (if any)

### ✅ Testing Strategy
- Unit tests needed
- Integration tests needed
- Manual verification steps
- Edge cases to cover
- Performance implications

### 🎯 Expected Outcome
- What will be improved
- Metrics to measure success
- Before/after comparison
- How to verify the fix works

### ⚠️ Risks & Considerations
- Potential side effects
- Dependencies to verify
- Backward compatibility
- Performance impact
- Security implications

## Supported Analysis Types

- 🐛 **Bug Analysis**: Find the root cause of errors
- 📈 **Performance**: Find bottlenecks
- 🔒 **Security**: Find security issues
- ♻️ **Refactoring**: Suggest improvements
- 🏗️ **Architecture**: Analyze structure
- 🔗 **Integration**: Check dependencies
- 📚 **Code Quality**: Analyze code quality

## Integration

- **Standalone**: Works independently
- **Before Planning**: Use before `/pck`
- **Before Implementation**: Use before `/impl`
- **Knowledge Capture**: Results can become `/kupdate` entries

## Notes

- ✅ Don't update local files - analyze and answer only
- ✅ Check current codebase - real-time analysis
- ✅ Follow response.instructions.md - stay on point
- ✅ Works with all parts of codebase
- ✅ Analysis results can be foundation for `/plan`

---

**Last Updated**: November 22, 2025

````