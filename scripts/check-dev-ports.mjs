import net from 'node:net';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const requiredPorts = [3000, 3001, 3002];
const dockerAppServices = ['api', 'web'];
const execFileAsync = promisify(execFile);

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, '0.0.0.0');
  });
}

async function getOccupiedPorts() {
  const availability = await Promise.all(
    requiredPorts.map(async (port) => [port, await isPortAvailable(port)]),
  );

  return availability.filter(([, available]) => !available).map(([port]) => port);
}

async function stopDockerAppContainers() {
  try {
    await execFileAsync('docker', ['compose', 'stop', ...dockerAppServices], {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

async function getPortOwners(ports) {
  try {
    const { stdout } = await execFileAsync('lsof', [
      '-nP',
      ...ports.map((port) => `-iTCP:${port}`),
      '-sTCP:LISTEN',
    ]);

    return stdout.trim();
  } catch {
    return '';
  }
}

async function main() {
  const occupied = await getOccupiedPorts();

  if (occupied.length === 0) {
    return;
  }

  console.log(
    `\n[dev] Ports already in use: ${occupied.join(', ')}. Stopping Docker app containers...`,
  );
  await stopDockerAppContainers();

  const stillOccupied = await getOccupiedPorts();

  if (stillOccupied.length === 0) {
    console.log('[dev] Docker app containers stopped. Starting local dev...\n');
    return;
  }

  const owners = await getPortOwners(stillOccupied);

  console.error('\n[dev] Required ports are still in use:', stillOccupied.join(', '));
  if (owners) {
    console.error('[dev] Port owners:');
    console.error(owners);
  }
  console.error('[dev] Stop the listed process/container, then run `pnpm dev` again.\n');
  process.exit(1);
}

await main();
