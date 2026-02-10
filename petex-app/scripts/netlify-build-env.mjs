import fs from 'node:fs';
import path from 'node:path';

const isNetlify = process.env.NETLIFY === 'true';

if (!isNetlify) {
  process.exit(0);
}

const buildId = process.env.COMMIT_REF || 'local';
const buildTime = new Date().toISOString();
const context = process.env.CONTEXT || 'local';
const deployId = process.env.DEPLOY_ID || '';

const content = [
  `NEXT_PUBLIC_APP_BUILD_ID=${buildId}`,
  `NEXT_PUBLIC_BUILD_TIME=${buildTime}`,
  `NEXT_PUBLIC_NETLIFY_CONTEXT=${context}`,
  `NEXT_PUBLIC_NETLIFY_DEPLOY_ID=${deployId}`,
  '',
].join('\n');

const envPath = path.join(process.cwd(), '.env.production');
fs.writeFileSync(envPath, content, 'utf8');
