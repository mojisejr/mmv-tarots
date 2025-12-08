## 📋 TDD-First Pull Request Template

### 🎯 **TDD Compliance Validation**

#### 🔴 **RED Phase - Tests Written First**
- [ ] **Test files created BEFORE implementation files**
- [ ] **Tests FAIL initially** (validated during development)
- [ ] **Test file locations**: Following project patterns (`__tests__/`, `.test.`, `_test.rs`, etc.)
- [ ] **Meaningful tests**: Tests validate actual behavior, not just pass trivially
- [ ] **Edge case coverage**: Tests cover error conditions and boundary cases

#### 🟢 **GREEN Phase - Minimal Implementation**
- [ ] **Minimal implementation**: Only code needed to make tests pass
- [ ] **No extra features**: Strictly limited to test requirements
- [ ] **Tests PASS**: All tests pass with implementation
- [ ] **No over-engineering**: Simple, focused implementation

#### 🔵 **REFACTOR Phase - Safe Improvement**
- [ ] **Code quality improvements**: Applied while maintaining test coverage
- [ ] **Tests still PASS**: All tests continue passing after refactoring
- [ ] **Type checking**: Zero type errors (`[typecheck command]`)
- [ ] **Lint compliance**: Zero lint violations (`[lint command]`)

### 🏗️ **Build & Test Validation**
- [ ] **Build validation**: `[build command]` → 100% PASS
- [ ] **Unit tests**: `[test command]` → 100% PASS
- [ ] **Type checking**: `[typecheck command]` → 100% PASS
- [ ] **Lint validation**: `[lint command]` → 100% PASS
- [ ] **Code formatting**: `[format command]` → Consistent style
- [ ] **Test coverage**: Minimum 80% for critical paths

### 📝 **Description**

#### **Changes Made**
<!--
Describe what this PR implements, following TDD-First methodology:

1. **Tests First**: What tests were written and why
2. **Implementation**: How the minimal code satisfies the tests
3. **Refactoring**: What improvements were made safely
-->

#### **TDD Implementation Details**
<!--
Example format:
- **RED Phase**: Created failing tests for [feature] in [test location]
- **GREEN Phase**: Implemented minimal [function] in [implementation location]
- **REFACTOR Phase**: Added [improvements] while maintaining test coverage
-->

### 🔗 **Related Issue**
- **Issue**: # <!-- Link to the GitHub issue this PR addresses -->
- **Type**: `[TASK]` <!-- Should be a task issue created via /plan or /plan2 -->

### 🤖 **Agent Learning Context**
#### **Approach Decision**
<!--
Why this approach was chosen over alternatives:
- Technical constraints considered
- Performance implications
- Maintainability factors
-->

#### **Alternatives Considered**
<!--
What other approaches were evaluated and why they were rejected:
- Alternative #1: [description] - Rejected because [reason]
- Alternative #2: [description] - Rejected because [reason]
-->

#### **Knowledge Capture**
<!--
Link to knowledge issues created from learnings:
- /kupdate [category] "[topic]" - [brief description]
-->

### 🧪 **Testing Instructions**

#### **Manual Testing**
- [ ] **Functionality verified**: Core feature works as expected
- [ ] **Edge cases tested**: Error conditions handled properly
- [ ] **Mobile responsive**: Works correctly on mobile devices
- [ ] **Accessibility**: WCAG 2.1 AA compliance checked

#### **Automated Testing**
- [ ] **Unit tests**: All new functions and utilities tested
- [ ] **Component tests**: React components render and interact correctly
- [ ] **Integration tests**: API routes and database operations tested
- [ ] **E2E tests**: Critical user journeys verified (if applicable)

### 📊 **Performance Impact**
- [ ] **Bundle size**: No significant increase in bundle size
- [ ] **Performance**: No performance regressions introduced
- [ ] **Database queries**: Optimized with proper indexes
- [ ] **API response times**: Within target (< 200ms)

### 🔒 **Security Considerations**
- [ ] **Input validation**: All user inputs validated and sanitized
- [ ] **Database security**: Parameterized queries, no injection risks
- [ ] **Authentication**: Proper access controls implemented
- [ ] **Data exposure**: No sensitive data leaked in responses

### 🔄 **Workflow Integration**
- **Task Issue**: # <!-- Link to /plan or /plan2 output -->
- **Context Issues**: <!-- Links to /fcs discussions if applicable -->
- **Knowledge Entries**: <!-- /kupdate links from implementation learnings -->

---

<details>
<summary>📸 <strong>Screenshots/Videos (Optional)</strong></summary>

<!-- Add screenshots or videos showing:
- Before/after functionality
- Mobile responsiveness
- Error states
- Success scenarios
-->

</details>

<details>
<summary>📊 <strong>Performance & Deployment (Optional)</strong></summary>

### 📊 **Performance Impact**
- [ ] **Bundle size**: No significant increase in bundle size
- [ ] **Performance**: No performance regressions introduced
- [ ] **Database queries**: Optimized with proper indexes
- [ ] **API response times**: Within target (< 200ms)

### 🚀 **Deployment Notes**
- [ ] **Database migrations**: Required migrations included
- [ ] **Environment variables**: New variables documented in `.env.example`
- [ ] **Dependencies**: New dependencies properly justified and documented
- [ ] **Breaking changes**: None expected (or clearly documented)

</details>

### ✅ **TDD Validation Checklist**

#### **Pre-Commit Validation**
- [ ] **RED phase completed**: Tests written first and failed initially
- [ ] **GREEN phase completed**: Minimal implementation passes tests
- [ ] **REFACTOR phase completed**: Code quality improved safely
- [ ] **All validations pass**: Build, test, lint, type-check 100% success

#### **TDD Compliance Verified**
```bash
# All commands executed successfully:
[build command]        # ✅ Build validation: 100% PASS
[test command]         # ✅ Test validation: 100% PASS
[lint command]         # ✅ Lint validation: 100% PASS
[typecheck command]    # ✅ Type validation: 100% PASS
[format command]       # ✅ Format validation: Consistent
```

### 📋 **Review Focus Areas**

#### **TDD Methodology Review**
- [ ] **Test-first approach confirmed**: Tests exist before implementation
- [ ] **Minimal implementation**: No over-engineering beyond test requirements
- [ ] **Proper refactoring**: Code improvements maintain test coverage
- [ ] **Test quality**: Tests properly validate functionality and edge cases

#### **Code Quality Review**
- [ ] **Language-specific patterns**: All best practices followed
- [ ] **Lint compliance**: Zero violations, proper formatting
- [ ] **Error handling**: Comprehensive error handling implemented
- [ ] **Documentation**: Code changes properly documented

#### **Agent Context Review**
- [ ] **Decision rationale**: Clear reasoning for approach chosen
- [ ] **Alternatives documented**: Other approaches properly evaluated
- [ ] **Knowledge captured**: Learnings preserved for future reference
- [ ] **Workflow integration**: Proper links to task/context issues

---

### 📚 **Additional Context**
<!--
Add any additional context that reviewers should know:
- Why this approach was chosen
- Alternative approaches considered
- Technical trade-offs made
- Future improvements planned
-->

---

**🎉 TDD-First Development Completed Successfully!**

This PR follows strict Test-Driven Development methodology with:
- **RED Phase**: Tests written first and validated to fail
- **GREEN Phase**: Minimal implementation to satisfy tests
- **REFACTOR Phase**: Safe code improvements with test coverage
- **100% Validation**: All automated checks passing
- **Agent Context**: Decision rationale and learnings preserved

**Review Priority**:
1. TDD methodology compliance and test quality
2. Agent context completeness for future reference
3. Security and code quality standards

---

*Generated with [PROJECT_NAME] TDD-First Workflow Template*