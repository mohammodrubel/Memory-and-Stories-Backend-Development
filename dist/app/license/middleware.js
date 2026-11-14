"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.licenseDomainGuard = void 0;
const check_1 = require("./check");
const normalizeHost = (raw) => {
    if (!raw)
        return '';
    return raw.split(':')[0].trim().toLowerCase();
};
const isLocalhostHost = (host) => host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1';
const licenseDomainGuard = (req, res, next) => {
    var _a, _b;
    const allowed = (0, check_1.getAllowedDomains)();
    if (allowed.length === 0) {
        return next();
    }
    const forwardedHost = req.headers['x-forwarded-host'];
    const rawHost = (_b = (_a = (typeof forwardedHost === 'string' ? forwardedHost.split(',')[0] : undefined)) !== null && _a !== void 0 ? _a : req.headers.host) !== null && _b !== void 0 ? _b : '';
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
exports.licenseDomainGuard = licenseDomainGuard;
