#!/usr/bin/env node

/**
 * Rapid Task Planner
 * Fast task creation with complexity validation
 * Uses the same template as /plan but in rapid mode
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class RapidPlanner {
  constructor() {
    this.projectRoot = process.cwd();
    this.complexityRules = [
      {
        keywords: ['authentication', 'security', 'password', 'token', 'jwt', 'auth'],
        reason: 'Security-critical features need detailed planning'
      },
      {
        keywords: ['database', 'migration', 'schema', 'sql', 'query'],
        reason: 'Database changes need careful analysis'
      },
      {
        keywords: ['api', 'endpoint', 'rest', 'graphql', 'webhook'],
        reason: 'API design needs comprehensive planning'
      },
      {
        keywords: ['payment', 'stripe', 'transaction', 'billing', 'checkout'],
        reason: 'Payment processing requires detailed planning'
      },
      {
        keywords: ['architecture', 'system', 'infrastructure', 'design pattern'],
        reason: 'System architecture changes need thorough planning'
      }
    ];
  }

  async plan2(taskDescription, force = false) {
    console.log('🚀 Rapid Task Planning...\n');

    try {
      // Quick complexity check
      const complexity = this.analyzeComplexity(taskDescription);

      if (!force && complexity.isComplex) {
        console.log(`⚠️  Task too complex for /plan2: ${complexity.reason}`);
        console.log(`💡 Use /plan "${taskDescription}" instead`);
        console.log(`💡 Or force with: /plan2 "${taskDescription}" --force\n`);
        return false;
      }

      if (force && complexity.isComplex) {
        console.log(`🔒 Forcing rapid planning (not recommended)\n`);
      }

      // Create rapid task
      await this.createRapidTask(taskDescription, force);

      return true;

    } catch (error) {
      console.error('❌ Rapid planning failed:', error.message);
      return false;
    }
  }

  analyzeComplexity(taskDescription) {
    const lowerTask = taskDescription.toLowerCase();

    for (const rule of this.complexityRules) {
      if (rule.keywords.some(keyword => lowerTask.includes(keyword))) {
        return {
          isComplex: true,
          reason: rule.reason,
          matchedKeywords: rule.keywords.filter(k => lowerTask.includes(k))
        };
      }
    }

    return {
      isComplex: false,
      reason: null,
      matchedKeywords: []
    };
  }

  async createRapidTask(taskDescription, force) {
    console.log('📋 Creating rapid task...');

    // Setup .tmp folder
    this.setupTempFolder();

    // Get current mode
    const currentMode = this.getCurrentMode();

    // Generate task content using shared template
    const taskContent = await this.generateTaskContent(taskDescription, currentMode, force);

    // Create GitHub issue
    await this.createGitHubIssue(taskDescription, taskContent);

    // Cleanup
    this.cleanupTempFiles();

    console.log('✅ Rapid task created successfully!');
    console.log('🚀 Ready for implementation with /impl [issue-number]');
  }

  setupTempFolder() {
    const tmpDir = path.join(this.projectRoot, '.tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Ensure .tmp is in .gitignore
    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    let gitignoreContent = '';
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }

    if (!gitignoreContent.includes('.tmp/')) {
      fs.appendFileSync(gitignorePath, '\n.tmp/\n');
    }
  }

  getCurrentMode() {
    try {
      // Try to read from .claude/current_mode if it exists
      const modeFile = path.join(this.projectRoot, '.claude', 'current_mode');
      if (fs.existsSync(modeFile)) {
        return fs.readFileSync(modeFile, 'utf8').trim();
      }
    } catch (error) {
      // Fall through to default
    }
    return 'MANUAL'; // Default mode
  }

  async generateTaskContent(taskDescription, currentMode, force) {
    const templatePath = path.join(this.projectRoot, 'docs', 'TASK-ISSUE-TEMP.md');

    if (!fs.existsSync(templatePath)) {
      throw new Error('Template docs/TASK-ISSUE-TEMP.md not found');
    }

    let templateContent = fs.readFileSync(templatePath, 'utf8');

    // Replace template placeholders
    templateContent = this.replaceTemplatePlaceholders(templateContent, {
      TASK_DESCRIPTION: taskDescription,
      EXECUTION_MODE: currentMode.toUpperCase(),
      DATE: new Date().toISOString().split('T')[0],
      ASSIGNEE: currentMode === 'COPILOT' ? '@copilot' : 'Assign to developer',
      IS_RAPID_TASK: true,
      FORCE_MODE: force
    });

    // Add rapid mode specific sections
    templateContent = this.addRapidModeSections(templateContent, taskDescription, force);

    return templateContent;
  }

  replaceTemplatePlaceholders(content, replacements) {
    // Replace standard placeholders
    content = content.replace(/\[TASK_DESCRIPTION\]/g, replacements.TASK_DESCRIPTION);
    content = content.replace(/\[EXECUTION_MODE\]/g, replacements.EXECUTION_MODE);
    content = content.replace(/\[DATE\]/g, replacements.DATE);
    content = content.replace(/\[ASSIGNEE\]/g, replacements.ASSIGNEE);

    // Replace conditional sections
    if (replacements.IS_RAPID_TASK) {
      content = content.replace(/\[TASK-XXX-X\]/g, 'TASK-RAPID');
      content = content.replace(/\[TASK_NUMBER\]/g, 'RAPID');
    }

    return content;
  }

  addRapidModeSections(content, taskDescription, force) {
    // Insert rapid mode header after title
    const rapidModeHeader = `

## 🚀 RAPID MODE TASK
**Current Mode: RAPID PLANNING**
- Focus on speed and core functionality delivery
- Basic validation and essential testing only
- Minimal documentation overhead
${force ? '- ⚠️  Forced creation (task appears complex for rapid mode)' : '- ✅ Verified as suitable for rapid implementation'}

---

`;

    // Insert after the first title line
    const lines = content.split('\n');
    const titleIndex = lines.findIndex(line => line.startsWith('#'));
    if (titleIndex !== -1) {
      lines.splice(titleIndex + 1, 0, rapidModeHeader);
      content = lines.join('\n');
    }

    // Simplify test requirements for rapid mode
    content = content.replace(
      /### 🧪 TEST-FIRST REQUIREMENTS \(MANDATORY\)[\s\S]*?Test Acceptance Criteria:/gs,
      `### 🧪 TEST-FIRST REQUIREMENTS (RAPID MODE)
**Essential tests only (focus on core functionality):**
- [ ] Core function test: Main functionality works
- [ ] Basic error handling test: Edge cases covered
- [ ] Integration test: Connects properly to existing system

**Rapid Test Acceptance Criteria:**`
    );

    // Simplify acceptance criteria for rapid mode
    content = content.replace(
      /### ✅ ACCEPTANCE CRITERIA \(100% MANDATORY\)[\s\S]*?- \[ \] Language\/typecheck passes/gs,
      `### ✅ ACCEPTANCE CRITERIA (RAPID MODE - BASIC)
- [ ] Build command passes ([build command]) - Basic validation
- [ ] Lint command passes with critical fixes only ([lint command])
- [ ] Core tests pass ([test command]) - Essential coverage
- [ ] Basic functionality works end-to-end
- [ ] No critical errors or regressions
- [ ] Language/typecheck passes`
    );

    return content;
  }

  async createGitHubIssue(taskDescription, taskContent) {
    try {
      // Write task content to temporary file
      const tempFilePath = path.join(this.projectRoot, '.tmp', 'rapid-task-content.md');
      fs.writeFileSync(tempFilePath, taskContent);

      // Create GitHub issue
      const command = `gh issue create \
        --title "[TASK-RAPID] ${taskDescription}" \
        --label "task-rapid" \
        --label "${this.getCurrentMode().toLowerCase()}-assignment" \
        --body-file "${tempFilePath}"`;

      const result = execSync(command, { encoding: 'utf8' });

      // Extract issue URL from result
      const issueUrlMatch = result.match(/https:\/\/github\.com\/[^\/]+\/[^\/]+\/issues\/\d+/);
      if (issueUrlMatch) {
        console.log(`📝 Task created: ${issueUrlMatch[0]}`);
      }

    } catch (error) {
      throw new Error(`Failed to create GitHub issue: ${error.message}`);
    }
  }

  cleanupTempFiles() {
    try {
      const tmpDir = path.join(this.projectRoot, '.tmp');
      const tempFile = path.join(tmpDir, 'rapid-task-content.md');

      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch (error) {
      console.warn('⚠️  Warning: Could not cleanup temporary files:', error.message);
    }
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node rapid-planner.js "task description" [--force]');
    process.exit(1);
  }

  const taskDescription = args[0];
  const force = args.includes('--force');

  const planner = new RapidPlanner();
  planner.plan2(taskDescription, force).then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = RapidPlanner;