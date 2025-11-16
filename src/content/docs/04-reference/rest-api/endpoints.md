---
title: REST API Endpoints
description: Complete catalog of auto-generated HTTP endpoints
category: rest-api
tags: [rest, endpoints, api-reference, http]
related:
  - ./overview.md
  - ./examples.md
  - ../authentication.md
difficulty: beginner
---

# REST API Endpoints

Complete reference of auto-generated HTTP endpoints. All endpoints are generated automatically from service contracts.

## User Management

### Create User

Create a new user account.

```http
POST /api/users
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created):**
```json
{
  "userId": "user-123",
  "email": "user@example.com",
  "createdAt": "2025-11-15T12:00:00Z"
}
```

**Required Permissions:** `users:create`

---

### Get User

Retrieve a user by ID.

```http
GET /api/users/:userId
```

**Path Parameters:**
- `userId` - User identifier

**Response (200 OK):**
```json
{
  "userId": "user-123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Required Permissions:** `users:read`

---

### Update User

Update user information.

```http
PUT /api/users/:userId
```

**Path Parameters:**
- `userId` - User identifier

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response (200 OK):**
```json
{
  "userId": "user-123",
  "email": "newemail@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "updatedAt": "2025-11-15T12:30:00Z"
}
```

**Required Permissions:** `users:update`

---

### Delete User

Permanently delete a user account.

```http
DELETE /api/users/:userId
```

**Path Parameters:**
- `userId` - User identifier

**Response (204 No Content)**

**Required Permissions:** `users:delete`

---

### List Users

Retrieve a paginated list of users.

```http
GET /api/users?page=1&pageSize=20&role=admin
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Items per page (default: 20, max: 100)
- `role` (optional) - Filter by role
- `search` (optional) - Search by name or email

**Response (200 OK):**
```json
{
  "users": [
    {
      "userId": "user-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 100,
  "totalPages": 5
}
```

**Required Permissions:** `users:read`

---

## Authentication

### Login

Authenticate and receive JWT tokens.

```http
POST /api/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "userId": "user-123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Required Permissions:** None (public endpoint)

---

### Logout

Invalidate user session.

```http
POST /api/logout
```

**Request Body:**
```json
{
  "userId": "user-123"
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Required Permissions:** Authenticated user

---

### Refresh Token

Obtain a new access token using a refresh token.

```http
POST /api/refresh-token
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**Required Permissions:** Valid refresh token

---

### External Authentication

Authenticate using external providers (Google, GitHub, etc.)

```http
POST /api/login/external
```

**Request Body:**
```json
{
  "provider": "google",
  "idToken": "ya29.a0AfH6SMBx..."
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "userId": "user-456",
    "email": "user@gmail.com",
    "name": "John Doe"
  }
}
```

**Supported Providers:**
- `google` - Google OAuth
- `github` - GitHub OAuth
- `microsoft` - Microsoft OAuth

**Required Permissions:** None (public endpoint)

---

## Error Responses

All endpoints may return these standard error responses:

### 400 Bad Request

Validation failed or malformed request.

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": "Invalid email format",
    "firstName": "First name is required"
  }
}
```

---

### 401 Unauthorized

Missing or invalid authentication token.

```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

---

### 403 Forbidden

Insufficient permissions to perform the operation.

```json
{
  "error": "Permission denied",
  "code": "PERMISSION_DENIED",
  "required": ["users:create"],
  "actual": ["users:read"]
}
```

---

### 404 Not Found

Requested resource or handler not found.

```json
{
  "error": "Handler not found for message type: UnknownCommand",
  "code": "HANDLER_NOT_FOUND"
}
```

Or:

```json
{
  "error": "User not found",
  "code": "NOT_FOUND"
}
```

---

### 500 Internal Server Error

Unexpected server error.

```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR",
  "correlationId": "abc-123-def"
}
```

Use the `correlationId` for troubleshooting in logs and traces.

---

## Pagination

List endpoints support pagination using query parameters:

```http
GET /api/users?page=2&pageSize=50
```

**Parameters:**
- `page` - Page number (1-indexed, default: 1)
- `pageSize` - Items per page (default: 20, max: 100)

**Response includes pagination metadata:**
```json
{
  "items": [...],
  "page": 2,
  "pageSize": 50,
  "totalCount": 250,
  "totalPages": 5,
  "hasNext": true,
  "hasPrevious": true
}
```

---

## Filtering and Sorting

List endpoints may support filtering and sorting:

```http
GET /api/users?role=admin&sort=createdAt&order=desc
```

**Common Query Parameters:**
- `sort` - Field to sort by
- `order` - Sort direction (`asc` or `desc`)
- Resource-specific filters (e.g., `role`, `status`, `search`)

Check individual endpoint documentation for supported filters.

---

## Field Selection

Some endpoints support field selection to reduce payload size:

```http
GET /api/users/:userId?fields=userId,email,firstName
```

**Response:**
```json
{
  "userId": "user-123",
  "email": "user@example.com",
  "firstName": "John"
}
```

---

## Endpoint Discovery

To discover all available endpoints, use the service discovery endpoint:

```http
GET /api/discovery/contracts
```

Returns all service contracts with their generated endpoints.

---

## Next Steps

- **[API Examples](./examples.md)** - Working code examples in multiple languages
- **[Authentication](../authentication.md)** - JWT tokens and permissions
- **[Error Handling](../../05-troubleshooting/common-errors/error-catalog.md)** - Comprehensive error reference
