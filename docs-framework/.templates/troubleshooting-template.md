---
# YAML Frontmatter - Required fields for all troubleshooting docs
title: "Troubleshooting [Component/Feature/Area Name]"
description: "[Brief description of what problems this covers - max 160 chars]"
category: "troubleshooting"
tags: ["debugging", "errors"]
applies_to: []  # List of components/packages this applies to
common_errors: []  # List of error codes/messages covered
last_updated: "YYYY-MM-DD"
status: "draft"  # draft | review | published
---

<!--
TROUBLESHOOTING TEMPLATE USAGE INSTRUCTIONS:

This template is for problem-solution documentation that helps users resolve issues.
Use this template when documenting:
- Common errors and their solutions
- Debugging strategies for specific components
- Known issues and workarounds
- Configuration problems and fixes

STRUCTURE GUIDELINES:
1. Organize by symptom/error (what users experience)
2. Provide clear diagnostic steps
3. Offer multiple solution paths when applicable
4. Include root cause explanations
5. Link to related guides/references

TROUBLESHOOTING vs GUIDE:
- Troubleshooting: "Thing isn't working, fix it"
- Guide: "Make thing work correctly from start"

FRONTMATTER TIPS:
- title: Name the area being troubleshot
- applies_to: List all affected components
- common_errors: Include error codes for searchability
- tags: Include technology/area tags
-->

# Troubleshooting [Component/Feature/Area Name]

> **Quick Help:** [One sentence overview of what this troubleshooting guide covers]

## Overview

[Brief introduction explaining what problems this guide addresses and how to use it]

### How to Use This Guide

1. **Find your symptom** - Look for the error message or behavior you're experiencing
2. **Try the quick fix** - Most issues have a common solution
3. **Dig deeper** - If quick fix doesn't work, follow diagnostic steps
4. **Get help** - Links to support if problem persists

### Common Issues at a Glance

| Issue | Quick Fix | Details |
|-------|-----------|---------|
| [Error/symptom 1] | [One-line fix] | [Link to section] |
| [Error/symptom 2] | [One-line fix] | [Link to section] |
| [Error/symptom 3] | [One-line fix] | [Link to section] |

## Issues by Category

### Installation & Setup Issues

#### Issue: [Specific Error/Problem]

**Error Message:**
```
[Exact error message users see]
```

**Symptoms:**
- [Observable symptom 1]
- [Observable symptom 2]

**Quick Fix:**
```bash
# Most common solution
```

**Root Cause:**
[Explanation of why this happens]

**Detailed Solution:**

1. [First diagnostic step]
   ```bash
   # Diagnostic command
   ```

   Expected output:
   ```
   [What success looks like]
   ```

2. [Second step if needed]
   ```bash
   # Fix command
   ```

3. [Verification step]
   ```bash
   # Verification command
   ```

**If This Doesn't Work:**
- [Alternative solution 1]
- [Alternative solution 2]
- [Link to related issue if applicable]

#### Issue: [Another Installation Issue]

[Continue pattern]

### Runtime Errors

#### Error: [Error Code/Message]

**Error Message:**
```
[Full error stack trace or message]
```

**When This Occurs:**
[Describe the scenario when this error appears]

**Quick Fix:**
```typescript
// Common fix
```

**Root Cause:**
[Technical explanation of the underlying issue]

**Step-by-Step Solution:**

1. **Identify the source**
   ```bash
   # Command to locate the issue
   ```

2. **Apply the fix**
   ```typescript
   // Code fix with explanation
   ```

3. **Verify the fix**
   ```bash
   # Test command
   ```

**Prevention:**
[How to avoid this issue in the future]

#### Error: [Another Runtime Error]

[Continue pattern]

### Configuration Issues

#### Problem: [Configuration Not Working]

**Symptoms:**
- [What users observe]
- [Expected vs actual behavior]

**Diagnostic Steps:**

1. **Check configuration file**
   ```bash
   cat config.json
   ```

   Look for:
   - [Configuration issue 1]
   - [Configuration issue 2]

2. **Verify environment**
   ```bash
   echo $ENV_VAR
   ```

3. **Test configuration**
   ```bash
   # Validation command
   ```

**Common Mistakes:**

- **Mistake 1:** [What people do wrong]
  ```typescript
  // Wrong
  const wrong = {};
  ```

  **Fix:**
  ```typescript
  // Correct
  const correct = {};
  ```

- **Mistake 2:** [Another common mistake]
  [Fix]

**Working Example:**
```typescript
// Complete, correct configuration
```

### Performance Issues

#### Problem: [Slow Performance/High Resource Usage]

**Symptoms:**
- [Observable symptom 1]
- [Metric that's out of range]

**Diagnostic Steps:**

1. **Measure baseline**
   ```bash
   # Profiling command
   ```

2. **Identify bottleneck**
   [How to analyze results]

3. **Common culprits:**
   - [Common cause 1] - [How to check]
   - [Common cause 2] - [How to check]

**Solutions by Cause:**

**If caused by [cause 1]:**
```typescript
// Solution 1
```

**If caused by [cause 2]:**
```typescript
// Solution 2
```

**Optimization Checklist:**
- [ ] [Optimization step 1]
- [ ] [Optimization step 2]
- [ ] [Optimization step 3]

### Integration Issues

#### Problem: [Service Communication Failure]

**Error Message:**
```
[Error message]
```

**Symptoms:**
- [What fails]
- [Observable behavior]

**Diagnostic Checklist:**

1. **Network connectivity**
   ```bash
   # Test connectivity
   ```

2. **Service discovery**
   ```bash
   # Check service registration
   ```

3. **Message bus**
   ```bash
   # Verify RabbitMQ connection
   ```

4. **Authentication**
   ```bash
   # Check credentials
   ```

**Solution Path:**

Based on diagnostics:

- **If network issue:** [Solution]
- **If discovery issue:** [Solution]
- **If message bus issue:** [Solution]
- **If auth issue:** [Solution]

### Testing Issues

#### Problem: [Tests Failing]

**Symptoms:**
```
[Test output showing failure]
```

**Common Causes:**

1. **Environment mismatch**
   - [Cause details]
   - **Fix:** [Solution]

2. **Timing issues**
   - [Cause details]
   - **Fix:** [Solution]

3. **Mock configuration**
   - [Cause details]
   - **Fix:** [Solution]

**Debugging Tests:**

```bash
# Run with debug output
npm test -- --verbose
```

**Test Isolation:**
```bash
# Run single test
npm test -- TestName
```

## Debugging Strategies

### Enable Debug Logging

```bash
# Set debug environment variable
export DEBUG=platform:*
```

**Useful debug namespaces:**
- `platform:core` - Core functionality
- `platform:message-bus` - Message bus operations
- `platform:events` - Event handling

### Inspect Message Bus

```bash
# Check RabbitMQ queues
docker exec rabbitmq rabbitmqctl list_queues
```

### Trace Requests

[How to use distributed tracing to debug issues]

```bash
# Access Jaeger UI
open http://localhost:16686
```

### Check Service Health

```bash
# Health check endpoints
curl http://localhost:3000/health
```

## Known Issues

### Issue: [Known Issue Title]

**Status:** [In Progress | Investigating | Planned Fix]

**Affects:** [Versions/components affected]

**Description:**
[Description of the known issue]

**Workaround:**
```typescript
// Temporary workaround
```

**Tracking:** [Link to GitHub issue if applicable]

### Issue: [Another Known Issue]

[Continue pattern]

## Platform-Specific Issues

### Docker Issues

#### Problem: [Container Won't Start]

[Solution]

#### Problem: [Volume Mounting Issues]

[Solution]

### Database Issues

#### Problem: [Connection Failures]

[Solution]

#### Problem: [Migration Errors]

[Solution]

### Message Bus Issues

#### Problem: [RabbitMQ Connection Lost]

[Solution]

#### Problem: [Queue Not Processing]

[Solution]

## Getting More Help

### Before Asking for Help

Gather this information:

```bash
# System info
node --version
npm --version
docker --version

# Platform info
npm list @banyanai/platform-core

# Service logs
docker logs service-name

# Error details
[Copy full error message and stack trace]
```

### Where to Get Help

- **Documentation:** [Link to relevant docs]
- **GitHub Issues:** [Link to issue tracker]
- **Community:** [Link to community forum/chat]
- **Support:** [Link to support if applicable]

### How to Report a Bug

When reporting issues, include:

1. **Environment details**
   - Platform version
   - Node version
   - Operating system

2. **Steps to reproduce**
   - Minimal code example
   - Configuration used
   - Commands run

3. **Expected vs actual behavior**
   - What should happen
   - What actually happens

4. **Error output**
   - Full error message
   - Stack trace
   - Relevant logs

**Bug Report Template:**
```markdown
## Environment
- Platform version:
- Node version:
- OS:

## Steps to Reproduce
1.
2.
3.

## Expected Behavior


## Actual Behavior


## Error Output
```
[paste error]
```

## Additional Context
```

## Preventive Measures

### Best Practices to Avoid Issues

1. **[Practice 1]**
   - [Explanation]
   - [Example]

2. **[Practice 2]**
   - [Explanation]
   - [Example]

### Regular Maintenance

```bash
# Update dependencies
npm update

# Clean build artifacts
npm run clean

# Rebuild everything
npm run build
```

### Health Monitoring

[How to set up monitoring to catch issues early]

## Related Resources

### Guides
- [Link to setup guide]
- [Link to configuration guide]

### Reference
- [Link to API reference]
- [Link to configuration reference]

### Concepts
- [Link to architecture docs]
- [Link to design patterns]
