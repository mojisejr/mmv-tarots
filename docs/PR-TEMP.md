# 📋 TDD-First Pull Request Template for Next.js

### 🎯 **TDD Compliance Validation**

#### 🔴 **RED Phase - Tests Written First**
- [ ] **Test files created BEFORE implementation files**
- [ ] **Tests FAIL initially** (validated during development)
- [ ] **Test file locations**: Following Next.js patterns (`__tests__/`, `.test.ts/.test.tsx`)
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
- [ ] **Type checking**: Zero type errors (`npx tsc --noEmit`)
- [ ] **Lint compliance**: Zero lint violations (`npm run lint`)

### 🏗️ **Build & Test Validation**
- [ ] **Build validation**: `npm run build` → 100% PASS
- [ ] **Unit tests**: `npm test` → 100% PASS
- [ ] **Type checking**: `npx tsc --noEmit` → 100% PASS
- [ ] **Lint validation**: `npm run lint` → 100% PASS
- [ ] **Code formatting**: Consistent style (Prettier/ESLint)
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
- **Type**: `[TASK]` <!-- Should be a task issue created via planning -->

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
- [ ] **Next.js specific**: App Router patterns working correctly

#### **Automated Testing**
- [ ] **Unit tests**: All new functions and utilities tested
- [ ] **Component tests**: React components render and interact correctly
- [ ] **API tests**: API routes and serverless functions tested
- [ ] **Integration tests**: Database operations tested (if applicable)

### 📊 **Performance Impact**
- [ ] **Bundle size**: No significant increase in bundle size
- [ ] **Performance**: No performance regressions introduced
- [ ] **Database queries**: Optimized with proper indexes (Neon)
- [ ] **API response times**: Within target (< 200ms)
- [ ] **Serverless cold starts**: Acceptable startup times

### 🔒 **Security Considerations**
- [ ] **Input validation**: All user inputs validated and sanitized
- [ ] **Database security**: Parameterized queries, no injection risks
- [ ] **Environment variables**: No sensitive data in code
- [ ] **API security**: Proper authentication/authorization if applicable
- [ ] **AI Gateway**: Proper usage through Vercel AI Gateway (if applicable)

### 🔄 **Next.js & Vercel Integration**
- [ ] **App Router**: Proper usage of Next.js 13+ App Router patterns
- [ ] **Server Components**: Correctly implemented where applicable
- [ ] **API Routes**: Following `app/api/*/route.ts` pattern
- [ ] **Vercel Deployment**: No deployment blockers
- [ ] **Environment Variables**: Properly configured for Vercel

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
<summary>🤖 <strong>AI/Workflow Integration (Optional)</strong></summary>

### Vercel Workflow (if applicable)
- [ ] **Workflow triggers**: Correctly configured
- [ ] **Job tracking**: Proper job ID handling
- [ ] **Error propagation**: Errors bubble up correctly
- [ ] **Async processing**: Long-running tasks handled properly

### AI Integration (if applicable)
- [ ] **Model usage**: Correct models selected (Gemini flash/pro)
- [ ] **Rate limiting**: Proper limits implemented
- [ ] **Cost control**: AI Gateway usage optimized
- [ ] **Error handling**: Graceful AI service failures

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
npm run build        # ✅ Build validation: 100% PASS
npm test            # ✅ Test validation: 100% PASS
npm run lint         # ✅ Lint validation: 100% PASS
npx tsc --noEmit    # ✅ Type validation: 100% PASS
```

### 📋 **Review Focus Areas**

#### **TDD Methodology Review**
- [ ] **Test-first approach confirmed**: Tests exist before implementation
- [ ] **Minimal implementation**: No over-engineering beyond test requirements
- [ ] **Proper refactoring**: Code improvements maintain test coverage
- [ ] **Test quality**: Tests properly validate functionality and edge cases

#### **Next.js Code Quality Review**
- [ ] **App Router patterns**: Proper usage of Next.js App Router
- [ ] **TypeScript compliance**: Strict mode, comprehensive typing
- [ ] **Server/Client components**: Correct separation of concerns
- [ ] **API Routes**: Proper Next.js API route patterns

#### **Performance & Security Review**
- [ ] **Bundle optimization**: No unnecessary imports or large bundles
- [ ] **Security best practices**: Input validation, no hardcoded secrets
- [ ] **Database efficiency**: Optimized queries, proper indexes
- [ ] **Serverless optimization**: Cold start times, memory usage

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
2. Next.js App Router pattern adherence
3. Agent context completeness for future reference
4. Security and performance standards

---

*Generated with MiMiVibe Next.js TDD-First Workflow Template*