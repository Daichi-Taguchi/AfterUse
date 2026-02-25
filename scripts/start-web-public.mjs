import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import localtunnel from 'localtunnel';
import QRCode from 'qrcode';

function parseCliArgs(argv) {
  const result = {
    subdomain: undefined,
    outFile: undefined
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg) {
      continue;
    }
    if (arg === '--subdomain' && argv[i + 1]) {
      result.subdomain = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--out' && argv[i + 1]) {
      result.outFile = argv[i + 1];
      i += 1;
    }
  }

  return result;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForWebServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return;
      }
    } catch {
      // Retry until timeout.
    }
    await sleep(1000);
  }
  throw new Error(`Web server did not become ready within ${timeoutMs}ms: ${url}`);
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });
}

async function resolveAvailablePort(startPort) {
  for (let port = startPort; port < startPort + 30; port += 1) {
    // eslint-disable-next-line no-await-in-loop
    const free = await isPortFree(port);
    if (free) {
      return port;
    }
  }
  throw new Error(`No available port found in range ${startPort}-${startPort + 29}.`);
}

async function resolveTunnelPassword() {
  try {
    const res = await fetch('https://loca.lt/mytunnelpassword');
    if (!res.ok) {
      return null;
    }
    const text = (await res.text()).trim();
    return text || null;
  } catch {
    return null;
  }
}

const cli = parseCliArgs(process.argv.slice(2));
const preferredPort = Number(process.env.WEB_PORT || '8081');
const outDir = path.join(process.cwd(), 'assets', 'qr');
const publicQrFile = path.join(outDir, cli.outFile || 'afteruse-web-public.png');
const passwordHelpQrFile = path.join(outDir, 'afteruse-tunnel-password-help.png');
const guideTextFile = path.join(outDir, 'afteruse-public-access-guide.txt');
const passwordLookupUrl = 'https://loca.lt/mytunnelpassword';

const port = await resolveAvailablePort(preferredPort);
const expoArgs = ['expo', 'start', '--web', '--host', 'localhost', '--port', String(port)];
const expo = spawn('npx', expoArgs, {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: process.env
});

let tunnel;
let shuttingDown = false;

async function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  try {
    if (tunnel) {
      await tunnel.close();
    }
  } catch {
    // Ignore tunnel close errors.
  }

  expo.kill('SIGINT');
  process.exit(code);
}

expo.on('exit', async (code) => {
  await shutdown(code ?? 0);
});

process.on('SIGINT', async () => {
  await shutdown(0);
});

process.on('SIGTERM', async () => {
  await shutdown(0);
});

try {
  await waitForWebServer(`http://127.0.0.1:${port}`);

  tunnel = await localtunnel({
    port,
    subdomain: cli.subdomain?.trim() || process.env.WEB_TUNNEL_SUBDOMAIN || undefined
  });

  fs.mkdirSync(outDir, { recursive: true });

  await QRCode.toFile(publicQrFile, tunnel.url, {
    type: 'png',
    width: 720,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });

  await QRCode.toFile(passwordHelpQrFile, passwordLookupUrl, {
    type: 'png',
    width: 720,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });

  const terminalQr = await QRCode.toString(tunnel.url, { type: 'terminal', small: true });
  const tunnelPassword = await resolveTunnelPassword();

  const guideText = [
    'AfterUse Public Access Guide (loca.lt)',
    '',
    'A. Main QR (site access)',
    `- Open: ${tunnel.url}`,
    '',
    'B. Tunnel password screen appears (loca.lt page)',
    '- Input the tunnel password shown below.',
    `- If unknown, open this on the SAME phone: ${passwordLookupUrl}`,
    '',
    `Tunnel password (current device): ${tunnelPassword || 'Failed to auto-fetch'}`,
    '',
    'Generated files:',
    `- Main QR: ${publicQrFile}`,
    `- Password Help QR: ${passwordHelpQrFile}`
  ].join('\n');
  fs.writeFileSync(guideTextFile, guideText, 'utf8');

  console.log(`Public URL   : ${tunnel.url}`);
  console.log(`Local Web    : http://127.0.0.1:${port}`);
  console.log(`Main QR      : ${publicQrFile}`);
  console.log(`Help QR      : ${passwordHelpQrFile}  (opens ${passwordLookupUrl})`);
  console.log(`Guide text   : ${guideTextFile}`);
  console.log('Terminal QR:');
  console.log(terminalQr);
  console.log('');
  console.log('[User Steps]');
  console.log('1) Read the Main QR to open AfterUse');
  console.log('2) If loca.lt asks for tunnel password, enter the value below');
  if (tunnelPassword) {
    console.log(`3) Tunnel password: ${tunnelPassword}`);
  } else {
    console.log(`3) Open ${passwordLookupUrl} on the SAME phone and enter that value`);
  }
  console.log('');
  console.log('Note: The loca.lt password page UI itself is managed by the tunnel service and cannot be customized here.');
  console.log('Keep this command running while sharing the app.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  await shutdown(1);
}
