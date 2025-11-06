import { expect } from 'chai';
import { WebSocket } from 'ws';
import { exec, spawn, ChildProcess, ChildProcessWithoutNullStreams } from 'child_process';
import 'dotenv/config';
import { MongoClient } from 'mongodb';

// The server is expected to be running on localhost:8080 for these tests.
const wsUrl = 'ws://localhost:8080';
const runIntegration = process.env.RUN_INTEGRATION === 'true';

(runIntegration ? describe : describe.skip)('Messaging Server', () => {
    let serverProcess: ChildProcess;

    // Before all tests, start the server
    before(function (done) {
        this.timeout(10000);
        console.log('Starting server for tests...');
        let started = false;
        // Prefer spawning node directly to get deterministic output
        serverProcess = spawn('node', ['dist/server.js']) as unknown as ChildProcessWithoutNullStreams;

        (serverProcess as ChildProcessWithoutNullStreams).stdout.on('data', (chunk) => {
            const msg = chunk.toString();
            process.stdout.write(msg);
            if (!started && msg.includes('[Server] HTTP and WebSocket server started')) {
                started = true;
                done();
            }
        });
        (serverProcess as ChildProcessWithoutNullStreams).stderr.on('data', (chunk) => process.stderr.write(chunk.toString()));
        serverProcess.on('error', (err) => {
            if (!started) done(err);
        });
        serverProcess.on('exit', (code) => {
            if (!started) done(new Error(`Server exited early with code ${code}`));
        });
        // Fallback timeout
        setTimeout(() => {
            if (!started) done(new Error('Server did not start in time'));
        }, 9000);
    });

    // After all tests, stop the server
    after(() => {
        console.log('Stopping server...');
        if (serverProcess) {
            serverProcess.kill('SIGINT');
        }
    });

    it('should allow a client to connect and receive a registration success message', (done) => {
        const ws = new WebSocket(wsUrl);
        let receivedRegisterSuccess = false;

        ws.on('message', (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === 'register-success') {
                expect(message.id).to.be.a('string');
                receivedRegisterSuccess = true;
            } else if (message.type === 'user-list' && receivedRegisterSuccess) {
                ws.close();
                done();
            }
        });

        ws.on('error', done);
    });

    it('should connect to MongoDB if MONGO_URI is set', function (done) {
        this.timeout(6000);
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            // Skip if no MongoDB configured
            this.skip();
            return;
        }
        const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 2000 });
        client.connect()
            .then(() => client.close())
            .then(() => done())
            .catch((err) => done(err));
    });
});