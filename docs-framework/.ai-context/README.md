# AI Context Markers

This directory contains metadata to help AI agents understand documentation context and navigate the Banyan Platform documentation efficiently.

## Overview

The `.ai-context` directory provides machine-readable metadata that AI agents can use to:
- Understand the semantic relationships between documentation files
- Route queries to the most relevant documentation
- Recognize common patterns in user queries
- Navigate the documentation structure efficiently
- Provide contextually aware responses

## File Types

### `patterns.json`
Machine-readable patterns that AI should recognize when processing user queries.

**Contents:**
- Error patterns and routing rules
- Task-based query patterns
- Concept query patterns
- Debugging query patterns
- Reference query patterns

**Usage:**
AI agents should load this file to match user queries against known patterns and route them to appropriate documentation sections.

### `relationships.json`
Document relationship graph showing how documentation files relate to each other.

**Contents:**
- Prerequisites for each document
- Next steps / recommended reading
- Related concepts
- Related guides
- Troubleshooting links

**Usage:**
AI agents use this to provide progressive disclosure - starting with directly relevant content and suggesting related material for deeper understanding.

### Context Files (`*.context.json`)
Semantic context for major documentation sections.

**Contents:**
- Section purpose and scope
- Target audience
- Common use cases
- Key concepts covered
- Related sections

**Usage:**
Helps AI agents understand what each documentation section is about and when to recommend it.

## How AI Agents Should Use This Directory

### 1. Query Routing

When a user asks a question:

```
1. Load patterns.json
2. Match query against patterns
3. Identify pattern type (error, task, concept, debugging, reference)
4. Route to primary documentation via DOCUMENTATION_MAP.json
5. Use relationships.json to suggest related content
```

### 2. Progressive Disclosure

When providing answers:

```
1. Start with directly relevant content (from pattern match)
2. Check relationships.json for prerequisites
3. If user lacks prerequisites, provide those first
4. After main answer, suggest "next steps" from relationships
5. Link to related concepts for deeper understanding
```

### 3. Context-Aware Responses

When formulating responses:

```
1. Load context file for relevant section
2. Understand section's purpose and scope
3. Tailor response depth to user's skill level
4. Include relevant examples from section
5. Link to complementary sections
```

## File Formats

### patterns.json Structure

```json
{
  "errorPatterns": {
    "regex": "pattern to match error queries",
    "route": "where to route these queries",
    "searchStrategy": "how to search"
  },
  "taskPatterns": { ... },
  "conceptPatterns": { ... }
}
```

### relationships.json Structure

```json
{
  "path/to/document.md": {
    "prerequisites": ["docs user should read first"],
    "nextSteps": ["docs user should read next"],
    "relatedConcepts": ["conceptual docs"],
    "relatedGuides": ["practical guides"],
    "troubleshooting": ["relevant troubleshooting"]
  }
}
```

### context.json Structure

```json
{
  "section": "section-name",
  "purpose": "what this section is for",
  "audience": "beginner|intermediate|advanced",
  "useCases": ["when to use this section"],
  "keyConcepts": ["main concepts covered"],
  "relatedSections": ["other relevant sections"]
}
```

## Integration with Other Documentation Files

### DOCUMENTATION_MAP.json
The `.ai-context` directory complements `DOCUMENTATION_MAP.json`:
- DOCUMENTATION_MAP provides file locations and categorization
- .ai-context provides semantic relationships and query patterns

### AI_QUERY_PATTERNS.md
Human-readable documentation of query patterns. The `patterns.json` file is the machine-readable version of these patterns.

### Frontmatter in Documentation Files
Individual documentation files have frontmatter with:
- `aliases`: Alternative names for the concept
- `relatedConcepts`: Related topics
- `commonQuestions`: Questions this doc answers

The `.ai-context` files aggregate and extend this information.

## Best Practices for AI Agents

1. **Always Load Context First**
   - Before answering queries, load relevant context files
   - Understand the documentation structure
   - Know the relationships between documents

2. **Use Pattern Matching**
   - Match user queries against patterns.json
   - Route queries appropriately
   - Provide targeted answers

3. **Respect Skill Levels**
   - Detect user skill level from query
   - Provide appropriate depth
   - Link to prerequisite material when needed

4. **Provide Complete Answers**
   - Primary answer from matched pattern
   - Related concepts for understanding
   - Next steps for continued learning
   - Troubleshooting if relevant

5. **Validate Paths**
   - Always verify file paths exist before referencing
   - Fall back to similar topics if exact match unavailable
   - Use DOCUMENTATION_MAP.json as source of truth

## Maintenance

### When Adding New Documentation

1. Update `DOCUMENTATION_MAP.json` with new file location
2. Update `relationships.json` with document relationships
3. If introducing new query patterns, update `patterns.json`
4. Add frontmatter with aliases and commonQuestions to the new file

### When Updating Relationships

Edit `relationships.json` to reflect new or changed relationships between documents.

### When Adding New Query Patterns

1. Update `patterns.json` with new pattern
2. Document pattern in `AI_QUERY_PATTERNS.md`
3. Test pattern routing with example queries

## Example Usage

### Example 1: Error Query

```
User: "I'm getting HANDLER_NOT_DISCOVERED error"

AI Process:
1. Load patterns.json
2. Match against errorPatterns regex
3. Identify error code: HANDLER_NOT_DISCOVERED
4. Route to: error-catalog.md#handler-not-discovered
5. Load relationships.json
6. Find related troubleshooting: handlers-not-discovered.md
7. Provide comprehensive answer with both resources
```

### Example 2: Task Query

```
User: "How do I add event sourcing to my service?"

AI Process:
1. Load patterns.json
2. Match against taskPatterns
3. Route to: DOCUMENTATION_MAP.json:byTask -> addEventSourcing
4. Load relationships.json for that guide
5. Check prerequisites: basic service creation
6. If user is beginner, suggest prerequisite first
7. Then provide event sourcing guide
8. Suggest related concepts for deeper understanding
```

### Example 3: Concept Query

```
User: "What is a correlation ID?"

AI Process:
1. Load patterns.json
2. Match against conceptPatterns
3. Route to: correlation-and-tracing.md
4. Load relationships.json
5. Provide concept explanation
6. Link to practical guide: correlation-id-tracking.md
7. Suggest related: Jaeger tracing, message bus
```

## Version History

- **1.0.0** (2025-11-15): Initial AI context system
  - patterns.json for query routing
  - relationships.json for document graph
  - README.md for AI agent guidance

## Future Enhancements

- **Semantic Search Index**: Full-text search capabilities
- **Context-Specific Embeddings**: Vector embeddings for similarity search
- **User Journey Tracking**: Common learning paths through documentation
- **FAQ Aggregation**: Most common questions across all docs
- **Code Example Index**: Quick lookup of code examples by pattern

## Support

For questions about the AI context system or suggestions for improvements, refer to the main documentation or contribute via the repository.
