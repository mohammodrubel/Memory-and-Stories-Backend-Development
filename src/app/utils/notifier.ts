import { Response } from 'express';

type Channel = Set<Response>;
const channels = new Map<string, Channel>();

function getChannel(userId: string): Channel {
  let ch = channels.get(userId);
  if (!ch) {
    ch = new Set();
    channels.set(userId, ch);
  }
  return ch;
}

export function subscribe(userId: string, res: Response): () => void {
  const ch = getChannel(userId);
  ch.add(res);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  res.write(`: connected\n\n`);

  const heartbeat = setInterval(() => {
    try {
      res.write(`: ping\n\n`);
    } catch {
      /* ignore */
    }
  }, 25000);

  const cleanup = () => {
    clearInterval(heartbeat);
    ch.delete(res);
    if (ch.size === 0) channels.delete(userId);
  };
  res.on('close', cleanup);
  return cleanup;
}

export function emit(userId: string, event: string, data: unknown): void {
  const ch = channels.get(userId);
  if (!ch || ch.size === 0) return;
  const payload =
    `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
  for (const res of ch) {
    try {
      res.write(payload);
    } catch {
      ch.delete(res);
    }
  }
}

export function broadcast(event: string, data: unknown): void {
  const payload =
    `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
  for (const ch of channels.values()) {
    for (const res of ch) {
      try {
        res.write(payload);
      } catch {
        ch.delete(res);
      }
    }
  }
}
