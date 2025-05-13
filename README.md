# Redis Extended MCP Server

A Model Context Protocol (MCP) server implementation for Redis, supporting advanced data structures like Hash, Sorted Set, and Set.

## Features

### Basic Operations
- `set`: Set a key-value pair with optional expiration
- `get`: Get value by key
- `delete`: Delete one or more keys
- `list`: List keys matching a pattern

### Hash Operations
- `hset`: Set a field in a hash
- `hget`: Get a field value from a hash
- `hgetall`: Get all fields and values from a hash
- `hdel`: Delete one or more fields from a hash

### Set Operations
- `sadd`: Add members to a set
- `smembers`: Get all members of a set
- `sismember`: Check if a member exists in a set
- `srem`: Remove members from a set

### Sorted Set Operations
- `zadd`: Add members with scores to a sorted set
- `zrange`: Get members from a sorted set by range
- `zrevrange`: Get members from a sorted set in reverse order
- `zrem`: Remove members from a sorted set

## Installation and Usage

### Prerequisites
- Node.js 18 or higher
- Redis server (default: localhost:6379)

### Local Setup
```bash
# Install dependencies
npm install

# Build
npm run build

# Run
npm start [redis-url]
# or
node dist/index.js [redis-url]
```

If no Redis URL is provided, it defaults to `redis://localhost:6379`.

### Docker Setup

```bash
# Build
npm run build
docker build -t redis-mcp-extended .

# Run
docker run -i --rm redis-mcp-extended [redis-url]
```

To connect to a local Redis server from Docker, use `host.docker.internal`:
```bash
docker run -i --rm redis-mcp-extended redis://host.docker.internal:6379
```

## MCP Client Configuration

### Basic Configuration
```json
{
  "mcpServers": {
    "redis": {
      "command": "node",
      "args": [
        "/{absolute-path}/dist/index.js",
        "redis://localhost:6379"
      ]
    }
  }
}
```

### Docker Configuration
```json
{
  "mcpServers": {
    "redis": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "redis-mcp-extended",
        "redis://host.docker.internal:6379"
      ]
    }
  }
}
```

### NPX Configuration (if published to npm)
```json
{
  "mcpServers": {
    "redis": {
      "command": "npx",
      "args": [
        "-y",
        "redis-mcp-extended",
        "redis://localhost:6379"
      ]
    }
  }
}
```

## Error Handling

The server includes comprehensive error handling for:
- Redis connection failures
- Invalid command formats
- Non-existent key access
- Permission issues

When errors occur, the server implements a retry mechanism with exponential backoff, up to a maximum of 5 retries.

## Implementation Details

- Built with Model Context Protocol SDK 1.7.0
- Written in TypeScript
- Uses ES Modules
- Communicates with MCP clients via StdioServerTransport

## License

MIT