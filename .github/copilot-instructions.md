# Copilot Instructions

This document provides essential guidance for AI agents to effectively contribute to the `waelio-messaging` codebase.

## Architecture Overview

The core of this project is a real-time messaging system built with Node.js, Express, and the `ws` WebSocket library.

- **Entry Point**: The application starts in `server.ts`. This file sets up an Express server and instantiates the `MessagingHub`.
- **Core Logic**: All WebSocket communication, client management, and message handling logic is encapsulated within the `MessagingHub` class in `MessagingHub.ts`.
- **Persistence**: The system has a dual persistence model.
  - If a `mongoURI` is provided during `MessagingHub` instantiation, it will connect to a MongoDB database and persist messages.
  - If no `mongoURI` is provided, it falls back to an **in-memory store** that mimics the MongoDB collection interface. This is a key pattern to understand when working with message history. See the `_setupInMemoryStore` method in `MessagingHub.ts`.

## Developer Workflows

### Running the Application

- **Development**: To run the server with live-reloading via `ts-node`, use:
  ```bash
  npm run dev
  ```
- **Production**: To build the project and run the compiled JavaScript output, use:
  ```bash
  npm run build
  npm start
  ```

### Testing

The project uses `mocha` and `chai` for testing. To run all tests, use:

```bash
npm test
```

There are two main test files:

- `MessagingHub.test.ts`: Contains unit tests for the `MessagingHub` class. It programmatically creates and tears down a server for each test.
- `server.test.ts`: Contains integration-style tests that require the main server to be running separately.

### WebSocket Protocol

Communication is handled via a simple JSON-based protocol. All messages have a `type` property. Refer to the `_handleClientMessage` method in `MessagingHub.ts` for implementation details.

- **Client -> Server**: `route` (direct message), `broadcast`, `get-history`.
- **Server -> Client**: `register-success`, `user-list`, `message`, `message-history`, `error`.

When adding new features, adhere to this protocol by adding new message types or extending existing payloads.
