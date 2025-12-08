# rrr

Daily Retrospective - Create structured daily retrospective GitHub Issues for continuous improvement and learning capture.

## Usage

```
/rrr [message]
```

## Examples

```bash
/rrr Productive day with payment system progress
/rrr Resolved critical bug in authentication flow
/rrr Learning Rust async patterns and best practices
/rrr Challenging debugging session with valuable insights
```

## Implementation

### Retrospective Creation

1. **Input Validation**:
   - Check message is provided and meaningful
   - Validate GitHub CLI (`gh`) availability

2. **Generate Retrospective Content**:
   - Create structured retrospective template
   - Include focus message from user
   - Add date and metadata
   - Provide comprehensive sections for reflection

3. **Issue Creation**:
   - Title: `[RETROSPECTIVE] Daily Review - YYYY-MM-DD`
   - Labels: `retrospective`, `daily-review`
   - Body: Complete retrospective template
   - Repository: Current repository

### Retrospective Structure

Generated retrospective includes these sections:

1. **Overview**:
   - Daily reflection purpose
   - Focus message from user
   - Date and metadata

2. **Accomplishments**:
   - Task achievement documentation
   - Problem solving highlights
   - Learning milestones
   - Collaboration experiences

3. **Challenges & Blockers**:
   - Technical issues encountered
   - Process challenges identified
   - Knowledge gaps recognized
   - Resource constraints faced

4. **Insights & Learnings**:
   - **Technical Insights**: Concepts that became clearer
   - **Process Insights**: Workflow improvements discovered
   - **Pattern Recognition**: Successful approaches identified

5. **Tomorrow's Goals**:
   - Priority 1: Most important objectives
   - Priority 2: Secondary goals
   - Learning Goal: Knowledge areas to explore
   - Improvement Goal: Process enhancements

6. **AI Self-Reflection**:
   - **What Worked Well**: Helpful AI assistance
   - **Areas for Improvement**: AI enhancement opportunities
   - **Knowledge Capture**: Documentation worth sharing

7. **Gratitude & Acknowledgments**:
   - Success recognition
   - Helpful contributions acknowledged
   - Positive experiences noted

### Template Example

```markdown
# 📅 Daily Retrospective - 2024-02-15

## Overview

Daily reflection and learning capture for continuous improvement and knowledge building.

## Today's Focus

Productive day with payment system progress

## Accomplishments

- [ ] **Task Achievement**: What was completed today?
- [ ] **Problem Solving**: What challenges were overcome?
- [ ] **Learning**: What new knowledge was gained?
- [ ] **Collaboration**: How did team interactions go?

## Challenges & Blockers

- [ ] **Technical Issues**: Any technical problems encountered?
- [ ] **Process Issues**: Any workflow or process challenges?
- [ ] **Knowledge Gaps**: What areas need more learning?
- [ ] **Resource Constraints**: Any limitations faced?

## Insights & Learnings

### Technical Insights
- *What technical concepts became clearer?*
- *What patterns or approaches worked well?*
- *What mistakes were made and what was learned?*

### Process Insights
- *How can the workflow be improved?*
- *What tools or techniques were helpful?*
- *What communication patterns worked well?*

## Tomorrow's Goals

- [ ] **Priority 1**: What's the most important thing to tackle?
- [ ] **Priority 2**: Secondary objectives
- [ ] **Learning Goal**: What knowledge area to explore?
- [ ] **Improvement Goal**: What process to enhance?

## AI Self-Reflection

### What Worked Well
- *AI assistance that was particularly helpful*
- *Successful problem-solving approaches*
- *Effective communication patterns*

### Areas for Improvement
- *Where AI assistance could be better*
- *What could be done differently next time*
- *Knowledge gaps to address*

### Knowledge Capture
- *What should be documented for future reference?*
- *What patterns are worth sharing with the team?*
- *What insights could benefit others?*

## Gratitude & Acknowledgments

- *What went well that deserves recognition?*
- *Who or what helped make the day successful?*
- *What positive experiences to carry forward?*

---

## Metadata

- **Date**: 2024-02-15
- **Created**: 2024-02-15 15:30:00 UTC
- **Mode**: manual

---

💭 *This retrospective helps build a pattern library of experiences and insights for continuous growth.*

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Output Examples

### Successful Creation
```
📝 Creating daily retrospective GitHub Issue
   Message: Productive day with payment system progress

✅ Daily retrospective GitHub Issue created successfully!
🔗 Issue URL: https://github.com/owner/repo/issues/234
📊 Issue Number: #234

🎉 Daily Retrospective Created!
   Date: 2024-02-15
   Focus: Productive day with payment system progress
   Issue: #234

💡 Next Steps:
   1. Fill in the retrospective sections with your experiences
   2. Be honest about challenges and learnings
   3. Use insights to improve tomorrow's work
   4. Consider creating knowledge entries for key learnings:
      /kupdate [category] '[topic]'

🔗 Access your retrospective: https://github.com/owner/repo/issues/234
```

## Best Practices Guidance

After creation, provide retrospective best practices:

```
💡 Retrospective Best Practices:
===============================
• Be honest and specific about experiences
• Focus on learning and improvement, not blame
• Include both successes and challenges
• Document technical insights for future reference
• Use learnings to create knowledge entries
• Review previous retrospectives for pattern recognition

🔗 Related Commands:
  /kupdate [category] '[topic]' - Document key learnings
  /ksearch '[query]' - Find related knowledge
  /khub - Browse all knowledge entries
```

## Error Handling

- **Empty message**: Prompt for meaningful retrospective focus
- **GitHub CLI missing**: Installation instructions
- **Issue creation failure**: Retry with detailed error
- **Access denied**: Authentication or permission issues

## Integration

- **Before**: Complete daily work and identify key experiences
- **After**: Create knowledge entries for key learnings with `/kupdate`
- **Related**: `/ksearch` to find related knowledge, `/khub` to browse
- **Discovery**: Build pattern library over time

## Retrospective Benefits

- **Continuous improvement**: Regular reflection on growth
- **Learning capture**: Document insights for future reference
- **Pattern recognition**: Identify successful approaches
- **Knowledge building**: Create entries for key learnings
- **Team coordination**: Share experiences and insights

## Features

- **Structured reflection**: Comprehensive sections for thorough review
- **Learning focus**: Emphasis on growth and improvement
- **Knowledge integration**: Links to knowledge creation workflow
- **Pattern building**: Foundation for continuous improvement
- **Team sharing**: Platform for experience exchange

## Files

- GitHub Issues - Individual retrospectives
- Knowledge Base - Key learnings from retrospectives
- `.claude/current_mode` - Included in metadata

## Notes

- Creates structured retrospectives for consistent reflection
- Emphasizes learning over blame or criticism
- Integrates with knowledge creation workflow
- Builds pattern library over time
- Supports both individual and team growth
- Encourages honest self-assessment and improvement