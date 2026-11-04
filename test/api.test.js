import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../server.js';

let server;
let baseUrl;
let mockTargetServer;
let mockTargetUrl;

describe('OmniDL API & Proxy Test Suite', () => {
    before(async () => {
        // Mock target server simulating upstream media provider (e.g. video file with Range support)
        mockTargetServer = http.createServer((req, res) => {
            const sampleData = Buffer.from('TEST_BINARY_VIDEO_DATA_OMNIDL_STREAM_1234567890');
            const totalLength = sampleData.length;

            if (req.method === 'HEAD') {
                res.writeHead(200, {
                    'Content-Type': 'video/mp4',
                    'Content-Length': totalLength,
                    'Accept-Ranges': 'bytes'
                });
                return res.end();
            }

            const range = req.headers.range;
            if (range) {
                const parts = range.replace(/bytes=/, '').split('-');
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
                const chunk = sampleData.subarray(start, end + 1);

                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${totalLength}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunk.length,
                    'Content-Type': 'video/mp4'
                });
                return res.end(chunk);
            }

            res.writeHead(200, {
                'Content-Type': 'video/mp4',
                'Content-Length': totalLength,
                'Accept-Ranges': 'bytes'
            });
            res.end(sampleData);
        });

        await new Promise((resolve) => mockTargetServer.listen(0, resolve));
        const mockPort = mockTargetServer.address().port;
        mockTargetUrl = `http://127.0.0.1:${mockPort}/sample.mp4`;

        // Start OmniDL server
        await new Promise((resolve) => {
            server = app.listen(0, resolve);
        });
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
    });

    after(async () => {
        if (server) await new Promise((resolve) => server.close(resolve));
        if (mockTargetServer) await new Promise((resolve) => mockTargetServer.close(resolve));
    });

    // ── Test CORS & Route Download ──
    test('OPTIONS /api/download handles preflight with appropriate CORS headers', async () => {
        const res = await fetch(`${baseUrl}/api/download`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://example.com',
                'Access-Control-Request-Method': 'POST'
            }
        });
        assert.ok(res.status === 200 || res.status === 204);
        assert.equal(res.headers.get('access-control-allow-origin'), '*');
        assert.ok(res.headers.get('access-control-allow-headers')?.includes('Range'));
    });

    test('POST /api/download rejects missing body or URL', async () => {
        const res = await fetch(`${baseUrl}/api/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        assert.equal(res.status, 400);
        const data = await res.json();
        assert.equal(data.success, false);
        assert.equal(data.code, 'INVALID_URL');
    });

    test('POST /api/download rejects unsupported platforms', async () => {
        const res = await fetch(`${baseUrl}/api/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: 'https://mysite.com/video123' })
        });
        assert.equal(res.status, 400);
        const data = await res.json();
        assert.equal(data.success, false);
        assert.equal(data.code, 'PLATFORM_UNSUPPORTED');
    });

    // ── Test Proxy & Streaming Binary ──
    test('GET /api/proxy returns full binary stream with CORS and Content-Disposition', async () => {
        const proxyUrl = `${baseUrl}/api/proxy?url=${encodeURIComponent(mockTargetUrl)}&filename=test_video`;
        const res = await fetch(proxyUrl);

        assert.equal(res.status, 200);
        assert.equal(res.headers.get('content-type'), 'video/mp4');
        assert.equal(res.headers.get('accept-ranges'), 'bytes');
        assert.ok(res.headers.get('content-disposition')?.includes('attachment; filename="test_video.mp4"'));
        assert.ok(res.headers.get('access-control-expose-headers')?.includes('Content-Disposition'));

        const buffer = await res.arrayBuffer();
        const text = Buffer.from(buffer).toString('utf-8');
        assert.equal(text, 'TEST_BINARY_VIDEO_DATA_OMNIDL_STREAM_1234567890');
    });

    test('GET /api/proxy handles HTTP Range request (206 Partial Content)', async () => {
        const proxyUrl = `${baseUrl}/api/proxy?url=${encodeURIComponent(mockTargetUrl)}&filename=test_video.mp4`;
        const res = await fetch(proxyUrl, {
            headers: {
                'Range': 'bytes=0-10'
            }
        });

        assert.equal(res.status, 206);
        assert.equal(res.headers.get('content-range'), 'bytes 0-10/47');
        const buffer = await res.arrayBuffer();
        const text = Buffer.from(buffer).toString('utf-8');
        assert.equal(text, 'TEST_BINARY');
    });

    test('HEAD /api/proxy returns correct headers without downloading body', async () => {
        const proxyUrl = `${baseUrl}/api/proxy?url=${encodeURIComponent(mockTargetUrl)}&filename=test_head.mp4`;
        const res = await fetch(proxyUrl, {
            method: 'HEAD'
        });

        assert.equal(res.status, 200);
        assert.equal(res.headers.get('content-type'), 'video/mp4');
        assert.equal(res.headers.get('content-length'), '47');
        assert.equal(res.headers.get('accept-ranges'), 'bytes');
    });
});
