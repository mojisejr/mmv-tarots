#!/usr/bin/env node

/**
 * Codebase Analysis Utilities
 *
 * These utilities provide reality-grounded analysis of the codebase
 * to prevent hallucination in planning and context creation.
 */

const fs = require('fs');
const path = require('path');

class CodebaseAnalyzer {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.packageJsonPath = path.join(projectRoot, 'package.json');
    this.srcDir = path.join(projectRoot, 'src');
  }

  /**
   * Analyze project dependencies and installed packages
   */
  analyzeDependencies() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      return {
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
        scripts: packageJson.scripts || {},
        availablePackages: Object.keys({
          ...(packageJson.dependencies || {}),
          ...(packageJson.devDependencies || {})
        })
      };
    } catch (error) {
      console.warn('Warning: Could not read package.json:', error.message);
      return {
        dependencies: {},
        devDependencies: {},
        scripts: {},
        availablePackages: []
      };
    }
  }

  /**
   * Scan existing components and patterns in the codebase
   */
  analyzeComponents() {
    const components = {
      existing: [],
      patterns: [],
      directories: []
    };

    try {
      // Scan src/components directory
      const componentsDir = path.join(this.srcDir, 'components');
      if (fs.existsSync(componentsDir)) {
        const items = fs.readdirSync(componentsDir, { withFileTypes: true });

        items.forEach(item => {
          if (item.isDirectory()) {
            components.directories.push(item.name);
            // Look for index.ts or main component file
            const componentFiles = fs.readdirSync(path.join(componentsDir, item.name))
              .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'));

            if (componentFiles.length > 0) {
              components.existing.push({
                name: item.name,
                files: componentFiles,
                path: path.join('src/components', item.name)
              });
            }
          }
        });
      }

      // Analyze common patterns
      this.analyzePatterns(components);

    } catch (error) {
      console.warn('Warning: Could not analyze components:', error.message);
    }

    return components;
  }

  /**
   * Analyze coding patterns and architecture
   */
  analyzePatterns(components) {
    try {
      // Scan for API routes
      const apiDir = path.join(this.srcDir, 'app/api');
      if (fs.existsSync(apiDir)) {
        components.patterns.push('api-routes');

        // Find existing API endpoints
        const apiEndpoints = this.findApiEndpoints(apiDir);
        components.apiEndpoints = apiEndpoints;
      }

      // Scan for Prisma schema
      const prismaSchema = path.join(this.srcDir, 'prisma/schema.prisma');
      if (fs.existsSync(prismaSchema)) {
        components.patterns.push('prisma-orm');
        components.hasPrisma = true;
      }

      // Check for authentication patterns
      if (fs.existsSync(path.join(this.srcDir, 'lib/auth'))) {
        components.patterns.push('auth-system');
      }

      // Check for form libraries
      const deps = this.analyzeDependencies().availablePackages;
      if (deps.includes('react-hook-form')) {
        components.patterns.push('react-hook-form');
      }
      if (deps.includes('zod')) {
        components.patterns.push('zod-validation');
      }
      if (deps.includes('@hookform/resolvers')) {
        components.patterns.push('hookform-resolvers');
      }

    } catch (error) {
      console.warn('Warning: Could not analyze patterns:', error.message);
    }
  }

  /**
   * Find existing API endpoints
   */
  findApiEndpoints(apiDir, basePath = '') {
    const endpoints = [];

    try {
      const items = fs.readdirSync(path.join(apiDir, basePath));

      items.forEach(item => {
        const itemPath = path.join(basePath, item);
        const fullPath = path.join(apiDir, itemPath);

        if (fs.statSync(fullPath).isDirectory()) {
          endpoints.push(...this.findApiEndpoints(apiDir, itemPath));
        } else if (item === 'route.ts' || item === 'route.js') {
          // Construct endpoint path
          const pathParts = basePath.split(path.sep);
          if (pathParts.length > 0) {
            endpoints.push(pathParts.join('/'));
          }
        }
      });
    } catch (error) {
      console.warn(`Warning: Could not scan API directory ${basePath}:`, error.message);
    }

    return endpoints;
  }

  /**
   * Validate if specific dependencies exist
   */
  validateDependencies(requiredPackages) {
    const { availablePackages } = this.analyzeDependencies();
    const validation = {
      available: [],
      missing: [],
      requiresInstall: []
    };

    requiredPackages.forEach(pkg => {
      if (availablePackages.includes(pkg)) {
        validation.available.push(pkg);
      } else {
        validation.missing.push(pkg);
        validation.requiresInstall.push(pkg);
      }
    });

    return validation;
  }

  /**
   * Generate codebase summary for context
   */
  generateCodebaseSummary() {
    const dependencies = this.analyzeDependencies();
    const components = this.analyzeComponents();

    return {
      projectType: 'Next.js App Router',
      language: 'TypeScript',
      database: 'PostgreSQL via Supabase',
      orm: components.hasPrisma ? 'Prisma' : 'None',
      availablePackages: dependencies.availablePackages,
      existingComponents: components.existing.map(c => c.name),
      apiEndpoints: components.apiEndpoints || [],
      patterns: components.patterns,
      buildTools: {
        hasTypeScript: dependencies.availablePackages.includes('typescript'),
        hasESLint: dependencies.availablePackages.includes('eslint'),
        hasPrettier: dependencies.availablePackages.includes('prettier'),
        hasJest: dependencies.availablePackages.includes('jest') || dependencies.availablePackages.includes('@testing-library/react')
      }
    };
  }

  /**
   * Check if proposed feature is realistic for current codebase
   */
  validateProposedFeature(featureDescription) {
    const summary = this.generateCodebaseSummary();
    const validation = {
      isRealistic: true,
      missingRequirements: [],
      recommendations: [],
      realityCheck: []
    };

    // Analyze feature description for common requirements
    const lowerDesc = featureDescription.toLowerCase();

    // Form-related features
    if (lowerDesc.includes('form') || lowerDesc.includes('validation')) {
      if (!summary.availablePackages.includes('react-hook-form')) {
        validation.missingRequirements.push('react-hook-form for form management');
        validation.recommendations.push('Install: npm install react-hook-form @hookform/resolvers');
      }
      if (!summary.availablePackages.includes('zod')) {
        validation.missingRequirements.push('zod for schema validation');
        validation.recommendations.push('Install: npm install zod');
      }
    }

    // Toast/notification features
    if (lowerDesc.includes('toast') || lowerDesc.includes('notification')) {
      if (!summary.existingComponents.some(c => c.toLowerCase().includes('toast'))) {
        validation.missingRequirements.push('Toast/notification system');
        validation.recommendations.push('Implement using existing Card/Alert components or install toast library');
      }
    }

    // Testing-related features
    if (lowerDesc.includes('test') || lowerDesc.includes('testing')) {
      if (!summary.buildTools.hasJest) {
        validation.missingRequirements.push('Testing framework');
        validation.recommendations.push('Install: npm install --save-dev jest @testing-library/react');
      }
    }

    // Database schema features
    if (lowerDesc.includes('database') || lowerDesc.includes('migration') || lowerDesc.includes('schema')) {
      if (!summary.orm) {
        validation.missingRequirements.push('Database ORM (Prisma)');
        validation.recommendations.push('Setup Prisma first before database operations');
        validation.isRealistic = false;
      }
    }

    return validation;
  }
}

module.exports = CodebaseAnalyzer;