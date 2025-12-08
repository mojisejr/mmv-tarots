# Workflow Template Repository

This repository contains a production-ready agent-centric workflow template with required docs, issue/task templates, and comprehensive agent instructions. Use this repository as a GitHub template for future projects.

**Latest Update:** November 2025 - Enhanced with .tmp folder enforcement, Response Quality Standards, Language Policy, and advanced commands (/pck, /aud)

Quick goals:
- Keep workflow rules, safety policies, and command templates intact.
- Provide a simple `setup.sh` to help fill project-specific metadata into `CLAUDE.md`.
- Support multiple execution modes (MANUAL/COPILOT) with agent-specific instructions.
- Enforce response quality standards and language-matching policies.

Files you should see in the root:
- `AGENTS.md` — agent workflow, safety rules, response standards, and implementation checklist
- `CLAUDE.md` — workflow and project metadata (template placeholders)
- `docs/ISSUE-TEMP.md` — context issue template
- `docs/TASK-ISSUE-TEMP.md` — atomic task issue template
- `docs/KNOWLEDGE-TEMP.md` — knowledge capture template
- `.claude/commands/` — 18 slash command definitions (init, mode, fcs, plan, plan2, pck, aud, impl, pr, khub, kupdate, klink, ksync, ksearch, krecent, kcategory, rrr)
- `.claude/settings.local.json` — agent permissions and settings configuration
- `.github/agents/` — agent-specific instruction files (7 files)
- `.github/instructions/` — core response standards and domain-specific guidance (9 files)
- `setup.sh` — interactive setup helper (run after cloning to fill project metadata)

## What's New in This Update

### ✨ New Slash Commands
- **`/pck [issue-number]`** — Plan check: analyze GitHub issue, scan codebase for context, show implementation steps
- **`/aud [question]`** — Audit: find bugs, suggest fixes, validate assumptions, generate implementation plans

### 📋 Enhanced Standards
- **Response Quality Standards** (5-point framework)
  - On-Point (ตรงประเด็น) — answer only what was asked
  - Good Context Ordering — simple to complex progression
  - Exact Details (ยึดมั่นในรายละเอียด) — accurate and specific
  - Security-First Focus — always consider security
  - Senior Developer Mindset — unbiased, expert feedback

- **Language Matching Policy** (Automatic)
  - Thai questions → Thai responses
  - English questions → English responses
  - Mixed → Follow primary language
  - Technical terms always in English

### 🏗️ New Directory Structure
- `.claude/commands/` — 18 slash command implementations
- `.claude/settings.local.json` — permissions and configuration
- `.github/agents/` — 7 agent-specific instruction files
- `.github/instructions/` — 9 core response and domain guidance files

### 📁 Enhanced Temporary File Management
- **Strict .tmp folder enforcement** — All temporary files created in project `.tmp/` folder only
- **Automatic cleanup** — Temporary files removed immediately after each operation
- **Zero system temp usage** — Never uses `/tmp/` or `$TEMP` directories
- **Auto gitignore** — `.tmp/` automatically added to `.gitignore`
- **Security-focused** — Project-scoped temporary file management

### 📚 Complete Command Suite (18 Total)
`/init` • `/mode` • `/fcs` • `/plan` • `/plan2` • `/pck` • `/aud` • `/impl` • `/pr` • `/khub` • `/kupdate` • `/klink` • `/ksync` • `/ksearch` • `/krecent` • `/kcategory` • `/rrr`

Quick start (macOS, zsh)

1) Clone this repo as a template for your project:

```bash
git clone https://github.com/<your-account>/<template-repo>.git my-project
cd my-project
```

2) Initialize the workflow template for your specific project:

```bash
/init                          # Automatically integrate workflow for your project
```

3) (Optional) Run the setup helper to populate additional `CLAUDE.md` metadata. The script will ask for your repository URL and the `claude` CLI alias (if you use a custom alias):

```bash
./setup.sh
```

Notes about the setup script
- The script attempts to call your `claude` CLI with `-p` and a prompt that instructs the assistant to fill top-level metadata while preserving workflow sections. If your claude CLI uses a different flag or interface, provide the correct alias that wraps it accordingly.
- If the `claude` CLI is not available, the script can run in offline/manual mode and create a temporary file for manual editing.
- The script always shows a diff and requires confirmation before overwriting `CLAUDE.md`.

How to adapt the template for your stack
- Replace placeholder tokens such as `[PROJECT_NAME]`, `[REPOSITORY_URL]`, `[PRIMARY_LANGUAGE]`, `[FRAMEWORK]` with real values.
- Update `docs/TASK-ISSUE-TEMP.md` build/test commands to match your stack (for example, replace `[build command]` and `[test command]`).

Optional next steps to make this a polished template repository:
- Add a LICENSE (MIT recommended) and `CONTRIBUTING.md`.
- Add `.github/ISSUE_TEMPLATE/*` and `PULL_REQUEST_TEMPLATE.md` for repo-level automation.
- Add a minimal CI workflow that validates docs and runs basic checks.

If you want, I can implement any of the optional steps above (LICENSE, CONTRIBUTING, GitHub meta, CI). Tell me which one to start with.

## Advanced Features

### Mode-Based Execution
The template supports two execution modes controlled via `/mode`:
- **MANUAL** — Tasks assigned to you for direct implementation
- **COPILOT** — Tasks assigned to @copilot for automated implementation

### Agent Instructions
Comprehensive agent guidance in `.github/agents/` ensures consistent behavior:
- `plan.agents.md` — Context hallucination prevention and task creation
- `impl.agents.md` — Implementation workflow with Red-Green-Refactor TDD
- `pr.agents.md` — Pull request creation and validation standards
- `fcs.agents.md` — Context issue management and discussion
- And more for mode-specific execution...

### Response Instructions
Domain-specific guidance in `.github/instructions/`:
- `response.instructions.md` — Core response quality standards (MANDATORY for all responses)
- `api.instructions.md` — API design, authentication, and error handling
- `architect.instructions.md` — System architecture and technology stack patterns
- `database.instructions.md` — Database schema, migrations, and security (RLS)
- `impl.instructions.md` — Implementation workflow details and validation
- `plan.instructions.md` — Task planning with hallucination prevention checklist
- `pr.instructions.md` — Pull request workflow from staging to main
- `fcs.instructions.md` — Context issue template and management
- `ui.instructions.md` — UI/UX design systems and accessibility

### Knowledge Management System
Integrated knowledge capture and retrieval for project insights:
- `/khub` — Central knowledge hub (GitHub Issue by default)
- `/kupdate [category] "[topic]"` — Create knowledge entries with structured format
- `/klink [issue-number]` — Automatically link knowledge to hub
- `/ksync` — Synchronize hub with all knowledge entries
- `/ksearch "[query]"` — Full-text search across knowledge base
- `/krecent` — Show recent 5 knowledge updates
- `/kcategory [category]` — Browse category-specific knowledge

Categories include: device, database, architecture, debug, workflow, frontend, backend

### Test-First Development (TDD)
All task templates enforce Red-Green-Refactor cycle:
- **Red Phase** — Write failing tests BEFORE code implementation
- **Green Phase** — Implement minimal code to pass tests
- **Refactor Phase** — Improve code quality while tests remain passing

This ensures high test coverage and code quality from the start.

## Workflow Architecture

```
🚀 Project Initialization (/init) - MANDATORY FIRST STEP
- Analyze PRD.md or existing codebase
- Auto-configure workflow commands
- Set up Git staging workflow
- Initialize project context tracking
         ↓
Context Discussion (/fcs)
- Create context GitHub Issues
- Iterative discussion and planning
- Accumulate project context
- Auto .tmp folder management for issue content
         ↓
     Planning (/plan OR /plan2)
/plan: Detailed atomic tasks with comprehensive analysis
/plan2: Rapid tasks with complexity validation
- Create atomic task GitHub Issues
- Test-first requirements specification
- Same template, different modes (rapid vs detailed)
- Auto .tmp folder management for task content
         ↓
  Pre-Implementation Check (/pck, /aud)
- Codebase analysis for dependencies
- Validate implementation approach
- Security and architecture review
         ↓
  Implementation (/impl)
  - Red Phase: Write failing tests
  - Green Phase: Implement minimal code
  - Refactor Phase: Improve code quality
  - Auto .tmp folder management for issue metadata
         ↓
  Full Validation:
  - Build: 100% success ([build command])
  - Lint: 0 warnings ([lint command])
  - Format: Consistent ([format command])
  - Tests: All passing ([test command])
         ↓
   Pull Request (/pr)
  - Feature branch → staging
  - Validation report included
  - Ready for team review
  - Auto .tmp folder management for PR content
         ↓
  Knowledge Capture (/kupdate, /klink)
  - Document learnings and insights
  - Link to centralized knowledge hub
  - Make discoveries discoverable
  - Auto .tmp folder management for knowledge content
```

## Response Quality Standards (Mandatory)

Every response from agents using this template follows these standards:

1. **On-Point (ตรงประเด็น)** — Answer only what was asked, no out-of-scope information
2. **Good Context Ordering** — Simple to complex progression, ordered for comprehension
3. **Exact Details** — Accurate, specific information with file/function names
4. **Security-First Focus** — Always consider security implications first
5. **Senior Developer Mindset** — Provide unbiased, expert feedback

## Language Matching Policy

The template automatically matches user language:
- **Thai questions** → Thai responses (except technical terms in English)
- **English questions** → English responses
- **Mixed language** → Follow the primary language
- **Technical terms** — Always use English (Rust, Cargo, PostgreSQL, etc.)

This ensures better communication and context preservation.

## 📁 Temporary File Management (Critical Security Feature)

All workflow commands enforce strict `.tmp` folder usage for temporary files:

### 🚨 Strict Enforcement Policy
- **NEVER** uses system temp directories (`/tmp/`, `$TEMP`)
- **ALWAYS** creates temporary files in project `.tmp/` folder only
- **ALWAYS** cleans up temporary files immediately after use
- **ALWAYS** adds `.tmp/` to `.gitignore` automatically

### 🔒 Security Benefits
- **Project-scoped**: No temporary files left in system directories
- **Automatic cleanup**: Zero pollution of file systems
- **Git-safe**: Temporary files never committed accidentally
- **Performance**: Project-local file operations are faster

### 📋 Commands with .tmp Folder Integration
- `/fcs` - Context issue creation with `.tmp/context-content.md`
- `/plan`, `/plan2` - Task creation with `.tmp/task-content.md`
- `/impl` - Implementation workflow with `.tmp/issue-details.md`
- `/pr` - Pull request with `.tmp/issue-info.md` and `.tmp/pr-body.md`
- `/kupdate` - Knowledge creation with `.tmp/knowledge-content.md`

### 💡 Zero Manual Setup Required
Every command automatically handles:
```bash
mkdir -p .tmp && echo ".tmp/" >> .gitignore
# Create temporary file in .tmp/
# Use with GitHub CLI --body-file .tmp/[filename]
# rm .tmp/[filename] (automatic cleanup)
```

This approach ensures clean, secure, and efficient temporary file management across the entire workflow.
