# Atomic Task Issue Template for Next.js Development
**Template for creating explicit atomic tasks that can be executed independently**

---

## 🚨 CRITICAL: ATOMIC TASK PRINCIPLES

### ✅ ATOMIC TASK CHARACTERISTICS
- **Single Responsibility**: One clear, deliverable outcome
- **Independent Execution**: No dependency chains or multiplexing
- **Complete Isolation**: Each task creates its own feature branch
- **100% Self-Contained**: All requirements and specifications included
- **Build Validation**: Must pass `npm run build` with 100% success
- **Zero Linter Errors**: Must pass `npm run lint` with zero violations
- **TypeScript Safe**: Must pass `npx tsc --noEmit` with zero errors

### 🚫 FORBIDDEN PATTERNS
- ❌ **Chain Dependencies**: Task B depending on Task A completion
- ❌ **Multiplexing**: Multiple features in single task
- ❌ **Phase Sequencing**: "This depends on Phase X completion"
- ❌ **Incremental Builds**: Build failures allowed as intermediate steps
- ❌ **Shared Branches**: Multiple tasks on same feature branch

---

## 📋 Atomic Task Template Structure

### Title Format
```
[TASK-XXX-X] Atomic: [Single Deliverable Description]
```

### Body Template
```markdown
## [TASK-XXX-X] Atomic: [Single Deliverable]

### 🤖 EXECUTION MODE: [MANUAL] (MANDATORY)
**Current Mode**: MANUAL
- **MANUAL**: Human implementation required using /impl command

### 🎯 SINGLE OBJECTIVE (MANDATORY)
**Complete this one specific deliverable end-to-end:**
- [EXACT single outcome this task must achieve]
- No additional features or modifications allowed

### 🧪 TEST-FIRST REQUIREMENTS (MANDATORY)
**Tests to write BEFORE code implementation:**
- [ ] Unit test: [test name] - [what should pass]
- [ ] Integration test: [test name] - [API/service behavior]
- [ ] Component test: [test name] - [UI component behavior]

**Test Acceptance Criteria:**
- [ ] Tests must fail initially (Red phase - before implementation)
- [ ] Tests document expected behavior
- [ ] All tests pass after implementation (Green phase)
- [ ] Code is refactored while tests remain passing (Refactor phase)

### 📦 DELIVERABLE (MANDATORY)
**This task creates ONE complete deliverable:**
- **File(s) Created**: [exact file paths that will be created]
- **Functionality Added**: [single specific functionality]
- **Integration Points**: [where this connects to existing code]

### 🏗️ TECHNICAL REQUIREMENTS
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Neon PostgreSQL
- **AI Integration**: Vercel AI Gateway + AI SDK (if applicable)
- **Testing**: Jest + React Testing Library
- **Orchestration**: Vercel Workflows (if applicable)

### 📁 FILES TO CREATE (EXACT LIST)
```
app/[exact-path]/[filename].tsx
app/[exact-path]/[filename].test.tsx
lib/[exact-path]/[service].ts
lib/[exact-path]/[service].test.ts
```

### 🔧 EXACT IMPLEMENTATION REQUIREMENTS
- **No modifications to existing files** (unless specified)
- **Complete TypeScript interfaces** for all data structures
- **Comprehensive error handling** with user-friendly messages
- **Loading states** for all async operations
- **Accessibility compliance** (WCAG 2.1 AA)
- **Mobile-first responsive design**

### 💾 DATABASE OPERATIONS (IF APPLICABLE)
```sql
-- EXACT SQL to execute (if any)
CREATE TABLE IF NOT EXISTS [table_name] (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- exact column definitions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 🎨 UI/UX REQUIREMENTS (IF APPLICABLE)
- **Design System**: Follow Tailwind CSS patterns
- **Mobile Optimization**: 320px minimum width
- **Large Touch Targets**: 44px minimum
- **High Contrast**: 4.5:1 minimum color contrast ratio
- **Reduced Motion**: Respect prefers-reduced-motion

### 🤖 AI INTEGRATION (IF APPLICABLE)
- **Vercel AI SDK**: Use proper streaming patterns
- **Model Selection**:
  - Gatekeeper/Analyst: `google-gemini-flash`
  - Mystic (Main): `google-gemini-pro` or `gpt-4o`
- **Error Handling**: Graceful AI service failures
- **Rate Limiting**: Implement per-user limits

### 🔄 VERCEL WORKFLOW (IF APPLICABLE)
- **Workflow Location**: `app/workflows/[name].ts`
- **Job Tracking**: Unique job ID for async operations
- **Status Updates**: PENDING → PROCESSING → COMPLETED/FAILED
- **Error Recovery**: Proper error propagation

### ✅ ACCEPTANCE CRITERIA (100% MANDATORY)
- [ ] Build command passes successfully (`npm run build`) - ZERO errors/warnings
- [ ] Lint command passes with zero violations (`npm run lint`)
- [ ] TypeScript compilation passes (`npx tsc --noEmit`) - ZERO errors
- [ ] All tests pass (`npm test`) with ZERO failures
- [ ] Test-first implemented (tests written before code)
- [ ] Red-Green-Refactor cycle followed
- [ ] Single deliverable works end-to-end
- [ ] No unintended side effects
- [ ] Code follows Next.js App Router patterns

### 🔄 GIT WORKFLOW (MANDATORY)
- **Branch Name**: `feature/task-[XXX]-[X]-[description]`
- **Source Branch**: MUST branch from latest `staging`
- **No Merge Conflicts**: Branch must be clean and mergeable
- **Commit Format**:
  ```
  feat: [single deliverable]

  - Address TASK-XXX-X: [task title]
  - Test-first: Tests written before implementation
  - TDD cycle: Red → Green → Refactor
  - Build: 100% PASS (0 errors, 0 warnings)
  - Lint: 100% PASS (0 violations)
  - TypeScript: 100% PASS
  - Tests: 100% PASS (0 failures)

  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

### 🚨 VALIDATION CHECKLIST (MANDATORY BEFORE COMMIT)
- [ ] **TDD RED PHASE**: Tests written FIRST and failing
- [ ] **TDD GREEN PHASE**: Implementation makes all tests pass
- [ ] **TDD REFACTOR PHASE**: Code improved while tests pass
- [ ] `npm run build` → ZERO errors or warnings
- [ ] `npm run lint` → ZERO violations
- [ ] `npx tsc --noEmit` → ZERO type errors
- [ ] `npm test` → All tests PASS
- [ ] No console errors in browser
- [ ] Mobile responsive (if UI component)

### 📖 IMPLEMENTATION INSTRUCTIONS
**Follow exactly these steps:**

1. **Create Feature Branch** (MANDATORY):
   ```bash
   git checkout staging
   git pull origin staging
   git checkout -b feature/task-[XXX]-[X]-[description]
   ```

2. **Use /impl Command** (MANDATORY):
   ```bash
   /impl [task description from title]
   ```

3. **Follow TDD Workflow** (automated by /impl):
   - RED: Write failing tests
   - GREEN: Minimal implementation
   - REFACTOR: Code quality improvements
   - VALIDATION: Build, lint, type-check, tests

### 🔗 RELATED CONTEXT (NO DEPENDENCIES)
- **Context Issue**: #[ISSUE-XXX] (for reference only)
- **No Task Dependencies**: This task must be executable independently
- **Reference Materials**:
  - `docs/PRD.md` - Product requirements
  - `.claude/commands/impl.md` - Implementation guide

**Assign to**: [developer name]
**Labels**: `atomic`, `nextjs`, `typescript`, `independent-execution`
```

---

## 🚀 Atomic Task Examples

### Example 1: API Route Creation
```markdown
## [TASK-001-1] Atomic: Create Tarot Prediction API Endpoint

### 🤖 EXECUTION MODE: MANUAL
**Current Mode**: MANUAL

### 🎯 SINGLE OBJECTIVE
**Complete this one specific deliverable end-to-end:**
- Create POST /api/predict endpoint for tarot question submission

### 📦 DELIVERABLE
**This task creates ONE complete deliverable:**
- **File(s) Created**: `app/api/predict/route.ts`, `app/api/predict/route.test.ts`
- **Functionality Added**: API endpoint for submitting tarot questions
- **Integration Points**: Connects to Vercel Workflow trigger

### 📁 FILES TO CREATE
```
app/api/predict/route.ts
app/api/predict/__tests__/route.test.ts
```

### 🔧 EXACT IMPLEMENTATION REQUIREMENTS
- Accept POST requests with JSON body: `{ question: string }`
- Validate question length (8-180 characters)
- Return job ID for async processing
- Trigger Vercel Workflow with question data
- Error handling for invalid requests

### ✅ ACCEPTANCE CRITERIA
- [ ] `npm run build` passes with ZERO errors
- [ ] `npm run lint` passes with ZERO violations
- [ ] `npx tsc --noEmit` passes
- [ ] Tests pass with ZERO failures
- [ ] API accepts valid requests
- [ ] API rejects invalid requests
- [ ] Vercel Workflow triggered correctly

**Assign to**: [developer]
**Labels**: `atomic`, `api`, `nextjs`, `typescript`
```

### Example 2: React Component Creation
```markdown
## [TASK-002-1] Atomic: Create TarotCard Component

### 🤖 EXECUTION MODE: MANUAL
**Current Mode**: MANUAL

### 🎯 SINGLE OBJECTIVE
**Complete this one specific deliverable end-to-end:**
- Create reusable TarotCard component for displaying tarot cards

### 📦 DELIVERABLE
**This task creates ONE complete deliverable:**
- **File(s) Created**: `components/TarotCard.tsx`, `components/TarotCard.test.tsx`
- **Functionality Added**: Display tarot card with image and name
- **Integration Points**: Can be imported throughout the app

### 📁 FILES TO CREATE
```
components/TarotCard.tsx
components/__tests__/TarotCard.test.tsx
```

### 🎨 UI/UX REQUIREMENTS
- Card image display with fallback
- Card name in Thai and English
- Responsive design for mobile
- Touch-friendly for selection
- Accessibility with ARIA labels

### ✅ ACCEPTANCE CRITERIA
- [ ] `npm run build` passes with ZERO errors
- [ ] `npm run lint` passes with ZERO violations
- [ ] `npx tsc --noEmit` passes
- [ ] Tests pass with ZERO failures
- [ ] Component renders correctly
- [ ] Mobile responsive
- [ ] Accessible

**Assign to**: [developer]
**Labels**: `atomic`, `component`, `react`, `typescript`
```

---

## 📝 Atomic Task Creation Guidelines

### 1. Single Deliverable Focus
- **One Thing Only**: Each task creates exactly one deliverable
- **Complete End-to-End**: Deliverable must be fully functional
- **No Partial Work**: Don't split logical units

### 2. Complete Independence
- **No Dependencies**: Task must not require other tasks
- **Self-Contained**: All requirements in single issue
- **Standalone**: Can execute without context from other tasks

### 3. Next.js Specific Patterns
- **App Router Structure**: Use `app/` directory patterns
- **Server Components**: Default to server components
- **API Routes**: Use `app/api/*/route.ts` pattern
- **TypeScript**: Strict mode, comprehensive typing

### 4. Quality Standards
- **Build Success**: `npm run build` must pass completely
- **Lint Clean**: `npm run lint` must have zero violations
- **Type Safe**: `npx tsc --noEmit` must pass
- **Tests Pass**: `npm test` must have zero failures

---

*Last Updated: 2025-12-08*
*Repository: mojisejr/mmv-tarots*