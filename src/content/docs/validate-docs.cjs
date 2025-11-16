#!/usr/bin/env node

/**
 * Documentation Validation Script
 *
 * Validates markdown documentation files for:
 * - Valid YAML frontmatter with required fields
 * - Internal link resolution
 * - Code block language tags
 * - Orphaned files (not referenced anywhere)
 * - Consistent heading hierarchy
 *
 * Usage: node validate-docs.js [path-to-docs-directory]
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Configuration
const DOCS_ROOT = process.argv[2] || path.join(__dirname);
const TEMPLATE_DIR = path.join(DOCS_ROOT, '.templates');

// Required frontmatter fields by category
const REQUIRED_FIELDS = {
  'getting-started': ['title', 'description', 'category', 'tags', 'difficulty', 'estimated_time', 'prerequisites', 'last_updated', 'status'],
  'tutorials': ['title', 'description', 'category', 'tags', 'difficulty', 'estimated_time', 'prerequisites', 'learning_objectives', 'last_updated', 'status'],
  'concepts': ['title', 'description', 'category', 'tags', 'difficulty', 'related_concepts', 'prerequisites', 'last_updated', 'status'],
  'guides': ['title', 'description', 'category', 'tags', 'difficulty', 'estimated_time', 'prerequisites', 'use_cases', 'last_updated', 'status'],
  'reference': ['title', 'description', 'category', 'tags', 'api_version', 'last_updated', 'status'],
  'troubleshooting': ['title', 'description', 'category', 'tags', 'applies_to', 'common_errors', 'last_updated', 'status']
};

// Validation results
const results = {
  totalFiles: 0,
  errors: [],
  warnings: [],
  filesProcessed: new Set(),
  internalLinks: new Map(),
  fileReferences: new Map(),
};

/**
 * Main validation function
 */
async function validateDocs() {
  console.log('📚 Starting documentation validation...\n');
  console.log(`📁 Docs root: ${DOCS_ROOT}\n`);

  // Find all markdown files
  const markdownFiles = findMarkdownFiles(DOCS_ROOT);
  results.totalFiles = markdownFiles.length;

  console.log(`Found ${markdownFiles.length} markdown files\n`);

  // Validate each file
  for (const file of markdownFiles) {
    validateFile(file);
  }

  // Check for orphaned files
  checkOrphanedFiles(markdownFiles);

  // Print results
  printResults();

  // Exit with error code if there are errors
  process.exit(results.errors.length > 0 ? 1 : 0);
}

/**
 * Find all markdown files recursively
 */
function findMarkdownFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      // Skip node_modules, .git, etc.
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

/**
 * Validate a single markdown file
 */
function validateFile(filePath) {
  const relativePath = path.relative(DOCS_ROOT, filePath);
  results.filesProcessed.add(relativePath);

  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Skip template files from certain validations
    const isTemplate = filePath.startsWith(TEMPLATE_DIR);

    // Validate frontmatter
    validateFrontmatter(filePath, content, isTemplate);

    // Validate internal links
    validateInternalLinks(filePath, content);

    // Validate code blocks
    validateCodeBlocks(filePath, content);

    // Validate heading hierarchy
    validateHeadingHierarchy(filePath, content);

  } catch (error) {
    addError(filePath, `Failed to read file: ${error.message}`);
  }
}

/**
 * Validate YAML frontmatter
 */
function validateFrontmatter(filePath, content, isTemplate) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    addError(filePath, 'Missing YAML frontmatter');
    return;
  }

  try {
    const frontmatter = yaml.load(frontmatterMatch[1]);

    if (!frontmatter || typeof frontmatter !== 'object') {
      addError(filePath, 'Invalid YAML frontmatter structure');
      return;
    }

    // Skip detailed validation for templates (they have placeholders)
    if (isTemplate) {
      return;
    }

    // Check category
    if (!frontmatter.category) {
      addError(filePath, 'Missing required field: category');
      return;
    }

    // Validate required fields based on category
    const requiredFields = REQUIRED_FIELDS[frontmatter.category];
    if (!requiredFields) {
      addWarning(filePath, `Unknown category: ${frontmatter.category}`);
      return;
    }

    for (const field of requiredFields) {
      if (!(field in frontmatter)) {
        addError(filePath, `Missing required field: ${field}`);
      }
    }

    // Validate field types
    if (frontmatter.tags && !Array.isArray(frontmatter.tags)) {
      addError(filePath, 'Field "tags" must be an array');
    }

    if (frontmatter.difficulty && !['beginner', 'intermediate', 'advanced'].includes(frontmatter.difficulty)) {
      addError(filePath, 'Field "difficulty" must be one of: beginner, intermediate, advanced');
    }

    if (frontmatter.status && !['draft', 'review', 'published'].includes(frontmatter.status)) {
      addError(filePath, 'Field "status" must be one of: draft, review, published');
    }

    // Validate date format
    if (frontmatter.last_updated && !frontmatter.last_updated.match(/^\d{4}-\d{2}-\d{2}$/)) {
      addError(filePath, 'Field "last_updated" must be in YYYY-MM-DD format');
    }

  } catch (error) {
    addError(filePath, `Failed to parse YAML frontmatter: ${error.message}`);
  }
}

/**
 * Validate internal links
 */
function validateInternalLinks(filePath, content) {
  // Match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const linkText = match[1];
    const linkUrl = match[2];

    // Skip external links
    if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
      continue;
    }

    // Skip anchors-only links
    if (linkUrl.startsWith('#')) {
      continue;
    }

    // Extract file path (remove anchors)
    const [linkPath] = linkUrl.split('#');

    // Resolve relative to current file
    const currentDir = path.dirname(filePath);
    const absoluteLinkPath = path.resolve(currentDir, linkPath);

    // Store the link for later validation
    if (!results.internalLinks.has(filePath)) {
      results.internalLinks.set(filePath, []);
    }
    results.internalLinks.get(filePath).push({
      text: linkText,
      url: linkUrl,
      resolvedPath: absoluteLinkPath
    });

    // Track file references
    const relativeLinkPath = path.relative(DOCS_ROOT, absoluteLinkPath);
    if (!results.fileReferences.has(relativeLinkPath)) {
      results.fileReferences.set(relativeLinkPath, new Set());
    }
    results.fileReferences.get(relativeLinkPath).add(path.relative(DOCS_ROOT, filePath));

    // Check if file exists
    if (!fs.existsSync(absoluteLinkPath)) {
      addError(filePath, `Broken internal link: "${linkUrl}" resolves to non-existent file: ${relativeLinkPath}`);
    }
  }
}

/**
 * Validate code blocks have language tags
 */
function validateCodeBlocks(filePath, content) {
  // Match fenced code blocks
  const codeBlockRegex = /```(\w*)\n/g;
  let match;
  let blockNumber = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    blockNumber++;
    const language = match[1];

    if (!language || language.trim() === '') {
      addWarning(filePath, `Code block #${blockNumber} missing language tag`);
    }
  }
}

/**
 * Validate heading hierarchy (no skipped levels)
 */
function validateHeadingHierarchy(filePath, content) {
  // Match headings
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  let previousLevel = 0;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2];

    // Check if we skipped a level (e.g., from h2 to h4)
    if (level > previousLevel + 1 && previousLevel > 0) {
      addWarning(filePath, `Heading hierarchy skip: "${text}" is h${level} but previous was h${previousLevel}`);
    }

    previousLevel = level;
  }
}

/**
 * Check for orphaned files (not referenced anywhere)
 */
function checkOrphanedFiles(allFiles) {
  for (const file of allFiles) {
    const relativePath = path.relative(DOCS_ROOT, file);

    // Skip templates
    if (relativePath.startsWith('.templates')) {
      continue;
    }

    // Skip README and index files
    const basename = path.basename(file);
    if (basename === 'README.md' || basename === 'index.md') {
      continue;
    }

    // Check if this file is referenced by any other file
    if (!results.fileReferences.has(relativePath)) {
      addWarning(file, 'Orphaned file: not referenced by any other documentation');
    }
  }
}

/**
 * Add an error to results
 */
function addError(filePath, message) {
  results.errors.push({
    file: path.relative(DOCS_ROOT, filePath),
    message
  });
}

/**
 * Add a warning to results
 */
function addWarning(filePath, message) {
  results.warnings.push({
    file: path.relative(DOCS_ROOT, filePath),
    message
  });
}

/**
 * Print validation results
 */
function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 VALIDATION RESULTS');
  console.log('='.repeat(80) + '\n');

  console.log(`📄 Files processed: ${results.totalFiles}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}\n`);

  if (results.errors.length > 0) {
    console.log('❌ ERRORS:\n');
    for (const error of results.errors) {
      console.log(`  ${error.file}`);
      console.log(`    → ${error.message}\n`);
    }
  }

  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    for (const warning of results.warnings) {
      console.log(`  ${warning.file}`);
      console.log(`    → ${warning.message}\n`);
    }
  }

  if (results.errors.length === 0 && results.warnings.length === 0) {
    console.log('✅ All documentation files are valid!\n');
  }

  console.log('='.repeat(80) + '\n');
}

// Run validation if this script is executed directly
if (require.main === module) {
  // Check if js-yaml is available
  try {
    require.resolve('js-yaml');
  } catch (error) {
    console.error('❌ Error: js-yaml module not found');
    console.error('Please install it with: npm install js-yaml\n');
    process.exit(1);
  }

  validateDocs().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = { validateDocs };
