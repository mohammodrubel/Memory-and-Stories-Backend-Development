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
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./app/config"));
const check_1 = require("./app/license/check");
process.on('uncaughtException', (err) => {
    console.error(err);
    process.exit(1);
});
let server = null;
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        if (config_1.default.license.enabled) {
            const opts = {
                url: (_a = config_1.default.license.url) !== null && _a !== void 0 ? _a : '',
                anonKey: (_b = config_1.default.license.anon_key) !== null && _b !== void 0 ? _b : '',
                licenseKey: (_c = config_1.default.license.key) !== null && _c !== void 0 ? _c : '',
                failClosed: true,
            };
            const result = yield (0, check_1.verifyLicense)(opts);
            if (!result.ok) {
                console.error(`[license] verification failed: ${result.reason}`);
                console.error('[license] contact your vendor to renew or activate this deployment.');
                process.exit(1);
            }
            console.log(`[license] ok (${result.reason})`);
            (0, check_1.startLicenseHeartbeat)(opts);
        }
        server = app_1.default.listen(config_1.default.port, () => {
            console.log(`🎯 Server listening on port: ${config_1.default.port}`);
        });
        process.on('unhandledRejection', (error) => {
            if (server) {
                server.close(() => {
                    console.log(error);
                    process.exit(1);
                });
            }
            else {
                process.exit(1);
            }
        });
    });
}
startServer();
process.on('SIGTERM', () => {
    if (server) {
        server.close();
    }
});
