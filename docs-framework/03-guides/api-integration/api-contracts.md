# API Contracts Guide

## Overview

API contracts define the public interface of your services, automatically generating REST and GraphQL endpoints. Well-designed contracts are the foundation of a good API.

## Contract Anatomy

A complete API contract includes:

```typescript
import { createContract } from '@banyanai/platform-contract-system';

export const CreateUserContract = createContract({
  // 1. Message Type (determines operation name)
  messageType: 'CreateUserCommand',

  // 2. Target Service (routing)
  targetService: 'user-service',

  // 3. Input Schema (validation)
  inputSchema: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      name: { type: 'string', minLength: 1, maxLength: 100 },
      role: { type: 'string', enum: ['user', 'admin'] }
    },
    required: ['email', 'name']
  },

  // 4. Output Schema (response shape)
  outputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      name: { type: 'string' },
      role: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' }
    },
    required: ['id', 'email', 'name', 'role', 'createdAt']
  },

  // 5. Permissions (authorization)
  requiredPermissions: ['users:create'],

  // 6. Public Flag (optional, defaults to false)
  isPublic: false
});
```

## Message Type Naming

### Convention

Message type determines the generated endpoint name:

| Message Type | REST Endpoint | GraphQL Operation |
|--------------|---------------|-------------------|
| `CreateUserCommand` | `POST /api/users` | `mutation createUser` |
| `GetUserQuery` | `GET /api/users/:id` | `query getUser` |
| `UpdateUserCommand` | `PUT /api/users/:id` | `mutation updateUser` |
| `DeleteUserCommand` | `DELETE /api/users/:id` | `mutation deleteUser` |
| `ListUsersQuery` | `GET /api/users` | `query listUsers` |

### Best Practices

```typescript
// Good: Clear intent, follows convention
messageType: 'CreateUserCommand'
messageType: 'GetUserQuery'
messageType: 'UpdateUserCommand'

// Avoid: Ambiguous or non-standard
messageType: 'ProcessUser'
messageType: 'HandleUserRequest'
```

## Input Schema

### JSON Schema Format

Input schemas use JSON Schema for validation:

```typescript
inputSchema: {
  type: 'object',
  properties: {
    // String validation
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255,
      description: 'User email address'
    },

    // Number validation
    age: {
      type: 'number',
      minimum: 0,
      maximum: 150,
      description: 'User age in years'
    },

    // Enum validation
    role: {
      type: 'string',
      enum: ['user', 'admin', 'moderator'],
      description: 'User role'
    },

    // Array validation
    tags: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 10,
      description: 'User tags'
    },

    // Nested object
    address: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        zipCode: { type: 'string', pattern: '^[0-9]{5}$' }
      },
      required: ['city']
    }
  },
  required: ['email', 'role']
}
```

### Common Formats

```typescript
// Email
{ type: 'string', format: 'email' }

// Date-time (ISO 8601)
{ type: 'string', format: 'date-time' }

// URI
{ type: 'string', format: 'uri' }

// UUID
{ type: 'string', format: 'uuid' }

// Date (YYYY-MM-DD)
{ type: 'string', format: 'date' }

// Time (HH:MM:SS)
{ type: 'string', format: 'time' }
```

### Validation Examples

```typescript
// Strong password
password: {
  type: 'string',
  minLength: 8,
  maxLength: 100,
  pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$',
  description: 'Must contain uppercase, lowercase, and number'
}

// Phone number
phoneNumber: {
  type: 'string',
  pattern: '^\\+[1-9]\\d{1,14}$',
  description: 'E.164 format phone number'
}

// Positive integer
quantity: {
  type: 'integer',
  minimum: 1,
  description: 'Must be at least 1'
}

// Percentage
discount: {
  type: 'number',
  minimum: 0,
  maximum: 100,
  description: 'Discount percentage (0-100)'
}
```

## Output Schema

### Response Shape

Define the complete response structure:

```typescript
outputSchema: {
  type: 'object',
  properties: {
    // Always include ID
    id: {
      type: 'string',
      description: 'Unique identifier'
    },

    // Core data fields
    email: { type: 'string' },
    name: { type: 'string' },
    role: { type: 'string' },

    // Timestamps (ISO 8601 strings)
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Creation timestamp'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Last update timestamp'
    },

    // Optional fields (not in required array)
    phoneNumber: {
      type: 'string',
      description: 'Optional phone number'
    }
  },
  required: ['id', 'email', 'name', 'role', 'createdAt']
}
```

### Nested Responses

```typescript
outputSchema: {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },

    // Nested object
    profile: {
      type: 'object',
      properties: {
        bio: { type: 'string' },
        avatar: { type: 'string', format: 'uri' }
      }
    },

    // Array of objects
    addresses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' },
          isPrimary: { type: 'boolean' }
        }
      }
    }
  }
}
```

## Permissions

### Permission-Based Access

Contracts specify required permissions:

```typescript
// Single permission
requiredPermissions: ['users:create']

// Multiple permissions (all required)
requiredPermissions: ['users:create', 'admin:access']

// No permissions (authenticated only)
requiredPermissions: []

// Public endpoint (no auth required)
isPublic: true
```

### Permission Naming Convention

```
<resource>:<action>

Examples:
- users:read
- users:create
- users:update
- users:delete
- users:admin
- orders:process
- reports:generate
```

### Permission Hierarchy

```typescript
// Read-only operations
requiredPermissions: ['users:read']

// Write operations
requiredPermissions: ['users:write']

// Admin operations (includes read and write)
requiredPermissions: ['users:admin']

// Super admin
requiredPermissions: ['system:admin']
```

## Public vs Private Contracts

### Public Contracts

Accessible without authentication:

```typescript
export const RegisterUserContract = createContract({
  messageType: 'RegisterUserCommand',
  targetService: 'auth-service',
  isPublic: true, // ← No authentication required
  requiredPermissions: [], // Must be empty for public
  // ...
});
```

**Use Cases**:
- User registration
- Login
- Password reset
- Public data retrieval

### Private Contracts

Require authentication and permissions:

```typescript
export const CreateUserContract = createContract({
  messageType: 'CreateUserCommand',
  targetService: 'user-service',
  isPublic: false, // ← Default, can omit
  requiredPermissions: ['users:create'], // ← Required permissions
  // ...
});
```

## Contract Organization

### File Structure

```
src/
  contracts/
    UserContracts.ts        # All user-related contracts
    OrderContracts.ts       # All order-related contracts
    ProductContracts.ts     # All product-related contracts
    index.ts                # Re-export all contracts
```

### Grouping Pattern

```typescript
// contracts/UserContracts.ts
import { createContract } from '@banyanai/platform-contract-system';

// Commands
export const CreateUserContract = createContract({ /* ... */ });
export const UpdateUserContract = createContract({ /* ... */ });
export const DeleteUserContract = createContract({ /* ... */ });

// Queries
export const GetUserContract = createContract({ /* ... */ });
export const ListUsersContract = createContract({ /* ... */ });
export const SearchUsersContract = createContract({ /* ... */ });
```

### Index File

```typescript
// contracts/index.ts
export * from './UserContracts.js';
export * from './OrderContracts.js';
export * from './ProductContracts.js';
```

## Complete Example

### User Management Contracts

```typescript
// contracts/UserContracts.ts
import { createContract } from '@banyanai/platform-contract-system';

// Create User
export const CreateUserContract = createContract({
  messageType: 'CreateUserCommand',
  targetService: 'user-service',
  inputSchema: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        maxLength: 255,
        description: 'User email address'
      },
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Full name'
      },
      role: {
        type: 'string',
        enum: ['user', 'admin'],
        default: 'user',
        description: 'User role'
      }
    },
    required: ['email', 'name']
  },
  outputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      name: { type: 'string' },
      role: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' }
    },
    required: ['id', 'email', 'name', 'role', 'createdAt']
  },
  requiredPermissions: ['users:create']
});

// Get User
export const GetUserContract = createContract({
  messageType: 'GetUserQuery',
  targetService: 'user-service',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'User ID'
      }
    },
    required: ['id']
  },
  outputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      name: { type: 'string' },
      role: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    },
    required: ['id', 'email', 'name', 'role', 'createdAt']
  },
  requiredPermissions: ['users:read']
});

// List Users
export const ListUsersContract = createContract({
  messageType: 'ListUsersQuery',
  targetService: 'user-service',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        default: 10,
        description: 'Number of results'
      },
      offset: {
        type: 'number',
        minimum: 0,
        default: 0,
        description: 'Pagination offset'
      },
      role: {
        type: 'string',
        enum: ['user', 'admin'],
        description: 'Filter by role'
      }
    }
  },
  outputSchema: {
    type: 'object',
    properties: {
      users: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string' }
          }
        }
      },
      total: {
        type: 'number',
        description: 'Total count'
      },
      hasMore: {
        type: 'boolean',
        description: 'More results available'
      }
    },
    required: ['users', 'total', 'hasMore']
  },
  requiredPermissions: ['users:read']
});
```

## Best Practices

### 1. Comprehensive Validation

```typescript
// Good: Detailed validation
inputSchema: {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255
    },
    age: {
      type: 'number',
      minimum: 0,
      maximum: 150
    }
  },
  required: ['email']
}

// Avoid: Weak validation
inputSchema: {
  type: 'object',
  properties: {
    email: { type: 'string' }, // No format or length check
    age: { type: 'number' }     // No range validation
  }
}
```

### 2. Descriptive Schemas

```typescript
// Good: Well-documented
properties: {
  email: {
    type: 'string',
    format: 'email',
    description: 'User email address for authentication'
  }
}

// Avoid: No documentation
properties: {
  email: { type: 'string' }
}
```

### 3. Consistent Naming

```typescript
// Good: Consistent across contracts
CreateUserCommand, GetUserQuery, UpdateUserCommand

// Avoid: Inconsistent
CreateUser, FetchUserQuery, UserUpdate
```

### 4. Complete Output Schemas

```typescript
// Good: Includes all relevant fields
outputSchema: {
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    name: { type: 'string' },
    role: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
}

// Avoid: Missing useful fields
outputSchema: {
  properties: {
    id: { type: 'string' },
    email: { type: 'string' }
    // Missing name, role, timestamps
  }
}
```

### 5. Granular Permissions

```typescript
// Good: Specific permissions
requiredPermissions: ['users:read']
requiredPermissions: ['users:create']
requiredPermissions: ['users:delete']

// Avoid: Overly broad
requiredPermissions: ['admin']
requiredPermissions: ['all-access']
```

## Troubleshooting

### Schema Validation Errors

**Error**: "Invalid input: email is required"

**Cause**: Missing required field

**Solution**: Include all required fields in request

### Permission Denied

**Error**: "Forbidden: Missing required permission users:create"

**Cause**: User JWT lacks permission

**Solution**: Ensure user has permission in JWT token

### Contract Not Found

**Error**: "No handler registered for CreateUserCommand"

**Cause**: Contract not registered or service not running

**Solution**: Verify handler decorator and service startup

## Next Steps

- [REST API Guide](./rest-api.md) - Using contracts in REST
- [GraphQL API Guide](./graphql-api.md) - Using contracts in GraphQL
- [API Security](./api-security.md) - Authentication and authorization
