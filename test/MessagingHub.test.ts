import 'mocha';
import { expect } from 'chai';
import http from 'http';
import { AddressInfo } from 'net';
import { MessagingHub } from '../src/MessagingHub.js';
import { WebSocket } from 'ws';

describe('MessagingHub', () => {
    let server: http.Server;
    let hub: MessagingHub;
    let port: number;

    // Start a new server and hub before each test
    beforeEach(async () => {
        server = http.createServer();
        await new Promise<void>(resolve => server.listen(0, resolve)); // 0 means listen on a random, free port
        port = (server.address() as AddressInfo).port;
        hub = new MessagingHub(server);
        await hub.ready; // Wait for the hub to be fully initialized
    });

    // Shut down the server and hub after each test
    afterEach(async () => {
        if (hub) {
            await hub.shutdown();
        }
        if (server && server.listening) {
            await new Promise<void>(resolve => server.close(() => resolve()));
        }
    });

    it('should be created without errors', () => {
        expect(hub).to.be.an.instanceOf(MessagingHub);
    });

    it('should accept a new client connection and assign an ID', (done) => {
        const client = new WebSocket(`ws://localhost:${port}`);
        let receivedRegisterSuccess = false;

        client.on('message', (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === 'register-success') {
                expect(message.id).to.be.a('string');
                receivedRegisterSuccess = true;
            } else if (message.type === 'user-list' && receivedRegisterSuccess) {
                client.close();
                done();
            }
        });

        client.on('error', done);
    });
});