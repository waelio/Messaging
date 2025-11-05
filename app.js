// public/app.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const elements = {
        connectBtn: document.getElementById('connectBtn'),
        statusSpan: document.getElementById('status'),
        destinationIdInput: document.getElementById('destinationId'),
        messageTextInput: document.getElementById('messageText'),
        sendBtn: document.getElementById('sendBtn'),
        broadcastBtn: document.getElementById('broadcastBtn'),
        logDiv: document.getElementById('log'),
        userList: document.getElementById('userList'),
        clientIdContainer: document.getElementById('clientIdContainer'),
        clientIdInput: document.getElementById('clientIdInput'),
        copyIdBtn: document.getElementById('copyIdBtn'),
    };

    // --- State ---
    let clientId = null; // Will be set by the server
    let ws = null;

    // --- Helper Functions ---
    function logMessage(message, type = 'info') {
        const p = document.createElement('p');
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        p.className = `log-${type}`; // Use a prefix to avoid conflicts
        elements.logDiv.appendChild(p);
        elements.logDiv.scrollTop = elements.logDiv.scrollHeight; // Auto-scroll
    }

    function updateUIForConnectedState() {
        elements.statusSpan.textContent = `Registered as '${clientId}'`;
        elements.connectBtn.textContent = 'Disconnect';
        elements.sendBtn.disabled = false;
        elements.broadcastBtn.disabled = false;
        elements.clientIdInput.value = clientId;
        elements.clientIdContainer.style.display = 'flex';
    }

    function updateUIForDisconnectedState() {
        elements.statusSpan.textContent = 'Disconnected';
        elements.connectBtn.textContent = 'Connect';
        elements.sendBtn.disabled = true;
        elements.broadcastBtn.disabled = true;
        elements.clientIdContainer.style.display = 'none';
        elements.userList.innerHTML = '';
    }

    function updateUserList(users) {
        elements.userList.innerHTML = ''; // Clear the list
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = user;
            if (user === clientId) {
                li.textContent += ' (You)';
                li.className = 'me';
            }
            elements.userList.appendChild(li);
        });
    }

    // --- WebSocket Logic ---
    function connect() {
        logMessage('Connecting to server...', 'status');
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        ws = new WebSocket(wsUrl);
        setupWebSocketHandlers(ws);
    }

    function disconnect() {
        if (ws) {
            ws.close();
        }
    }

    function setupWebSocketHandlers(wsInstance) {
        ws.onopen = () => {
            elements.statusSpan.textContent = 'Connected. Waiting for registration...';
            logMessage('Connection opened. Waiting for server to assign ID...');
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                switch (message.type) {
                    case 'register-success':
                        clientId = message.id;
                        logMessage(`Successfully registered with ID: ${clientId}`, 'status');
                        updateUIForConnectedState();
                        break;
                    case 'user-list':
                        updateUserList(message.users);
                        break;
                    default:
                        logMessage(`Received: ${JSON.stringify(message)}`, 'received');
                }
            } catch (error) {
                logMessage(`Error parsing server message: ${event.data}`, 'error');
            }
        };

        ws.onclose = () => {
            ws = null; // Clear the instance
            clientId = null; // Clear the ID
            updateUIForDisconnectedState();
            logMessage('Connection closed.', 'status');
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            logMessage('WebSocket error occurred. See console for details.', 'error');
        };
    }

    // --- Event Listeners ---
    function init() {
        elements.connectBtn.addEventListener('click', () => {
            if (ws) {
                disconnect();
            } else {
                connect();
            }
        });

        elements.copyIdBtn.addEventListener('click', () => {
            if (!clientId) return;
            navigator.clipboard.writeText(clientId).then(() => {
                logMessage('Your ID has been copied to the clipboard!', 'status');
            }).catch(err => {
                console.error('Failed to copy ID: ', err);
                logMessage('Failed to copy ID to clipboard.', 'error');
            });
        });

        elements.sendBtn.addEventListener('click', () => {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                alert('Not connected to the server.');
                return;
            }

            const destinationId = elements.destinationIdInput.value.trim();
            const messageText = elements.messageTextInput.value.trim();

            if (!destinationId || !messageText) {
                alert('Please provide a destination ID and a message.');
                return;
            }

            const message = {
                type: 'route',
                to: destinationId,
                payload: { text: messageText, timestamp: new Date().toISOString() }
            };

            ws.send(JSON.stringify(message));
            logMessage(`Sent to '${destinationId}': ${messageText}`, 'sent');
            elements.messageTextInput.value = ''; // Clear input after sending
        });

        elements.broadcastBtn.addEventListener('click', () => {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                alert('Not connected to the server.');
                return;
            }

            const messageText = elements.messageTextInput.value.trim();

            if (!messageText) {
                alert('Please provide a message to broadcast.');
                return;
            }

            const message = {
                type: 'broadcast',
                payload: { text: messageText, timestamp: new Date().toISOString() }
            };

            ws.send(JSON.stringify(message));
            logMessage(`Broadcasted: ${messageText}`, 'sent');
            elements.messageTextInput.value = ''; // Clear input after sending
        });
    }

    // --- Start the application ---
    init();
});