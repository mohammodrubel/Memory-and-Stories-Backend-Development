import { Request, Response, NextFunction } from 'express';
import { getAllowedDomains } from './check';

const normalizeHost = (raw?: string): string => {
  if (!raw) return '';
  return raw.split(':')[0].trim().toLowerCase();
};

const isLocalhostHost = (host: string): boolean =>
  host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1';

export const licenseDomainGuard = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const allowed = getAllowedDomains();
  if (allowed.length === 0) {
    return next();
  }

  const forwardedHost = req.headers['x-forwarded-host'];
  const rawHost =
    (typeof forwardedHost === 'string' ? forwardedHost.split(',')[0] : undefined) ??
    req.headers.host ??
    '';
  const host = normalizeHost(rawHost);

  const allowsLocalhost = allowed.some((d) => isLocalhostHost(d));
  if (allowsLocalhost && isLocalhostHost(host)) {
    return next();
  }

  if (allowed.some((d) => d.toLowerCase() === host)) {
    return next();
  }

  res.status(503).json({
    success: false,
    message: 'license_domain_mismatch',
    host,
  });
};
