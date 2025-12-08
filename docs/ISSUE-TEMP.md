# GitHub Context Issue Template for Iterative Discussion
**Template for creating and evolving context through multi-session discussions**

---

## 🎯 [ISSUE-XXX] [Context Title]

### 🎯 CONTEXT OBJECTIVE
**Primary Goal:**
- [Main objective of this context]
- [Expected benefits from this context]

### 📝 DISCUSSION LOG
**Session Timeline:**
- **Initial Session**: [YYYY-MM-DD HH:MM] - Initial discussion
- **Update Session 1**: [YYYY-MM-DD HH:MM] - Added requirements
- **Update Session 2**: [YYYY-MM-DD HH:MM] - Clarified scope
- [Add more sessions as needed]

### 🔄 CURRENT STATUS
**Context Phase:**
- `[Planning]` - Planning/consultation phase
- `[Ready for Planning]` - Ready for implementation planning
- `[Implementation Ready]` - Ready for implementation

**Last Updated**: [YYYY-MM-DD HH:MM]

### 📋 ACCUMULATED CONTEXT
**Requirements from Discussions:**
- [Requirement 1 - from initial session]
- [Requirement 2 - from subsequent session]
- [Requirement N - from latest session]

**Technical Decisions:**
- [Decision 1 - architecture choice]
- [Decision 2 - technology stack]
- [Decision 3 - implementation approach]

**Constraints & Assumptions:**
- [Constraint 1 - performance/time limitations]
- [Assumption 1 - user behavior patterns]
- [Constraint 2 - technical limitations]

**Scope Boundaries:**
**IN SCOPE:**
- [Features/components to implement]
- [Functionality to support]

**OUT OF SCOPE:**
- [Features/components not to implement]
- [Functionality not to support in this context]

### 🏗️ TECHNICAL ARCHITECTURE
**System Components:**
- **Next.js Components**: [App Router pages/layouts]
- **API Routes**: [Next.js API endpoints]
- **Database Models**: [Neon PostgreSQL tables]
- **Vercel Workflows**: [AI pipeline workflows]
- **External Integrations**: [AI Gateway, other services]

**Architecture Patterns:**
- [Pattern 1 - Serverless functions]
- [Pattern 2 - AI orchestration]
- [Pattern 3 - Async processing]

**Key Technical Requirements:**
- **Performance**: API response < 200ms (p95)
- **Security**: Input validation, environment variables
- **Scalability**: Serverless auto-scaling
- **Type Safety**: TypeScript strict mode

### 🎯 IMPLEMENTATION DIRECTIONS
**Breaking Down Strategy:**
- [Suggest atomic task breakdown]
- [Feature priority order]
- [Dependencies to manage]

**Risk Areas Identified:**
- [Risk 1 - AI integration complexity]
- [Risk 2 - Vercel Workflow limitations]
- [Risk 3 - Neon DB connection issues]

**Success Criteria:**
- [Criteria 1 - measurable outcome]
- [Criteria 2 - user experience metric]
- [Criteria 3 - technical requirement]

### 📚 REFERENCE MATERIALS
**Documentation:**
- `docs/PRD.md` - Product Requirements Document
- `.claude/commands/impl.md` - Implementation workflow guide
- `.claude/commands/run-test.md` - Testing framework setup

**Code Examples:**
- [Code Reference 1 - Next.js pattern]
- [Implementation Pattern 2 - Vercel Workflow]

**External Resources:**
- [Vercel AI SDK Documentation]
- [Neon Database Documentation]

### 🔄 SESSION NOTES
**Notes from [YYYY-MM-DD HH:MM] Session:**
- **Discussed Topics:**
  - [Topic 1 - discussed item]
  - [Topic 2 - information gathered]
- **Decisions Made:**
  - [Decision 1]
  - [Decision 2]
- **Unanswered Questions:**
  - [Question 1]
  - [Question 2]

**Action Items:**
- [ ] [Action item 1 - for next session]
- [ ] [Action item 2 - research/validate]

**Next Session Focus:**
- [What to discuss in next session]
- [Information to prepare]
- [Decisions needed]

### 📋 PLANNING READINESS CHECKLIST
✅ **Requirements are clear and complete**
- [ ] All functional requirements are documented
- [ ] Non-functional requirements are identified
- [ ] User stories/use cases are clear

✅ **Technical approach is validated**
- [ ] Next.js architecture decisions are confirmed
- [ ] Neon + Vercel integration is validated
- [ ] AI pipeline patterns are defined

✅ **Dependencies are identified**
- [ ] Vercel AI SDK dependencies are listed
- [ ] Neon database dependencies are mapped
- [ ] Vercel Workflow dependencies are acknowledged

✅ **Scope boundaries are defined**
- [ ] IN SCOPE items are clearly listed
- [ ] OUT OF SCOPE items are explicitly excluded
- [ ] Success criteria are measurable

✅ **Risk areas are acknowledged**
- [ ] AI integration risks are identified
- [ ] Serverless architecture risks are considered
- [ ] Development timeline constraints are realistic

✅ **Testing Strategy is Defined**
- [ ] Unit testing approach (Jest)
- [ ] Integration testing plan
- [ ] E2E testing framework (Playwright)

**Overall Planning Status:**
**[Ready for Planning]** - When all checklist items are complete
**[Not Ready Yet]** - Requires additional discussion

### 🔗 RELATED ISSUES
- **Parent Issue**: # (if applicable)
- **Related Context Issues**: # (if applicable)
- **Technical Dependencies**: # (if applicable)

**Implementation Notes:**
- Use `/impl [task description]` to implement features from this context
- Use `/run-test [type]` to run appropriate tests
- Follow TDD Red-Green-Refactor cycle
- Ensure TypeScript strict mode compliance

---

## 📝 Instructions for Using This Template

### Initial Context Creation
1. Fill basic sections: CONTEXT OBJECTIVE, start DISCUSSION LOG, set CURRENT STATUS = Planning
2. Add initial requirements from first discussion
3. Update SESSION NOTES with key points
4. Check Planning Readiness

### Context Updates
1. Add to DISCUSSION LOG with new session timestamp
2. Update ACCUMULATED CONTEXT with new requirements/decisions
3. Modify TECHNICAL ARCHITECTURE based on new insights
4. Update SESSION NOTES with latest discussion
5. Assess Planning Readiness

### When Ready for Implementation
- Ensure **Context Phase** = `[Implementation Ready]`
- All **PLANNING READINESS CHECKLIST** items are ✅
- Use `/impl` command to begin implementation
- Follow the workflow in `.claude/commands/impl.md`

### Context Evolution Principles
- **Incremental**: Add information gradually through discussions
- **Transparent**: Document decision rationale
- **Flexible**: Adjust decisions with explanations
- **Action-Oriented**: Focus on implementation-ready outcomes

---

*This template is designed for iterative discussion-based context creation specifically for the MiMiVibe tarot reading application using Next.js, Neon, and Vercel Workflow.*