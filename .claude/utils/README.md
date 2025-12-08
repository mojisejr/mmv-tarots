# Codebase Analyzer Utilities

These utilities provide reality-grounded analysis of the codebase to prevent hallucination in planning and context creation.

## Usage

```javascript
const CodebaseAnalyzer = require('./codebase-analyzer.js');

// Initialize analyzer
const analyzer = new CodebaseAnalyzer('/path/to/project');

// Analyze dependencies
const deps = analyzer.analyzeDependencies();
console.log('Available packages:', deps.availablePackages);

// Analyze components
const components = analyzer.analyzeComponents();
console.log('Existing components:', components.existing);

// Validate proposed feature
const validation = analyzer.validateProposedFeature('Create payment form');
console.log('Missing requirements:', validation.missingRequirements);

// Generate full summary
const summary = analyzer.generateCodebaseSummary();
console.log('Project state:', summary);
```

## Features

### 1. Dependency Analysis
- Scans `package.json` for installed packages
- Identifies available scripts
- Provides package availability validation

### 2. Component Analysis
- Scans `src/components` for existing UI components
- Detects architectural patterns (API routes, auth, forms)
- Identifies available libraries and tools

### 3. Feature Validation
- Validates if proposed features are realistic for current codebase
- Identifies missing dependencies with installation commands
- Provides fallback alternatives for missing components

### 4. Pattern Detection
- Detects existing patterns (API routes, auth systems, form libraries)
- Analyzes file structure and naming conventions
- Identifies architectural decisions

## Integration

These utilities are used by:
- `/fcs` command: To provide reality-grounded context analysis
- `/plan` command: To validate task requirements against actual codebase
- Future tools: To ensure all planning is based on codebase reality

## Example Output

```javascript
{
  dependencies: {
    available: ['next', 'react', 'typescript', 'prisma', 'zod'],
    missing: ['react-hook-form'],
    requiresInstall: ['react-hook-form']
  },
  components: {
    existing: ['Button', 'Card', 'Input', 'Alert'],
    patterns: ['api-routes', 'prisma-orm', 'zod-validation']
  },
  validation: {
    isRealistic: true,
    missingRequirements: ['react-hook-form for form management'],
    recommendations: ['Install: npm install react-hook-form']
  }
}
```

## Benefits

- **Prevents hallucination**: All requirements validated against actual code
- **Provides installation guidance**: Exact commands for missing dependencies
- **Suggests alternatives**: Fallback solutions when pieces are missing
- **Maintains consistency**: Follows existing codebase patterns
- **Reality-based planning**: Tasks based on actual project capabilities