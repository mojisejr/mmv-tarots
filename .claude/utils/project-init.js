#!/usr/bin/env node

/**
 * Project Initialization Utility
 * Automatically integrates workflow template into any project
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProjectInitializer {
  constructor() {
    this.projectRoot = process.cwd();
    this.config = {
      projectName: '',
      repositoryUrl: '',
      authorName: '',
      authorEmail: '',
      language: '',
      framework: '',
      database: '',
      deployment: '',
      buildCommand: '[build command]',
      lintCommand: '[lint command]',
      formatCommand: '[format command]',
      testCommand: '[test command]',
      typecheckCommand: '[typecheck command]',
      hasPRD: false,
      isExistingProject: false
    };
  }

  async initialize() {
    console.log('🚀 Initializing workflow template for project...\n');

    try {
      // Phase 1: Project Analysis
      await this.analyzeProject();

      // Phase 2: Configuration Update
      await this.updateConfiguration();

      // Phase 3: Git Setup
      await this.setupGitWorkflow();

      // Phase 4: Validation
      await this.validateSetup();

      this.printSuccess();

    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      process.exit(1);
    }
  }

  async analyzeProject() {
    console.log('📋 Analyzing project...');

    // Check for PRD.md
    if (fs.existsSync(path.join(this.projectRoot, 'PRD.md'))) {
      this.config.hasPRD = true;
      await this.analyzePRD();
    } else {
      // Analyze existing codebase
      this.config.isExistingProject = await this.hasSourceCode();
      if (this.config.isExistingProject) {
        await this.analyzeCodebase();
      }
    }

    // Get Git configuration
    await this.getGitConfig();

    console.log(`✅ Project type: ${this.config.hasPRD ? 'New project with PRD' : this.config.isExistingProject ? 'Existing project' : 'Empty project'}`);
  }

  async analyzePRD() {
    const prdPath = path.join(this.projectRoot, 'PRD.md');
    const content = fs.readFileSync(prdPath, 'utf8');

    // Extract project name
    const nameMatch = content.match(/## Project Name:\s*(.+)/i);
    if (nameMatch) {
      this.config.projectName = nameMatch[1].trim();
    }

    // Extract technology stack
    const techStackMatch = content.match(/## Technology Stack\s*[\s\S]*?\*\*Language\*\*:\s*([^\n]+)/i);
    if (techStackMatch) {
      this.config.language = techStackMatch[1].trim();
    }

    const frameworkMatch = content.match(/## Technology Stack\s*[\s\S]*?\*\*Framework\*\*:\s*([^\n]+)/i);
    if (frameworkMatch) {
      this.config.framework = frameworkMatch[1].trim();
    }

    const databaseMatch = content.match(/## Technology Stack\s*[\s\S]*?\*\*Database\*\*:\s*([^\n]+)/i);
    if (databaseMatch) {
      this.config.database = databaseMatch[1].trim();
    }

    const deploymentMatch = content.match(/## Technology Stack\s*[\s\S]*?\*\*Deployment\*\*:\s*([^\n]+)/i);
    if (deploymentMatch) {
      this.config.deployment = deploymentMatch[1].trim();
    }
  }

  async hasSourceCode() {
    const indicators = [
      'src/', 'lib/', 'app/', 'components/', 'services/', 'models/',
      'package.json', 'Cargo.toml', 'requirements.txt', 'pyproject.toml',
      'go.mod', 'pom.xml', 'build.gradle', 'Gemfile'
    ];

    return indicators.some(indicator => {
      const fullPath = path.join(this.projectRoot, indicator);
      return fs.existsSync(fullPath);
    });
  }

  async analyzeCodebase() {
    // Detect language and framework from package files
    if (fs.existsSync(path.join(this.projectRoot, 'package.json'))) {
      await this.analyzeNodeProject();
    } else if (fs.existsSync(path.join(this.projectRoot, 'Cargo.toml'))) {
      await this.analyzeRustProject();
    } else if (fs.existsSync(path.join(this.projectRoot, 'requirements.txt')) ||
               fs.existsSync(path.join(this.projectRoot, 'pyproject.toml'))) {
      await this.analyzePythonProject();
    } else if (fs.existsSync(path.join(this.projectRoot, 'go.mod'))) {
      await this.analyzeGoProject();
    }

    // Analyze project structure
    await this.analyzeProjectStructure();
  }

  async analyzeNodeProject() {
    this.config.language = 'TypeScript'; // Default assumption
    const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));

    // Detect language
    if (packageJson.devDependencies?.typescript || packageJson.dependencies?.typescript) {
      this.config.language = 'TypeScript';
    } else {
      this.config.language = 'JavaScript';
    }

    // Detect framework
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    if (deps.react) this.config.framework = 'React';
    else if (deps.next) this.config.framework = 'Next.js';
    else if (deps.express) this.config.framework = 'Express';
    else if (deps.fastify) this.config.framework = 'Fastify';
    else if (deps.vue) this.config.framework = 'Vue';

    // Set commands
    this.config.buildCommand = 'npm run build';
    this.config.lintCommand = 'npm run lint';
    this.config.formatCommand = 'prettier --check .';
    this.config.testCommand = 'npm test';
    this.config.typecheckCommand = 'tsc --noEmit';
  }

  async analyzeRustProject() {
    this.config.language = 'Rust';
    const cargoToml = fs.readFileSync(path.join(this.projectRoot, 'Cargo.toml'), 'utf8');

    // Detect framework
    if (cargoToml.includes('actix-web')) this.config.framework = 'Actix-web';
    else if (cargoToml.includes('rocket')) this.config.framework = 'Rocket';
    else if (cargoToml.includes('axum')) this.config.framework = 'Axum';
    else if (cargoToml.includes('tokio')) this.config.framework = 'Tokio';

    // Set commands
    this.config.buildCommand = 'cargo build --release';
    this.config.lintCommand = 'cargo clippy --all-targets --all-features';
    this.config.formatCommand = 'cargo fmt -- --check';
    this.config.testCommand = 'cargo test';
    this.config.typecheckCommand = 'cargo check';
  }

  async analyzePythonProject() {
    this.config.language = 'Python';

    // Check for requirements.txt
    const reqPath = path.join(this.projectRoot, 'requirements.txt');
    if (fs.existsSync(reqPath)) {
      const requirements = fs.readFileSync(reqPath, 'utf8');
      if (requirements.includes('fastapi')) this.config.framework = 'FastAPI';
      else if (requirements.includes('django')) this.config.framework = 'Django';
      else if (requirements.includes('flask')) this.config.framework = 'Flask';
    }

    // Check for pyproject.toml
    const pyprojectPath = path.join(this.projectRoot, 'pyproject.toml');
    if (fs.existsSync(pyprojectPath)) {
      const pyproject = fs.readFileSync(pyprojectPath, 'utf8');
      if (pyproject.includes('poetry')) {
        this.config.buildCommand = 'poetry build';
        this.config.lintCommand = 'poetry run ruff check';
        this.config.formatCommand = 'poetry run black --check .';
        this.config.testCommand = 'poetry run pytest';
        this.config.typecheckCommand = 'poetry run mypy';
      } else {
        this.config.buildCommand = 'python -m build';
        this.config.lintCommand = 'ruff check';
        this.config.formatCommand = 'black --check .';
        this.config.testCommand = 'pytest';
        this.config.typecheckCommand = 'mypy';
      }
    } else {
      // Default pip commands
      this.config.buildCommand = 'python -m build';
      this.config.lintCommand = 'ruff check';
      this.config.formatCommand = 'black --check .';
      this.config.testCommand = 'pytest';
      this.config.typecheckCommand = 'mypy';
    }
  }

  async analyzeGoProject() {
    this.config.language = 'Go';
    const goMod = fs.readFileSync(path.join(this.projectRoot, 'go.mod'), 'utf8');

    // Set commands
    this.config.buildCommand = 'go build ./...';
    this.config.lintCommand = 'golangci-lint run';
    this.config.formatCommand = 'gofmt -d .';
    this.config.testCommand = 'go test ./...';
    this.config.typecheckCommand = 'go vet ./...';
  }

  async analyzeProjectStructure() {
    // Analyze directory structure for documentation
    const dirs = ['src', 'lib', 'app', 'components', 'services', 'models', 'migrations', 'config'];
    const structure = [];

    for (const dir of dirs) {
      if (fs.existsSync(path.join(this.projectRoot, dir))) {
        structure.push(dir);
      }
    }

    this.config.projectStructure = structure;
  }

  async getGitConfig() {
    try {
      this.config.authorName = execSync('git config user.name', { encoding: 'utf8' }).trim();
      this.config.authorEmail = execSync('git config user.email', { encoding: 'utf8' }).trim();

      try {
        this.config.repositoryUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      } catch {
        this.config.repositoryUrl = 'Not set';
      }

      if (!this.config.projectName) {
        // Extract project name from git repo or directory
        try {
          const remoteUrl = this.config.repositoryUrl;
          if (remoteUrl && remoteUrl !== 'Not set') {
            this.config.projectName = remoteUrl.split('/').pop().replace('.git', '');
          } else {
            this.config.projectName = path.basename(this.projectRoot);
          }
        } catch {
          this.config.projectName = path.basename(this.projectRoot);
        }
      }
    } catch (error) {
      console.warn('⚠️  Warning: Could not get Git configuration');
    }
  }

  async updateConfiguration() {
    console.log('🔧 Updating configuration...');

    // Update CLAUDE.md
    await this.updateClaudeMd();

    // Update task template
    await this.updateTaskTemplate();
  }

  async updateClaudeMd() {
    const claudePath = path.join(this.projectRoot, 'CLAUDE.md');
    if (!fs.existsSync(claudePath)) {
      console.warn('⚠️  CLAUDE.md not found, skipping update');
      return;
    }

    let content = fs.readFileSync(claudePath, 'utf8');

    // Replace placeholders
    content = content.replace(/\[PROJECT_NAME\]/g, this.config.projectName);
    content = content.replace(/\[REPOSITORY_URL\]/g, this.config.repositoryUrl);
    content = content.replace(/\[AUTHOR_NAME\]/g, this.config.authorName);
    content = content.replace(/\[EMAIL\]/g, this.config.authorEmail);
    content = content.replace(/\[PRIMARY_LANGUAGE\]/g, this.config.language);
    content = content.replace(/\[WEB_FRAMEWORK\]/g, this.config.framework);
    content = content.replace(/\[DATABASE\]/g, this.config.database || 'Not specified');
    content = content.replace(/\[DEPLOYMENT_PLATFORM\]/g, this.config.deployment || 'Not specified');

    // Replace command placeholders
    content = content.replace(/\[build command\]/g, this.config.buildCommand);
    content = content.replace(/\[lint command\]/g, this.config.lintCommand);
    content = content.replace(/\[format command\]/g, this.config.formatCommand);
    content = content.replace(/\[test command\]/g, this.config.testCommand);
    content = content.replace(/\[typecheck command\]/g, this.config.typecheckCommand);

    fs.writeFileSync(claudePath, content);
    console.log('✅ Updated CLAUDE.md');
  }

  async updateTaskTemplate() {
    const templatePath = path.join(this.projectRoot, 'docs', 'TASK-ISSUE-TEMP.md');
    if (!fs.existsSync(templatePath)) {
      console.warn('⚠️  docs/TASK-ISSUE-TEMP.md not found, skipping update');
      return;
    }

    let content = fs.readFileSync(templatePath, 'utf8');

    // Replace command placeholders
    content = content.replace(/\[build command\]/g, this.config.buildCommand);
    content = content.replace(/\[lint command\]/g, this.config.lintCommand);
    content = content.replace(/\[format command\]/g, this.config.formatCommand);
    content = content.replace(/\[test command\]/g, this.config.testCommand);
    content = content.replace(/\[typecheck command\]/g, this.config.typecheckCommand);

    fs.writeFileSync(templatePath, content);
    console.log('✅ Updated task template');
  }

  
  async setupGitWorkflow() {
    console.log('🔧 Setting up Git workflow...');

    try {
      // Check if we're in a git repository
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });

      // Create and push staging branch if it doesn't exist
      try {
        execSync('git checkout staging', { stdio: 'ignore' });
        console.log('✅ Switched to staging branch');
      } catch {
        try {
          execSync('git checkout -b staging');
          console.log('✅ Created staging branch');
        } catch (error) {
          console.warn('⚠️  Could not create staging branch:', error.message);
        }
      }

      // Try to push staging branch
      try {
        execSync('git push -u origin staging', { stdio: 'ignore' });
        console.log('✅ Pushed staging branch to remote');
      } catch {
        console.warn('⚠️  Could not push staging branch (may not exist remotely)');
      }

    } catch {
      console.warn('⚠️  Not in a Git repository. Please run: git init');
    }
  }

  async validateSetup() {
    console.log('🔍 Validating setup...');

    // Check GitHub CLI
    try {
      execSync('gh --version', { stdio: 'ignore' });
      console.log('✅ GitHub CLI is available');
    } catch {
      console.warn('⚠️  GitHub CLI (gh) not found. Install from: https://cli.github.com/');
    }

    // Check language-specific tools
    switch (this.config.language) {
      case 'TypeScript':
      case 'JavaScript':
        try {
          execSync('node --version', { stdio: 'ignore' });
          execSync('npm --version', { stdio: 'ignore' });
          console.log('✅ Node.js and npm are available');
        } catch {
          console.warn('⚠️  Node.js/npm not found. Please install Node.js');
        }
        break;
      case 'Rust':
        try {
          execSync('rustc --version', { stdio: 'ignore' });
          execSync('cargo --version', { stdio: 'ignore' });
          console.log('✅ Rust and Cargo are available');
        } catch {
          console.warn('⚠️  Rust/Cargo not found. Please install Rust');
        }
        break;
      case 'Python':
        try {
          execSync('python --version', { stdio: 'ignore' });
          console.log('✅ Python is available');
        } catch {
          console.warn('⚠️  Python not found. Please install Python');
        }
        break;
      case 'Go':
        try {
          execSync('go version', { stdio: 'ignore' });
          console.log('✅ Go is available');
        } catch {
          console.warn('⚠️  Go not found. Please install Go');
        }
        break;
    }
  }

  printSuccess() {
    console.log('\n🎉 Project initialized successfully!\n');

    console.log('📋 Project Configuration:');
    console.log(`- Name: ${this.config.projectName}`);
    console.log(`- Language: ${this.config.language}`);
    if (this.config.framework) console.log(`- Framework: ${this.config.framework}`);
    if (this.config.database) console.log(`- Database: ${this.config.database}`);
    console.log(`- Repository: ${this.config.repositoryUrl}\n`);

    console.log('🔧 Workflow Commands Updated:');
    console.log(`- Build command: ${this.config.buildCommand}`);
    console.log(`- Lint command: ${this.config.lintCommand}`);
    console.log(`- Format command: ${this.config.formatCommand}`);
    console.log(`- Test command: ${this.config.testCommand}`);
    console.log(`- Type check command: ${this.config.typecheckCommand}\n`);

    console.log('📚 Next Steps:');
    console.log('1. Use /fcs [topic] to create context discussions');
    console.log('2. Use /plan [task] to create implementation tasks');
    console.log('3. Use /impl [issue-number] to implement features');
    console.log('4. Use /pr [feedback] to create pull requests\n');

    console.log('🎉 Your workflow is ready to use!');
  }
}

// Run if executed directly
if (require.main === module) {
  const initializer = new ProjectInitializer();
  initializer.initialize().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = ProjectInitializer;