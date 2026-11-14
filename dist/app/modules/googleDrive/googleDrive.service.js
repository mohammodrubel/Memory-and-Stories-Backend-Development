"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOAuthClient = buildOAuthClient;
exports.getAuthUrl = getAuthUrl;
exports.handleCallback = handleCallback;
exports.getStatus = getStatus;
exports.disconnect = disconnect;
exports.getAuthedCalendarClient = getAuthedCalendarClient;
exports.getAuthedDriveClient = getAuthedDriveClient;
exports.getFreshAccessToken = getFreshAccessToken;
exports.listFolderFiles = listFolderFiles;
exports.isDescendant = isDescendant;
exports.getFileMeta = getFileMeta;
exports.streamFile = streamFile;
exports.setFolderPublic = setFolderPublic;
exports.snapshotDeliveryTree = snapshotDeliveryTree;
exports.streamThumbnail = streamThumbnail;
const googleapis_1 = require("googleapis");
const prisma_1 = __importDefault(require("../../utils/prisma"));
const config_1 = __importDefault(require("../../config"));
const crypto_1 = require("../../utils/crypto");
const SCOPES = [
    // Need full drive to write permission (set public) on user-picked folders.
    'https://www.googleapis.com/auth/drive',
    // Calendar push — write events on admin's primary calendar
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
];
function buildOAuthClient() {
    const { client_id, client_secret, redirect_uri } = config_1.default.google;
    if (!client_id || !client_secret || !redirect_uri) {
        throw new Error('Google OAuth env not configured');
    }
    return new googleapis_1.google.auth.OAuth2(client_id, client_secret, redirect_uri);
}
function getAuthUrl(state) {
    const oauth = buildOAuthClient();
    return oauth.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: SCOPES,
        state,
        include_granted_scopes: true,
    });
}
function handleCallback(code) {
    return __awaiter(this, void 0, void 0, function* () {
        const oauth = buildOAuthClient();
        const { tokens } = yield oauth.getToken(code);
        if (!tokens.refresh_token) {
            throw new Error('No refresh_token returned. Revoke prior consent and retry (need prompt=consent + access_type=offline).');
        }
        oauth.setCredentials(tokens);
        const oauth2 = googleapis_1.google.oauth2({ version: 'v2', auth: oauth });
        const me = yield oauth2.userinfo.get();
        const email = me.data.email || 'unknown';
        yield prisma_1.default.googleDriveAccount.deleteMany({});
        const row = yield prisma_1.default.googleDriveAccount.create({
            data: {
                email,
                accessToken: (0, crypto_1.encryptSecret)(tokens.access_token || ''),
                refreshToken: (0, crypto_1.encryptSecret)(tokens.refresh_token),
                scope: tokens.scope || null,
                tokenType: tokens.token_type || null,
                expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
            },
        });
        return { connected: true, email: row.email };
    });
}
function getStatus() {
    return __awaiter(this, void 0, void 0, function* () {
        const row = yield prisma_1.default.googleDriveAccount.findFirst({
            orderBy: { createdAt: 'desc' },
        });
        if (!row)
            return { connected: false };
        return { connected: true, email: row.email, since: row.createdAt };
    });
}
function disconnect() {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma_1.default.googleDriveAccount.deleteMany({});
        return { connected: false };
    });
}
function loadOAuthFromDb() {
    return __awaiter(this, void 0, void 0, function* () {
        const row = yield prisma_1.default.googleDriveAccount.findFirst({
            orderBy: { createdAt: 'desc' },
        });
        if (!row)
            throw new Error('Google not connected');
        const oauth = buildOAuthClient();
        oauth.setCredentials({
            access_token: (0, crypto_1.decryptSecret)(row.accessToken),
            refresh_token: (0, crypto_1.decryptSecret)(row.refreshToken),
            expiry_date: row.expiryDate ? Number(row.expiryDate) : undefined,
            token_type: row.tokenType || undefined,
            scope: row.scope || undefined,
        });
        oauth.on('tokens', (t) => __awaiter(this, void 0, void 0, function* () {
            const update = {};
            if (t.access_token)
                update.accessToken = (0, crypto_1.encryptSecret)(t.access_token);
            if (t.refresh_token)
                update.refreshToken = (0, crypto_1.encryptSecret)(t.refresh_token);
            if (t.expiry_date)
                update.expiryDate = BigInt(t.expiry_date);
            if (Object.keys(update).length) {
                yield prisma_1.default.googleDriveAccount.update({
                    where: { id: row.id },
                    data: update,
                });
            }
        }));
        return { oauth, row };
    });
}
function getAuthedCalendarClient() {
    return __awaiter(this, void 0, void 0, function* () {
        const { oauth } = yield loadOAuthFromDb();
        return googleapis_1.google.calendar({ version: 'v3', auth: oauth });
    });
}
function getAuthedDriveClient() {
    return __awaiter(this, void 0, void 0, function* () {
        const row = yield prisma_1.default.googleDriveAccount.findFirst({
            orderBy: { createdAt: 'desc' },
        });
        if (!row)
            throw new Error('Google Drive not connected');
        const oauth = buildOAuthClient();
        oauth.setCredentials({
            access_token: (0, crypto_1.decryptSecret)(row.accessToken),
            refresh_token: (0, crypto_1.decryptSecret)(row.refreshToken),
            expiry_date: row.expiryDate ? Number(row.expiryDate) : undefined,
            token_type: row.tokenType || undefined,
            scope: row.scope || undefined,
        });
        oauth.on('tokens', (t) => __awaiter(this, void 0, void 0, function* () {
            const update = {};
            if (t.access_token)
                update.accessToken = (0, crypto_1.encryptSecret)(t.access_token);
            if (t.refresh_token)
                update.refreshToken = (0, crypto_1.encryptSecret)(t.refresh_token);
            if (t.expiry_date)
                update.expiryDate = BigInt(t.expiry_date);
            if (Object.keys(update).length) {
                yield prisma_1.default.googleDriveAccount.update({
                    where: { id: row.id },
                    data: update,
                });
            }
        }));
        return googleapis_1.google.drive({ version: 'v3', auth: oauth });
    });
}
function getFreshAccessToken() {
    return __awaiter(this, void 0, void 0, function* () {
        const row = yield prisma_1.default.googleDriveAccount.findFirst({
            orderBy: { createdAt: 'desc' },
        });
        if (!row)
            throw new Error('Google Drive not connected');
        const oauth = buildOAuthClient();
        oauth.setCredentials({
            refresh_token: (0, crypto_1.decryptSecret)(row.refreshToken),
        });
        const { credentials } = yield oauth.refreshAccessToken();
        if (credentials.access_token) {
            yield prisma_1.default.googleDriveAccount.update({
                where: { id: row.id },
                data: {
                    accessToken: (0, crypto_1.encryptSecret)(credentials.access_token),
                    expiryDate: credentials.expiry_date
                        ? BigInt(credentials.expiry_date)
                        : null,
                },
            });
        }
        return credentials.access_token || '';
    });
}
function listFolderFiles(folderId, pageToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const drive = yield getAuthedDriveClient();
        const res = yield drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'nextPageToken, files(id, name, mimeType, size, thumbnailLink, iconLink, modifiedTime, videoMediaMetadata, imageMediaMetadata)',
            pageSize: 100,
            pageToken,
            orderBy: 'name',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });
        return {
            files: (res.data.files || []),
            nextPageToken: res.data.nextPageToken || null,
        };
    });
}
function isDescendant(candidateId_1, rootId_1) {
    return __awaiter(this, arguments, void 0, function* (candidateId, rootId, maxDepth = 25) {
        if (candidateId === rootId)
            return true;
        const drive = yield getAuthedDriveClient();
        let current = candidateId;
        for (let i = 0; i < maxDepth; i++) {
            const r = yield drive.files.get({
                fileId: current,
                fields: 'id, parents',
                supportsAllDrives: true,
            });
            const parents = r.data.parents || [];
            if (parents.includes(rootId))
                return true;
            if (parents.length === 0)
                return false;
            current = parents[0];
            if (current === rootId)
                return true;
        }
        return false;
    });
}
function getFileMeta(fileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const drive = yield getAuthedDriveClient();
        const res = yield drive.files.get({
            fileId,
            fields: 'id, name, mimeType, size, thumbnailLink, iconLink, modifiedTime, videoMediaMetadata, imageMediaMetadata, parents',
            supportsAllDrives: true,
        });
        return res.data;
    });
}
function streamFile(fileId, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const drive = yield getAuthedDriveClient();
        const meta = yield drive.files.get({
            fileId,
            fields: 'id, name, mimeType, size',
            supportsAllDrives: true,
        });
        const name = meta.data.name || fileId;
        const mime = meta.data.mimeType || 'application/octet-stream';
        const size = meta.data.size ? Number(meta.data.size) : undefined;
        res.setHeader('Content-Type', mime);
        if (size)
            res.setHeader('Content-Length', String(size));
        const dispo = (((_a = res.req.query) === null || _a === void 0 ? void 0 : _a.download) === '1' ? 'attachment' : 'inline');
        res.setHeader('Content-Disposition', `${dispo}; filename="${encodeURIComponent(name)}"`);
        const stream = yield drive.files.get({ fileId, alt: 'media', supportsAllDrives: true }, { responseType: 'stream' });
        stream.data
            .on('error', (err) => {
            if (!res.headersSent)
                res.status(500);
            res.end(`Drive stream error: ${err.message}`);
        })
            .pipe(res);
    });
}
function setFolderPublic(folderId) {
    return __awaiter(this, void 0, void 0, function* () {
        const drive = yield getAuthedDriveClient();
        // Idempotent: list permissions, skip if 'anyone reader' already present
        try {
            const existing = yield drive.permissions.list({
                fileId: folderId,
                fields: 'permissions(id, type, role)',
                supportsAllDrives: true,
            });
            const hasPublic = (existing.data.permissions || []).some((p) => p.type === 'anyone' && p.role === 'reader');
            if (hasPublic)
                return;
        }
        catch (_a) {
            /* ignore — try to create anyway */
        }
        yield drive.permissions.create({
            fileId: folderId,
            requestBody: { role: 'reader', type: 'anyone' },
            supportsAllDrives: true,
        });
    });
}
function snapshotDeliveryTree(rootFolderId_1, rootFolderName_1) {
    return __awaiter(this, arguments, void 0, function* (rootFolderId, rootFolderName, maxFiles = 5000) {
        const drive = yield getAuthedDriveClient();
        const out = [];
        const queue = [
            { id: rootFolderId, name: rootFolderName },
        ];
        while (queue.length && out.length < maxFiles) {
            const cur = queue.shift();
            let pageToken;
            do {
                const r = yield drive.files.list({
                    q: `'${cur.id}' in parents and trashed = false`,
                    fields: 'nextPageToken, files(id, name, mimeType, size)',
                    pageSize: 100,
                    pageToken,
                    supportsAllDrives: true,
                    includeItemsFromAllDrives: true,
                });
                for (const f of r.data.files || []) {
                    const isFolder = f.mimeType === 'application/vnd.google-apps.folder';
                    out.push({
                        fileId: f.id,
                        fileName: f.name || 'Untitled',
                        mimeType: f.mimeType || 'application/octet-stream',
                        size: f.size || null,
                        isFolder,
                        parentFolderId: cur.id,
                        parentFolderName: cur.name,
                    });
                    if (isFolder) {
                        queue.push({ id: f.id, name: f.name || 'Folder' });
                    }
                    if (out.length >= maxFiles)
                        break;
                }
                pageToken = r.data.nextPageToken || undefined;
            } while (pageToken && out.length < maxFiles);
        }
        return out;
    });
}
function streamThumbnail(fileId, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const drive = yield getAuthedDriveClient();
        const meta = yield drive.files.get({
            fileId,
            fields: 'thumbnailLink, mimeType',
            supportsAllDrives: true,
        });
        const link = meta.data.thumbnailLink;
        if (!link) {
            res.status(404).end('No thumbnail');
            return;
        }
        const token = yield getFreshAccessToken();
        const url = link.replace(/=s\d+$/, '=s400');
        const upstream = yield fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!upstream.ok || !upstream.body) {
            res.status(upstream.status || 502).end('Thumbnail fetch failed');
            return;
        }
        res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
        res.setHeader('Cache-Control', 'private, max-age=300');
        const reader = upstream.body.getReader();
        const pump = () => __awaiter(this, void 0, void 0, function* () {
            const { done, value } = yield reader.read();
            if (done) {
                res.end();
                return;
            }
            res.write(Buffer.from(value));
            return pump();
        });
        yield pump();
    });
}
