---
title: "User Management Example"
description: "Complete user management service with registration, authentication, and profile management"
category: "examples"
tags: ["example", "authentication", "users", "security", "reference"]
difficulty: "beginner"
last_updated: "2025-01-15"
status: "published"
---

# User Management Example

> **Reference Implementation**: A production-ready user management service with authentication, authorization, and profile management.

## Overview

This example demonstrates a complete user management system including registration, login, password management, and profile updates.

## Features

- User registration with validation
- Password hashing with bcrypt
- JWT-based authentication
- Profile management
- Password change with verification
- Email uniqueness enforcement
- Account deactivation

## Architecture

```
Commands:
- RegisterUser
- Login
- UpdateProfile
- ChangePassword
- DeactivateUser

Queries:
- GetUser
- GetUserByEmail

Utilities:
- PasswordUtils (hashing, verification, validation)
- EmailUtils (validation, normalization)
- TokenUtils (JWT generation, verification)
```

## Key Security Features

### Password Hashing

```typescript
export class PasswordUtils {
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static validate(password: string): { valid: boolean; error?: string } {
    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }
    // Additional validation...
    return { valid: true };
  }
}
```

### Login Flow

```typescript
@CommandHandlerDecorator(LoginCommand)
export class LoginHandler extends CommandHandler<LoginCommand, LoginResult> {
  async handle(command: LoginCommand): Promise<LoginResult> {
    // Find user
    const user = await UserReadModel.findByEmail(command.email);
    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Verify password
    const valid = await PasswordUtils.verify(command.password, user.passwordHash);
    if (!valid) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Generate token
    const token = TokenUtils.generate({
      userId: user.id,
      email: user.email,
      permissions: ['user:read', 'user:update'],
    });

    return { success: true, token, userId: user.id };
  }
}
```

## Security Best Practices

1. **Never store plain-text passwords**
2. **Use bcrypt with sufficient salt rounds**
3. **Normalize emails (lowercase, trim)**
4. **Validate password strength**
5. **Use generic error messages** (don't reveal if email exists)
6. **Implement rate limiting** (future enhancement)

## Use Cases

Use this example when you need:
- User registration and authentication
- Password-based login
- JWT token issuance
- Profile management
- Account lifecycle management

## Getting Started

See the [User Management Tutorial](../01-tutorials/beginner/user-management-service.md) for step-by-step instructions.

## Additional Resources

- [Security Best Practices](../03-guides/security-best-practices.md)
- [Authentication Patterns](../02-concepts/authentication.md)
- [JWT Guide](../03-guides/jwt-authentication.md)
