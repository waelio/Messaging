# Real-Time Messaging System

A real-time messaging application built with Node.js, Express, and WebSockets (`ws`). It works out-of-the-box with in-memory message storage and can be optionally connected to a MongoDB database for persistent history.

## Features

- **Real-Time Communication**: Uses WebSockets for low-latency, bidirectional communication between clients and the server.
- **Secure Client Identification**: The server assigns a unique ID (`uuid`) to each client upon connection to prevent impersonation.
- **Direct Messaging**: Clients can send private messages to other specific clients.
- **Broadcast Messaging**: Clients can broadcast messages to all other connected clients.
- **Optional Message Persistence**: Connect to a MongoDB database to enable long-term message storage.
- **Message History**: Clients can request their message history, which includes messages they've sent, received, and all broadcast messages.
- **Live User List**: All clients receive an updated list of connected users whenever a user connects or disconnects.

## Prerequisites

- Node.js (v16 or newer) and npm.

## Quick Start

1.  **Clone and enter the project:**

    ```bash
    git clone https://github.com/waelio/Messaging.git
    cd Messaging
    ```

2.  **Install dependencies and run:**
    This single command will install all necessary packages and start the server.
    ```bash
    npm start
    ```

That's it! The server is now running, and you only ever need to use `npm start`.

By default, the server runs in a simple **in-memory mode**. It will keep a history of the last 10 messages, but they will be lost when the server restarts.

## Accessing the Client

    Open a web browser and navigate to `http://localhost:8080`.

## Optional: Adding Database Persistence

If you like the application and want to save message history permanently, you can connect it to a MongoDB database.

1.  **Get a Database**: The easiest way is to get a free one from MongoDB Atlas. Follow their steps to create a free cluster, a database user, and get your **connection string**.

2.  **Create a `.env` file**: In the project folder, create a new file named `.env`.

3.  **Add your connection string**: Copy the `MONGO_URI` line from `.env.example` into your new `.env` file and replace the placeholder with your actual connection string.

Now, when you run `npm start`, the server will automatically detect the `.env` file, connect to the database, and store a history of the last 100 messages.

---

## Alternative: Running with Docker

For users comfortable with Docker, this is an alternative way to run the application with a local database.

**Prerequisite:** Ensure Docker Desktop is installed and running.

1.  **Build and start the services:**
    Run the following command to build the Docker images and start the application and database in the background:

    ```bash
    npm run docker:up
    ```

2.  **View Logs (Optional):**
    To see the logs from your running application, use the command:

    ```bash
    docker compose logs -f app
    ```

3.  **Stop the services:**
    To stop and remove the running containers, run:
    ```bash
    npm run docker:down
    ```

### Troubleshooting Docker

- **`sh: docker: command not found` or `sh: docker-compose: command not found`**:
  This error means your terminal cannot find the Docker command.

  1.  **Ensure Docker Desktop is installed and running.** You should see the Docker whale icon in your system's menu bar or system tray.
  2.  If you just installed it, **try closing and reopening your terminal**, or restarting your computer. This helps the system recognize the new command.

- **`Cannot connect to the Docker daemon...`**:
  This error means Docker Desktop is installed but not running. Start the Docker Desktop application and wait for it to initialize.

## WebSocket Message Protocol

The communication between the client and server follows a simple JSON-based protocol. All messages should have a `type` property.

### Client to Server

| Type          | Description                                  | Payload Example                           |
| ------------- | -------------------------------------------- | ----------------------------------------- |
| `route`       | Sends a direct message to another client.    | `{ "to": "user-id", "payload": { ... } }` |
| `broadcast`   | Sends a message to all other clients.        | `{ "payload": { ... } }`                  |
| `get-history` | Requests the message history for the client. | `{}`                                      |

### Server to Client

| Type               | Description                                                             | Payload Example                                |
| ------------------ | ----------------------------------------------------------------------- | ---------------------------------------------- |
| `register-success` | Sent upon successful connection, providing the client's assigned ID.    | `{ "id": "assigned-uuid" }`                    |
| `user-list`        | Sent to all clients when the list of connected users changes.           | `{ "users": ["user-1", "user-2"] }`            |
| `message`          | A direct or broadcast message received from another user.               | `{ "from": "sender-id", "payload": { ... } }`  |
| `message-history`  | Sent in response to `get-history`, contains an array of past messages.  | `{ "history": [{...}, {...}] }`                |
| `info`             | General information from the server (e.g., shutdown notice).            | `{ "message": "Server is shutting down." }`    |
| `error`            | Sent when an error occurs (e.g., invalid message type, user not found). | `{ "message": "Client 'user-id' not found." }` |

---
