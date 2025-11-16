---
title: "Calling Your APIs"
description: "Learn how to consume Banyan services using REST, GraphQL, and WebSocket APIs"
category: "getting-started"
tags: ["api", "rest", "graphql", "websocket", "client"]
difficulty: "beginner"
estimated_time: "15 minutes"
prerequisites:
  - "Completed Your First Service"
  - "Service running locally"
last_updated: "2025-01-15"
status: "published"
---

# Calling Your APIs

> **TL;DR:** Use REST for simple requests, GraphQL for flexible queries, and WebSocket for real-time updates - all auto-generated from your service contracts.

## Overview

The Banyan Platform automatically generates three API styles from your service contracts. This guide shows you how to use each one effectively.

### What You'll Learn

- How to call REST endpoints
- How to query with GraphQL
- How to subscribe to real-time events with WebSocket
- When to use each API style
- How to handle authentication and errors

### Prerequisites

- Completed [Your First Service](./02-your-first-service.md)
- Service running on your machine
- API Gateway running (port 3003)

## The Three API Styles

All three are **automatically generated** from the same service contracts:

| API Style | Best For | Protocol |
|-----------|----------|----------|
| **REST** | Simple CRUD, standard tooling, caching | HTTP/JSON |
| **GraphQL** | Flexible queries, multiple resources, exploration | HTTP/JSON |
| **WebSocket** | Real-time updates, event streams, low latency | WebSocket |

**You can mix and match!** Use REST for mutations, GraphQL for complex queries, and WebSocket for live updates.

## Quick Examples

### REST: Create a User

```bash
curl -X POST http://localhost:3003/api/users \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: dev-user-123" \
  -H "X-Dev-Permissions: users:create" \
  -d '{
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### GraphQL: Create and Query

```bash
curl -X POST http://localhost:3003/graphql \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: dev-user-123" \
  -H "X-Dev-Permissions: users:create" \
  -d '{
    "query": "mutation { createUser(input: { email: \"jane@example.com\", firstName: \"Jane\", lastName: \"Smith\" }) { userId email createdAt } }"
  }'
```

### WebSocket: Real-time Events

```javascript
const ws = new WebSocket('ws://localhost:3003/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    userId: 'dev-user-123',
    permissions: ['users:read']
  }));

  ws.send(JSON.stringify({
    type: 'subscribe',
    eventType: 'UserCreated'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'event') {
    console.log('New user:', data.payload);
  }
};
```

## Authentication

### Development Mode

In development, use special headers instead of JWT tokens:

```bash
# REST and GraphQL
curl -H "X-Dev-User-Id: dev-user-123" \
     -H "X-Dev-Permissions: users:create,users:read" \
     http://localhost:3003/api/users
```

**Available permissions:**
- `users:create` - Create users
- `users:read` - Read user data
- `users:update` - Update users
- `users:delete` - Delete users

### Production Mode

In production, use JWT Bearer tokens:

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     http://localhost:3003/api/users
```

The token includes user ID and permissions automatically.

## REST API

### How It Works

Every command becomes a POST endpoint, every query becomes a GET endpoint:

```
Command: CreateUserCommand → POST /api/users
Query: GetUserQuery → GET /api/users/:id
```

### Making Requests

#### POST (Commands)

Commands modify state - use POST:

```javascript
// Using fetch API
const response = await fetch('http://localhost:3003/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Dev-User-Id': 'dev-user-123',
    'X-Dev-Permissions': 'users:create',
  },
  body: JSON.stringify({
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
  }),
});

const result = await response.json();
console.log('User created:', result);
// { userId: 'user-123', email: 'john@example.com', createdAt: '2025-01-15T10:30:00Z' }
```

#### GET (Queries)

Queries read data - use GET:

```javascript
const response = await fetch('http://localhost:3003/api/users/user-123', {
  headers: {
    'X-Dev-User-Id': 'dev-user-123',
    'X-Dev-Permissions': 'users:read',
  },
});

const user = await response.json();
console.log('User:', user);
// { userId: 'user-123', email: 'john@example.com', firstName: 'John', lastName: 'Doe' }
```

### Error Handling

REST uses standard HTTP status codes:

```javascript
const response = await fetch('http://localhost:3003/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Dev-User-Id': 'dev-user-123',
    'X-Dev-Permissions': 'users:create',
  },
  body: JSON.stringify({ email: 'invalid' }),
});

if (!response.ok) {
  const error = await response.json();
  console.error('Error:', error);
  // {
  //   error: 'Validation failed',
  //   code: 'VALIDATION_ERROR',
  //   details: { firstName: 'Required field missing' }
  // }
}
```

**Common status codes:**
- `200` - Success
- `400` - Validation error
- `401` - Authentication required
- `403` - Permission denied
- `404` - Resource not found
- `500` - Server error

### Verify

Test your REST endpoint:

```bash
curl -v -X POST http://localhost:3003/api/users \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: dev-user-123" \
  -H "X-Dev-Permissions: users:create" \
  -d '{"email":"test@example.com","firstName":"Test","lastName":"User"}'
```

Expected:
```
< HTTP/1.1 200 OK
< Content-Type: application/json
{
  "userId": "user-1705334567890",
  "email": "test@example.com",
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

## GraphQL API

### How It Works

Every contract becomes a GraphQL type:

```graphql
type Mutation {
  createUser(input: CreateUserInput!): CreateUserResult
}

input CreateUserInput {
  email: String!
  firstName: String!
  lastName: String!
}

type CreateUserResult {
  userId: String!
  email: String!
  createdAt: String!
}
```

### Interactive Playground

The easiest way to explore GraphQL is with GraphiQL:

**Open:** [http://localhost:3003/graphql](http://localhost:3003/graphql)

Features:
- ✅ Auto-completion as you type
- ✅ Documentation explorer (right panel)
- ✅ Query history
- ✅ Real-time validation
- ✅ Response formatting

### Making Queries

Use GraphQL to fetch exactly the data you need:

```javascript
const response = await fetch('http://localhost:3003/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Dev-User-Id': 'dev-user-123',
    'X-Dev-Permissions': 'users:read',
  },
  body: JSON.stringify({
    query: `
      query GetUser($userId: String!) {
        getUser(input: { userId: $userId }) {
          userId
          email
          firstName
          lastName
        }
      }
    `,
    variables: { userId: 'user-123' },
  }),
});

const { data, errors } = await response.json();
if (errors) {
  console.error('GraphQL errors:', errors);
} else {
  console.log('User:', data.getUser);
}
```

### Making Mutations

Mutations modify data:

```javascript
const response = await fetch('http://localhost:3003/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Dev-User-Id': 'dev-user-123',
    'X-Dev-Permissions': 'users:create',
  },
  body: JSON.stringify({
    query: `
      mutation CreateUser($email: String!, $firstName: String!, $lastName: String!) {
        createUser(input: {
          email: $email
          firstName: $firstName
          lastName: $lastName
        }) {
          userId
          email
          createdAt
        }
      }
    `,
    variables: {
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
  }),
});

const { data, errors } = await response.json();
if (errors) {
  console.error('Mutation failed:', errors);
} else {
  console.log('Created user:', data.createUser);
}
```

### Batching Multiple Operations

One of GraphQL's superpowers - fetch multiple resources in one request:

```graphql
mutation CreateAndQuery {
  # Create a user
  user1: createUser(input: {
    email: "alice@example.com"
    firstName: "Alice"
    lastName: "Smith"
  }) {
    userId
    email
  }

  # Create another user
  user2: createUser(input: {
    email: "bob@example.com"
    firstName: "Bob"
    lastName: "Jones"
  }) {
    userId
    email
  }
}
```

### Error Handling

GraphQL returns errors in a structured format:

```javascript
const { data, errors } = await response.json();

if (errors) {
  errors.forEach(error => {
    console.error(`Error: ${error.message}`);
    console.error(`Path: ${error.path?.join('.')}`);
    console.error(`Code: ${error.extensions?.code}`);
  });
}
```

### Verify

Try this mutation in GraphiQL ([http://localhost:3003/graphql](http://localhost:3003/graphql)):

```graphql
mutation CreateUser {
  createUser(input: {
    email: "graphql-test@example.com"
    firstName: "GraphQL"
    lastName: "Test"
  }) {
    userId
    email
    createdAt
  }
}
```

Expected response:
```json
{
  "data": {
    "createUser": {
      "userId": "user-1705334567890",
      "email": "graphql-test@example.com",
      "createdAt": "2025-01-15T10:35:00.000Z"
    }
  }
}
```

## WebSocket API

### How It Works

WebSocket provides real-time event subscriptions. Subscribe to events and receive updates as they happen.

### Connecting

```javascript
const ws = new WebSocket('ws://localhost:3003/ws');

ws.onopen = () => {
  console.log('Connected to WebSocket');

  // Authenticate (development mode)
  ws.send(JSON.stringify({
    type: 'auth',
    userId: 'dev-user-123',
    permissions: ['users:read', 'users:create']
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket closed');
};
```

### Subscribing to Events

After authentication, subscribe to specific event types:

```javascript
// Subscribe to user creation events
ws.send(JSON.stringify({
  type: 'subscribe',
  eventType: 'UserCreated'
}));

// Subscribe to user update events
ws.send(JSON.stringify({
  type: 'subscribe',
  eventType: 'UserUpdated'
}));
```

### Receiving Events

Handle incoming events:

```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'auth_success':
      console.log('Authenticated successfully');
      break;

    case 'auth_error':
      console.error('Authentication failed:', message.error);
      break;

    case 'subscribe_success':
      console.log('Subscribed to:', message.eventType);
      break;

    case 'event':
      console.log(`Event: ${message.eventType}`, message.payload);
      // Handle the event
      if (message.eventType === 'UserCreated') {
        updateUserList(message.payload);
      }
      break;

    case 'ping':
      // Heartbeat - connection is alive
      break;
  }
};
```

### Unsubscribing

Stop receiving events:

```javascript
ws.send(JSON.stringify({
  type: 'unsubscribe',
  eventType: 'UserCreated'
}));
```

### React Hook Example

Here's a reusable React hook for WebSocket subscriptions:

```javascript
import { useEffect, useState } from 'react';

function useWebSocket(url, userId, permissions) {
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      setConnected(true);
      socket.send(JSON.stringify({
        type: 'auth',
        userId,
        permissions
      }));
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'event') {
        setEvents(prev => [...prev, message]);
      }
    };

    socket.onclose = () => {
      setConnected(false);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [url, userId, permissions]);

  const subscribe = (eventType) => {
    if (ws && connected) {
      ws.send(JSON.stringify({ type: 'subscribe', eventType }));
    }
  };

  const unsubscribe = (eventType) => {
    if (ws && connected) {
      ws.send(JSON.stringify({ type: 'unsubscribe', eventType }));
    }
  };

  return { ws, connected, events, subscribe, unsubscribe };
}

// Usage in component
function UserList() {
  const { connected, events, subscribe } = useWebSocket(
    'ws://localhost:3003/ws',
    'dev-user-123',
    ['users:read']
  );
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (connected) {
      subscribe('UserCreated');
    }
  }, [connected, subscribe]);

  useEffect(() => {
    const userCreatedEvents = events.filter(e => e.eventType === 'UserCreated');
    if (userCreatedEvents.length > 0) {
      const newUser = userCreatedEvents[userCreatedEvents.length - 1].payload;
      setUsers(prev => [...prev, newUser]);
    }
  }, [events]);

  return (
    <div>
      <h2>Users (Live Updates)</h2>
      {users.map(user => (
        <div key={user.userId}>{user.email}</div>
      ))}
    </div>
  );
}
```

### Verify

Create a simple HTML file to test WebSocket:

```html
<!DOCTYPE html>
<html>
<head>
  <title>WebSocket Test</title>
</head>
<body>
  <h1>User Events</h1>
  <div id="events"></div>

  <script>
    const ws = new WebSocket('ws://localhost:3003/ws');
    const eventsDiv = document.getElementById('events');

    ws.onopen = () => {
      console.log('Connected');
      ws.send(JSON.stringify({
        type: 'auth',
        userId: 'dev-user-123',
        permissions: ['users:read']
      }));
      ws.send(JSON.stringify({
        type: 'subscribe',
        eventType: 'UserCreated'
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      eventsDiv.innerHTML += `<pre>${JSON.stringify(message, null, 2)}</pre>`;
    };
  </script>
</body>
</html>
```

Open this file in your browser, then create a user via REST or GraphQL - you'll see the event appear in real-time!

## Which API Should I Use?

### Use REST When:

- ✅ Building traditional request/response flows
- ✅ You need HTTP caching (GET requests)
- ✅ You want standard HTTP tooling (curl, Postman)
- ✅ Each request fetches one resource
- ✅ You're building a mobile app with REST libraries

**Example:** Simple CRUD operations, file uploads, health checks

### Use GraphQL When:

- ✅ You need flexible data fetching
- ✅ You want to fetch multiple resources in one request
- ✅ Different clients need different data shapes
- ✅ You want strong typing and auto-completion
- ✅ You want to explore the API interactively

**Example:** Dashboard with complex queries, mobile apps with limited bandwidth

### Use WebSocket When:

- ✅ You need real-time updates
- ✅ Building dashboards or live feeds
- ✅ You want server-push notifications
- ✅ Low latency is critical
- ✅ Building collaborative features

**Example:** Live dashboards, chat applications, real-time notifications

### Mix and Match!

Common pattern: **REST for mutations + WebSocket for updates**

```javascript
// 1. Create user via REST
const response = await fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify(newUser)
});

// 2. WebSocket notifies all connected clients
ws.onmessage = (event) => {
  if (event.data.eventType === 'UserCreated') {
    // Update UI in real-time
    addUserToList(event.data.payload);
  }
};
```

## Next Steps

Now that you know how to call your APIs:

- **[Next Steps Guide](./04-next-steps.md)** - Learn what to build next
- **[Tutorial: Build a User Service](../01-tutorials/building-user-service.md)** - Build a complete CRUD service
- **[REST API Reference](../04-reference/rest-endpoints.md)** - Complete REST documentation
- **[GraphQL Reference](../04-reference/graphql-schema.md)** - Complete GraphQL schema
- **[WebSocket Protocol](../04-reference/websocket-protocol.md)** - WebSocket message formats

## Common Issues

### Connection Refused

**Problem:** Cannot connect to `http://localhost:3003`

**Solution:** Ensure API Gateway is running

```bash
cd /path/to/banyan-core/platform/services/api-gateway
pnpm run dev
```

### Permission Denied

**Problem:** API returns 403 Forbidden

**Solution:** Add required permissions to request

```bash
# Check what permissions are required
curl http://localhost:3003/api/users  # Error message shows required permissions

# Add permission to header
curl -H "X-Dev-Permissions: users:create" http://localhost:3003/api/users
```

### GraphQL Errors

**Problem:** GraphQL returns validation errors

**Solution:** Use GraphiQL to validate your query

1. Open [http://localhost:3003/graphql](http://localhost:3003/graphql)
2. Paste your query
3. See validation errors in real-time
4. Use auto-complete to fix errors

### WebSocket Not Connecting

**Problem:** WebSocket connection fails

**Solution:** Check browser console for errors

```javascript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = (event) => {
  console.log('Close code:', event.code);
  console.log('Close reason:', event.reason);
};
```

Common causes:
- API Gateway not running
- Wrong URL (use `ws://` not `http://`)
- Authentication failed

## Additional Resources

- [API Reference](../04-reference/README.md) - Complete API documentation
- [Authentication Guide](../03-guides/authentication.md) - JWT tokens and permissions
- [Error Handling](../03-guides/error-handling.md) - Handle errors gracefully
- [Client Libraries](../03-guides/client-libraries.md) - TypeScript/JavaScript clients
