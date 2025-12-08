## Project Overview

**Project Name**: MiMiVibe - Tarot Reading Application

**Repository**: https://github.com/mojisejr/mmv-tarots

**Author**: mojisejr

**Description**: Serverless tarot reading application built with Next.js, featuring AI-powered tarot readings through Vercel Workflow orchestration. This document provides critical information for AI agents working on this project.

---

## ⚠️ CRITICAL SAFETY RULES

### 🚨 FORBIDDEN ACTIONS (NEVER ALLOWED)

- ❌ **NEVER merge PRs yourself** - Provide PR link and wait for user instructions
- ❌ **NEVER work on main branch** - Always use staging or feature branches
- ❌ **NEVER delete critical files** (.env, .git/, node_modules/, package.json, next.config.ts)
- ❌ **NEVER commit sensitive data** (API keys, passwords, secrets) - Use environment variables
- ❌ **NEVER skip 100% validation** (build, lint, test) - Must pass completely
- ❌ **NEVER use git push --force** - Only use --force-with-lease when absolutely necessary
- ❌ **NEVER implement without proper testing** - Follow TDD Red-Green-Refactor cycle

### 📁 MANDATORY TEMPORARY FILE MANAGEMENT (CRITICAL)

#### 🚨 STRICT .TMP FOLDER POLICY (NO EXCEPTIONS)

- ❌ **NEVER use system temp directories** (`/tmp/`, `$TEMP`, etc.)
- ❌ **NEVER create temporary files in project root or other folders**
- ✅ **ALWAYS create temporary files in `.tmp/` folder ONLY**
- ✅ **ALWAYS clean up `.tmp/` folder after each operation**
- ✅ **ALWAYS ensure `.tmp/` folder is in `.gitignore`**

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

---

## 🎯 Agent-Specific Guidelines

### For Code Generation Agents

1. **Next.js App Router Patterns**:
   - Use `app/` directory structure
   - API routes: `app/api/*/route.ts`
   - Pages: `app/*/page.tsx`
   - Layouts: `app/*/layout.tsx`

2. **TypeScript Requirements**:
   - Always use strict mode
   - Define interfaces for all data structures
   - Use proper typing for API responses
   - Leverage Next.js built-in types

3. **React Best Practices**:
   - Server Components by default
   - Client Components with `'use client'` directive
   - Proper state management patterns
   - Accessibility considerations

### For Database/Backend Agents

1. **Neon PostgreSQL Integration**:
   - Use connection pooling
   - Parameterized queries only
   - Handle connection errors gracefully
   - Use JSONB for flexible data storage

2. **Vercel Workflow Integration**:
   - Workflow files in `app/workflows/`
   - Handle long-running AI tasks
   - Implement proper error handling
   - Use job tracking with unique IDs

### For AI/ML Integration Agents

1. **Vercel AI SDK Usage**:
   - Import from `ai` package
   - Use AI Gateway for model access
   - Implement proper streaming for long responses
   - Handle rate limiting gracefully

2. **Model Selection Guidelines**:
   - Gatekeeper/Analyst: `google-gemini-flash`
   - Mystic (Main Reading): `google-gemini-pro` or `gpt-4o`
   - Always use AI Gateway for cost control

### For Testing Agents

1. **Testing Framework**:
   - Jest for unit/integration tests
   - React Testing Library for components
   - Playwright for E2E tests
   - Mock external dependencies

2. **Test Organization**:
   - Co-locate tests: `__tests__/` directories
   - Test naming: `*.test.ts` or `*.test.tsx`
   - Coverage goal: 80%+
   - Test critical paths thoroughly

---

## 📊 Agent Communication Standards

### Response Quality

1. **Be Precise**: Reference actual file names and code locations
2. **Show Context**: Explain why specific approaches are chosen
3. **Provide Examples**: Include code snippets when helpful
4. **Security First**: Always consider security implications

### Code Reviews

1. **Check TypeScript Types**: Ensure all code is properly typed
2. **Validate Next.js Patterns**: Ensure App Router best practices
3. **Verify Error Handling**: Check for proper error boundaries
4. **Performance Considerations**: Ensure efficient rendering

### Task Completion

1. **Full Implementation**: Complete all requested features
2. **Testing Included**: Provide tests for new code
3. **Documentation**: Update relevant documentation
4. **Verification**: Ensure build/lint/tests pass

---

## 🏗️ Project Context for Agents

### Current Tech Stack
- **Frontend**: Next.js 16 + React 19 + TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: Neon (PostgreSQL) with Vercel integration
- **AI**: Vercel AI Gateway + AI SDK (Google Gemini)
- **Orchestration**: Vercel Workflows
- **Deployment**: Vercel

### Project Status
- ✅ Project initialized with Next.js
- ✅ PRD documented and finalized
- ✅ Commands updated for Next.js ecosystem
- ⏳ Database schema designed (not yet implemented)
- ⏳ AI pipeline architecture defined (not yet implemented)
- ⏳ Testing framework to be set up

### Key Files to Understand
- `docs/PRD.md` - Complete product requirements
- `package.json` - Current dependencies and scripts
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript strict mode configuration

---

## 🚀 Agent Task Examples

### When Asked to "Implement API Endpoint":

```typescript
// Expected pattern for app/api/predict/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Validation and processing logic
    return NextResponse.json({ jobId: 'uuid-here' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
```

### When Asked to "Create Component":

```tsx
// Expected pattern for components/TarotCard.tsx
interface TarotCardProps {
  name: string
  image: string
  interpretation?: string
}

export default function TarotCard({ name, image, interpretation }: TarotCardProps) {
  return (
    <div className="tarot-card">
      <img src={image} alt={name} />
      <h3>{name}</h3>
      {interpretation && <p>{interpretation}</p>}
    </div>
  )
}
```

### When Asked to "Set Up Database":

```typescript
// Expected pattern for lib/db.ts
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function getPredictions() {
  const data = await sql`SELECT * FROM predictions ORDER BY created_at DESC`
  return data
}
```

---

## 📋 Quick Reference for Agents

### Common Imports
```typescript
// Next.js
import { NextRequest, NextResponse } from 'next/server'
import { headers, cookies } from 'next/headers'

// Database
import { neon } from '@neondatabase/serverless'

// AI SDK
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

// Testing
import { render, screen } from '@testing-library/react'
```

### Environment Variables
- `NEON_DATABASE_URL` - Neon database connection
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI API key
- `AI_GATEWAY_SECRET` - Vercel AI Gateway (optional)

### Package Scripts
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest"
}
```

---

_This document provides essential context for AI agents to work effectively on the MiMiVibe tarot reading application._