const { execSync } = require('child_process');

const env = process.env.VERCEL_ENV;

if (env === 'production') {
  console.log('[vercel] Running prisma migrate deploy...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} else {
  console.log(`[vercel] Skipping migrations for VERCEL_ENV=${env || 'undefined'}.`);
}
