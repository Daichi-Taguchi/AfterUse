import os from 'node:os';
import { spawn } from 'node:child_process';

function resolveLanIPv4() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    if (!iface) {
      continue;
    }
    for (const address of iface) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  return null;
}

const host = process.env.WEB_HOST || resolveLanIPv4() || '127.0.0.1';
process.env.WEB_HOST = host;
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = process.env.REACT_NATIVE_PACKAGER_HOSTNAME || host;

await import('./generate-web-qr.mjs');
console.log(`Use this URL on mobile browser: http://${host}:${process.env.WEB_PORT || '8081'}`);

const args = ['expo', 'start', '--web', '--host', 'lan'];
if (process.env.WEB_PORT) {
  args.push('--port', process.env.WEB_PORT);
}

const child = spawn('npx', args, {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
