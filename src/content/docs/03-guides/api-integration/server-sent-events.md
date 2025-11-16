---
title: Server-Sent Events (SSE)
description: Real-time event streaming from API Gateway using Server-Sent Events
category: api-integration
tags: [sse, real-time, events, streaming, websocket-alternative]
related:
  - ../../02-core-concepts/event-driven-architecture.md
  - ./graphql-api.md
  - ./rest-api.md
difficulty: intermediate
---

# Server-Sent Events (SSE)

The API Gateway provides Server-Sent Events (SSE) support for real-time event streaming to clients. SSE is a standard protocol that allows servers to push updates to clients over a single HTTP connection.

## Overview

Server-Sent Events provide:

- **One-way server-to-client streaming**: Server pushes events to clients
- **Automatic reconnection**: Built-in browser support for connection recovery
- **Text-based protocol**: Simple format, easy to debug
- **HTTP-based**: Works through firewalls and proxies
- **Permission-based filtering**: Events filtered by user permissions

## When to Use SSE

### Use SSE When:

- **Real-time notifications**: User notifications, alerts, status updates
- **Live dashboards**: Streaming metrics, monitoring data
- **Activity feeds**: Real-time updates to feeds or timelines
- **Progress tracking**: Long-running operation status updates
- **One-way communication**: Server needs to push to client only

### Use WebSocket Instead When:

- **Bi-directional communication needed**: Client sends frequent messages to server
- **Binary data**: Streaming video, audio, or binary protocols
- **Custom protocols**: Need full control over message format

### Use REST/GraphQL Instead When:

- **Request-response pattern**: Client initiates all interactions
- **Infrequent updates**: Polling is acceptable
- **No real-time requirements**: Data freshness not critical

## SSE Endpoint

### Connection URL

```
GET /api/events
```

### Authentication

SSE connections **require authentication**. Include JWT token in request:

**Query Parameter (recommended):**
```
GET /api/events?token=YOUR_JWT_TOKEN
```

**Authorization Header:**
```
GET /api/events
Authorization: Bearer YOUR_JWT_TOKEN
```

### Event Filtering

Subscribe to specific event types using the `events` query parameter:

```
GET /api/events?events=UserCreated,UserUpdated,OrderPlaced
```

**Important**: Users only receive events they have permission to view. The API Gateway filters events based on the user's permissions.

## Event Format

SSE events follow the standard Server-Sent Events format:

```
event: UserCreated
id: UserCreated-1700000000000
data: {"userId":"123","email":"user@example.com","createdAt":"2024-11-15T10:00:00Z"}

event: OrderPlaced
id: OrderPlaced-1700000000001
data: {"orderId":"456","userId":"123","total":99.99}
```

### Event Structure

Each event contains:

- **event**: Event type name (e.g., `UserCreated`, `OrderPlaced`)
- **id**: Unique event ID for client-side tracking and resume
- **data**: JSON payload with event data

### Special Events

**Connection Established:**
```
event: connected
data: {"connectionId":"uuid","timestamp":"2024-11-15T10:00:00Z"}
```

**Heartbeat (comment lines):**
```
: heartbeat 2024-11-15T10:00:00Z
```

**Connection Closing:**
```
event: close
data: {"reason":"Server shutting down"}
```

## Client Examples

### JavaScript (Browser)

```javascript
// Create EventSource connection
const token = 'YOUR_JWT_TOKEN';
const eventSource = new EventSource(
  `/api/events?token=${token}&events=UserCreated,OrderPlaced`
);

// Handle connection open
eventSource.addEventListener('open', () => {
  console.log('SSE connection established');
});

// Handle specific event types
eventSource.addEventListener('UserCreated', (event) => {
  const data = JSON.parse(event.data);
  console.log('New user created:', data);
  updateUserList(data);
});

eventSource.addEventListener('OrderPlaced', (event) => {
  const data = JSON.parse(event.data);
  console.log('New order placed:', data);
  updateOrderDashboard(data);
});

// Handle all events (fallback)
eventSource.onmessage = (event) => {
  console.log('Received event:', event);
};

// Handle errors and reconnection
eventSource.onerror = (error) => {
  console.error('SSE error:', error);

  // EventSource automatically attempts to reconnect
  if (eventSource.readyState === EventSource.CLOSED) {
    console.log('Connection closed, manual reconnection may be needed');
  }
};

// Close connection when done
function cleanup() {
  eventSource.close();
}
```

### Python

```python
import requests
import json

def stream_events(token, event_types=None):
    """
    Stream events from API Gateway using SSE.

    Args:
        token: JWT authentication token
        event_types: Optional list of event types to filter
    """
    url = 'http://localhost:3003/api/events'
    params = {'token': token}

    if event_types:
        params['events'] = ','.join(event_types)

    headers = {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
    }

    try:
        with requests.get(url, params=params, headers=headers, stream=True) as response:
            response.raise_for_status()

            # Process SSE stream
            for line in response.iter_lines(decode_unicode=True):
                if not line:
                    continue

                # Parse SSE format
                if line.startswith('event:'):
                    event_type = line[6:].strip()
                elif line.startswith('data:'):
                    data = json.loads(line[5:].strip())
                    handle_event(event_type, data)
                elif line.startswith('id:'):
                    event_id = line[3:].strip()
                elif line.startswith(':'):
                    # Heartbeat comment - ignore
                    pass

    except requests.exceptions.RequestException as e:
        print(f"SSE connection error: {e}")

def handle_event(event_type, data):
    """Handle received event."""
    print(f"Event: {event_type}")
    print(f"Data: {data}")

    if event_type == 'UserCreated':
        print(f"New user: {data.get('email')}")
    elif event_type == 'OrderPlaced':
        print(f"New order: {data.get('orderId')}")

# Usage
if __name__ == '__main__':
    token = 'YOUR_JWT_TOKEN'
    stream_events(token, event_types=['UserCreated', 'OrderPlaced'])
```

### Node.js

```javascript
import { EventSource } from 'eventsource';

const token = 'YOUR_JWT_TOKEN';
const eventTypes = ['UserCreated', 'OrderPlaced'];

const url = `http://localhost:3003/api/events?token=${token}&events=${eventTypes.join(',')}`;

const eventSource = new EventSource(url);

eventSource.addEventListener('UserCreated', (event) => {
  const data = JSON.parse(event.data);
  console.log('New user:', data);
});

eventSource.addEventListener('OrderPlaced', (event) => {
  const data = JSON.parse(event.data);
  console.log('New order:', data);
});

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
};

// Graceful shutdown
process.on('SIGINT', () => {
  eventSource.close();
  process.exit(0);
});
```

### curl (Testing)

```bash
# Basic connection
curl -N -H "Accept: text/event-stream" \
  "http://localhost:3003/api/events?token=YOUR_JWT_TOKEN"

# With event filtering
curl -N -H "Accept: text/event-stream" \
  "http://localhost:3003/api/events?token=YOUR_JWT_TOKEN&events=UserCreated,OrderPlaced"

# With authorization header
curl -N -H "Accept: text/event-stream" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3003/api/events"
```

## Error Handling

### Authentication Errors

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required for SSE connection"
}
```

**Solution**: Include valid JWT token in request.

### Permission Errors

**403 Forbidden:**
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions for requested event types",
  "deniedEvents": ["AdminEvent", "SystemEvent"]
}
```

**Solution**: User lacks permissions for requested event types. Subscribe to allowed events only.

### Connection Limit Errors

**503 Service Unavailable:**
```json
{
  "error": "Service Unavailable",
  "message": "Connection limit exceeded. Please close existing connections."
}
```

**Solution**: Each user can have up to 5 concurrent SSE connections (default). Close unused connections.

### Network Errors

SSE connections may fail due to:
- Network interruptions
- Proxy timeouts
- Server restarts

**Browser clients**: EventSource automatically reconnects using exponential backoff.

**Custom clients**: Implement reconnection logic with the `Last-Event-ID` header:

```javascript
// Browser automatically includes Last-Event-ID on reconnect
// Manual implementation:
const lastEventId = localStorage.getItem('lastEventId');
const eventSource = new EventSource(url, {
  headers: {
    'Last-Event-ID': lastEventId
  }
});

eventSource.addEventListener('message', (event) => {
  if (event.lastEventId) {
    localStorage.setItem('lastEventId', event.lastEventId);
  }
});
```

## Reconnection Strategy

### Browser Automatic Reconnection

Browsers automatically reconnect EventSource connections with exponential backoff:

1. Initial reconnection after 1 second
2. Exponential backoff: 2s, 4s, 8s, 16s...
3. Maximum backoff: typically 30 seconds

### Custom Reconnection Logic

```javascript
class ResilientEventSource {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.reconnectDelay = 1000; // Start at 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.connect();
  }

  connect() {
    this.eventSource = new EventSource(this.url);

    this.eventSource.onopen = () => {
      console.log('Connected');
      this.reconnectDelay = 1000; // Reset on successful connection
    };

    this.eventSource.onerror = (error) => {
      console.error('Connection error:', error);

      if (this.eventSource.readyState === EventSource.CLOSED) {
        this.reconnect();
      }
    };
  }

  reconnect() {
    console.log(`Reconnecting in ${this.reconnectDelay}ms...`);

    setTimeout(() => {
      this.connect();

      // Exponential backoff
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay
      );
    }, this.reconnectDelay);
  }

  close() {
    this.eventSource?.close();
  }
}
```

## Connection Lifecycle

### Connection Limits

- **Per user**: 5 concurrent connections (default)
- **Total system**: Configurable based on infrastructure

### Heartbeat Mechanism

Server sends heartbeat comments every 30 seconds to keep connections alive:

```
: heartbeat 2024-11-15T10:00:00Z
```

Clients receive heartbeats but don't trigger `onmessage` events.

### Idle Timeout

Connections idle for more than 10 minutes are automatically closed:

```
event: close
data: {"reason":"Connection idle timeout"}
```

### Graceful Shutdown

On server shutdown, all connections receive close event:

```
event: close
data: {"reason":"Server shutting down"}
```

Clients should implement reconnection logic to handle shutdowns.

## Performance Considerations

### Connection Overhead

Each SSE connection maintains:
- HTTP connection (1 TCP socket)
- Memory for buffers
- Event subscription overhead

**Best Practice**: Limit concurrent connections per client.

### Event Throughput

SSE is text-based and may have lower throughput than binary protocols:

- **Good for**: Notifications, status updates, metrics (< 100 events/second)
- **Not ideal for**: High-frequency data streams (> 1000 events/second)

### Load Balancing

SSE connections are long-lived. Consider:

- **Sticky sessions**: Route user to same server
- **Session affinity**: Use consistent hashing
- **Connection draining**: Gracefully close on deployment

## Browser Compatibility

### Supported Browsers

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Opera: Full support
- IE: Not supported (use polyfill)

### Polyfill for Older Browsers

```html
<script src="https://cdn.jsdelivr.net/npm/event-source-polyfill@1.0.31/src/eventsource.min.js"></script>
```

## Security Considerations

### Authentication Required

All SSE connections require valid JWT authentication. Connections without authentication are rejected with 401.

### Permission-Based Filtering

Events are filtered based on user permissions:
- Users only receive events they have permission to view
- Event types with required permissions are filtered at the gateway
- Denied events are never sent to unauthorized users

### Token Expiration

JWT tokens expire. Handle token refresh:

```javascript
let currentEventSource;

function connectSSE(token) {
  currentEventSource?.close();
  currentEventSource = new EventSource(`/api/events?token=${token}`);

  currentEventSource.onerror = async (error) => {
    if (error.target.readyState === EventSource.CLOSED) {
      // Try to refresh token and reconnect
      const newToken = await refreshAuthToken();
      connectSSE(newToken);
    }
  };
}
```

### Rate Limiting

API Gateway may implement rate limiting on SSE connections:
- Connection attempts per user
- Event subscription limits
- Bandwidth throttling

## Monitoring and Debugging

### Connection Statistics

API Gateway exposes SSE statistics via internal endpoints:

```json
{
  "connections": {
    "totalConnections": 42,
    "uniqueUsers": 15,
    "connectionsByUser": {
      "user123": 2,
      "user456": 1
    }
  },
  "events": {
    "totalEventTypes": 25,
    "publicEvents": 5,
    "protectedEvents": 20
  }
}
```

### Debug Logging

Enable debug logging to troubleshoot SSE issues:

```javascript
eventSource.addEventListener('open', () => {
  console.log('SSE connected', {
    readyState: eventSource.readyState,
    url: eventSource.url
  });
});

eventSource.addEventListener('error', (error) => {
  console.error('SSE error', {
    readyState: eventSource.readyState,
    error
  });
});

eventSource.addEventListener('message', (event) => {
  console.log('SSE message', {
    type: event.type,
    data: event.data,
    lastEventId: event.lastEventId
  });
});
```

## Best Practices

### 1. Always Handle Errors

```javascript
eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  // Implement recovery logic
};
```

### 2. Close Connections When Done

```javascript
// On component unmount or page unload
window.addEventListener('beforeunload', () => {
  eventSource.close();
});
```

### 3. Filter Events Client-Side

```javascript
eventSource.addEventListener('UserCreated', (event) => {
  const data = JSON.parse(event.data);

  // Filter events relevant to current context
  if (data.organizationId === currentOrganizationId) {
    handleUserCreated(data);
  }
});
```

### 4. Implement Backpressure

```javascript
let eventQueue = [];
let processing = false;

eventSource.addEventListener('message', (event) => {
  eventQueue.push(event);
  processQueue();
});

async function processQueue() {
  if (processing || eventQueue.length === 0) return;

  processing = true;
  while (eventQueue.length > 0) {
    const event = eventQueue.shift();
    await handleEvent(event);
  }
  processing = false;
}
```

### 5. Monitor Connection Health

```javascript
let lastHeartbeat = Date.now();

eventSource.addEventListener('message', () => {
  lastHeartbeat = Date.now();
});

// Check for stale connection
setInterval(() => {
  const timeSinceHeartbeat = Date.now() - lastHeartbeat;
  if (timeSinceHeartbeat > 60000) { // 1 minute
    console.warn('No heartbeat received, connection may be stale');
    eventSource.close();
    reconnect();
  }
}, 10000); // Check every 10 seconds
```

## Comparison with Alternatives

| Feature | SSE | WebSocket | Long Polling |
|---------|-----|-----------|--------------|
| Direction | Server → Client | Bi-directional | Client ↔ Server |
| Protocol | HTTP | WebSocket (WS/WSS) | HTTP |
| Reconnection | Automatic | Manual | Manual |
| Browser Support | Good (no IE) | Excellent | Excellent |
| Complexity | Low | Medium | Low |
| Overhead | Low | Low | High |
| Use Case | Push notifications | Chat, gaming | Fallback only |

## Related Documentation

- [Event-Driven Architecture](../../02-core-concepts/event-driven-architecture.md) - Understanding domain events
- [GraphQL API](./graphql-api.md) - Alternative API for real-time subscriptions
- [REST API](./rest-api.md) - Request-response pattern
- [Authentication](../authentication/overview.md) - JWT authentication setup
- [Authorization](../authorization/overview.md) - Permission-based access control

## Troubleshooting

See [Common SSE Issues](../../05-troubleshooting/common-errors/error-catalog.md#sse-errors) for detailed error resolution.
