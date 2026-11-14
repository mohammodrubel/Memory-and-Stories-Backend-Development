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
exports.startLicenseHeartbeat = exports.verifyLicense = exports.getAllowedDomains = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const CACHE_FILE = path_1.default.join(process.cwd(), '.license-cache.json');
const GRACE_MS = 7 * 24 * 60 * 60 * 1000;
let allowedDomains = [];
const getAllowedDomains = () => allowedDomains;
exports.getAllowedDomains = getAllowedDomains;
const readCache = () => {
    try {
        if (!fs_1.default.existsSync(CACHE_FILE))
            return null;
        return JSON.parse(fs_1.default.readFileSync(CACHE_FILE, 'utf8'));
    }
    catch (_a) {
        return null;
    }
};
const writeCache = (rec) => {
    try {
        fs_1.default.writeFileSync(CACHE_FILE, JSON.stringify(rec), 'utf8');
    }
    catch (_a) {
        // non-fatal
    }
};
const callLicenseServer = (url, anonKey, licenseKey) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield fetch(`${url}/rest/v1/rpc/verify_license`, {
            method: 'POST',
            headers: {
                apikey: anonKey,
                Authorization: `Bearer ${anonKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ p_key: licenseKey }),
            signal: AbortSignal.timeout(10000),
        });
        if (!res.ok)
            return null;
        return (yield res.json());
    }
    catch (_a) {
        return null;
    }
});
const verifyLicense = (opts) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    if (!opts.url || !opts.anonKey || !opts.licenseKey) {
        return { ok: false, reason: 'license_env_missing' };
    }
    const response = yield callLicenseServer(opts.url, opts.anonKey, opts.licenseKey);
    if (response && response.valid) {
        const expiresAt = response.expires_at
            ? new Date(response.expires_at).getTime()
            : Date.now() + GRACE_MS;
        allowedDomains = (_a = response.allowed_domains) !== null && _a !== void 0 ? _a : [];
        writeCache({
            verifiedAt: Date.now(),
            expiresAt,
            customer: (_b = response.customer) !== null && _b !== void 0 ? _b : '',
            plan: (_c = response.plan) !== null && _c !== void 0 ? _c : '',
            allowedDomains,
        });
        return { ok: true, reason: 'verified' };
    }
    if (response && !response.valid) {
        return { ok: false, reason: (_d = response.reason) !== null && _d !== void 0 ? _d : 'invalid' };
    }
    const cached = readCache();
    if (cached && Date.now() - cached.verifiedAt < GRACE_MS && Date.now() < cached.expiresAt) {
        allowedDomains = (_e = cached.allowedDomains) !== null && _e !== void 0 ? _e : [];
        return { ok: true, reason: 'cached_grace' };
    }
    return { ok: opts.failClosed ? false : true, reason: 'server_unreachable' };
});
exports.verifyLicense = verifyLicense;
let consecutiveFailures = 0;
const startLicenseHeartbeat = (opts, intervalMs = 60 * 60 * 1000) => {
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield (0, exports.verifyLicense)(Object.assign(Object.assign({}, opts), { failClosed: true }));
        if (result.ok) {
            consecutiveFailures = 0;
            return;
        }
        consecutiveFailures += 1;
        console.warn(`[license] heartbeat failed (${consecutiveFailures}): ${result.reason}`);
        if (consecutiveFailures >= 7) {
            console.error('[license] 7 consecutive heartbeat failures, shutting down');
            process.exit(1);
        }
    }), intervalMs).unref();
};
exports.startLicenseHeartbeat = startLicenseHeartbeat;
