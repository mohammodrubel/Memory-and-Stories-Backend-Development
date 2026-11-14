"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribe = subscribe;
exports.emit = emit;
exports.broadcast = broadcast;
const channels = new Map();
function getChannel(userId) {
    let ch = channels.get(userId);
    if (!ch) {
        ch = new Set();
        channels.set(userId, ch);
    }
    return ch;
}
function subscribe(userId, res) {
    var _a;
    const ch = getChannel(userId);
    ch.add(res);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    (_a = res.flushHeaders) === null || _a === void 0 ? void 0 : _a.call(res);
    res.write(`: connected\n\n`);
    const heartbeat = setInterval(() => {
        try {
            res.write(`: ping\n\n`);
        }
        catch (_a) {
            /* ignore */
        }
    }, 25000);
    const cleanup = () => {
        clearInterval(heartbeat);
        ch.delete(res);
        if (ch.size === 0)
            channels.delete(userId);
    };
    res.on('close', cleanup);
    return cleanup;
}
function emit(userId, event, data) {
    const ch = channels.get(userId);
    if (!ch || ch.size === 0)
        return;
    const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
    for (const res of ch) {
        try {
            res.write(payload);
        }
        catch (_a) {
            ch.delete(res);
        }
    }
}
function broadcast(event, data) {
    const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
    for (const ch of channels.values()) {
        for (const res of ch) {
            try {
                res.write(payload);
            }
            catch (_a) {
                ch.delete(res);
            }
        }
    }
}
