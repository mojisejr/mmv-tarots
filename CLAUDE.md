## Project Overview

**Project Name**: MiMiVibe - Tarot Reading Application

**Repository**: https://github.com/mojisejr/mmv-tarots

**Author**: mojisejr

**Description**: Serverless tarot reading application built with Next.js, featuring AI-powered tarot readings through Vercel Workflow orchestration. The application uses a "fire-and-forget" architecture to handle long-running AI processing without requiring users to keep their browsers open.

---

## ⚠️ CRITICAL SAFETY RULES

### 🚨 FORBIDDEN ACTIONS (NEVER ALLOWED)

#### 🚨 CODE IMPLEMENTATION - ABSOLUTELY FORBIDDEN (EXCEPT `/impl`)

- ❌ **NEVER CODE, IMPLEMENT, WRITE, EDIT, OR REFACTOR ANY CODE unless `/impl` command is used**
- ❌ **NEVER write even a single line of code without `/impl` command**
- ❌ **NEVER create, modify, or delete any files without `/impl` command**
- ❌ **NEVER use Write, Edit, NotebookEdit tools without `/impl` command**
- ❌ **NEVER run implementation commands (npm install, etc.) without `/impl` command**
- ✅ **ONLY ALLOWED TO CODE**: When user explicitly uses `/impl` command
- ✅ **DEFAULT STATE**: READ-ONLY MODE (analyze, report, recommend, but NEVER implement)

#### 📋 General Prohibited Actions

- ❌ **NEVER merge PRs yourself** - Provide PR link and wait for user instructions
- ✅ **ALLOWED to commit and push to staging branch** - Only after `/impl` implementation
- ✅ **ALLOWED to create PRs to staging** - After successful `/impl` implementation and QA
- ❌ **NEVER work on main branch** - Always use staging or feature branches
- ❌ **NEVER delete critical files** (.env, .git/, node_modules/, package.json, next.config.ts)
- ❌ **NEVER commit sensitive data** (API keys, passwords, secrets) - Use environment variables
- ❌ **NEVER write sensitive data in GitHub issues, PRs, or commit files** - Use placeholders like [REDACTED] or [API_KEY]
- ❌ **NEVER skip 100% validation** (build, lint, test) - Must pass completely
- ❌ **NEVER use git push --force** - Only use --force-with-lease when absolutely necessary
- ❌ **NEVER implement without proper testing** - Follow TDD Red-Green-Refactor cycle (with `/impl`)

### 📁 MANDATORY TEMPORARY FILE MANAGEMENT (CRITICAL)

#### 🚨 STRICT .TMP FOLDER POLICY (NO EXCEPTIONS)

- ❌ **NEVER use system temp directories** (`/tmp/`, `$TEMP`, etc.)
- ❌ **NEVER create temporary files in project root or other folders**
- ✅ **ALWAYS create temporary files in `.tmp/` folder ONLY**
- ✅ **ALWAYS clean up `.tmp/` folder after each operation**
- ✅ **ALWAYS ensure `.tmp/` folder is in `.gitignore`**

#### 🎯 ENFORCED TEMPORARY FILE WORKFLOW

**1. Pre-Operation Setup**:
```bash
# ALWAYS create .tmp folder if it doesn't exist
mkdir -p .tmp
# ALWAYS ensure .tmp/ is in .gitignore
echo ".tmp/" >> .gitignore
```

**2. Temporary File Creation**:
```bash
# ALWAYS use project .tmp folder
echo "content" > .tmp/temp-file.md
# NEVER use system temp
# echo "content" > /tmp/temp-file.md  ❌ FORBIDDEN
```

**3. Post-Operation Cleanup**:
```bash
# ALWAYS clean up .tmp folder after operation
rm -rf .tmp/*
# or for specific files
rm .tmp/temp-file.md
```

#### 🔍 AUTOMATIC VERIFICATION

All operations MUST:
1. Check `.tmp/` folder exists before operation
2. Create temporary files ONLY in `.tmp/` folder
3. Clean up `.tmp/` folder immediately after use
4. Verify cleanup success before completion

### 📋 MANDATORY WORKFLOW RULES

- ✅ **ALWAYS** sync staging branch before any implementation: `git checkout staging && git pull origin staging`
- ✅ **ALWAYS** create feature branch for new work: `git checkout -b feature/[description]`
- ✅ **ALWAYS** ensure 100% build success before commit: `npm run build`
- ✅ **ALWAYS** ensure 100% lint pass before commit: `npm run lint`
- ✅ **ALWAYS** ensure TypeScript compilation: `npx tsc --noEmit`
- ✅ **ALWAYS** run tests before commit: `npm test`
- ✅ **ALWAYS** use `.tmp/` folder for temporary files and clean up immediately after use

---

## 📊 Response Quality Standards (MANDATORY)

### 1. **On-Point**
- Answer only what was asked
- No out-of-scope information
- Cut unnecessary details

### 2. **Good Context Ordering**
- Simple to complex progression
- Start with robust answer first
- Gradually increase complexity
- Order information for easy comprehension

### 3. **Exact Details**
- Provide accurate and specific information
- Reference actual file, function, variable names
- No hallucinating about code or structure
- Verify assumptions before answering

### 4. **Security-First Focus**
- Always consider security implications
- Recommend secure approach first
- Warn about potential risks
- Explain why approach is secure

### 5. **Senior Developer Mindset**
- Provide unbiased feedback
- Answer directly and straightforwardly
- Demonstrate expertise in domain
- Use best practices for technology stack

---

## 🌐 Response Language Policy

### Thai-Only Responses (MANDATORY)

- **ALL responses MUST be in Thai language** - ไม่ว่าผู้ใช้จะถามเป็นภาษาใด
- **User asks in English** → Respond in Thai
- **User asks in Thai** → Respond in Thai
- **User asks in any language** → Respond in Thai
- **Technical terms** → Keep English terms in parentheses (Next.js, TypeScript, Neon, etc.)

### ตัวอย่าง / Examples

**User (English)**: "Why is the AI pipeline failing?"
**Agent (Thai)**: "จากการวิเคราะห์ AI pipeline ใน `app/workflows/` พบว่า..."

**User (Thai)**: "ทำไม AI pipeline ถึง fail ?"
**Agent (Thai)**: "จากการวิเคราะห์ AI pipeline ใน `app/workflows/` พบว่า..."

**User (Japanese)**: "AIパイプラインが失敗するのはなぜですか？"
**Agent (Thai)**: "จากการวิเคราะห์ AI pipeline ใน `app/workflows/` พบว่า..."

---

## 🏗️ Technical Architecture

### Core Stack
**Language**: TypeScript • **Framework**: Next.js (App Router) • **Database**: Neon (PostgreSQL) • **AI**: Vercel AI Gateway + AI SDK • **Orchestration**: Vercel Workflow • **Deploy**: Vercel

### Project Structure

```
mmv-tarots/
├── README.md                   # Project overview and quick start
├── docs/
│   └── PRD.md                  # Product Requirements Document
├── app/                        # Next.js App Router
│   ├── api/                    # API routes
│   │   └── predict/            # Tarot prediction endpoints
│   ├── workflows/              # Vercel Workflow definitions
│   │   └── tarot.ts           # AI pipeline workflow
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   └── globals.css            # Global styles
├── components/                 # React components
├── lib/                       # Utilities and configurations
├── public/                    # Static assets
│   └── cards/                 # Tarot card images
├── .env.example               # Environment variables template
├── package.json               # Dependencies and scripts
├── next.config.ts             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
└── tailwind.config.ts         # Tailwind CSS configuration
```

### Database Schema

```sql
CREATE TABLE predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_identifier TEXT,
  question TEXT NOT NULL,
  job_id TEXT,
  status TEXT DEFAULT 'PENDING',
  analysis_result JSONB,
  selected_cards JSONB,
  final_reading JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### Git Branch Strategy

```
main              ←─ DEVELOPER (manual merge)
  │                └─ Production-ready code
staging ←───────   ←─ FEATURE BRANCHES (PRs)
  │                └─ Integration testing
feature/*         ←─ Development work
```

### Key Features

- **AI Tarot Readings**: 4-step Agent Pipeline (Gatekeeper → Analyst → Dealer → Mystic)
- **Async Processing**: Vercel Workflow handles long-running AI tasks
- **Fire-and-Forget**: Submit question, get job ID, check results later
- **Serverless Architecture**: Fully scalable with Vercel and Neon
- **Type-Safe**: Full TypeScript implementation

### Development Commands

```bash
npm run dev           # Development server (http://localhost:3000)
npm run build         # Production build
npm run start         # Start production server
npm run lint          # ESLint checks
npx tsc --noEmit      # TypeScript type checking
npm test              # Run tests (when configured)
```

### Performance Metrics

- **API Response Time**: < 200ms (p95)
- **AI Processing**: 1-2 minutes (async via Vercel Workflow)
- **Concurrent Users**: 100+ (serverless scaling)
- **Database**: Neon PostgreSQL with auto-scaling
- **Monthly Cost**: ~$50-100 (Vercel + Neon + AI Gateway)

---

## 🧪 Test-Driven Development (TDD) System

### 🔴🟢🔵 Red-Green-Refactor Cycle (MANDATORY)

#### 🔴 Red Phase (Tests First)
- **Write failing tests** for functionality
- Tests document expected behavior before code exists
- Run: `npm test` → tests FAIL (no implementation yet)

#### 🟢 Green Phase (Minimal Implementation)
- **Write minimal code** to make tests pass
- Don't implement extra features
- Run: `npm test` → tests PASS

#### 🔵 Refactor Phase (Improve Code)
- **Refactor for clarity and maintainability**
- Keep tests passing while improving
- Run: `npm test` → tests still PASS
- Run: `npm run lint` → zero warnings
- Run: `npx tsc --noEmit` → no type errors

### Testing Framework (To Be Set Up)

```bash
# Install testing dependencies
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D @types/jest jest-environment-jsdom ts-jest
```

### Test Organization

```
app/
├── api/
│   └── __tests__/          # API route tests
├── __tests__/              # Page/layout tests
components/
└── __tests__/              # Component tests
lib/
└── __tests__/              # Utility tests
```

---

## 🎯 Quality Standards

### Code Quality Requirements

- **TypeScript**: Strict mode enabled (eliminates entire classes of bugs)
- **ESLint**: Zero warnings (enforced)
- **Build**: 100% success rate before commit
- **Tests**: Unit tests for critical paths (API, utilities)
- **React**: Follow Next.js App Router best practices

### API Quality Standards

- **Response Times**: p95 < 200ms for all endpoints
- **Error Handling**: Structured JSON errors with proper status codes
- **Input Validation**: Validate all user inputs
- **Environment Variables**: Use Vercel-managed secrets
- **HTTPS Only**: Automatic in production

### Security Standards

- **Secrets Management**: Use Vercel Environment Variables
- **Database Access**: Use connection pooling with Neon
- **Input Validation**: Comprehensive validation for all inputs
- **AI Gateway**: Use Vercel AI Gateway for model access control
- **Rate Limiting**: Implement per-user limits

---

## 📋 Available Commands

### Implementation Commands

```bash
/impl [task description]        # Implementation workflow with TDD
/run-test [type]               # Run tests (api, component, unit, e2e)
```

### Command Execution Flow

**When using /impl:**
1. Check current branch (must be staging)
2. Create feature branch
3. Phase 0: Analysis & Planning
4. Phase 1: RED - Write failing tests
5. Phase 2: GREEN - Minimal implementation
6. Phase 3: REFACTOR - Improve code quality
7. Phase 4: QA - Build + Lint + Type check + Tests
8. Commit with conventional format

**When using /run-test:**
1. Check if testing framework is configured
2. Execute appropriate npm script
3. Report test results and coverage

---

## Git Operations Policy

### ✅ ALLOWED Actions
- **Commit to staging branch**: For iterative development
- **Push to staging branch**: To save progress
- **Create PRs to staging**: For code review and tracking

### ❌ FORBIDDEN Actions
- **Push to main branch**: Direct pushes not allowed
- **Merge PRs to main**: Requires user approval
- **Force push**: Only use `--force-with-lease` when absolutely necessary

### Standard Git Workflow
```bash
# After completing implementation and QA
git add .
git commit -m "feat(scope): description

- Changes made
- Tests added/updated
- QA checks passed (build, lint, test, types)

Closes #123"

# Push to staging
git push origin staging

# Optional: Create PR for review
gh pr create --base staging --title "Feature Title" --body "Description of changes"
```

---

## 📚 Key Documentation

- **PRD**: `docs/PRD.md` - Complete product requirements
- **Implementation Guide**: `.claude/commands/impl.md`
- **Testing Guide**: `.claude/commands/run-test.md`

---

_This document focuses on agent-critical information for efficient Next.js development workflow execution and safe development practices._