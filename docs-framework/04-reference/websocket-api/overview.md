---
title: WebSocket API Overview
description: Real-time event subscriptions for live data updates
category: websocket-api
tags: [websocket, real-time, events, subscriptions, streaming]
related:
  - ./protocol.md
  - ./examples.md
  - ../authentication.md
  - ../../03-guides/api-integration/server-sent-events.md
difficulty: intermediate
---

# WebSocket API Overview

The Banyan Platform provides WebSocket support for real-time event streaming from your services to web and mobile clients.

## Key Features

### Real-Time Event Streaming

- **Server-to-client push** - Events delivered instantly
- **Subscription-based** - Subscribe to specific event types
- **Permission-filtered** - Events filtered by user permissions
- **Low latency** - Direct WebSocket connection
- **Reconnection** - Automatic connection recovery

### Connection-Time Authentication

> **IMPORTANT**: Authentication happens AT CONNECTION TIME, not after.

WebSocket connections are authenticated when established:

1. **Include JWT token** in URL parameter or headers
2. **Connection accepted** if token is valid
3. **Connection rejected** if token is invalid/expired
4. **Subscribe to events** immediately after connection
5. **Refresh token** before expiration (reconnect with new token)

This differs from HTTP where authentication happens per-request. With WebSocket:
- Authentication is one-time at connection
- Token expiration requires reconnection
- Can't change user context without reconnecting

## WebSocket URL

```
ws://localhost:3003/ws       # Development
wss://api.example.com/ws     # Production (TLS)
```

## Quick Example

```javascript
// Connect with JWT token in URL parameter
const token = localStorage.getItem('jwt_token');
const ws = new WebSocket(`ws://localhost:3003/ws?token=${token}`);

ws.onopen = () => {
  console.log('WebSocket connected and authenticated');

  // Subscribe to user events
  ws.send(JSON.stringify({
    type: 'subscribe',
    eventType: 'User.Events.UserCreated'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'event') {
    console.log('Event received:', message.eventType, message.payload);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  // Connection may have been rejected due to invalid/expired token
};
```

## Connection Flow

1. **Authenticate AT CONNECTION** - Include JWT token in URL or headers
2. **Connection established** if token is valid (or rejected if invalid)
3. **Subscribe** to event types immediately after connection
4. **Receive** real-time events
5. **Refresh token every 5 minutes** (before expiration)

> **Critical**: Unlike HTTP requests where authentication happens per-request, WebSocket authentication happens ONCE at connection time. If your token expires (5 minute TTL), you must reconnect with a fresh token.

## Message Types

### Client → Server

#### Subscribe Message

Subscribe to an event type:

```json
{
  "type": "subscribe",
  "eventType": "User.Events.UserCreated",
  "filters": {
    "department": "engineering"
  }
}
```

#### Unsubscribe Message

Stop receiving events:

```json
{
  "type": "unsubscribe",
  "eventType": "User.Events.UserCreated"
}
```

#### Ping Message

Keep connection alive:

```json
{
  "type": "ping",
  "timestamp": "2025-11-15T12:00:00.000Z"
}
```

### Server → Client

#### Event Message

Real-time event from subscribed type:

```json
{
  "type": "event",
  "eventType": "User.Events.UserCreated",
  "payload": {
    "userId": "user-456",
    "email": "user@example.com",
    "createdAt": "2025-11-15T12:00:00.000Z"
  },
  "timestamp": "2025-11-15T12:00:00.123Z",
  "correlationId": "abc-123-def"
}
```

#### Subscription Success

```json
{
  "type": "subscribe_success",
  "eventType": "User.Events.UserCreated"
}
```

#### Subscription Error

```json
{
  "type": "subscribe_error",
  "eventType": "User.Events.UserCreated",
  "error": "Insufficient permissions",
  "code": "PERMISSION_DENIED"
}
```

## Authentication

### Production (JWT Token)

Include token in URL parameter:

```javascript
const token = localStorage.getItem('jwt_token');
const ws = new WebSocket(`wss://api.example.com/ws?token=${token}`);

ws.onopen = () => {
  console.log('WebSocket connected and authenticated');
  // Start subscribing immediately
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  // Connection rejected - likely invalid or expired token
};

ws.onclose = (event) => {
  if (event.code === 4001) {
    console.error('Authentication failed - redirecting to login');
    window.location.href = '/login';
  }
};
```

Or in headers (Node.js/custom clients):

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('wss://api.example.com/ws', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Token Expiration and Refresh

Platform JWT tokens expire after 5 minutes. For long-lived connections:

```javascript
let ws = null;
let reconnectTimer = null;

function connectWebSocket() {
  const token = localStorage.getItem('jwt_token');
  ws = new WebSocket(`wss://api.example.com/ws?token=${token}`);

  ws.onopen = () => {
    console.log('Connected');
    clearTimeout(reconnectTimer);

    // Resubscribe to events
    ws.send(JSON.stringify({
      type: 'subscribe',
      eventType: 'User.Events.UserCreated'
    }));

    // Refresh token every 4 minutes (before 5 minute expiration)
    reconnectTimer = setTimeout(() => {
      console.log('Refreshing token...');
      refreshTokenAndReconnect();
    }, 4 * 60 * 1000);
  };

  ws.onclose = () => {
    console.log('Disconnected - reconnecting...');
    clearTimeout(reconnectTimer);
    setTimeout(connectWebSocket, 1000);
  };
}

async function refreshTokenAndReconnect() {
  // Get fresh token from auth service
  const response = await fetch('/api/refresh-token', {
    method: 'POST',
    body: JSON.stringify({
      refreshToken: localStorage.getItem('refresh_token')
    })
  });

  const data = await response.json();
  localStorage.setItem('jwt_token', data.accessToken);

  // Close old connection
  ws.close();

  // Reconnect with new token
  connectWebSocket();
}

// Initial connection
connectWebSocket();
```

### Development Mode

> **CRITICAL SECURITY WARNING**
>
> Development mode (`DEVELOPMENT_AUTH_ENABLED=true`) **BYPASSES ALL AUTHENTICATION** and should **NEVER** be enabled in production environments.
>
> - NO token validation
> - NO permission checks
> - NO security whatsoever
> - **Anyone can access ANY data**
>
> Only use for local development on your machine.

For local development (requires `DEVELOPMENT_AUTH_ENABLED=true`):

```javascript
const ws = new WebSocket('ws://localhost:3003/ws', {
  headers: {
    'X-Dev-User-Id': 'test-user-123',
    'X-Dev-Permissions': 'events:subscribe,users:read'
  }
});
```

## Subscription Patterns

### Subscribe to Multiple Events

```javascript
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    eventType: 'User.Events.UserCreated'
  }));

  ws.send(JSON.stringify({
    type: 'subscribe',
    eventType: 'User.Events.UserUpdated'
  }));

  ws.send(JSON.stringify({
    type: 'subscribe',
    eventType: 'Order.Events.OrderCreated'
  }));
};
```

### Subscribe with Filters

Filter events by specific criteria:

```javascript
// Only receive events for specific customer
ws.send(JSON.stringify({
  type: 'subscribe',
  eventType: 'Order.Events.OrderCreated',
  filters: {
    customerId: 'customer-123'
  }
}));

// Only receive high-priority notifications
ws.send(JSON.stringify({
  type: 'subscribe',
  eventType: 'Notification.Events.NotificationSent',
  filters: {
    priority: 'high'
  }
}));
```

How filters work:
- Server evaluates filters against event payload
- Only matching events are sent to client
- Filters reduce bandwidth and client processing
- Use dot notation for nested fields: `"user.department": "engineering"`

## Keep-Alive (Ping/Pong)

Maintain connection during idle periods:

```javascript
// Send ping every 30 seconds
const pingInterval = setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'ping',
      timestamp: new Date().toISOString()
    }));
  }
}, 30000);

ws.onclose = () => {
  clearInterval(pingInterval);
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'pong') {
    console.log('Pong received, connection alive');
  }
};
```

Platform behavior:
- Server sends ping if no messages for 60 seconds
- Connection closed if no pong response within 10 seconds
- Client should send ping every 30-45 seconds

## When to Use WebSocket vs GraphQL Subscriptions

The platform supports **both WebSocket subscriptions and GraphQL subscriptions**.

### Use WebSocket When:
- Using REST API for queries/commands
- Need more control over connection management
- Building custom real-time features
- Prefer JSON message protocol

### Use GraphQL Subscriptions When:
- Using GraphQL for queries/mutations
- Want unified API surface
- Prefer GraphQL WS protocol
- Need typed schema for subscriptions

Both connect to different endpoints:
- WebSocket: `ws://localhost:3003/ws`
- GraphQL: `ws://localhost:3003/graphql` (using graphql-ws protocol)

## Next Steps

- **[WebSocket Protocol](./protocol.md)** - Complete message protocol reference
- **[WebSocket Examples](./examples.md)** - Working code examples
- **[Authentication](../authentication.md)** - JWT tokens and permissions
- **[GraphQL Subscriptions](../graphql-api/overview.md)** - Alternative subscription method
