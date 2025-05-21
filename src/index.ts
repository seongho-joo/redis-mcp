#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { createClient } from 'redis';

// Configuration
const REDIS_URL = process.argv[2] || "redis://localhost:6379";
const MAX_RETRIES = 5;
const MIN_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds

// Create Redis client with retry strategy
const redisClient = createClient({
    url: REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries >= MAX_RETRIES) {
                console.error(`[Redis Error] Maximum retries (${MAX_RETRIES}) reached. Giving up.`);
                console.error(`[Redis Error] Connection: ${REDIS_URL}`);
                return new Error('Max retries reached');
            }
            const delay = Math.min(Math.pow(2, retries) * MIN_RETRY_DELAY, MAX_RETRY_DELAY);
            console.error(`[Redis Retry] Attempt ${retries + 1}/${MAX_RETRIES} failed`);
            console.error(`[Redis Retry] Next attempt in ${delay}ms`);
            console.error(`[Redis Retry] Connection: ${REDIS_URL}`);
            return delay;
        }
    }
});

// Define Zod schemas for validation
const SetArgumentsSchema = z.object({
    key: z.string(),
    value: z.string(),
    expireSeconds: z.number().optional(),
});

const GetArgumentsSchema = z.object({
    key: z.string(),
});

const DeleteArgumentsSchema = z.object({
    key: z.string().or(z.array(z.string())),
});

const ListArgumentsSchema = z.object({
    pattern: z.string().default("*"),
});

// Hash schemas
const HashSetArgumentsSchema = z.object({
    key: z.string(),
    field: z.string(),
    value: z.string(),
});

const HashGetArgumentsSchema = z.object({
    key: z.string(),
    field: z.string(),
});

const HashGetAllArgumentsSchema = z.object({
    key: z.string(),
});

const HashDeleteArgumentsSchema = z.object({
    key: z.string(),
    fields: z.array(z.string()),
});

// Set schemas
const SetAddArgumentsSchema = z.object({
    key: z.string(),
    members: z.array(z.string()),
});

const SetRemoveArgumentsSchema = z.object({
    key: z.string(),
    members: z.array(z.string()),
});

const SetMembersArgumentsSchema = z.object({
    key: z.string(),
});

// Sorted Set schemas
const ZSetAddArgumentsSchema = z.object({
    key: z.string(),
    members: z.array(z.object({
        score: z.number(),
        member: z.string(),
    })),
});

const ZSetRangeArgumentsSchema = z.object({
    key: z.string(),
    start: z.number(),
    stop: z.number(),
    withScores: z.boolean().optional(),
});

const ZSetRemoveArgumentsSchema = z.object({
    key: z.string(),
    members: z.array(z.string()),
});

// JSON schemas
const JsonSetArgumentsSchema = z.object({
    key: z.string(),
    value: z.any(),
    expireSeconds: z.number().optional(),
});

const JsonGetArgumentsSchema = z.object({
    key: z.string(),
});

// Create server instance
const server = new Server(
    {
        name: "redis-extended",
        version: "1.0.0"
    },
    {
        capabilities: {
            tools: {}
        }
    }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            // Basic operations
            {
                name: "set",
                description: "Set a Redis key-value pair with optional expiration",
                inputSchema: {
                    type: "object",
                    properties: {
                        key: { type: "string", description: "Redis key" },
                        value: { type: "string", description: "Value to store" },
                        expireSeconds: { type: "number", description: "Optional expiration time in seconds" },
                    },
                    required: ["key", "value"],
                },
            },
            {
                name: "get",
                description: "Get value by key from Redis",
                inputSchema: {
                    type: "object",
                    properties: {
                        key: { type: "string", description: "Redis key to retrieve" },
                    },
                    required: ["key"],
                },
            },
            {
                name: "delete",
                description: "Delete one or more keys from Redis",
                inputSchema: {
                    type: "object",
                    properties: {
                        key: {
                            oneOf: [
                                { type: "string" },
                                { type: "array", items: { type: "string" } }
                            ],
                            description: "Key or array of keys to delete",
                        },
                    },
                    required: ["key"],
                },
            },
            {
                name: "list",
                description: "List Redis keys matching a pattern",
                inputSchema: {
                    type: "object",
                    properties: {
                        pattern: { type: "string", description: "Pattern to match keys (default: *)" },
                    },
                },
            },
            // Hash operations
            {
                name: "hset",
                description: "Set a field in a Redis hash",
                inputSchema: {
                    type: "object",
                    properties: {
                        key: { type: "string", description: "Hash key" },
                        field: { type: "string", description: "Field name" },
                        value: { type: "string", description: "Field value" },
                    },
                    required: ["key", "field", "value"],
                },
            },
            {
                name: "hget",
                description: "Get a field from a Redis hash",
                inputSchema: {
                    type: "object",
                    properties: {
                        key: { type: "string", description: "Hash key" },
                        field: { type: "string", description: "Field name" },
                    },
                    required: ["key", "field"],
                },
            },
            {
                name: "hgetall",
                description: "Get all fields and values from a Redis hash",
                inputSchema: {
                    type: "object",
                    properties: {
                        key: { type: "string", description: "Hash key" },
                    },
                    required: ["key"],
                },
            },
            {
                name: "hdel",
                description: "Delete one or more fields from a Redis hash",
                inputSchema: {
                    type: "object",
                    properties: {
                        key: { type: "string", description: "Hash key" },
                        fields: { type: "array", items: { type: "string" }, description: "Fields to delete" },
                    },
                    required: ["key", "fields"],
                },
            },
            // Set operations
            {
                name: "sadd",
                description: "Add one or more members to a Redis set",
                inputSchema: {
                    type: "object",
                    properties: {
                        key: { type: "string", description: "Set key" },
                        members: { type: "array", items: { type: "string" }, description: "Members to add" },
                    },
                    required: ["key", "members"],
                },
            },
            {
                name: "srem",
                description: "Remove one or more members from a Redis set",
                inputSchema: {
                    type: "object",
                    properties: {
                        key: { type: "string", description: "Set key" },
                        members: { type: "array", items: { type: "string" }, description: "Members to remove" },
                    },
                    required: ["key", "members"],
                },
            },
            {
                name: "smembers",
                description: "Get all members of a Redis set",
                inputSchema: {
                    type: "object",
                    properties: {
                        key: { type: "string", description: "Set key" },
                    },
                    required: ["key"],
                },
            },
            // Sorted Set operations
            {
                name: "zadd",
                description: "Add one or more members to a Redis sorted set",
                inputSchema: {
                    type: "object",
                    properties: {
                        key: { type: "string", description: "Sorted set key" },
                        members: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    score: { type: "number", description: "Member score" },
                                    member: { type: "string", description: "Member value" },
                                },
                                required: ["score", "member"],
                            },
                            description: "Members to add with their scores",
                        },
                    },
                    required: ["key", "members"],
                },
            },
            {
                name: "zrange",
                description: "Get members from a Redis sorted set by range",
                inputSchema: {
                    type: "object",
                    properties: {
                        key: { type: "string", description: "Sorted set key" },
                        start: { type: "number", description: "Start index" },
                        stop: { type: "number", description: "Stop index" },
                        withScores: { type: "boolean", description: "Include scores in output" },
                    },
                    required: ["key", "start", "stop"],
                },
            },
            {
                name: "zrem",
                description: "Remove one or more members from a Redis sorted set",
                inputSchema: {
                    type: "object",
                    properties: {
                        key: { type: "string", description: "Sorted set key" },
                        members: { type: "array", items: { type: "string" }, description: "Members to remove" },
                    },
                    required: ["key", "members"],
                },
            },
            // JSON operations
            {
                name: "json_set",
                description: "Store a JSON value in Redis",
                inputSchema: {
                    type: "object",
                    properties: {
                        key: { type: "string", description: "Redis key" },
                        value: { type: "object", description: "JSON value to store" },
                        expireSeconds: { type: "number", description: "Optional expiration time in seconds" },
                    },
                    required: ["key", "value"],
                },
            },
            {
                name: "json_get",
                description: "Get JSON value by key from Redis",
                inputSchema: {
                    type: "object",
                    properties: {
                        key: { type: "string", description: "Redis key to retrieve" },
                    },
                    required: ["key"],
                },
            },
        ],
    };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        // Basic operations
        if (name === "set") {
            const { key, value, expireSeconds } = SetArgumentsSchema.parse(args);
            if (expireSeconds) {
                await redisClient.setEx(key, expireSeconds, value);
            } else {
                await redisClient.set(key, value);
            }
            return {
                content: [{ type: "text", text: `Successfully set key: ${key}` }],
            };
        } else if (name === "get") {
            const { key } = GetArgumentsSchema.parse(args);
            const value = await redisClient.get(key);
            return {
                content: [{ type: "text", text: value === null ? `Key not found: ${key}` : value }],
            };
        } else if (name === "delete") {
            const { key } = DeleteArgumentsSchema.parse(args);
            if (Array.isArray(key)) {
                await redisClient.del(key);
                return {
                    content: [{ type: "text", text: `Successfully deleted ${key.length} keys` }],
                };
            } else {
                await redisClient.del(key);
                return {
                    content: [{ type: "text", text: `Successfully deleted key: ${key}` }],
                };
            }
        } else if (name === "list") {
            const { pattern } = ListArgumentsSchema.parse(args);
            const keys = await redisClient.keys(pattern);
            return {
                content: [{
                    type: "text",
                    text: keys.length > 0 ? `Found keys:\n${keys.join('\n')}` : "No keys found matching pattern",
                }],
            };
        }
        // Hash operations
        else if (name === "hset") {
            const { key, field, value } = HashSetArgumentsSchema.parse(args);
            await redisClient.hSet(key, field, value);
            return {
                content: [{ type: "text", text: `Successfully set field ${field} in hash ${key}` }],
            };
        } else if (name === "hget") {
            const { key, field } = HashGetArgumentsSchema.parse(args);
            const value = await redisClient.hGet(key, field);
            return {
                content: [{ type: "text", text: value === null ? `Field not found: ${field}` : value }],
            };
        } else if (name === "hgetall") {
            const { key } = HashGetAllArgumentsSchema.parse(args);
            const hash = await redisClient.hGetAll(key);
            return {
                content: [{
                    type: "text",
                    text: Object.keys(hash).length > 0
                        ? `Hash contents:\n${Object.entries(hash).map(([k, v]) => `${k}: ${v}`).join('\n')}`
                        : "Hash is empty",
                }],
            };
        } else if (name === "hdel") {
            const { key, fields } = HashDeleteArgumentsSchema.parse(args);
            await redisClient.hDel(key, fields);
            return {
                content: [{ type: "text", text: `Successfully deleted ${fields.length} fields from hash ${key}` }],
            };
        }
        // Set operations
        else if (name === "sadd") {
            const { key, members } = SetAddArgumentsSchema.parse(args);
            await redisClient.sAdd(key, members);
            return {
                content: [{ type: "text", text: `Successfully added ${members.length} members to set ${key}` }],
            };
        } else if (name === "srem") {
            const { key, members } = SetRemoveArgumentsSchema.parse(args);
            await redisClient.sRem(key, members);
            return {
                content: [{ type: "text", text: `Successfully removed ${members.length} members from set ${key}` }],
            };
        } else if (name === "smembers") {
            const { key } = SetMembersArgumentsSchema.parse(args);
            const members = await redisClient.sMembers(key);
            return {
                content: [{
                    type: "text",
                    text: members.length > 0
                        ? `Set members:\n${members.join('\n')}`
                        : "Set is empty",
                }],
            };
        }
        // Sorted Set operations
        else if (name === "zadd") {
            const { key, members } = ZSetAddArgumentsSchema.parse(args);
            const scoreMembers = members.map(m => ({ score: m.score, value: m.member }));
            await redisClient.zAdd(key, scoreMembers);
            return {
                content: [{ type: "text", text: `Successfully added ${members.length} members to sorted set ${key}` }],
            };
        } else if (name === "zrange") {
            const { key, start, stop, withScores } = ZSetRangeArgumentsSchema.parse(args);
            
            let options = {};
            if (withScores) {
                options = { WITHSCORES: true };
            }
            
            const members = await redisClient.zRange(key, start, stop, options);
            
            return {
                content: [{
                    type: "text",
                    text: members.length > 0
                        ? `Sorted set members:\n${withScores
                            ? members.map((m, i) => i % 2 === 0 ? `${m} (score: ${members[i + 1]})` : null).filter(Boolean).join('\n')
                            : members.join('\n')}`
                        : "No members found in range",
                }],
            };
        } else if (name === "zrem") {
            const { key, members } = ZSetRemoveArgumentsSchema.parse(args);
            await redisClient.zRem(key, members);
            return {
                content: [{ type: "text", text: `Successfully removed ${members.length} members from sorted set ${key}` }],
            };
        }
        // JSON operations
        else if (name === "json_set") {
            const { key, value, expireSeconds } = JsonSetArgumentsSchema.parse(args);
            await redisClient.json.set(key, '$', value);
            if (expireSeconds) {
                await redisClient.expire(key, expireSeconds);
            }
            return {
                content: [{ type: "text", text: `Successfully set JSON for key: ${key}` }],
            };
        } else if (name === "json_get") {
            const { key } = JsonGetArgumentsSchema.parse(args);
            const value = await redisClient.json.get(key);
            if (value === null) {
                return {
                    content: [{ type: "text", text: `Key not found: ${key}` }],
                };
            }
            return {
                content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
            };
        } else {
            throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(
                `Invalid arguments: ${error.errors
                    .map((e) => `${e.path.join(".")}: ${e.message}`)
                    .join(", ")}`
            );
        }
        throw error;
    }
});

// Set up Redis event handlers
redisClient.on('error', (err: Error) => {
    console.error(`[Redis Error] ${err.name}: ${err.message}`);
    console.error(`[Redis Error] Connection: ${REDIS_URL}`);
    console.error(`[Redis Error] Stack: ${err.stack}`);
});

redisClient.on('connect', () => {
    console.error(`[Redis Connected] Successfully connected to ${REDIS_URL}`);
});

// Start the server
async function runServer() {
    try {
        // Connect to Redis
        await redisClient.connect();

        // Set up MCP server
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Redis MCP Server running on stdio");
    } catch (error) {
        const err = error as Error;
        console.error("[Redis Fatal] Server initialization failed");
        console.error(`[Redis Fatal] Error: ${err.name}: ${err.message}`);
        console.error(`[Redis Fatal] Connection: ${REDIS_URL}`);
        console.error(`[Redis Fatal] Stack: ${err.stack}`);
        await redisClient.quit().catch(() => {});
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    await redisClient.quit().catch(() => {});
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await redisClient.quit().catch(() => {});
    process.exit(0);
});

runServer(); 