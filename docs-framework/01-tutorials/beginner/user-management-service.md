---
title: "Build a User Management Service"
description: "Build a complete user management service with registration, authentication, and profile management"
category: "tutorials"
tags: ["beginner", "authentication", "users", "security", "hands-on"]
difficulty: "beginner"
estimated_time: "120 minutes"
prerequisites:
  - "Completed Todo Service Tutorial"
  - "Understanding of authentication concepts"
  - "Understanding of password hashing"
learning_objectives:
  - "Implement user registration with validation"
  - "Handle password hashing and verification"
  - "Create authentication flow"
  - "Manage user profiles"
  - "Apply security best practices"
last_updated: "2025-01-15"
status: "published"
---

# Build a User Management Service

> **What You'll Build:** A complete user management service with registration, login, profile management, and password reset.

## Overview

This tutorial builds a production-ready user management service. You'll implement user registration, authentication, profile management, and learn security best practices.

By the end, you'll have a service that:
- Registers new users with email/password
- Authenticates users and issues tokens
- Manages user profiles
- Handles password changes
- Implements proper password hashing
- Validates email uniqueness

### Learning Objectives

By the end of this tutorial, you will be able to:

- Build a complete authentication system
- Hash and verify passwords securely
- Validate user input comprehensively
- Issue and validate authentication tokens
- Implement profile management
- Apply security best practices

### Prerequisites

Before starting this tutorial, you should:

- Complete [Todo Service Tutorial](./todo-service.md)
- Understand basic authentication concepts
- Have Node.js 20+, pnpm, and Docker installed

### What We're Building

A user management service with these features:

**Commands:**
- `RegisterUser` - Create new user account
- `Login` - Authenticate and get token
- `UpdateProfile` - Update user information
- `ChangePassword` - Change user password
- `DeactivateUser` - Deactivate user account

**Queries:**
- `GetUser` - Get user by ID
- `GetUserByEmail` - Find user by email

**Security Features:**
- Password hashing with bcrypt
- Email validation
- Password strength validation
- Token-based authentication
- Rate limiting (future enhancement)

## Setup

### Create Project Structure

```bash
mkdir user-service
cd user-service

mkdir -p packages/contracts/src
mkdir -p service/src/{commands,queries,read-models,utils}

cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/*'
  - 'service'
EOF
```

## Part 1: Define Contracts

### Step 1: Create Contracts Package

Create `packages/contracts/package.json`:

```json
{
  "name": "@myorg/user-service-contracts",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@banyanai/platform-core": "^1.0.116",
    "@banyanai/platform-contract-system": "^1.0.116"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

Create `packages/contracts/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 2: Define Command Contracts

Create `packages/contracts/src/commands.ts`:

```typescript
import { Command } from '@banyanai/platform-contract-system';

@Command({
  name: 'UserService.Commands.RegisterUser',
  description: 'Register a new user',
  requiredPermissions: [], // Public - no permissions required
})
export class RegisterUserCommand {
  email!: string;
  password!: string;
  firstName!: string;
  lastName!: string;
}

export interface RegisterUserResult {
  success: boolean;
  userId?: string;
  error?: string;
}

@Command({
  name: 'UserService.Commands.Login',
  description: 'Authenticate user and issue token',
  requiredPermissions: [], // Public - no permissions required
})
export class LoginCommand {
  email!: string;
  password!: string;
}

export interface LoginResult {
  success: boolean;
  token?: string;
  userId?: string;
  error?: string;
}

@Command({
  name: 'UserService.Commands.UpdateProfile',
  description: 'Update user profile information',
  requiredPermissions: ['user:update'],
})
export class UpdateProfileCommand {
  userId!: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface UpdateProfileResult {
  success: boolean;
  error?: string;
}

@Command({
  name: 'UserService.Commands.ChangePassword',
  description: 'Change user password',
  requiredPermissions: ['user:update'],
})
export class ChangePasswordCommand {
  userId!: string;
  currentPassword!: string;
  newPassword!: string;
}

export interface ChangePasswordResult {
  success: boolean;
  error?: string;
}

@Command({
  name: 'UserService.Commands.DeactivateUser',
  description: 'Deactivate user account',
  requiredPermissions: ['user:admin'],
})
export class DeactivateUserCommand {
  userId!: string;
  reason?: string;
}

export interface DeactivateUserResult {
  success: boolean;
  error?: string;
}
```

### Step 3: Define Query Contracts

Create `packages/contracts/src/queries.ts`:

```typescript
import { Query } from '@banyanai/platform-contract-system';

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

@Query({
  name: 'UserService.Queries.GetUser',
  description: 'Get user by ID',
  requiredPermissions: ['user:read'],
})
export class GetUserQuery {
  userId!: string;
}

export interface GetUserResult {
  success: boolean;
  user?: UserDto;
  error?: string;
}

@Query({
  name: 'UserService.Queries.GetUserByEmail',
  description: 'Find user by email',
  requiredPermissions: ['user:read'],
})
export class GetUserByEmailQuery {
  email!: string;
}

export interface GetUserByEmailResult {
  success: boolean;
  user?: UserDto;
  error?: string;
}
```

### Step 4: Export and Build

Create `packages/contracts/src/index.ts`:

```typescript
export * from './commands.js';
export * from './queries.js';
```

Build contracts:

```bash
cd packages/contracts
pnpm install
pnpm run build
```

## Part 2: Create Service Infrastructure

### Step 1: Create Service Package

Create `service/package.json`:

```json
{
  "name": "@myorg/user-service",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@banyanai/platform-base-service": "^1.0.116",
    "@banyanai/platform-core": "^1.0.116",
    "@banyanai/platform-event-sourcing": "^1.0.116",
    "@banyanai/platform-telemetry": "^1.0.116",
    "@myorg/user-service-contracts": "workspace:*",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3"
  }
}
```

Create `service/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 2: Create Utility Functions

Create `service/src/utils/password.ts`:

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export class PasswordUtils {
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static validate(password: string): { valid: boolean; error?: string } {
    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }

    if (!/[A-Z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one lowercase letter' };
    }

    if (!/[0-9]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one number' };
    }

    return { valid: true };
  }
}
```

Create `service/src/utils/email.ts`:

```typescript
export class EmailUtils {
  static validate(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static normalize(email: string): string {
    return email.toLowerCase().trim();
  }
}
```

Create `service/src/utils/token.ts`:

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  permissions: string[];
}

export class TokenUtils {
  static generate(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  }

  static verify(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      return null;
    }
  }
}
```

### Step 3: Create User Read Model

Create `service/src/read-models/UserReadModel.ts`:

```typescript
import { ReadModel, ReadModelBase } from '@banyanai/platform-event-sourcing';

export interface UserData {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  active: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  deactivatedAt?: Date;
}

@ReadModel({ tableName: 'users' })
export class UserReadModel extends ReadModelBase<UserReadModel> {
  id!: string;
  email!: string;
  passwordHash!: string;
  firstName!: string;
  lastName!: string;
  phoneNumber?: string;
  active!: boolean;
  createdAt!: Date;
  lastLoginAt?: Date;
  deactivatedAt?: Date;

  getId(): string {
    return this.id;
  }

  // In-memory storage
  private static users = new Map<string, UserData>();
  private static emailIndex = new Map<string, string>(); // email -> userId

  static async findById(id: string): Promise<UserReadModel | null> {
    const userData = this.users.get(id);
    if (!userData) return null;

    const model = new UserReadModel();
    Object.assign(model, userData);
    return model;
  }

  static async findByEmail(email: string): Promise<UserReadModel | null> {
    const userId = this.emailIndex.get(email.toLowerCase());
    if (!userId) return null;
    return this.findById(userId);
  }

  static async create(userData: UserData): Promise<void> {
    this.users.set(userData.id, userData);
    this.emailIndex.set(userData.email.toLowerCase(), userData.id);
  }

  static async update(id: string, updates: Partial<UserData>): Promise<void> {
    const existing = this.users.get(id);
    if (!existing) {
      throw new Error(`User ${id} not found`);
    }

    const updated = { ...existing, ...updates };
    this.users.set(id, updated);

    // Update email index if email changed
    if (updates.email && updates.email !== existing.email) {
      this.emailIndex.delete(existing.email.toLowerCase());
      this.emailIndex.set(updates.email.toLowerCase(), id);
    }
  }

  static async emailExists(email: string): Promise<boolean> {
    return this.emailIndex.has(email.toLowerCase());
  }
}
```

## Part 3: Implement Command Handlers

### Step 1: RegisterUserHandler

Create `service/src/commands/RegisterUserHandler.ts`:

```typescript
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { RegisterUserCommand, type RegisterUserResult } from '@myorg/user-service-contracts';
import { UserReadModel } from '../read-models/UserReadModel.js';
import { PasswordUtils } from '../utils/password.js';
import { EmailUtils } from '../utils/email.js';

@CommandHandlerDecorator(RegisterUserCommand)
export class RegisterUserHandler extends CommandHandler<RegisterUserCommand, RegisterUserResult> {
  constructor() {
    super();
  }

  async handle(command: RegisterUserCommand, user: AuthenticatedUser | null): Promise<RegisterUserResult> {
    try {
      Logger.info('Registering user', { email: command.email });

      // Validate email
      if (!EmailUtils.validate(command.email)) {
        return { success: false, error: 'Invalid email format' };
      }

      const normalizedEmail = EmailUtils.normalize(command.email);

      // Check email uniqueness
      const emailExists = await UserReadModel.emailExists(normalizedEmail);
      if (emailExists) {
        return { success: false, error: 'Email already registered' };
      }

      // Validate password
      const passwordValidation = PasswordUtils.validate(command.password);
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.error };
      }

      // Validate name
      if (!command.firstName || command.firstName.trim().length === 0) {
        return { success: false, error: 'First name is required' };
      }

      if (!command.lastName || command.lastName.trim().length === 0) {
        return { success: false, error: 'Last name is required' };
      }

      // Hash password
      const passwordHash = await PasswordUtils.hash(command.password);

      // Create user
      const userId = this.generateId();

      await UserReadModel.create({
        id: userId,
        email: normalizedEmail,
        passwordHash,
        firstName: command.firstName.trim(),
        lastName: command.lastName.trim(),
        active: true,
        createdAt: new Date(),
      });

      Logger.info('User registered successfully', { userId, email: normalizedEmail });

      return {
        success: true,
        userId,
      };
    } catch (error) {
      Logger.error('Failed to register user', { error, email: command.email });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }
}
```

### Step 2: LoginHandler

Create `service/src/commands/LoginHandler.ts`:

```typescript
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { LoginCommand, type LoginResult } from '@myorg/user-service-contracts';
import { UserReadModel } from '../read-models/UserReadModel.js';
import { PasswordUtils } from '../utils/password.js';
import { EmailUtils } from '../utils/email.js';
import { TokenUtils } from '../utils/token.js';

@CommandHandlerDecorator(LoginCommand)
export class LoginHandler extends CommandHandler<LoginCommand, LoginResult> {
  constructor() {
    super();
  }

  async handle(command: LoginCommand, user: AuthenticatedUser | null): Promise<LoginResult> {
    try {
      Logger.info('Login attempt', { email: command.email });

      const normalizedEmail = EmailUtils.normalize(command.email);

      // Find user
      const userRecord = await UserReadModel.findByEmail(normalizedEmail);
      if (!userRecord) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Check if active
      if (!userRecord.active) {
        return { success: false, error: 'Account is deactivated' };
      }

      // Verify password
      const passwordValid = await PasswordUtils.verify(command.password, userRecord.passwordHash);
      if (!passwordValid) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Update last login
      await UserReadModel.update(userRecord.id, {
        lastLoginAt: new Date(),
      });

      // Generate token
      const token = TokenUtils.generate({
        userId: userRecord.id,
        email: userRecord.email,
        permissions: ['user:read', 'user:update'],
      });

      Logger.info('Login successful', { userId: userRecord.id });

      return {
        success: true,
        token,
        userId: userRecord.id,
      };
    } catch (error) {
      Logger.error('Login failed', { error, email: command.email });
      return {
        success: false,
        error: 'Login failed',
      };
    }
  }
}
```

### Step 3: UpdateProfileHandler

Create `service/src/commands/UpdateProfileHandler.ts`:

```typescript
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { UpdateProfileCommand, type UpdateProfileResult } from '@myorg/user-service-contracts';
import { UserReadModel } from '../read-models/UserReadModel.js';

@CommandHandlerDecorator(UpdateProfileCommand)
export class UpdateProfileHandler extends CommandHandler<UpdateProfileCommand, UpdateProfileResult> {
  constructor() {
    super();
  }

  async handle(command: UpdateProfileCommand, user: AuthenticatedUser | null): Promise<UpdateProfileResult> {
    try {
      Logger.info('Updating profile', { userId: command.userId });

      // Check user exists
      const userRecord = await UserReadModel.findById(command.userId);
      if (!userRecord) {
        return { success: false, error: 'User not found' };
      }

      // Layer 2 Authorization: Users can only update their own profile
      if (user && userRecord.id !== user.userId) {
        const isAdmin = user.permissions?.includes('user:admin');
        if (!isAdmin) {
          return { success: false, error: 'You can only update your own profile' };
        }
      }

      // Build updates
      const updates: any = {};
      if (command.firstName) {
        if (command.firstName.trim().length === 0) {
          return { success: false, error: 'First name cannot be empty' };
        }
        updates.firstName = command.firstName.trim();
      }
      if (command.lastName) {
        if (command.lastName.trim().length === 0) {
          return { success: false, error: 'Last name cannot be empty' };
        }
        updates.lastName = command.lastName.trim();
      }
      if (command.phoneNumber !== undefined) {
        updates.phoneNumber = command.phoneNumber.trim() || undefined;
      }

      // Update user
      await UserReadModel.update(command.userId, updates);

      Logger.info('Profile updated successfully', { userId: command.userId });

      return { success: true };
    } catch (error) {
      Logger.error('Failed to update profile', { error, userId: command.userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed',
      };
    }
  }
}
```

### Step 4: ChangePasswordHandler

Create `service/src/commands/ChangePasswordHandler.ts`:

```typescript
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { ChangePasswordCommand, type ChangePasswordResult } from '@myorg/user-service-contracts';
import { UserReadModel } from '../read-models/UserReadModel.js';
import { PasswordUtils } from '../utils/password.js';

@CommandHandlerDecorator(ChangePasswordCommand)
export class ChangePasswordHandler extends CommandHandler<ChangePasswordCommand, ChangePasswordResult> {
  constructor() {
    super();
  }

  async handle(command: ChangePasswordCommand, user: AuthenticatedUser | null): Promise<ChangePasswordResult> {
    try {
      Logger.info('Changing password', { userId: command.userId });

      // Check user exists
      const userRecord = await UserReadModel.findById(command.userId);
      if (!userRecord) {
        return { success: false, error: 'User not found' };
      }

      // Layer 2 Authorization: Users can only change their own password
      if (user && userRecord.id !== user.userId) {
        return { success: false, error: 'You can only change your own password' };
      }

      // Verify current password
      const currentPasswordValid = await PasswordUtils.verify(
        command.currentPassword,
        userRecord.passwordHash
      );
      if (!currentPasswordValid) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Validate new password
      const passwordValidation = PasswordUtils.validate(command.newPassword);
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.error };
      }

      // Ensure new password is different
      const samePassword = await PasswordUtils.verify(command.newPassword, userRecord.passwordHash);
      if (samePassword) {
        return { success: false, error: 'New password must be different from current password' };
      }

      // Hash and update password
      const newPasswordHash = await PasswordUtils.hash(command.newPassword);
      await UserReadModel.update(command.userId, {
        passwordHash: newPasswordHash,
      });

      Logger.info('Password changed successfully', { userId: command.userId });

      return { success: true };
    } catch (error) {
      Logger.error('Failed to change password', { error, userId: command.userId });
      return {
        success: false,
        error: 'Password change failed',
      };
    }
  }
}
```

### Step 5: DeactivateUserHandler

Create `service/src/commands/DeactivateUserHandler.ts`:

```typescript
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { DeactivateUserCommand, type DeactivateUserResult } from '@myorg/user-service-contracts';
import { UserReadModel } from '../read-models/UserReadModel.js';

@CommandHandlerDecorator(DeactivateUserCommand)
export class DeactivateUserHandler extends CommandHandler<DeactivateUserCommand, DeactivateUserResult> {
  constructor() {
    super();
  }

  async handle(command: DeactivateUserCommand, user: AuthenticatedUser | null): Promise<DeactivateUserResult> {
    try {
      Logger.info('Deactivating user', { userId: command.userId, reason: command.reason });

      // Check user exists
      const userRecord = await UserReadModel.findById(command.userId);
      if (!userRecord) {
        return { success: false, error: 'User not found' };
      }

      // Check already deactivated
      if (!userRecord.active) {
        return { success: true }; // Idempotent
      }

      // Deactivate user
      await UserReadModel.update(command.userId, {
        active: false,
        deactivatedAt: new Date(),
      });

      Logger.info('User deactivated successfully', {
        userId: command.userId,
        reason: command.reason,
      });

      return { success: true };
    } catch (error) {
      Logger.error('Failed to deactivate user', { error, userId: command.userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deactivation failed',
      };
    }
  }
}
```

## Part 4: Implement Query Handlers

### Step 1: GetUserHandler

Create `service/src/queries/GetUserHandler.ts`:

```typescript
import { QueryHandler, QueryHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { GetUserQuery, type GetUserResult } from '@myorg/user-service-contracts';
import { UserReadModel } from '../read-models/UserReadModel.js';

@QueryHandlerDecorator(GetUserQuery)
export class GetUserHandler extends QueryHandler<GetUserQuery, GetUserResult> {
  constructor() {
    super();
  }

  async handle(query: GetUserQuery, user: AuthenticatedUser | null): Promise<GetUserResult> {
    try {
      Logger.info('Getting user', { userId: query.userId });

      const userRecord = await UserReadModel.findById(query.userId);
      if (!userRecord) {
        return { success: false, error: 'User not found' };
      }

      // Layer 2 Authorization: Users can only view their own profile
      if (user && userRecord.id !== user.userId) {
        const isAdmin = user.permissions?.includes('user:admin');
        if (!isAdmin) {
          return { success: false, error: 'You can only view your own profile' };
        }
      }

      return {
        success: true,
        user: {
          id: userRecord.id,
          email: userRecord.email,
          firstName: userRecord.firstName,
          lastName: userRecord.lastName,
          phoneNumber: userRecord.phoneNumber,
          active: userRecord.active,
          createdAt: userRecord.createdAt.toISOString(),
          lastLoginAt: userRecord.lastLoginAt?.toISOString(),
        },
      };
    } catch (error) {
      Logger.error('Failed to get user', { error, userId: query.userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query failed',
      };
    }
  }
}
```

### Step 2: GetUserByEmailHandler

Create `service/src/queries/GetUserByEmailHandler.ts`:

```typescript
import { QueryHandler, QueryHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { GetUserByEmailQuery, type GetUserByEmailResult } from '@myorg/user-service-contracts';
import { UserReadModel } from '../read-models/UserReadModel.js';
import { EmailUtils } from '../utils/email.js';

@QueryHandlerDecorator(GetUserByEmailQuery)
export class GetUserByEmailHandler extends QueryHandler<GetUserByEmailQuery, GetUserByEmailResult> {
  constructor() {
    super();
  }

  async handle(query: GetUserByEmailQuery, user: AuthenticatedUser | null): Promise<GetUserByEmailResult> {
    try {
      Logger.info('Getting user by email', { email: query.email });

      const normalizedEmail = EmailUtils.normalize(query.email);
      const userRecord = await UserReadModel.findByEmail(normalizedEmail);

      if (!userRecord) {
        return { success: false, error: 'User not found' };
      }

      // Layer 2 Authorization: Users can only view their own profile
      if (user && userRecord.id !== user.userId) {
        const isAdmin = user.permissions?.includes('user:admin');
        if (!isAdmin) {
          return { success: false, error: 'You can only view your own profile' };
        }
      }

      return {
        success: true,
        user: {
          id: userRecord.id,
          email: userRecord.email,
          firstName: userRecord.firstName,
          lastName: userRecord.lastName,
          phoneNumber: userRecord.phoneNumber,
          active: userRecord.active,
          createdAt: userRecord.createdAt.toISOString(),
          lastLoginAt: userRecord.lastLoginAt?.toISOString(),
        },
      };
    } catch (error) {
      Logger.error('Failed to get user by email', { error, email: query.email });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query failed',
      };
    }
  }
}
```

## Part 5: Create Service Entry Point

Create `service/src/index.ts`:

```typescript
import { BaseService } from '@banyanai/platform-base-service';
import { Logger } from '@banyanai/platform-telemetry';

async function main() {
  try {
    await BaseService.start({
      name: 'user-service',
      version: '1.0.0',
    });

    Logger.info('User Service started successfully');
  } catch (error) {
    Logger.error('Failed to start service', { error });
    process.exit(1);
  }
}

main();
```

## Part 6: Build and Run

### Install and Build

```bash
# From user-service root
pnpm install
pnpm -r run build
```

### Run Service

```bash
cd service
node dist/index.js
```

Expected output:
```
Handler discovery completed {
  commandHandlers: 5,
  queryHandlers: 2,
  eventHandlers: 0,
  totalHandlers: 7
}
User Service started successfully
```

## Part 7: Test Your Service

### Register a User

```bash
curl -X POST http://localhost:3003/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

Response:
```json
{
  "success": true,
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Login

```bash
curl -X POST http://localhost:3003/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Get User Profile

```bash
curl -X POST http://localhost:3003/api/users/get \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "X-Dev-Permissions: user:read" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Update Profile

```bash
curl -X POST http://localhost:3003/api/users/update-profile \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "X-Dev-Permissions: user:update" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "phoneNumber": "+1-555-0100"
  }'
```

### Change Password

```bash
curl -X POST http://localhost:3003/api/users/change-password \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "X-Dev-Permissions: user:update" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "currentPassword": "SecurePass123",
    "newPassword": "NewSecurePass456"
  }'
```

## Understanding What We Built

### Security Features

1. **Password Hashing**: Bcrypt with salt rounds
2. **Email Validation**: Format and uniqueness checks
3. **Password Strength**: Uppercase, lowercase, numbers required
4. **Token-Based Auth**: JWT with 7-day expiry
5. **Policy Authorization**: Users can only access their own data

### Key Patterns

1. **Utility Classes**: Reusable password, email, token utils
2. **Data Normalization**: Email lowercase normalization
3. **Idempotent Operations**: Deactivation can be called multiple times
4. **Error Messages**: Generic messages for security (don't reveal if email exists)

## Next Steps

- [Event Sourcing Tutorial](../intermediate/event-sourcing-service.md)
- [Multi-Service Integration](../intermediate/multi-service-integration.md)
- [External Auth Integration](../../06-examples/external-auth-integration/)

## Additional Resources

- [Security Best Practices](../../03-guides/security-best-practices.md)
- [Password Hashing Guide](../../03-guides/password-hashing.md)
- [JWT Authentication](../../03-guides/jwt-authentication.md)
