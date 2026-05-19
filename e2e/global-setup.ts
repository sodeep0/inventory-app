import { execSync } from 'child_process';
import path from 'path';

function extractJwt(output: string): string {
  const match = output.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
  if (!match) {
    throw new Error(`No JWT found in seed output:\n${output}`);
  }
  return match[0];
}

export default async function globalSetup(): Promise<void> {
  const backendDir = path.join(__dirname, '../backend');
  const output = execSync('npm run seed:e2e', {
    cwd: backendDir,
    encoding: 'utf-8',
    env: process.env,
  });
  process.env.E2E_TOKEN = extractJwt(output);
}
