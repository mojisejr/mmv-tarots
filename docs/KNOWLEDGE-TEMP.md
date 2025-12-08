# Knowledge Issue Template

**Template for capturing structured learning and solutions for AI-Human collaboration**

---

## 🔧 [CATEGORY] [SPECIFIC TOPIC]

**Knowledge ID**: KNOW-[CATEGORY]-[NUMBER]
**Source**: Context #[issue] | PR #[pr] | Chat Discussion
**Date Added**: YYYY-MM-DD
**Difficulty**: [Easy|Medium|Hard|Complex]
**Status**: [Verified|Working|Needs Testing|Deprecated]

### 📋 PROBLEM STATEMENT
[Clear description of what problem we were trying to solve]

### 🎯 SOLUTION IMPLEMENTED
[Step-by-step what actually worked - specific code, commands, approaches]

### 💭 AI HONEST FEEDBACK & LESSONS LEARNED

**What Actually Worked:**
- [Specific thing that succeeded] - [Why it worked - technical reasoning]
- [Specific thing that succeeded] - [Why it worked - technical reasoning]

**What Didn't Work & Why:**
- [Failed approach 1] - [reason it failed]
- [Failed approach 2] - [reason it failed]

**⚠️ Things to Avoid:**
- [Common pitfall 1] - [consequence if ignored]
- [Common pitfall 2] - [consequence if ignored]

**🔍 Things to Notice Before Starting:**
- [Prerequisite 1] - [how to check/verify]
- [Prerequisite 2] - [how to check/verify]
- [Environment condition] - [how to verify]

**🤖 AI Self-Improvement Notes:**
- "I initially thought [wrong approach] but learned that [correct approach]"
- "For future similar problems, I should first [check/consider X]"
- "Key insight I missed: [important realization]"
- "Pattern recognition: this relates to [previous problem] via [connection]"

### 🔗 LINKS & REFERENCES
- **Context Issue**: #[issue-number] - [brief description]
- **Pull Request**: #[pr-number] - [brief description]
- **Related Knowledge**: KNOW-[CATEGORY]-[other-number]
- **Code Files**: [file-path] (lines X-Y)
- **Documentation**: [link to relevant docs]

### 🏷️ TAGS & SEARCHABILITY
`tag1` `tag2` `tag3` `category-specific` `problem-type`

### ✅ VERIFICATION STATUS
- [ ] Tested in development environment
- [ ] Working in production build
- [ ] Edge cases considered
- [ ] Documentation updated

---

## 📝 Usage Instructions

### Creating Knowledge Entries

1. **Use =kupdate command**:
   ```bash
   =kupdate [category] "[topic description]"
   ```

2. **Fill all sections completely**:
   - Problem statement (clear & specific)
   - Solution (step-by-step implementation)
   - AI honest feedback (critical for learning)
   - Links & references (traceability)

3. **Auto-label creation**:
   - System auto-creates `knowledge-[category]` label if needed
   - Adds appropriate searchability tags

### Knowledge Categories

**Standard Categories**:
- `device` - CU12, KU16, SerialPort, hardware integration
- `database` - SQLite, Sequelize, migrations, queries
- `architecture` - Design patterns, structural decisions
- `debug` - Error solutions, troubleshooting, workarounds
- `workflow` - Process improvements, automation
- `frontend` - React, Electron, UI components
- `backend` - Node.js, APIs, services

### Knowledge ID Format

**Format**: `KNOW-[CATEGORY]-[NUMBER]`
- Example: `KNOW-DEVICE-001`, `KNOW-DATABASE-015`
- Auto-increment per category
- Easy reference and linking

### AI Feedback Guidelines

**Be Honest and Specific**:
- What assumptions were wrong?
- What knowledge gaps were discovered?
- What would you do differently next time?
- What patterns emerged?

**Focus on Learning**:
- Not just "what worked" but "why it worked"
- Not just "what failed" but "why it failed"
- Connections to other problems/solutions
- Future prevention strategies

---

## 🔍 Integration with Workflow

### Manual Knowledge Capture

**After Implementation (=impl completes)**:
1. Review what was learned
2. Use `=kupdate category "topic"` to create knowledge entry
3. Fill template with honest feedback
4. Link to source Context/PR issues

**After Context Discussion (=fcs completes)**:
1. Extract key decisions and insights
2. Use `=kupdate category "decision/insight"`
3. Document reasoning and alternatives considered
4. Link to context issue

**After Chat Learning**:
1. When discovering new patterns or solutions
2. Use `=kupdate category "discovery"`
3. Capture breakthrough moments
4. Reference relevant code/issues

### Search and Retrieval

**Commands**:
```bash
=ksearch "[query]"              # Search all knowledge entries
=khub                          # Go to main Knowledge Hub
=krecent                       # Show recent knowledge updates
=kcategory [category]          # Show knowledge for specific category
```

**Search Optimization**:
- Use tags for better matching
- Include problem keywords
- Reference specific technologies/errors
- Cross-reference related entries

---

_This template is designed for maximum learning retention and future problem-solving efficiency._