import net from 'node:net';

const requiredPorts = [3000, 3001, 3002];

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

async function main() {
  const availability = await Promise.all(
    requiredPorts.map(async (port) => [port, await isPortAvailable(port)]),
  );

  const occupied = availability.filter(([, available]) => !available).map(([port]) => port);

  if (occupied.length === 0) {
    return;
  }

  console.error('\n[dev] Required ports are already in use:', occupied.join(', '));
  console.error('[dev] This usually happens when Docker dev containers are running.');
  console.error('[dev] Stop containers first (for local dev):');
  console.error('      docker compose down');
  console.error('[dev] Or continue using Docker and do not run local `pnpm dev` in parallel.\n');
  process.exit(1);
}

await main();
