import { google } from 'googleapis';
import { Response } from 'express';
import prisma from '../../utils/prisma';
import config from '../../config';
import { encryptSecret, decryptSecret } from '../../utils/crypto';

const SCOPES = [
  // Need full drive to write permission (set public) on user-picked folders.
  'https://www.googleapis.com/auth/drive',
  // Calendar push — write events on admin's primary calendar
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

export function buildOAuthClient() {
  const { client_id, client_secret, redirect_uri } = config.google;
  if (!client_id || !client_secret || !redirect_uri) {
    throw new Error('Google OAuth env not configured');
  }
  return new google.auth.OAuth2(client_id, client_secret, redirect_uri);
}

export function getAuthUrl(state: string): string {
  const oauth = buildOAuthClient();
  return oauth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state,
    include_granted_scopes: true,
  });
}

export async function handleCallback(code: string) {
  const oauth = buildOAuthClient();
  const { tokens } = await oauth.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error(
      'No refresh_token returned. Revoke prior consent and retry (need prompt=consent + access_type=offline).',
    );
  }
  oauth.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth });
  const me = await oauth2.userinfo.get();
  const email = me.data.email || 'unknown';

  await prisma.googleDriveAccount.deleteMany({});
  const row = await prisma.googleDriveAccount.create({
    data: {
      email,
      accessToken: encryptSecret(tokens.access_token || ''),
      refreshToken: encryptSecret(tokens.refresh_token),
      scope: tokens.scope || null,
      tokenType: tokens.token_type || null,
      expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
    },
  });
  return { connected: true, email: row.email };
}

export async function getStatus() {
  const row = await prisma.googleDriveAccount.findFirst({
    orderBy: { createdAt: 'desc' },
  });
  if (!row) return { connected: false };
  return { connected: true, email: row.email, since: row.createdAt };
}

export async function disconnect() {
  await prisma.googleDriveAccount.deleteMany({});
  return { connected: false };
}

async function loadOAuthFromDb() {
  const row = await prisma.googleDriveAccount.findFirst({
    orderBy: { createdAt: 'desc' },
  });
  if (!row) throw new Error('Google not connected');
  const oauth = buildOAuthClient();
  oauth.setCredentials({
    access_token: decryptSecret(row.accessToken),
    refresh_token: decryptSecret(row.refreshToken),
    expiry_date: row.expiryDate ? Number(row.expiryDate) : undefined,
    token_type: row.tokenType || undefined,
    scope: row.scope || undefined,
  });
  oauth.on('tokens', async (t) => {
    const update: Record<string, unknown> = {};
    if (t.access_token) update.accessToken = encryptSecret(t.access_token);
    if (t.refresh_token) update.refreshToken = encryptSecret(t.refresh_token);
    if (t.expiry_date) update.expiryDate = BigInt(t.expiry_date);
    if (Object.keys(update).length) {
      await prisma.googleDriveAccount.update({
        where: { id: row.id },
        data: update,
      });
    }
  });
  return { oauth, row };
}

export async function getAuthedCalendarClient() {
  const { oauth } = await loadOAuthFromDb();
  return google.calendar({ version: 'v3', auth: oauth });
}

export async function getAuthedDriveClient() {
  const row = await prisma.googleDriveAccount.findFirst({
    orderBy: { createdAt: 'desc' },
  });
  if (!row) throw new Error('Google Drive not connected');

  const oauth = buildOAuthClient();
  oauth.setCredentials({
    access_token: decryptSecret(row.accessToken),
    refresh_token: decryptSecret(row.refreshToken),
    expiry_date: row.expiryDate ? Number(row.expiryDate) : undefined,
    token_type: row.tokenType || undefined,
    scope: row.scope || undefined,
  });

  oauth.on('tokens', async (t) => {
    const update: Record<string, unknown> = {};
    if (t.access_token) update.accessToken = encryptSecret(t.access_token);
    if (t.refresh_token) update.refreshToken = encryptSecret(t.refresh_token);
    if (t.expiry_date) update.expiryDate = BigInt(t.expiry_date);
    if (Object.keys(update).length) {
      await prisma.googleDriveAccount.update({
        where: { id: row.id },
        data: update,
      });
    }
  });

  return google.drive({ version: 'v3', auth: oauth });
}

export async function getFreshAccessToken(): Promise<string> {
  const row = await prisma.googleDriveAccount.findFirst({
    orderBy: { createdAt: 'desc' },
  });
  if (!row) throw new Error('Google Drive not connected');
  const oauth = buildOAuthClient();
  oauth.setCredentials({
    refresh_token: decryptSecret(row.refreshToken),
  });
  const { credentials } = await oauth.refreshAccessToken();
  if (credentials.access_token) {
    await prisma.googleDriveAccount.update({
      where: { id: row.id },
      data: {
        accessToken: encryptSecret(credentials.access_token),
        expiryDate: credentials.expiry_date
          ? BigInt(credentials.expiry_date)
          : null,
      },
    });
  }
  return credentials.access_token || '';
}

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: string | null;
  thumbnailLink?: string | null;
  iconLink?: string | null;
  videoMediaMetadata?: { width?: number | null; height?: number | null; durationMillis?: string | null } | null;
  imageMediaMetadata?: { width?: number | null; height?: number | null } | null;
  modifiedTime?: string | null;
};

export async function listFolderFiles(
  folderId: string,
  pageToken?: string,
): Promise<{ files: DriveFile[]; nextPageToken?: string | null }> {
  const drive = await getAuthedDriveClient();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields:
      'nextPageToken, files(id, name, mimeType, size, thumbnailLink, iconLink, modifiedTime, videoMediaMetadata, imageMediaMetadata)',
    pageSize: 100,
    pageToken,
    orderBy: 'name',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return {
    files: (res.data.files || []) as DriveFile[],
    nextPageToken: res.data.nextPageToken || null,
  };
}

export async function isDescendant(
  candidateId: string,
  rootId: string,
  maxDepth = 25,
): Promise<boolean> {
  if (candidateId === rootId) return true;
  const drive = await getAuthedDriveClient();
  let current = candidateId;
  for (let i = 0; i < maxDepth; i++) {
    const r = await drive.files.get({
      fileId: current,
      fields: 'id, parents',
      supportsAllDrives: true,
    });
    const parents = r.data.parents || [];
    if (parents.includes(rootId)) return true;
    if (parents.length === 0) return false;
    current = parents[0];
    if (current === rootId) return true;
  }
  return false;
}

export async function getFileMeta(fileId: string): Promise<DriveFile> {
  const drive = await getAuthedDriveClient();
  const res = await drive.files.get({
    fileId,
    fields:
      'id, name, mimeType, size, thumbnailLink, iconLink, modifiedTime, videoMediaMetadata, imageMediaMetadata, parents',
    supportsAllDrives: true,
  });
  return res.data as DriveFile;
}

export async function streamFile(fileId: string, res: Response): Promise<void> {
  const drive = await getAuthedDriveClient();
  const meta = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size',
    supportsAllDrives: true,
  });
  const name = meta.data.name || fileId;
  const mime = meta.data.mimeType || 'application/octet-stream';
  const size = meta.data.size ? Number(meta.data.size) : undefined;

  res.setHeader('Content-Type', mime);
  if (size) res.setHeader('Content-Length', String(size));
  const dispo = (res.req.query?.download === '1' ? 'attachment' : 'inline');
  res.setHeader(
    'Content-Disposition',
    `${dispo}; filename="${encodeURIComponent(name)}"`,
  );

  const stream = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'stream' },
  );
  stream.data
    .on('error', (err) => {
      if (!res.headersSent) res.status(500);
      res.end(`Drive stream error: ${err.message}`);
    })
    .pipe(res);
}

export async function setFolderPublic(folderId: string): Promise<void> {
  const drive = await getAuthedDriveClient();
  // Idempotent: list permissions, skip if 'anyone reader' already present
  try {
    const existing = await drive.permissions.list({
      fileId: folderId,
      fields: 'permissions(id, type, role)',
      supportsAllDrives: true,
    });
    const hasPublic = (existing.data.permissions || []).some(
      (p) => p.type === 'anyone' && p.role === 'reader',
    );
    if (hasPublic) return;
  } catch {
    /* ignore — try to create anyway */
  }
  await drive.permissions.create({
    fileId: folderId,
    requestBody: { role: 'reader', type: 'anyone' },
    supportsAllDrives: true,
  });
}

export type SnapshotRow = {
  fileId: string;
  fileName: string;
  mimeType: string;
  size: string | null;
  isFolder: boolean;
  parentFolderId: string | null;
  parentFolderName: string | null;
};

export async function snapshotDeliveryTree(
  rootFolderId: string,
  rootFolderName: string,
  maxFiles = 5000,
): Promise<SnapshotRow[]> {
  const drive = await getAuthedDriveClient();
  const out: SnapshotRow[] = [];
  const queue: { id: string; name: string }[] = [
    { id: rootFolderId, name: rootFolderName },
  ];
  while (queue.length && out.length < maxFiles) {
    const cur = queue.shift()!;
    let pageToken: string | undefined;
    do {
      const r = await drive.files.list({
        q: `'${cur.id}' in parents and trashed = false`,
        fields:
          'nextPageToken, files(id, name, mimeType, size)',
        pageSize: 100,
        pageToken,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      for (const f of r.data.files || []) {
        const isFolder =
          f.mimeType === 'application/vnd.google-apps.folder';
        out.push({
          fileId: f.id!,
          fileName: f.name || 'Untitled',
          mimeType: f.mimeType || 'application/octet-stream',
          size: f.size || null,
          isFolder,
          parentFolderId: cur.id,
          parentFolderName: cur.name,
        });
        if (isFolder) {
          queue.push({ id: f.id!, name: f.name || 'Folder' });
        }
        if (out.length >= maxFiles) break;
      }
      pageToken = r.data.nextPageToken || undefined;
    } while (pageToken && out.length < maxFiles);
  }
  return out;
}

export async function streamThumbnail(
  fileId: string,
  res: Response,
): Promise<void> {
  const drive = await getAuthedDriveClient();
  const meta = await drive.files.get({
    fileId,
    fields: 'thumbnailLink, mimeType',
    supportsAllDrives: true,
  });
  const link = meta.data.thumbnailLink;
  if (!link) {
    res.status(404).end('No thumbnail');
    return;
  }
  const token = await getFreshAccessToken();
  const url = link.replace(/=s\d+$/, '=s400');
  const upstream = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!upstream.ok || !upstream.body) {
    res.status(upstream.status || 502).end('Thumbnail fetch failed');
    return;
  }
  res.setHeader(
    'Content-Type',
    upstream.headers.get('content-type') || 'image/jpeg',
  );
  res.setHeader('Cache-Control', 'private, max-age=300');
  const reader = upstream.body.getReader();
  const pump = async (): Promise<void> => {
    const { done, value } = await reader.read();
    if (done) {
      res.end();
      return;
    }
    res.write(Buffer.from(value));
    return pump();
  };
  await pump();
}
