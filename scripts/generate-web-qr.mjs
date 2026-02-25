import QRCode from 'qrcode';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function parseCliArgs(argv) {
  const result = {
    url: undefined,
    outFile: undefined
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg) {
      continue;
    }
    if (arg === '--url' && argv[i + 1]) {
      result.url = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--out' && argv[i + 1]) {
      result.outFile = argv[i + 1];
      i += 1;
      continue;
    }
    if (!arg.startsWith('--') && !result.url) {
      result.url = arg;
    }
  }

  return result;
}

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

const cli = parseCliArgs(process.argv.slice(2));
const customUrl = cli.url?.trim() || process.env.QR_TARGET_URL?.trim();
const host = process.env.WEB_HOST || resolveLanIPv4() || '127.0.0.1';
const port = process.env.WEB_PORT || '8081';
const protocol = process.env.WEB_PROTOCOL || 'http';
const outDir = path.join(process.cwd(), 'assets', 'qr');
const defaultOutFile = customUrl ? 'afteruse-web-fixed.png' : 'afteruse-web-local.png';
const outFile = path.join(outDir, cli.outFile || process.env.QR_OUT_FILE || defaultOutFile);
const url = customUrl || `${protocol}://${host}:${port}`;

fs.mkdirSync(outDir, { recursive: true });

await QRCode.toFile(outFile, url, {
  type: 'png',
  width: 720,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
});

const terminalQr = await QRCode.toString(url, { type: 'terminal', small: true });

console.log(`QR generated: ${outFile}`);
console.log(`URL encoded : ${url}`);
console.log('Terminal QR:');
console.log(terminalQr);
