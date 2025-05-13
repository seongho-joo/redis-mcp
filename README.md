# Redis Extended MCP Server

A Model Context Protocol server that provides extended access to Redis databases, including support for Hash, Set, and Sorted Set data structures.

## Features

### Basic Operations
- `set`: Set a key-value pair with optional expiration
- `get`: Get value by key
- `delete`: Delete one or more keys
- `list`: List keys matching a pattern

### Hash Operations
- `hset`: Set a field in a hash
- `hget`: Get a field from a hash
- `hgetall`: Get all fields and values from a hash
- `hdel`: Delete one or more fields from a hash

### Set Operations
- `sadd`: Add one or more members to a set
- `srem`: Remove one or more members from a set
- `smembers`: Get all members of a set

### Sorted Set Operations
- `zadd`: Add one or more members to a sorted set with scores
- `zrange`: Get members from a sorted set by range
- `zrem`: Remove one or more members from a sorted set

## Prerequisites

1. Redis server must be installed and running
   - [Download Redis](https://redis.io/download)
   - For Windows users: Use [Windows Subsystem for Linux (WSL)](https://redis.io/docs/getting-started/installation/install-redis-on-windows/) or [Memurai](https://www.memurai.com/)
   - Default port: 6379

## Installation

```bash
npm install
npm run build
```

## Usage

### Running the Server

```bash
npm start [redis-url]
```

If no Redis URL is provided, it defaults to `redis://localhost:6379`.

### VS Code Integration

Add the following to your VS Code settings:

```json
{
  "mcp": {
    "inputs": [
      {
        "type": "promptString",
        "id": "redis_url",
        "description": "Redis URL (e.g. redis://localhost:6379)"
      }
    ],
    "servers": {
      "redis": {
        "command": "npx",
        "args": ["-y", "redis-mcp-extended"],
        "env": {
          "REDIS_URL": "${input:redis_url}"
        }
      }
    }
  }
}
```

### Docker Support

```json
{
  "mcp": {
    "inputs": [
      {
        "type": "promptString",
        "id": "redis_url",
        "description": "Redis URL (e.g. redis://host.docker.internal:6379)"
      }
    ],
    "servers": {
      "redis": {
        "command": "docker",
        "args": ["run", "-i", "--rm", "redis-mcp-extended"],
        "env": {
          "REDIS_URL": "${input:redis_url}"
        }
      }
    }
  }
}
```

## Error Handling

The server implements exponential backoff with a maximum of 5 retries:
- Initial retry delay: 1 second
- Maximum delay: 30 seconds
- Server will exit after max retries to prevent infinite reconnection loops

## License

MIT License