import { Server } from 'http';
import app from './app';
import config from './app/config';
import { verifyLicense, startLicenseHeartbeat } from './app/license/check';

process.on('uncaughtException', (err) => {
  console.error(err);
  process.exit(1);
});

let server: Server | null = null;

async function startServer() {
  if (config.license.enabled) {
    const opts = {
      url: config.license.url ?? '',
      anonKey: config.license.anon_key ?? '',
      licenseKey: config.license.key ?? '',
      failClosed: true,
    };
    const result = await verifyLicense(opts);
    if (!result.ok) {
      console.error(`[license] verification failed: ${result.reason}`);
      console.error('[license] contact your vendor to renew or activate this deployment.');
      process.exit(1);
    }
    console.log(`[license] ok (${result.reason})`);
    startLicenseHeartbeat(opts);
  }

  server = app.listen(config.port, () => {
    console.log(`🎯 Server listening on port: ${config.port}`);
  });

  process.on('unhandledRejection', (error) => {
    if (server) {
      server.close(() => {
        console.log(error);
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}



startServer();

process.on('SIGTERM', () => {
  if (server) {
    server.close();
  }
});



