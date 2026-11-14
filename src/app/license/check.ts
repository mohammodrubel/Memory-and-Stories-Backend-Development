import fs from 'fs';
import path from 'path';

interface VerifyResponse {
  valid: boolean;
  reason?: string;
  customer?: string;
  plan?: string;
  expires_at?: string;
  allowed_domains?: string[];
}

interface CacheRecord {
  verifiedAt: number;
  expiresAt: number;
  customer: string;
  plan: string;
  allowedDomains: string[];
}

const CACHE_FILE = path.join(process.cwd(), '.license-cache.json');
const GRACE_MS = 7 * 24 * 60 * 60 * 1000;

let allowedDomains: string[] = [];

export const getAllowedDomains = (): string[] => allowedDomains;

const readCache = (): CacheRecord | null => {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) as CacheRecord;
  } catch {
    return null;
  }
};

const writeCache = (rec: CacheRecord): void => {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(rec), 'utf8');
  } catch {
    // non-fatal
  }
};

const callLicenseServer = async (
  url: string,
  anonKey: string,
  licenseKey: string,
): Promise<VerifyResponse | null> => {
  try {
    const res = await fetch(`${url}/rest/v1/rpc/verify_license`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_key: licenseKey }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return (await res.json()) as VerifyResponse;
  } catch {
    return null;
  }
};

export interface ILicenseCheckOptions {
  url: string;
  anonKey: string;
  licenseKey: string;
  failClosed: boolean;
}

export const verifyLicense = async (
  opts: ILicenseCheckOptions,
): Promise<{ ok: boolean; reason: string }> => {
  if (!opts.url || !opts.anonKey || !opts.licenseKey) {
    return { ok: false, reason: 'license_env_missing' };
  }

  const response = await callLicenseServer(opts.url, opts.anonKey, opts.licenseKey);

  if (response && response.valid) {
    const expiresAt = response.expires_at
      ? new Date(response.expires_at).getTime()
      : Date.now() + GRACE_MS;
    allowedDomains = response.allowed_domains ?? [];
    writeCache({
      verifiedAt: Date.now(),
      expiresAt,
      customer: response.customer ?? '',
      plan: response.plan ?? '',
      allowedDomains,
    });
    return { ok: true, reason: 'verified' };
  }

  if (response && !response.valid) {
    return { ok: false, reason: response.reason ?? 'invalid' };
  }

  const cached = readCache();
  if (cached && Date.now() - cached.verifiedAt < GRACE_MS && Date.now() < cached.expiresAt) {
    allowedDomains = cached.allowedDomains ?? [];
    return { ok: true, reason: 'cached_grace' };
  }

  return { ok: opts.failClosed ? false : true, reason: 'server_unreachable' };
};

let consecutiveFailures = 0;

export const startLicenseHeartbeat = (
  opts: ILicenseCheckOptions,
  intervalMs = 60 * 60 * 1000,
): void => {
  setInterval(async () => {
    const result = await verifyLicense({ ...opts, failClosed: true });
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
  }, intervalMs).unref();
};
