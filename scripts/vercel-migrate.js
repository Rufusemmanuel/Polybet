const { spawnSync } = require('node:child_process');

const env = process.env.VERCEL_ENV;
const isProd = env === 'production';

if (!isProd) {
  console.log(`[vercel] Skipping prisma migrate deploy (VERCEL_ENV=${env || 'undefined'}).`);
  process.exit(0);
}

console.log('[vercel] Running prisma migrate deploy...');
const res = spawnSync('npx', ['prisma', 'migrate', 'deploy'], { stdio: 'inherit' });
process.exit(res.status ?? 1);
