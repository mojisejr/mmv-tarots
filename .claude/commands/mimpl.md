# Multi-Agent Implementation Command (/mimpl)

## Usage
```
/mimpl [task description]
/mimpl [issue-number]
```

## Overview
Multi-Agent Implementation command ที่ทำงานเหมือน /impl ทุกประการ แต่ใช้ **Task tool pattern** เพื่อจัดการงานที่ซับซ้อนหลายส่วนพร้อมกัน ยังคง TDD Red-Green-Refactor workflow ไว้ครบถ้วน

## 🤖 Task Tool Coordination Layer

### Main Agent (Claude Code) เป็น Coordinator:
- วิเคราะห์ task และสร้าง session context
- เรียก Task tool แทนการ spawn agents
- ตรวจสอบความคืบหน้าด้วย AgentOutputTool
- ประสานการทำงานระหว่าง Tasks

### Task "Agents" (Task tool calls):
```bash
# Database Task
Task subagent_type='general-purpose' prompt="You are the Database Agent..."

# API Task
Task subagent_type='general-purpose' prompt="You are the API Agent..."

# Frontend Task
Task subagent_type='general-purpose' prompt="You are the Frontend Agent..."
```

## 🔄 Coordination via Shared Context

#### Session File Structure:
```
.tmp/mimpl-session-[timestamp]/
├── context.md           # Global state and instructions
├── progress.md          # Real-time progress updates
├── conflicts.md         # Issues and resolutions
└── artifacts/           # Generated files by tasks
    ├── database/
    ├── api/
    ├── frontend/
    └── tests/
```

#### Task Communication Flow:
```markdown
# Main agent coordinates tasks through context.md
## Task Status
- Database: STARTED at 14:30
- API: WAITING (dependency: database)
- Frontend: WAITING (dependency: api)

# Tasks read context and update status
```

### 📋 Task Types & Responsibilities

#### 1. **Database Task** (subagent_type='general-purpose')
Prompt Template:
```
You are the Database Agent. Your task is: {task_description}

Session ID: {session_id}
Context: Read .tmp/mimpl-session-{id}/context.md
Output: Write to .tmp/mimpl-session-{id}/database/

Responsibilities:
- Design schema following Neon/PostgreSQL best practices
- Write migration scripts
- Create test fixtures and seed data
- Write tests for models and migrations
- Update progress.md when starting/finishing

Coordination:
- Update context.md when schema changes
- Mark dependencies complete for API Task
```

#### 2. **API Task** (subagent_type='general-purpose')
Prompt Template:
```
You are the API Agent. Your task is: {task_description}

Session ID: {session_id}
Context: Read .tmp/mimpl-session-{id}/context.md
Dependencies: Wait for Database Task completion
Output: Write to .tmp/mimpl-session-{id}/api/

Responsibilities:
- Implement Next.js App Router API routes
- Add request/response validation with Zod
- Write comprehensive API tests
- Handle errors and edge cases
- Follow RESTful conventions

Coordination:
- Check context.md for Database Task status
- Update progress.md when starting/finishing
- Mark dependencies complete for Frontend Task
```

#### 3. **Frontend Task** (subagent_type='general-purpose')
Prompt Template:
```
You are the Frontend Agent. Your task is: {task_description}

Session ID: {session_id}
Context: Read .tmp/mimpl-session-{id}/context.md
Dependencies: Wait for API Task completion
Output: Write to .tmp/mimpl-session-{id}/frontend/

Responsibilities:
- Build React components with TypeScript
- Implement UI/UX following design system
- Manage state with appropriate patterns
- Write component tests with React Testing Library
- Ensure accessibility compliance

Coordination:
- Check context.md for API Task status
- Update progress.md when starting/finishing
```

#### 4. **Testing Task** (subagent_type='general-purpose')
Prompt Template:
```
You are the Testing Agent. Your task is: {task_description}

Session ID: {session_id}
Context: Read .tmp/mimpl-session-{id}/context.md
Dependencies: Monitor all other tasks
Output: Write to .tmp/mimpl-session-{id}/tests/

Responsibilities:
- Write integration tests
- Create E2E test scenarios
- Ensure test coverage requirements
- Validate cross-task integration
- Performance testing setup

Coordination:
- Monitor all task progress via context.md
- Run tests as tasks complete
- Report integration issues to conflicts.md
```

### 🚀 Implementation Commands

#### Multi-Task Execution Flow:

```bash
# Step 1: Environment Setup (Same as /impl)
Bash git checkout staging  # MANDATORY: Staging-only policy

# Step 2: Initialize Session
SESSION_ID=$(date +%s)
Bash mkdir -p .tmp/mimpl-session-$SESSION_ID/artifacts/{database,api,frontend,tests}

# Step 3: Create Initial Context
Write .tmp/mimpl-session-$SESSION_ID/context.md
Content: |
  # Multi-Task Implementation Session
  Task: {task_description}
  Session ID: $SESSION_ID
  Started: $(date)

  ## Task Dependencies
  Database → API → Frontend
            ↓
        Testing (monitors all)

  ## Status
  - Database: NOT_STARTED
  - API: WAITING (dependency: database)
  - Frontend: WAITING (dependency: api)
  - Testing: MONITORING

# Step 4: Launch Tasks in Background
Task subagent_type='general-purpose' description="Database Task" run_in_background=true \
  prompt="You are the Database Agent for task: {task_description}. Session ID: $SESSION_ID..."

Task subagent_type='general-purpose' description="API Task" run_in_background=true \
  prompt="You are the API Agent for task: {task_description}. Session ID: $SESSION_ID..."

Task subagent_type='general-purpose' description="Frontend Task" run_in_background=true \
  prompt="You are the Frontend Agent for task: {task_description}. Session ID: $SESSION_ID..."

Task subagent_type='general-purpose' description="Testing Task" run_in_background=true \
  prompt="You are the Testing Agent for task: {task_description}. Session ID: $SESSION_ID..."

# Step 5: Monitor Progress
# Main agent checks AgentOutputTool results
# Updates context.md based on task outputs
# Resolves conflicts via conflicts.md

# Step 6: TDD Phase Execution (Enhanced)
# Phase 1: RED - Tasks write tests for their domains
# Phase 2: GREEN - Tasks implement based on dependencies
# Phase 3: REFACTOR - Cross-task optimization
# Phase 4: QA - Full integration testing

# Step 7: Final Validation (Same as /impl)
npm run build    # MUST pass 100%
npm run lint     # MUST pass 100%
npx tsc --noEmit # MUST pass 100%
npm test         # MUST pass 100%

# Step 8: Cleanup
Bash rm -rf .tmp/mimpl-session-$SESSION_ID
```

### 📊 Task Monitoring Pattern

#### Main Agent Monitoring Loop:
```typescript
// Check task status every 30 seconds
while (tasksRunning) {
  for (const task of backgroundTasks) {
    const output = AgentOutputTool(task.id, block=false);

    if (output.status === 'COMPLETE') {
      updateContext(task.id, 'COMPLETE');
      markDependenciesComplete(task.id);
    } else if (output.status === 'FAILED') {
      handleTaskFailure(task, output.error);
    }
  }

  // Update progress display
  displayProgress();

  // Check for conflicts
  resolveConflicts();

  // Wait before next check
  AgentOutputTool(null, block=true, wait_up_to=30);
}
```

#### Progress Display:
```
🤖 Multi-Task Implementation Session: {task_description}
├── ✅ Database Task: COMPLETE (45s)
├── ✅ API Task: COMPLETE (38s)
├── 🔄 Frontend Task: IN_PROGRESS (67%)
└── 🧪 Testing Task: MONITORING

📋 Overall Progress: 3/4 tasks active
🎯 Current Phase: GREEN - Implementation
```

### 🔧 Conflict Resolution Strategy

#### 1. **File Conflicts**
```markdown
## Conflict Resolution Template

### Issue:
[Description of conflict]

### Tasks Involved:
- Task A: [what they did]
- Task B: [what they did]

### Resolution:
[How to resolve]
- Priority: [which task takes precedence]
- Action: [specific steps to fix]
```

#### 2. **Dependency Resolution**
```typescript
// Check dependencies before proceeding
const checkDependencies = (taskId: string) => {
  const context = readContext();
  const dependencies = context.dependencies[taskId];

  for (const dep of dependencies) {
    if (context.tasks[dep].status !== 'COMPLETE') {
      throw `${taskId} cannot start: ${dep} not complete`;
    }
  }
};
```

### 🔍 Enhanced TDD Workflow with Tasks

#### Phase 1: RED (Test Writing)
```bash
# Each Task writes tests for their domain
- Database Task: Model tests, migration tests
- API Task: Endpoint tests, validation tests
- Frontend Task: Component tests, integration tests
- Testing Task: E2E scenarios, integration contracts
```

#### Phase 2: GREEN (Implementation)
```bash
# Sequential based on dependencies
1. Database Task (parallel if multiple DB tasks)
2. API Task (after database)
3. Frontend Task (after API)
4. Testing Task (throughout)
```

#### Phase 3: REFACTOR (Optimization)
```bash
# Cross-task coordination:
- Database Task: Optimize schema
- API Task: Standardize response formats
- Frontend Task: Abstract shared components
- Testing Task: Optimize test suite
```

### ✅ Git Operations (Unchanged from /impl)

Task coordination ไม่กระทบ Git workflow:
- ทำงานบน staging branch เท่านั้น
- Commit เมื่อทุก phase เสร็จสมบูรณ์
- ใช้ conventional commit format เหมือนเดิม
- สร้าง PR เฉพาะเมื่อได้รับคำสั่ง

### 🎯 Success Criteria

เหมือน /impl ทุกประการ แต่เพิ่ม:
- ✅ All tasks complete successfully
- ✅ Zero inter-task conflicts unresolved
- ✅ Dependencies properly resolved
- ✅ Parallel efficiency achieved (faster than sequential)
- ✅ Cross-task integration tests pass
- ✅ Shared context properly maintained

### 📝 Example Usage

```bash
/mimpl implement user authentication system

Output:
🤖 Analyzing task complexity...
📋 Creating session: mimpl-session-1736467890
🔄 Launching 4 tasks: database, api, frontend, testing

📋 Session Context Initialized
Task Dependencies: database → api → frontend
Monitoring: testing

🔄 Phase 0: Task Planning
   ✅ Database Task: Planning complete (8s)
   ✅ API Task: Planning complete (12s)
   ✅ Frontend Task: Planning complete (15s)
   ✅ Testing Task: Test strategy ready (10s)

🔄 Phase 1: RED - Test Writing
   🧪 Database Task: Writing model tests...
   🧪 API Task: Writing endpoint tests...
   🧪 Frontend Task: Writing component tests...
   🧪 Testing Task: Setting up integration tests...

🔄 Phase 2: GREEN - Implementation
   ✅ Database: Schema + migrations complete (45s)
   ✅ API: Routes + validation complete (67s)
   ✅ Frontend: Components + integration complete (89s)
   ✅ Testing: All tests passing (34s)

🔄 Phase 3: REFACTOR - Optimization
   ✅ Type safety validation
   ✅ Performance optimization
   ✅ Code deduplication

🎯 Implementation Complete!
   - All tasks completed successfully
   - 100% Tests pass
   - Build successful
   - Zero conflicts
   - 35% faster than sequential execution
```

## Critical Rules (Inherited from /impl + Task specific):

### TDD Rules (UNCHANGED):
- **TDD RED-GREEN-REFACTOR phases are MANDATORY**
- **100% test pass rate REQUIRED at every stage**
- **NEVER skip test cases - NO exceptions**

### Task Coordination Rules (NEW):
- **ALWAYS use Task tool for "agent" execution**
- **ALWAYS coordinate through shared context files**
- **ALWAYS check dependencies before task execution**
- **ALWAYS update context.md when starting/finishing tasks**
- **ALWAYS use AgentOutputTool to monitor background tasks**
- **IMMEDIATELY report conflicts to conflicts.md**

### Git Rules (UNCHANGED):
- **STAGING-ONLY POLICY: NEVER code on main branch**
- **ALWAYS work on staging branch ONLY**
- **NEVER create PRs unless explicitly requested**

### Success Criteria:
- All TDD phases completed with 100% pass rate
- All tasks complete successfully via Task tool
- Zero unresolved inter-task conflicts
- Build, lint, TypeScript all pass 100%
- Faster execution than sequential implementation
- Clean session cleanup after completion