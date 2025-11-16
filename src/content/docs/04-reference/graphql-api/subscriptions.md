---
title: GraphQL Subscriptions
description: Real-time event subscriptions via GraphQL over WebSocket
category: graphql-api
tags: [graphql, subscriptions, websocket, real-time, events]
related:
  - ./queries.md
  - ./mutations.md
  - ./schema.md
  - ../websocket-api/overview.md
difficulty: advanced
---

# GraphQL Subscriptions

Real-time event subscriptions using GraphQL over WebSocket. Subscribe to domain events and receive updates as they occur.

## Overview

GraphQL subscriptions provide real-time updates by:

- Establishing a WebSocket connection
- Using graphql-ws protocol
- Subscribing to specific domain events
- Receiving events as they occur
- Filtering events by criteria

## Connection Setup

### WebSocket Endpoint

```
ws://localhost:3003/graphql
wss://api.your-domain.com/graphql  # Production
```

### Connection Protocol

The platform uses **graphql-ws** protocol (not subscriptions-transport-ws):

```typescript
import { createClient } from 'graphql-ws';

const client = createClient({
  url: 'ws://localhost:3003/graphql',
  connectionParams: {
    authToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
});
```

### Authentication

Subscriptions require authentication via connection params:

```typescript
const client = createClient({
  url: 'ws://localhost:3003/graphql',
  connectionParams: () => ({
    authToken: `Bearer ${getAccessToken()}`
  })
});
```

**Development mode:**
```typescript
connectionParams: {
  'X-Dev-User-Id': 'dev-user-123',
  'X-Dev-Permissions': 'users:read,orders:read'
}
```

## Subscription Structure

```graphql
subscription OperationName($filter: EventFilterInput) {
  eventName(filter: $filter) {
    eventId
    timestamp
    payload {
      field1
      field2
    }
  }
}
```

## Authentication Events

### UserCreated

Subscribe to new user creation events.

**Permission Required:** `auth:view-users`

```graphql
subscription OnUserCreated {
  userCreated {
    userId
    email
    profile {
      firstName
      lastName
      displayName
    }
    createdAt
    timestamp
  }
}
```

**Event Payload:**
```json
{
  "data": {
    "userCreated": {
      "userId": "user-789",
      "email": "newuser@example.com",
      "profile": {
        "firstName": "Alice",
        "lastName": "Johnson",
        "displayName": "Alice Johnson"
      },
      "createdAt": "2025-11-15T14:30:00Z",
      "timestamp": "2025-11-15T14:30:00.123Z"
    }
  }
}
```

### UserUpdated

Subscribe to user profile updates.

**Permission Required:** `auth:view-users`

```graphql
subscription OnUserUpdated($userId: String) {
  userUpdated(filter: { userId: $userId }) {
    userId
    email
    updatedFields
    updatedAt
    updatedBy
    timestamp
  }
}
```

**With filtering:**
```json
{
  "userId": "user-123"
}
```

**Event Payload:**
```json
{
  "data": {
    "userUpdated": {
      "userId": "user-123",
      "email": "user@example.com",
      "updatedFields": ["profile.firstName", "profile.timezone"],
      "updatedAt": "2025-11-15T14:35:00Z",
      "updatedBy": "user-123",
      "timestamp": "2025-11-15T14:35:00.456Z"
    }
  }
}
```

### UserDeleted

Subscribe to user deletion events.

**Permission Required:** `admin:view-users`

```graphql
subscription OnUserDeleted {
  userDeleted {
    userId
    email
    deletedAt
    deletedBy
    reason
    timestamp
  }
}
```

### RoleAssigned

Subscribe to role assignment events.

**Permission Required:** `auth:view-roles`

```graphql
subscription OnRoleAssigned($userId: String) {
  roleAssigned(filter: { userId: $userId }) {
    userId
    roleName
    assignedBy
    timestamp
  }
}
```

### PermissionGranted

Subscribe to permission grant events.

**Permission Required:** `auth:view-permissions`

```graphql
subscription OnPermissionGranted {
  permissionGranted {
    userId
    permission
    grantedBy
    expiresAt
    timestamp
  }
}
```

## Session Events

### SessionCreated

Subscribe to new session creation.

**Permission Required:** `auth:view-sessions`

```graphql
subscription OnSessionCreated($userId: String) {
  sessionCreated(filter: { userId: $userId }) {
    sessionId
    userId
    deviceInfo
    ipAddress
    createdAt
    expiresAt
    timestamp
  }
}
```

### SessionExpired

Subscribe to session expiration events.

**Permission Required:** `auth:view-sessions`

```graphql
subscription OnSessionExpired {
  sessionExpired {
    sessionId
    userId
    expiredAt
    reason
    timestamp
  }
}
```

## Service Discovery Events

### ServiceRegistered

Subscribe to new service registrations.

**Permission Required:** `admin:view-services`

```graphql
subscription OnServiceRegistered {
  serviceRegistered {
    serviceName
    version
    serviceId
    endpoint
    contracts {
      messageType
      description
    }
    registeredAt
    timestamp
  }
}
```

### ServiceHealthChanged

Subscribe to service health status changes.

**Permission Required:** `admin:view-services`

```graphql
subscription OnServiceHealthChanged($serviceName: String) {
  serviceHealthChanged(filter: { serviceName: $serviceName }) {
    serviceName
    status
    previousStatus
    healthCheckTime
    responseTime
    errors
    timestamp
  }
}
```

**Status values:**
- `healthy` - Service responding normally
- `degraded` - Service slow or partial failure
- `unhealthy` - Service not responding
- `unknown` - No recent health data

### ContractUpdated

Subscribe to contract updates.

**Permission Required:** `admin:view-contracts`

```graphql
subscription OnContractUpdated {
  contractUpdated {
    serviceName
    version
    contracts {
      messageType
      description
      inputSchema
      outputSchema
    }
    updatedAt
    timestamp
  }
}
```

## Client Implementation

### Apollo Client

```typescript
import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

// HTTP link for queries and mutations
const httpLink = new HttpLink({
  uri: 'http://localhost:3003/graphql',
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
});

// WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:3003/graphql',
    connectionParams: {
      authToken: `Bearer ${accessToken}`
    }
  })
);

// Split based on operation type
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache()
});
```

**Using subscriptions:**
```typescript
import { gql, useSubscription } from '@apollo/client';

const USER_CREATED_SUBSCRIPTION = gql`
  subscription OnUserCreated {
    userCreated {
      userId
      email
      profile {
        displayName
      }
    }
  }
`;

function UserCreationMonitor() {
  const { data, loading, error } = useSubscription(
    USER_CREATED_SUBSCRIPTION
  );

  if (loading) return <p>Waiting for users...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      New user created: {data.userCreated.email}
    </div>
  );
}
```

### Vanilla JavaScript

```typescript
import { createClient } from 'graphql-ws';

const client = createClient({
  url: 'ws://localhost:3003/graphql',
  connectionParams: {
    authToken: `Bearer ${accessToken}`
  }
});

const subscription = client.subscribe(
  {
    query: `
      subscription {
        userCreated {
          userId
          email
        }
      }
    `
  },
  {
    next: (data) => {
      console.log('User created:', data.data.userCreated);
    },
    error: (error) => {
      console.error('Subscription error:', error);
    },
    complete: () => {
      console.log('Subscription completed');
    }
  }
);

// Unsubscribe
subscription();
```

### React Hook

```typescript
function useUserCreatedSubscription() {
  const [latestUser, setLatestUser] = useState(null);

  useEffect(() => {
    const client = createClient({
      url: 'ws://localhost:3003/graphql',
      connectionParams: {
        authToken: `Bearer ${getAccessToken()}`
      }
    });

    const unsubscribe = client.subscribe(
      {
        query: `
          subscription {
            userCreated {
              userId
              email
              profile { displayName }
            }
          }
        `
      },
      {
        next: (data) => setLatestUser(data.data.userCreated),
        error: (err) => console.error(err)
      }
    );

    return () => unsubscribe();
  }, []);

  return latestUser;
}
```

## Event Filtering

### Filter by Entity ID

```graphql
subscription OnUserUpdated($userId: String!) {
  userUpdated(filter: { userId: $userId }) {
    userId
    updatedFields
  }
}
```

### Filter by Multiple Criteria

```graphql
subscription OnServiceHealthChanged(
  $serviceName: String
  $minSeverity: String
) {
  serviceHealthChanged(
    filter: {
      serviceName: $serviceName
      minSeverity: $minSeverity
    }
  ) {
    serviceName
    status
    errors
  }
}
```

## Error Handling

### Connection Errors

```typescript
const client = createClient({
  url: 'ws://localhost:3003/graphql',
  connectionParams: {
    authToken: `Bearer ${accessToken}`
  },
  on: {
    error: (error) => {
      console.error('WebSocket error:', error);
    },
    closed: (event) => {
      console.log('WebSocket closed:', event);
    }
  }
});
```

### Subscription Errors

```typescript
client.subscribe(
  { query: SUBSCRIPTION_QUERY },
  {
    next: (data) => console.log(data),
    error: (error) => {
      if (error.message.includes('PERMISSION_DENIED')) {
        console.error('Missing permission');
      } else if (error.message.includes('INVALID_TOKEN')) {
        console.error('Token expired, refreshing...');
        refreshToken();
      }
    }
  }
);
```

### Reconnection

```typescript
const client = createClient({
  url: 'ws://localhost:3003/graphql',
  connectionParams: {
    authToken: `Bearer ${accessToken}`
  },
  retryAttempts: 5,
  retryWait: async (retries) => {
    await new Promise(resolve =>
      setTimeout(resolve, Math.min(1000 * 2 ** retries, 10000))
    );
  }
});
```

## Best Practices

### Connection Management

- Reuse WebSocket connections across subscriptions
- Close connections when component unmounts
- Handle reconnection automatically
- Monitor connection health

### Performance

- Filter events on the server (not client)
- Unsubscribe from unused subscriptions
- Use pagination for historical data (queries)
- Batch event processing on client

### Security

- Always authenticate WebSocket connections
- Validate subscription filters
- Respect permission boundaries
- Use WSS (secure WebSocket) in production

### Error Recovery

- Implement exponential backoff for reconnection
- Handle token expiration gracefully
- Log subscription errors for debugging
- Provide fallback UI during disconnection

## Limitations

- Maximum 100 concurrent subscriptions per connection
- Events are not guaranteed to be delivered (at-most-once)
- No event history (use queries for historical data)
- Subscriptions timeout after 24 hours of inactivity

## Next Steps

- **[GraphQL Queries](./queries.md)** - Fetch historical data
- **[GraphQL Mutations](./mutations.md)** - Trigger events
- **[WebSocket API](../websocket-api/overview.md)** - Alternative subscription API
- **[Authentication](../authentication.md)** - JWT tokens and permissions
