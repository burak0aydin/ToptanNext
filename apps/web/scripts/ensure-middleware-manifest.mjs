import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const manifestPath = path.join(process.cwd(), '.next', 'server', 'middleware-manifest.json');
const manifestContent = JSON.stringify(
  {
    version: 3,
    middleware: {},
    functions: {},
    sortedMiddleware: [],
  },
  null,
  2,
);

async function ensureManifest() {
  try {
    await access(manifestPath);
    return;
  } catch {
    // Manifest is missing; create a safe default so Next.js dev server won't crash.
  }

  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${manifestContent}\n`, 'utf8');
}

await ensureManifest();
