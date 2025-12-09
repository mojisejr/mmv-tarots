# Implementation Workflow Command

## Usage
```
/impl [task description] [issue-number]
/impl [issue-number]
```

## Implementation Workflow (TDD Red-Green-Refactor)

### 🔍 Phase 0: Analysis & Planning
1. **Analyze Requirement Carefully**
   - Break down the requirement into smaller, testable components
   - Identify what needs to be implemented vs what already exists
   - Determine success criteria and acceptance tests
   - Check if Neon DB connection or Vercel Workflow setup is needed

2. **Analyze Codebase & Dependencies**
   - Explore relevant code to understand existing patterns
   - Check app directory structure (Next.js App Router)
   - Verify if new dependencies need to be added to package.json
   - **STOP IMPLEMENTATION** if additional config/setup is required
   - Inform user about any missing prerequisites

3. **TDD Planning with Success Criteria**
   - Create comprehensive todo list with Red-Green-Refactor phases
   - Define what "success" looks like for each component
   - Plan test cases covering: happy path, edge cases, error handling
   - Consider testing framework for Next.js (Jest, Vitest, or Playwright)

### 🔴 Phase 1: RED - Write Failing Tests
1. **Write Tests BEFORE Implementation**
   - Create test files alongside implementation or in __tests__ directories
   - For API routes: test in app/api/__tests__/
   - For components: test in components/__tests__/ or using .test.tsx
   - For utilities: test in utils/__tests__/ or using .test.ts
   - Tests must clearly define expected behavior

2. **Verify Tests FAIL**
   - Run test suite to ensure all new tests FAIL (Red phase)
   - Verify error messages clearly indicate missing implementation
   - Confirm tests actually test the intended functionality

### 🟢 Phase 2: GREEN - Make Tests Pass
1. **Minimal Implementation**
   - Write the SIMPLEST code that makes tests pass
   - Focus on functionality over optimization
   - Do NOT refactor or optimize in this phase
   - Add just enough code to satisfy test requirements

2. **Continuous Test Execution**
   - Run tests after every small change
   - Fix failing tests immediately
   - **NEVER proceed to next test until current tests pass 100%**

### 🔵 Phase 3: REFACTOR - Improve Code Quality
1. **Code Improvement**
   - Refactor implementation for clarity and maintainability
   - Apply Next.js best practices and TypeScript strict typing
   - Use proper React patterns (hooks, Server/Client components)
   - Remove code duplication and improve structure

2. **Continuous Validation**
   - Run tests after EVERY refactor change
   - Ensure 100% test pass rate is maintained
   - Check TypeScript compilation: `npx tsc --noEmit`
   - Repeat Refactor phase until code quality meets standards

### 🔄 Phase 4: Final Quality Assurance
1. **Comprehensive Testing**
   - Run ENTIRE test suite (existing + new tests)
   - **MUST achieve 100% pass rate - NO failing tests allowed**
   - Verify test coverage is complete and meaningful

2. **Build & Lint Validation**
   - **Build MUST pass 100%**: `npm run build` - No build errors allowed
   - **Linter MUST pass 100%**: `npm run lint` - No warnings/errors allowed
   - **TypeScript MUST pass**: `npx tsc --noEmit` - No type errors allowed
   - Fix any issues before proceeding

### 📋 Branch Management (STAGING-ONLY POLICY)
- **MANDATORY**: Check current branch immediately upon command execution
- **FORBIDDEN**: NEVER code, implement, or modify files on main branch
- **REQUIRED**: ALWAYS work on staging branch ONLY
- **FEATURE BRANCHES**: Create from staging ONLY when needed
- **SAFETY CHECK**: If on main branch, IMMEDIATELY switch to staging
- **HARD STOP**: Command execution HALTS if cannot switch to staging

### 🤖 Multi-Agent Task Management
- Use Task tool with subagent_type='general-purpose' for complex tasks
- Use Task tool with subagent_type='Explore' for codebase exploration
- Use Task tool with subagent_type='Plan' for architecture planning
- Run agents in parallel when possible for efficiency

### 📊 Continuous Progress Tracking
- Use TodoWrite tool to track Red-Green-Refactor phases
- Mark tasks as in_progress and completed systematically
- Keep working until ALL phases are complete
- Never skip any test case or phase

### ✅ Git Commit Standards
- Run `git add .` after all phases complete successfully
- Create comprehensive commit messages that are:
  - Follow conventional commits: feat:, fix:, docs:, refactor:, etc.
  - Include scope: e.g., feat(api): add tarot prediction endpoint
  - Include issue reference: closes #123
  - Descriptive and readable for future reference
- Include context about what was changed and why

### 🚫 PR Policy
- NEVER create PRs automatically
- Only create PR when explicitly requested by user
- PRs should go to staging branch for review

## Implementation Commands

### When executing /impl command:

#### Step 1: Environment Setup (STAGING-ONLY ENFORCEMENT)
```bash
# MANDATORY: Check current branch FIRST
Bash git branch --show-current

# CRITICAL: If on main branch, IMMEDIATELY switch:
Bash git checkout staging

# FORBIDDEN: NEVER work on main branch
# - If branch is 'main', STOP ALL IMPLEMENTATION
# - Switch to staging BEFORE any coding
# - ONLY proceed if on staging or feature branch

# OPTIONAL: Create feature branch FROM staging:
Bash git checkout -b feature/task-123-description
```

#### Step 2: TDD Execution Flow
1. **Phase 0: Analysis**
   - Analyze requirement carefully
   - Check codebase and dependencies
   - Create comprehensive todo list with Red-Green-Refactor phases

2. **Phase 1: RED**
   - Write failing tests for ALL components
   - Use appropriate testing framework (Jest/Vitest/Playwright)
   - Run tests: `npm test` or specific test runner
   - Verify tests actually FAIL (100% red phase)

3. **Phase 2: GREEN**
   - Implement minimal code to make tests pass
   - Run tests continuously: `npm test` (watch mode)
   - **NEVER proceed until 100% tests pass**

4. **Phase 3: REFACTOR**
   - Refactor and optimize code
   - Apply Next.js best practices
   - Run tests after EVERY refactor
   - Check TypeScript: `npx tsc --noEmit`
   - Maintain 100% test pass rate throughout

5. **Phase 4: Quality Assurance**
   - Run build: `npm run build` (MUST pass 100%)
   - Run linter: `npm run lint` (MUST pass 100%)
   - Run TypeScript check: `npx tsc --noEmit` (MUST pass)
   - Run ALL tests: `npm test` (MUST pass 100%)
   - **MUST achieve 100% pass on ALL checks**

#### Step 3: Git Operations
```bash
Bash git add .  # After ALL phases complete
Bash git commit -m "feat(api): add tarot prediction endpoint

- Implement POST /api/predict for question submission
- Add GET /api/predict/[jobId] for status checking
- Integrate with Vercel Workflow for async processing
- Connect to Neon database for data persistence

Closes #123"
```

#### Step 4: Report Completion
- Document TDD phases completed
- Report final test coverage
- Confirm all quality checks passed
- Summarize what was implemented

## Next.js-Specific Considerations:

### File Structure Guidelines:
- **API Routes**: `app/api/*/route.ts` (for App Router)
- **Pages**: `app/*/page.tsx`
- **Layouts**: `app/*/layout.tsx`
- **Components**: `components/*/` or alongside pages
- **Utilities**: `lib/`, `utils/`, or `helpers/`
- **Types**: `types/` or inline with components

### Testing Patterns:
- **Components**: Use React Testing Library + Jest/Vitest
- **API Routes**: Test request/response with supertest
- **Database**: Use test database or mocks
- **Integration**: Playwright for E2E tests

### TypeScript Requirements:
- Always use strict mode
- Define interfaces for all props and data structures
- Use proper typing for API responses
- Leverage Next.js built-in types

## Example Execution Flow:
```
1. **MANDATORY**: Check branch → **IMMEDIATELY** switch to staging if on main
2. Phase 0: Analyze requirement & plan tests
3. Phase 1: RED → Write failing tests (verify they fail)
4. Phase 2: GREEN → Implement minimal code (100% tests pass)
5. Phase 3: REFACTOR → Apply Next.js best practices (maintain 100% pass)
6. Phase 4: QA → Build + Lint + TypeScript + All tests (100% pass)
7. Git add → Commit with conventional commit format
8. Report completion with metrics
```

## Critical Rules (NEVER VIOLATE):
- **TDD RED-GREEN-REFACTOR phases are MANDATORY**
- **100% test pass rate REQUIRED at every stage**
- **NEVER skip test cases - NO exceptions**
- **NEVER proceed with build/lint/test failures**
- **STAGING-ONLY POLICY: NEVER code on main branch - FORBIDDEN**
- **ALWAYS work on staging branch ONLY**
- **IMMEDIATELY switch from main to staging before ANY coding**
- **STOP execution if cannot switch to staging**
- **NEVER create PRs unless explicitly requested**
- **STOP if additional config/environment needed**
- **ALWAYS follow Next.js App Router conventions**
- **ALWAYS use TypeScript strict mode**

## Success Criteria:
- All tests written first (RED phase confirmed)
- Implementation makes all tests pass (GREEN phase)
- Code follows Next.js best practices (REFACTOR phase)
- 100% pass rate on: build, lint, TypeScript, ALL tests
- Comprehensive commit with conventional format
- No TypeScript errors or warnings