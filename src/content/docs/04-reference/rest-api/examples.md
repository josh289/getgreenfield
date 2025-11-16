---
title: REST API Examples
description: Working code examples for consuming the REST API in multiple languages
category: rest-api
tags: [rest, examples, code-samples, curl, javascript, python]
related:
  - ./overview.md
  - ./endpoints.md
  - ../authentication.md
difficulty: beginner
---

# REST API Examples

Working code examples for consuming the REST API in multiple programming languages.

## cURL Examples

### Basic POST Request

```bash
curl -X POST http://localhost:3003/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Basic GET Request

```bash
curl http://localhost:3003/api/users/user-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### GET with Query Parameters

```bash
curl "http://localhost:3003/api/users?page=1&pageSize=20&role=admin" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Development Mode (No JWT)

```bash
curl -X POST http://localhost:3003/api/users \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: dev-user-123" \
  -H "X-Dev-Permissions: users:create,users:read" \
  -d '{
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

---

## JavaScript/TypeScript Examples

### Using Fetch API

```typescript
// Create user
async function createUser(email: string, firstName: string, lastName: string) {
  const response = await fetch('http://localhost:3003/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      email,
      firstName,
      lastName,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create user');
  }

  return response.json();
}

// Usage
try {
  const user = await createUser('john@example.com', 'John', 'Doe');
  console.log('User created:', user);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Get User

```typescript
async function getUser(userId: string) {
  const response = await fetch(`http://localhost:3003/api/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch user');
  }

  return response.json();
}

// Usage
const user = await getUser('user-123');
console.log('User:', user);
```

### List Users with Pagination

```typescript
async function listUsers(page = 1, pageSize = 20, filters: Record<string, string> = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...filters,
  });

  const response = await fetch(`http://localhost:3003/api/users?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to list users');
  }

  return response.json();
}

// Usage
const result = await listUsers(1, 20, { role: 'admin' });
console.log(`Found ${result.totalCount} users`);
console.log('Users:', result.users);
```

### Error Handling

```typescript
async function safeApiCall<T>(
  url: string,
  options: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json();

      // Handle specific error codes
      switch (error.code) {
        case 'UNAUTHORIZED':
          // Redirect to login
          window.location.href = '/login';
          break;
        case 'PERMISSION_DENIED':
          console.error('Insufficient permissions:', error.required);
          break;
        case 'VALIDATION_ERROR':
          console.error('Validation errors:', error.details);
          break;
        default:
          console.error('API error:', error.message);
      }

      throw new Error(error.message);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      // Network error
      console.error('Network error - API unreachable');
    }
    throw error;
  }
}
```

### TypeScript API Client

```typescript
class BanyanApiClient {
  constructor(
    private baseUrl: string,
    private token: string
  ) {}

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }

  // User operations
  async createUser(email: string, firstName: string, lastName?: string) {
    return this.request('POST', '/api/users', { email, firstName, lastName });
  }

  async getUser(userId: string) {
    return this.request('GET', `/api/users/${userId}`);
  }

  async updateUser(userId: string, updates: Partial<{ email: string; firstName: string; lastName: string }>) {
    return this.request('PUT', `/api/users/${userId}`, updates);
  }

  async deleteUser(userId: string) {
    return this.request('DELETE', `/api/users/${userId}`);
  }

  async listUsers(page = 1, pageSize = 20, filters: Record<string, string> = {}) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...filters,
    });
    return this.request('GET', `/api/users?${params}`);
  }
}

// Usage
const client = new BanyanApiClient('http://localhost:3003', token);
const user = await client.createUser('john@example.com', 'John', 'Doe');
```

---

## React Examples

### Using Hooks

```typescript
import { useState, useEffect } from 'react';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('http://localhost:3003/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }

        const data = await response.json();
        setUsers(data.users);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.userId}>{user.email}</li>
      ))}
    </ul>
  );
}
```

### Create User Form

```typescript
function CreateUserForm() {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3003/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const user = await response.json();
      console.log('User created:', user);

      // Reset form
      setFormData({ email: '', firstName: '', lastName: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
      />
      <input
        type="text"
        value={formData.firstName}
        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
        placeholder="First Name"
        required
      />
      <input
        type="text"
        value={formData.lastName}
        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
        placeholder="Last Name"
      />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Creating...' : 'Create User'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

---

## Python Examples

### Using Requests Library

```python
import requests

class BanyanApiClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.token = token
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        })

    def create_user(self, email, first_name, last_name=None):
        """Create a new user"""
        response = self.session.post(
            f'{self.base_url}/api/users',
            json={
                'email': email,
                'firstName': first_name,
                'lastName': last_name
            }
        )
        response.raise_for_status()
        return response.json()

    def get_user(self, user_id):
        """Get user by ID"""
        response = self.session.get(f'{self.base_url}/api/users/{user_id}')
        response.raise_for_status()
        return response.json()

    def update_user(self, user_id, **updates):
        """Update user"""
        response = self.session.put(
            f'{self.base_url}/api/users/{user_id}',
            json=updates
        )
        response.raise_for_status()
        return response.json()

    def delete_user(self, user_id):
        """Delete user"""
        response = self.session.delete(f'{self.base_url}/api/users/{user_id}')
        response.raise_for_status()

    def list_users(self, page=1, page_size=20, **filters):
        """List users with pagination and filters"""
        params = {
            'page': page,
            'pageSize': page_size,
            **filters
        }
        response = self.session.get(
            f'{self.base_url}/api/users',
            params=params
        )
        response.raise_for_status()
        return response.json()

# Usage
client = BanyanApiClient('http://localhost:3003', token)

# Create user
user = client.create_user('john@example.com', 'John', 'Doe')
print(f'Created user: {user["userId"]}')

# Get user
user = client.get_user('user-123')
print(f'User email: {user["email"]}')

# List users
result = client.list_users(page=1, page_size=20, role='admin')
print(f'Found {result["totalCount"]} users')
```

### Error Handling

```python
from requests.exceptions import HTTPError

try:
    user = client.create_user('invalid-email', 'John')
except HTTPError as e:
    error = e.response.json()

    if error['code'] == 'VALIDATION_ERROR':
        print('Validation errors:')
        for field, message in error['details'].items():
            print(f'  {field}: {message}')
    elif error['code'] == 'PERMISSION_DENIED':
        print(f'Missing permissions: {error["required"]}')
    else:
        print(f'Error: {error["message"]}')
```

---

## Node.js Examples

### Using Axios

```typescript
import axios, { AxiosInstance } from 'axios';

class BanyanApiClient {
  private client: AxiosInstance;

  constructor(baseUrl: string, token: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { code, message, details } = error.response.data;
          console.error(`API Error [${code}]: ${message}`, details);
        }
        return Promise.reject(error);
      }
    );
  }

  async createUser(email: string, firstName: string, lastName?: string) {
    const { data } = await this.client.post('/api/users', {
      email,
      firstName,
      lastName,
    });
    return data;
  }

  async getUser(userId: string) {
    const { data } = await this.client.get(`/api/users/${userId}`);
    return data;
  }

  async listUsers(page = 1, pageSize = 20, filters: Record<string, string> = {}) {
    const { data } = await this.client.get('/api/users', {
      params: { page, pageSize, ...filters },
    });
    return data;
  }
}

// Usage
const client = new BanyanApiClient('http://localhost:3003', process.env.JWT_TOKEN);

try {
  const user = await client.createUser('john@example.com', 'John', 'Doe');
  console.log('User created:', user);
} catch (error) {
  console.error('Failed to create user:', error.message);
}
```

---

## Testing with Postman

### Collection Setup

1. **Create Base URL Variable:**
   - Variable: `base_url`
   - Value: `http://localhost:3003`

2. **Add Authorization:**
   - Type: Bearer Token
   - Token: `{{jwt_token}}`

3. **Create Requests:**

**Create User:**
```
POST {{base_url}}/api/users
Body (raw JSON):
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Get User:**
```
GET {{base_url}}/api/users/:userId
Params:
  userId: user-123
```

### Environment Variables

Create environments for different stages:

**Development:**
```json
{
  "base_url": "http://localhost:3003",
  "jwt_token": "dev_token_here"
}
```

**Production:**
```json
{
  "base_url": "https://api.production.com",
  "jwt_token": "prod_token_here"
}
```

---

## Next Steps

- **[Endpoint Catalog](./endpoints.md)** - Complete API reference
- **[Authentication](../authentication.md)** - JWT token management
- **[Error Handling](../../05-troubleshooting/common-errors/error-catalog.md)** - Error codes and solutions
- **[GraphQL Examples](../graphql-api/examples.md)** - Alternative query language
