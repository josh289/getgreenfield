#!/usr/bin/env node

/**
 * AI Accessibility Validation Script
 *
 * Validates that all AI-optimized documentation files are properly configured:
 * - DOCUMENTATION_MAP.json is valid and all paths resolve
 * - relationships.json references only existing files
 * - patterns.json has valid regex patterns
 * - SEARCH_INDEX.json is complete and consistent
 * - Frontmatter in documentation files contains required fields
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class ValidationResult {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  addError(message) {
    this.errors.push(message);
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  addSuccess(message) {
    this.successes.push(message);
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  print() {
    console.log(`\n${colors.cyan}=== AI Accessibility Validation Results ===${colors.reset}\n`);

    if (this.successes.length > 0) {
      console.log(`${colors.green}✓ Successes (${this.successes.length}):${colors.reset}`);
      this.successes.forEach(msg => console.log(`  ${colors.green}✓${colors.reset} ${msg}`));
      console.log();
    }

    if (this.warnings.length > 0) {
      console.log(`${colors.yellow}⚠ Warnings (${this.warnings.length}):${colors.reset}`);
      this.warnings.forEach(msg => console.log(`  ${colors.yellow}⚠${colors.reset} ${msg}`));
      console.log();
    }

    if (this.errors.length > 0) {
      console.log(`${colors.red}✗ Errors (${this.errors.length}):${colors.reset}`);
      this.errors.forEach(msg => console.log(`  ${colors.red}✗${colors.reset} ${msg}`));
      console.log();
    }

    console.log(`${colors.cyan}Summary:${colors.reset}`);
    console.log(`  Successes: ${colors.green}${this.successes.length}${colors.reset}`);
    console.log(`  Warnings:  ${colors.yellow}${this.warnings.length}${colors.reset}`);
    console.log(`  Errors:    ${colors.red}${this.errors.length}${colors.reset}`);

    if (this.hasErrors()) {
      console.log(`\n${colors.red}Validation FAILED${colors.reset}\n`);
      return 1;
    } else {
      console.log(`\n${colors.green}Validation PASSED${colors.reset}\n`);
      return 0;
    }
  }
}

const docsRoot = __dirname;
const result = new ValidationResult();

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(path.join(docsRoot, filePath));
  } catch (error) {
    return false;
  }
}

/**
 * Load and parse JSON file
 */
function loadJSON(filename) {
  try {
    const content = fs.readFileSync(path.join(docsRoot, filename), 'utf8');
    return JSON.parse(content);
  } catch (error) {
    result.addError(`Failed to load ${filename}: ${error.message}`);
    return null;
  }
}

/**
 * Validate DOCUMENTATION_MAP.json
 */
function validateDocumentationMap() {
  console.log(`${colors.blue}Validating DOCUMENTATION_MAP.json...${colors.reset}`);

  const docMap = loadJSON('DOCUMENTATION_MAP.json');
  if (!docMap) return;

  result.addSuccess('DOCUMENTATION_MAP.json is valid JSON');

  // Validate structure
  if (!docMap.index) {
    result.addError('DOCUMENTATION_MAP.json missing "index" property');
    return;
  }

  // Validate all paths in byTask
  let validPaths = 0;
  let invalidPaths = 0;

  if (docMap.index.byTask) {
    Object.entries(docMap.index.byTask).forEach(([task, path]) => {
      if (fileExists(path)) {
        validPaths++;
      } else {
        invalidPaths++;
        result.addError(`byTask["${task}"] points to non-existent file: ${path}`);
      }
    });
  }

  // Validate byError paths
  if (docMap.index.byError) {
    Object.entries(docMap.index.byError).forEach(([error, path]) => {
      // Remove anchor if present
      const filePath = path.split('#')[0];
      if (fileExists(filePath)) {
        validPaths++;
      } else {
        invalidPaths++;
        result.addError(`byError["${error}"] points to non-existent file: ${filePath}`);
      }
    });
  }

  // Validate byPackage paths
  if (docMap.index.byPackage) {
    Object.entries(docMap.index.byPackage).forEach(([pkg, path]) => {
      if (fileExists(path)) {
        validPaths++;
      } else {
        invalidPaths++;
        result.addWarning(`byPackage["${pkg}"] points to non-existent file: ${path}`);
      }
    });
  }

  // Validate metadata
  if (docMap.metadata) {
    result.addSuccess('DOCUMENTATION_MAP.json has metadata section');

    const requiredMetadata = ['totalDocuments', 'lastValidated', 'platformVersion'];
    requiredMetadata.forEach(field => {
      if (docMap.metadata[field]) {
        result.addSuccess(`Metadata contains ${field}`);
      } else {
        result.addWarning(`Metadata missing ${field}`);
      }
    });
  } else {
    result.addWarning('DOCUMENTATION_MAP.json missing metadata section');
  }

  if (invalidPaths === 0) {
    result.addSuccess(`All ${validPaths} paths in DOCUMENTATION_MAP.json are valid`);
  } else {
    result.addError(`${invalidPaths} invalid paths found in DOCUMENTATION_MAP.json`);
  }
}

/**
 * Validate relationships.json
 */
function validateRelationships() {
  console.log(`${colors.blue}Validating relationships.json...${colors.reset}`);

  const relationships = loadJSON('.ai-context/relationships.json');
  if (!relationships) return;

  result.addSuccess('relationships.json is valid JSON');

  let validRefs = 0;
  let invalidRefs = 0;

  Object.entries(relationships).forEach(([docPath, relations]) => {
    // Skip metadata entries
    if (docPath === 'version' || docPath === 'lastUpdated' || docPath === 'description' ||
        docPath === 'learningPaths' || docPath === 'topicClusters') {
      return;
    }

    // Check if the document itself exists
    if (!fileExists(docPath)) {
      result.addWarning(`relationships.json references non-existent document: ${docPath}`);
      return;
    }

    // Check all related documents
    ['prerequisites', 'nextSteps', 'relatedConcepts', 'relatedGuides', 'troubleshooting'].forEach(category => {
      if (relations[category] && Array.isArray(relations[category])) {
        relations[category].forEach(relatedPath => {
          if (fileExists(relatedPath)) {
            validRefs++;
          } else {
            invalidRefs++;
            result.addError(`${docPath}.${category} references non-existent file: ${relatedPath}`);
          }
        });
      }
    });
  });

  if (invalidRefs === 0) {
    result.addSuccess(`All ${validRefs} relationship references are valid`);
  } else {
    result.addError(`${invalidRefs} invalid relationship references found`);
  }
}

/**
 * Validate patterns.json
 */
function validatePatterns() {
  console.log(`${colors.blue}Validating patterns.json...${colors.reset}`);

  const patterns = loadJSON('.ai-context/patterns.json');
  if (!patterns) return;

  result.addSuccess('patterns.json is valid JSON');

  // Validate regex patterns
  const patternTypes = ['errorPatterns', 'taskPatterns', 'conceptPatterns', 'debuggingPatterns', 'referencePatterns'];

  patternTypes.forEach(type => {
    if (patterns[type] && patterns[type].regex) {
      try {
        new RegExp(patterns[type].regex);
        result.addSuccess(`${type}.regex is valid`);
      } catch (error) {
        result.addError(`${type}.regex is invalid: ${error.message}`);
      }
    } else {
      result.addWarning(`${type} missing regex pattern`);
    }
  });

  // Validate contextual triggers
  if (patterns.contextualTriggers) {
    Object.entries(patterns.contextualTriggers).forEach(([trigger, config]) => {
      if (config.primary && !fileExists(config.primary)) {
        result.addError(`contextualTriggers["${trigger}"].primary points to non-existent file: ${config.primary}`);
      }
    });
  }
}

/**
 * Validate SEARCH_INDEX.json
 */
function validateSearchIndex() {
  console.log(`${colors.blue}Validating SEARCH_INDEX.json...${colors.reset}`);

  const searchIndex = loadJSON('SEARCH_INDEX.json');
  if (!searchIndex) return;

  result.addSuccess('SEARCH_INDEX.json is valid JSON');

  if (!searchIndex.documents || !Array.isArray(searchIndex.documents)) {
    result.addError('SEARCH_INDEX.json missing or invalid "documents" array');
    return;
  }

  let validDocs = 0;
  let invalidDocs = 0;

  searchIndex.documents.forEach(doc => {
    if (fileExists(doc.path)) {
      validDocs++;
    } else {
      invalidDocs++;
      result.addError(`SEARCH_INDEX document references non-existent file: ${doc.path}`);
    }

    // Validate required fields
    const requiredFields = ['path', 'title', 'category', 'difficulty', 'excerpt', 'keywords'];
    requiredFields.forEach(field => {
      if (!doc[field]) {
        result.addWarning(`SEARCH_INDEX document ${doc.path} missing field: ${field}`);
      }
    });
  });

  if (invalidDocs === 0) {
    result.addSuccess(`All ${validDocs} SEARCH_INDEX documents reference valid files`);
  } else {
    result.addError(`${invalidDocs} invalid document references in SEARCH_INDEX`);
  }

  // Validate metadata
  if (searchIndex.indexedDocuments !== searchIndex.documents.length) {
    result.addWarning(`SEARCH_INDEX.indexedDocuments (${searchIndex.indexedDocuments}) doesn't match actual count (${searchIndex.documents.length})`);
  }
}

/**
 * Validate frontmatter in key documentation files
 */
function validateFrontmatter() {
  console.log(`${colors.blue}Validating documentation frontmatter...${colors.reset}`);

  const keyFiles = [
    '02-concepts/architecture/correlation-and-tracing.md',
    '05-troubleshooting/by-symptom/handlers-not-discovered.md',
    '04-reference/decorators/command-handlers.md',
    '05-troubleshooting/debugging-tools/jaeger-tracing.md'
  ];

  let validFrontmatter = 0;
  let missingFrontmatter = 0;

  keyFiles.forEach(filePath => {
    if (!fileExists(filePath)) {
      result.addWarning(`Key file not found for frontmatter validation: ${filePath}`);
      return;
    }

    try {
      const content = fs.readFileSync(path.join(docsRoot, filePath), 'utf8');

      // Check for YAML frontmatter
      if (!content.startsWith('---')) {
        result.addWarning(`${filePath} missing frontmatter`);
        missingFrontmatter++;
        return;
      }

      // Extract frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) {
        result.addWarning(`${filePath} has malformed frontmatter`);
        missingFrontmatter++;
        return;
      }

      const frontmatter = frontmatterMatch[1];

      // Check for semantic fields
      const hasAliases = frontmatter.includes('aliases:');
      const hasRelatedConcepts = frontmatter.includes('relatedConcepts:');
      const hasCommonQuestions = frontmatter.includes('commonQuestions:');

      if (hasAliases && hasRelatedConcepts && hasCommonQuestions) {
        result.addSuccess(`${filePath} has complete semantic frontmatter`);
        validFrontmatter++;
      } else {
        const missing = [];
        if (!hasAliases) missing.push('aliases');
        if (!hasRelatedConcepts) missing.push('relatedConcepts');
        if (!hasCommonQuestions) missing.push('commonQuestions');
        result.addWarning(`${filePath} missing semantic fields: ${missing.join(', ')}`);
        missingFrontmatter++;
      }
    } catch (error) {
      result.addError(`Failed to validate frontmatter for ${filePath}: ${error.message}`);
    }
  });

  if (validFrontmatter === keyFiles.length) {
    result.addSuccess('All key files have complete semantic frontmatter');
  }
}

/**
 * Validate AI context directory structure
 */
function validateAIContextDirectory() {
  console.log(`${colors.blue}Validating .ai-context directory...${colors.reset}`);

  const requiredFiles = [
    '.ai-context/README.md',
    '.ai-context/patterns.json',
    '.ai-context/relationships.json'
  ];

  requiredFiles.forEach(file => {
    if (fileExists(file)) {
      result.addSuccess(`${file} exists`);
    } else {
      result.addError(`Required file missing: ${file}`);
    }
  });
}

/**
 * Run all validations
 */
function runValidation() {
  console.log(`\n${colors.cyan}Starting AI Accessibility Validation${colors.reset}`);
  console.log(`Documentation root: ${docsRoot}\n`);

  validateDocumentationMap();
  validateRelationships();
  validatePatterns();
  validateSearchIndex();
  validateFrontmatter();
  validateAIContextDirectory();

  return result.print();
}

// Run validation
const exitCode = runValidation();
process.exit(exitCode);
