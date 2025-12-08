## Project Overview

**Project Name**: [PROJECT_NAME] (Workflow Template)

**Repository**: [REPOSITORY_URL]
**Author**: [AUTHOR_NAME] <[EMAIL]>

**Description**: Generic, reusable agent workflow and implementation template. Use this repository to document mandatory agent safety rules, workflow commands, templates, and the implementation checklist used by automated agents and developers. Replace placeholders with project-specific metadata when adapting this template.

---

## ⚠️ CRITICAL SAFETY RULES

### 🚨 FORBIDDEN ACTIONS (NEVER ALLOWED)

- ❌ **NEVER merge PRs yourself** - Provide PR link and wait for user instructions
- ❌ **NEVER work on main/staging branches** - Always use feature branches
- ❌ **NEVER delete critical files** (.env, .git/, node_modules/, package.json, lib/database/)
- ❌ **NEVER commit sensitive data** (API keys, passwords, secrets) - Use environment variables
- ❌ **NEVER skip 100% validation** (build, lint, test) - Must pass completely
- ❌ **NEVER use git push --force** - Only use --force-with-lease when absolutely necessary
- ❌ **NEVER implement without task issue** - Must use =plan command first

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

**4. GitHub Issue Content Creation**:
```bash
# ALWAYS use .tmp folder for issue content drafts
echo "Issue content" > .tmp/issue-content.md
# Create GitHub issue using .tmp file
gh issue create --title "Title" --body-file .tmp/issue-content.md
# ALWAYS clean up immediately
rm .tmp/issue-content.md
```

#### 🔍 AUTOMATIC VERIFICATION

All commands MUST:
1. Check `.tmp/` folder exists before operation
2. Create temporary files ONLY in `.tmp/` folder
3. Clean up `.tmp/` folder immediately after use
4. Verify cleanup success before completion

### 📋 MANDATORY WORKFLOW RULES

- ✅ **ALWAYS** sync staging branch before any implementation: `git checkout staging && git pull origin staging`
- ✅ **ALWAYS** verify task issue exists: `#[issue-number]` before `=impl`
- ✅ **ALWAYS** use feature branch naming: `feature/task-[issue-number]-[description]`
- ✅ **ALWAYS** ensure 100% build success before commit: `[build command]`
- ✅ **ALWAYS** ensure 100% lint pass before commit: `[lint command]`
- ✅ **ALWAYS** use template-guided workflow with proper context validation
- ✅ **ALWAYS** verify code formatting: `[format command]`
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

### Automatic Language Matching (MANDATORY)

- **If user asks in Thai** → Respond in Thai (ยกเว้น technical terms)
- **If user asks in English** → Respond in English
- **Mixed language** → Follow the primary language of the question
- **Technical terms** → Always use English (Rust, Cargo, PostgreSQL, etc.)

### Examples

**User (Thai)**: "ทำไม queue ถึง fail ?"
**Agent (Thai)**: "จากการวิเคราะห์ queue system ใน `src/queue/` พบว่า..."

**User (English)**: "Why is the queue failing?"
**Agent (English)**: "After analyzing the queue system in `src/queue/`, I found..."

**User (Mixed)**: "explain ว่า database connection pool ทำงานยังไง"
**Agent (Thai)**: "Connection pool ใน database ทำงานแบบ... (code examples use English)"

---

## 📋 Workflow System

### Template Integration

**Context Issue Template** - `/docs/ISSUE-TEMP.md`:

- Used for: `=fcs > [topic-name]` or `=fcs > [CONTEXT]`
- **ALWAYS creates GitHub Issue** - Never creates local .md files
- Creates living document for iterative discussion
- Contains: DISCUSSION LOG, ACCUMULATED CONTEXT, PLANNING READINESS CHECKLIST

**Task Issue Template** - `/docs/TASK-ISSUE-TEMP.md`:

- Used for: `=plan > [task description]`
- **ALWAYS creates GitHub Issue** - Never creates local .md files
- Creates atomic tasks based on current mode (MANUAL/COPILOT)
- Contains: EXECUTION MODE field, 100% validation requirements

**Knowledge Issue Template** - `/docs/KNOWLEDGE-TEMP.md`:

- Used for: `=kupdate [category] "[topic]"`
- **ALWAYS creates GitHub Issue** - Never creates local .md files
- Creates structured knowledge entries with AI honest feedback
- Contains: Problem → Solution → Lessons Learned → Links

### Mode-Based Execution System

**Default Mode**: MANUAL (agent implementation)

**Mode Commands**:

```bash
/mode manual     # Tasks assigned to agent (Claude)
/mode copilot     # Tasks assigned to @copilot
/mode status      # Show current execution mode
```

**Mode-Specific Behavior**:

- **MANUAL Mode**: `/plan` creates tasks assigned to agent, `/impl` triggers agent implementation using code editing tools
- **COPILOT Mode**: `/plan` creates tasks assigned to @copilot, `/impl` triggers copilot implementation

### Core Commands

**✅ NEW: Claude Code Slash Commands Implemented!**
All workflow commands are now available as proper Claude Code slash commands (markdown files in `.claude/commands/`).

```bash
# Project Setup
/init                          # Initialize workflow template for current project (IMPORTANT: Run first!)

# Mode Management
/mode [manual|copilot|status]  # Set or show execution mode

# Analysis & Planning
/pck [issue-number]            # Plan check - analyze task before impl
/aud [question]                # Audit - analyze codebase and answer

# Context Management
/fcs [topic-name]              # Create new Context GitHub Issue
/fcs list                      # Show all active Context Issues

# Task Management
/plan [task description]       # Create detailed Task GitHub Issue using docs/TASK-ISSUE-TEMP.md
/plan2 [task description]      # Create rapid Task GitHub Issue with complexity validation
/impl [issue-number]           # Implementation workflow for specific GitHub issue
/impl [issue-number] [msg]     # Implementation with additional context
/pr [feedback]                 # Create Pull Request from feature branch (to staging)

# Knowledge Management
/khub                          # 🔍 Read Knowledge Hub (MANDATORY first step)
/kupdate [category] "[topic]"  # Create Knowledge GitHub Issue (CHECK existing numbers!)
/klink [knowledge-issue-number] # Link knowledge entry to Knowledge Hub
/ksync                         # Synchronize Knowledge Hub with all entries
/ksearch "[query]"             # Search across all knowledge entries
/krecent                       # Show last 5 knowledge updates
/kcategory [category]          # Show knowledge for specific category

# Other Commands
/rrr [message]                 # Create daily retrospective GitHub Issue

# Legacy = Commands (still supported for backward compatibility)
=fcs > [topic-name]           # Create new Context GitHub Issue
=plan > [task description]    # Create Task GitHub Issue
=impl > [issue-number]        # Implementation workflow
=khub                         # Read Knowledge Hub
# ... (all other = commands still work)
```

### Claude Code Slash Command Features

- **Proper Implementation**: Markdown files in `.claude/commands/` directory
- **Claude Integration**: Processed and executed by Claude Code
- **Rich Documentation**: Each command includes comprehensive usage, examples, and implementation details
- **Error Handling**: Clear error messages and helpful suggestions
- **Validation**: Automatic checking of prerequisites and dependencies
- **Help System**: All commands support help via detailed documentation

### Command Structure

All slash commands follow this structure:
- **Usage**: Clear syntax and parameter description
- **Examples**: Practical usage scenarios
- **Implementation**: Step-by-step execution details
- **Integration**: How commands work together
- **Error Handling**: Common issues and solutions
- **Files**: Related files and dependencies

### Template-Driven Workflow Process

**🚀 Phase 0: Project Initialization** (MANDATORY for new projects)
- `/init` → Automatically integrate workflow template into current project
- Analyzes PRD.md (if available) or existing codebase
- Updates all template configurations with project-specific settings
- Sets up Git workflow and environment validation

1. **Phase 1**: `/fcs [topic]` → Create initial context **GitHub Issue** (NEVER .md file)
2. **Phase 2**: `/fcs [topic]` → Update context **GitHub Issue** iteratively
3. **Phase 3**: Context reaches `[Ready for Planning]` status → Ready for planning
4. **Phase 4**: `/plan [task]` OR `/plan2 [task]` → Create atomic **GitHub Issues** (NEVER .md files)
   - `/plan`: Detailed planning with comprehensive analysis
   - `/plan2`: Rapid planning with complexity validation
5. **Phase 5**: `/impl [issue-number]` → Implement specific GitHub issue based on mode

**💡 Enhanced Workflow with Claude Code Slash Commands:**
- **Step 0**: Always run `/init` first when cloning template to new project
- Use `/mode [manual|copilot]` to set execution mode
- Commands processed by Claude Code with intelligent execution
- Rich documentation and help built into each command
- Comprehensive error handling and validation
- All workflows maintain the same template-driven approach
- Legacy `=` commands remain supported for backward compatibility

### Project Integration with /init

The `/init` command automatically handles project integration for both new and existing projects:

**New Projects (with PRD.md)**:
- Parses PRD.md for project requirements and technology stack
- Auto-configures workflow commands based on specified technologies
- Sets up project structure documentation from requirements

**Existing Projects**:
- Analyzes codebase to detect language, framework, and dependencies
- Auto-configures appropriate build/test/lint commands
- Updates template placeholders with detected project information

**Automatic Configuration**:
- Updates `CLAUDE.md` with project-specific settings
- Configures command placeholders (`[build command]`, `[test command]`, etc.)
- Sets up staging branch workflow
- Initializes context tracking for the project
- Validates development environment setup

**Supported Technologies**:
- **Node.js/TypeScript**: npm/yarn, React, Next.js, Express, Fastify
- **Rust**: Cargo, Actix-web, Rocket, Axum, Tokio
- **Python**: pip/poetry, FastAPI, Django, Flask, pytest
- **Go**: go modules, standard build tools
- **Custom**: Manual configuration options available

### Implementation Workflow (MANDATORY)

**Pre-Implementation Checklist**:

1. **Staging Sync**: `git checkout staging && git pull origin staging`
2. **Task Verification**: Confirm Task **GitHub Issue** `#[issue-number]` exists and is [TASK] type
3. **Context Status**: Verify Context **GitHub Issue** is `[Ready for Planning]` or `[Implementation Ready]`
4. **Environment Check**: `git status` - working directory must be clean

**Implementation Steps**:

1. **Create Feature Branch**: `git checkout -b feature/task-[issue-number]-[description]`

2. **🔴 Red Phase (Tests First)** ⚠️ MANDATORY:
   ```bash
   # Write tests BEFORE code implementation
   [test command]  # Must FAIL (no implementation yet)
   ```

3. **🟢 Green Phase (Minimal Implementation)**:
   ```bash
   # Write minimal code to make tests pass
   [test command]  # Must PASS
   [build command] # Must pass
   ```

4. **🔵 Refactor Phase (Code Quality)**:
   ```bash
   # Improve code while keeping tests passing
   [lint command]   # Must pass
   [format command] # Must pass
   ```

5. **Final Validation** (100% required):
   - **Build**: `[build command]` (zero errors/warnings)
   - **Lint**: `[lint command]` (zero violations)
   - **Format**: `[format command]` (consistent)
   - **Tests**: `[test command]` (zero failures)
   - **Type Check**: `[typecheck command]` (pass)

6. **Commit & Push**:
   ```bash
   git add .
   git commit -m "feat: [description] - Address #[issue-number] 🤖"
   git push -u origin feature/task-[issue-number]-[description]
   ```

**Post-Implementation**:
- **MANUAL**: User uses `/pr` to create pull request
- **COPILOT**: Agent creates PR automatically

### Enhanced Pull Request Process

**Template Integration**:
- If `docs/PR-TEMP.md` exists: `/pr` automatically fills template with TDD compliance, validation results, and agent context
- If no template: `/pr` uses default structured format with multi-language support

**Agent Context Preservation**:
- **Approach Decision**: Why specific implementation was chosen
- **Alternatives Considered**: Other approaches evaluated and rejected
- **Knowledge Capture**: Links to `/kupdate` entries for learnings
- **Workflow Integration**: Connections to `/plan` tasks and `/fcs` discussions

**Multi-Language Validation**:
Commands automatically detected from project configuration:
- `[build command]` → Build validation
- `[lint command]` → Lint validation
- `[format command]` → Format validation
- `[typecheck command]` → Type checking
- `[test command]` → Test validation

---

## 🧠 Knowledge Management System

### Knowledge Workflow Integration

**Knowledge Capture Points**:

- **After Implementation**: When `=impl` completes successfully, use `=kupdate` to document learnings **(auto-prompts for hub linking)**
- **After Context Discussion**: When `=fcs` reaches key decisions, use `=kupdate` to capture insights **(auto-prompts for hub linking)**
- **After Chat Discoveries**: When breakthrough solutions are found, use `=kupdate` to preserve knowledge **(auto-prompts for hub linking)**

**Enhanced Knowledge Workflow**:

1. **🔍 Pre-Creation Check**: `=khub` → Read Knowledge Hub #102 FIRST to check existing KNOW-[CATEGORY]-XXX numbers
2. **Verify**: Check category section for existing numbers to avoid duplicates (e.g., KNOW-DEVICE-001, KNOW-DEVICE-002)
3. **Create**: `=kupdate [category] "[topic]"` → Creates knowledge issue with next available number
4. **Prompt**: System asks "Link to Knowledge Hub #102? (y/n)"
5. **Link**: If "y" → Automatically runs `=klink`
6. **Sync**: Use `=ksync` to ensure hub is fully synchronized
7. **Discover**: All knowledge accessible through `=khub` navigation

### Knowledge Categories

`device` • `database` • `architecture` • `debug` • `workflow` • `frontend` • `backend`

### Knowledge ID System

**Format**: `KNOW-[CATEGORY]-[NUMBER]` (e.g., `KNOW-DEVICE-001`)

### 🔍 Duplicate Prevention (CRITICAL)

**Workflow**: `/khub` → Check existing numbers → `/kupdate` → Auto-link

❌ **Wrong**: Skip `/khub` → Create duplicate ID
✅ **Right**: `/khub` → Verify → Create correct next number

### Auto-Label Creation

**Auto-creates**: `knowledge-[category]` labels + generates `KNOW-[CATEGORY]-[NUMBER]` IDs

### Knowledge Hub Integration

**Automated Commands**:
- **`/klink [issue-number]`** - Auto-links knowledge to hub
- **`/ksync`** - Syncs hub with all knowledge entries
- **`/kupdate`** - Creates issue + prompts for auto-linking

**Benefits**: Auto-linking ✅ • Consistent formatting ✅ • Centralized discovery ✅

### Knowledge Search & Retrieval

**Search Commands**:
```bash
/ksearch "query"    • /kcategory device    • /krecent
/khub               • /ksync                • /klink [number]
```

**Knowledge Entry Structure**:
- **Problem** → **Solution** → **Lessons** → **Avoid** → **References**

---

## 🧪 Test-Driven Development (TDD) System

### 🔴🟢🔵 Red-Green-Refactor Cycle (MANDATORY)

The Red-Green-Refactor cycle is the core of Test-Driven Development workflow:

#### 🔴 Red Phase (Tests First)
- **Write failing tests** for the functionality you want to implement
- Tests document the expected behavior before code exists
- Run tests: `[test command]` → tests FAIL (because code doesn't exist yet)

#### 🟢 Green Phase (Minimal Implementation)
- **Write minimal code** to make the failing tests pass
- Don't implement extra features yet
- Focus only on passing the tests you wrote
- Run tests: `[test command]` → tests PASS

#### 🔵 Refactor Phase (Improve Code)
- **Refactor the code** for clarity, performance, and maintainability
- Keep tests passing while improving code quality
- Run tests: `[test command]` → tests still PASS
- Run linter: `[lint command]` → zero warnings/errors
- Run formatter: `[format command]` → consistent style

### TDD Workflow Examples

```bash
# Node.js: npm test → fail → implement → pass → build → lint
# Python: pytest → fail → implement → pass → build → lint
# Rust: cargo test → fail → implement → pass → build → clippy
# Go: go test → fail → implement → pass → build → lint
```

### TDD Integration

**Mandatory Requirements**:
- ✅ Tests BEFORE code (Red Phase)
- ✅ Tests PASS after implementation (Green Phase)
- ✅ Refactor while tests pass (Refactor Phase)
- ✅ Red-Green-Refactor cycle for ALL implementations

**Benefits**: Higher quality ✅ • Better design ✅ • Regression prevention ✅ • Living docs ✅

---

## 🏗️ Technical Architecture

### Core Stack
**Language**: [PRIMARY_LANGUAGE] • **Framework**: [WEB_FRAMEWORK] • **Database**: [DATABASE] • **Auth**: [AUTH_METHOD] • **Deploy**: [DEPLOYMENT_PLATFORM]

### Project Structure

```
[project-name]/
├── README.md                   # Project overview and quick start
├── docs/                       # Workflow and templates (issue/task templates)
├── src/                        # Source code (language-dependent)
│   ├── main.*                  # Server or application entry point
│   ├── config.*                # Configuration management
│   ├── handlers/               # Request handlers / API endpoints
│   ├── services/               # Business logic and integrations
│   ├── models/                 # Data structures and types
   └── db/                     # Database helpers and migrations
├── migrations/                 # Database migrations (if applicable)
└── .env.example                # Environment variables template
```

### Database Schema (example)

```
# Sample core tables (adapt to project needs)
users (id, external_id, name, email, avatar, created_at)
events (id, user_id, type, payload, created_at)
payments (id, user_id, provider_id, amount, status, created_at)
```

### Git Branch Strategy (Staging-First Workflow)

```
main              ←─ DEVELOPER (manual merge)
  │                └─ Production-ready code
staging ←───────   ←─ FEATURE BRANCHES (auto PR)
  │                └─ Integration testing
feature/task-XXX   ←─ Development work
```

**Developer Responsibilities:**
- Review and merge `staging → main` when ready
- Ensure all tests pass before merging to main
- Handle conflicts and resolve issues
- Maintain code quality standards

**Automated Workflow:**
- Feature branches always PR to `staging`
- Automated tests run on staging PR
- CI/CD validates all requirements
- Never auto-merge to main

### Key Features

- **Tarot Readings**: Question submission → AI processing (1 combined agent) → Result storage
- **Credit System**: Stars (paid currency) + Coins (earned currency), exchangeable 100:1
- **User Authentication**: LINE LIFF OAuth with JWT tokens
- **Payment Processing**: Stripe integration with webhook handling
- **Referral System**: Generate referral codes, earn coins per signup
- **AI Engine**: Single optimized GPT-4o Mini call (combines analysis + interpretation)
- **Queue System**: Upstash Redis for async reading processing
- **Real-time Status**: Check reading processing status via polling or WebSocket

### Development Commands

```bash
cargo run              # Development server (default: http://localhost:8080)
cargo build --release  # Production build (creates optimized binary)
cargo test             # Run all tests
cargo clippy           # Lint checks
cargo fmt              # Code formatting
```

### Performance Metrics

- **API Response Time**: Target < 200ms (p95)
- **Reading Generation**: 1-2 seconds (single optimized AI call)
- **Concurrent Connections**: 5,000+ (Actix-web capable)
- **Memory Usage**: ~3-5MB per request (Rust efficiency)
- **Startup Time**: ~10ms
- **Monthly Cost**: ~$50-75 (Render + Supabase + Upstash)

---

## 🎯 Quality Standards

### Code Quality Requirements

- **Rust**: Edition 2021, strict type system (eliminates entire classes of bugs)
- **Cargo Check**: Zero compiler warnings (enforced)
- **Clippy Lints**: Zero warnings (`cargo clippy`)
- **Formatting**: `cargo fmt` auto-formatting, consistent across project
- **Build**: 100% success rate before commit
- **Tests**: Unit tests for critical paths (payments, auth)
- **Async Safety**: No panics, proper error handling in all async contexts

### API Quality Standards

- **Response Times**: p95 < 200ms for all endpoints
- **Error Handling**: Always return structured JSON errors with status codes
- **Rate Limiting**: Enforce per-user limits via Redis
- **Input Validation**: Validate all user inputs before processing
- **JWT Security**: 7-day token expiration, secure secret management
- **HTTPS Only**: Enforce in production, automatic via Render

### Performance Standards

- **Startup Time**: API ready within 10ms
- **Database Queries**: < 50ms per query (with indexes)
- **Redis Operations**: < 10ms per operation
- **AI Processing**: 1-2 seconds per reading (queue-based async)
- **Concurrent Users**: Handle 100+ concurrent connections
- **Memory Usage**: < 10MB base memory + ~1MB per concurrent request

### Security Standards

- **Secrets Management**: Use .env, never commit sensitive data
- **Database Access**: All queries use parameterized statements (SQLx)
- **Authentication**: JWT tokens with proper expiration
- **CORS**: Configured for frontend domain only
- **Rate Limiting**: Per-user limits on sensitive endpoints
- **Webhook Verification**: Verify Stripe webhook signatures
- **Error Messages**: Never expose sensitive system details

### Template-Guided Quality

- **Context Issues**: Complete PLANNING READINESS CHECKLIST ✅ (Always GitHub Issues)
- **Task Issues**: 100% build/lint/test requirements mandatory (Always GitHub Issues)
- **Mode Execution**: Follow mode-specific behavior exactly
- **Template Consistency**: All issues follow template structures
- **File Policy**: NEVER create local .md files for issues - ALWAYS use GitHub Issues

---

## 📚 Reference Materials

### Templates

- `/docs/ISSUE-TEMP.md` - Context Issue Template for iterative discussions
- `/docs/TASK-ISSUE-TEMP.md` - Atomic Task Template for implementation
- `/docs/KNOWLEDGE-TEMP.md` - Knowledge Issue Template for structured learning

### Performance Metrics

- **Target**: API response time < 200ms (p95)
- **Goal**: 99.9% uptime for Tarot reading service
- **Reliability**: 99.99% accurate reading delivery
- **Database**: PostgreSQL via Supabase with automatic scaling
- **Queue**: Upstash Redis with serverless scaling
- **Cost**: ~$50-75/month for full stack at scale

### Security Notes

- **Input Validation**: Comprehensive validation for all user inputs
- **Authentication**: LINE LIFF OAuth + JWT with 7-day expiration
- **Data Protection**: Encrypted connections, secure token storage
- **Access Control**: Role-based access (user, admin levels)
- **Payment Security**: Stripe webhook verification, idempotent operations
- **Audit Trail**: Complete logs for readings and transactions

---

_This document focuses on agent-critical information for efficient workflow execution and safe development practices._