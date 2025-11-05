// public/app.js

document.addEventListener('DOMContentLoaded', () => {
    const connectBtn = document.getElementById('connectBtn');
    const statusSpan = document.getElementById('status');
    const destinationIdInput = document.getElementById('destinationId');
    const messageTextInput = document.getElementById('messageText');
    const sendBtn = document.getElementById('sendBtn');
    const broadcastBtn = document.getElementById('broadcastBtn');
    const logDiv = document.getElementById('log');
    const userList = document.getElementById('userList');

    let clientId = null; // Will be set by the server
    let ws = null;

    function logMessage(message, type = 'info') {
        const p = document.createElement('p');
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        p.className = `log-${type}`; // Use a prefix to avoid conflicts
        logDiv.appendChild(p);
        logDiv.scrollTop = logDiv.scrollHeight; // Auto-scroll
    }

    connectBtn.addEventListener('click', () => {
        if (ws) {
            ws.close();
            return; // Exit after requesting disconnection
        }

        logMessage('Connecting to server...', 'status');
        // Determine WebSocket protocol (ws or wss)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            statusSpan.textContent = 'Connected. Waiting for registration...';
            connectBtn.textContent = 'Disconnect';
            logMessage('Connection opened. Waiting for server to assign ID...');
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                switch (message.type) {
                    case 'register-success':
                        clientId = message.id;
                        statusSpan.textContent = `Registered as '${clientId}'`;
                        sendBtn.disabled = false;
                        broadcastBtn.disabled = false;
                        logMessage(`Successfully registered with ID: ${clientId}`, 'status');
                        break;
                    case 'user-list':
                        userList.innerHTML = ''; // Clear the list
                        message.users.forEach(user => {
                            const li = document.createElement('li');
                            li.textContent = user;
                            if (user === clientId) {
                                li.textContent += ' (You)';
                                li.className = 'me';
                            }
                            userList.appendChild(li);
                        });
                        break;
                    default:
                        logMessage(`Received: ${JSON.stringify(message)}`, 'received');
                }
            } catch (error) {
                logMessage(`Error parsing server message: ${event.data}`, 'error');
            }
        };

        ws.onclose = () => {
            statusSpan.textContent = 'Disconnected';
            connectBtn.textContent = 'Connect';
            sendBtn.disabled = true;
            broadcastBtn.disabled = true;
            ws = null;
            clientId = null;
            userList.innerHTML = ''; // Clear user list on disconnect
            logMessage('Connection closed.', 'status');
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            logMessage('WebSocket error occurred. See console for details.', 'error');
        };
    });

    sendBtn.addEventListener('click', () => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            alert('Not connected to the server.');
            return;
        }

        const destinationId = destinationIdInput.value.trim();
        const messageText = messageTextInput.value.trim();

        if (!destinationId || !messageText) {
            alert('Please provide a destination ID and a message.');
            return;
        }

        const message = {
            type: 'route',
            to: destinationId,
            payload: {
                text: messageText,
                timestamp: new Date().toISOString()
            }
        };

        ws.send(JSON.stringify(message));
        logMessage(`Sent to '${destinationId}': ${messageText}`, 'sent');
        messageTextInput.value = ''; // Clear input after sending
    });

    broadcastBtn.addEventListener('click', () => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            alert('Not connected to the server.');
            return;
        }

        const messageText = messageTextInput.value.trim();

        if (!messageText) {
            alert('Please provide a message to broadcast.');
            return;
        }

        const message = {
            type: 'broadcast',
            payload: {
                text: messageText,
                timestamp: new Date().toISOString()
            }
        };

        ws.send(JSON.stringify(message));
        logMessage(`Broadcasted: ${messageText}`, 'sent');
        messageTextInput.value = ''; // Clear input after sending
    });
});