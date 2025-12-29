const { spawnSync } = require('node:child_process');
const { Client } = require('pg');

const env = process.env.VERCEL_ENV;
const isProd = env === 'production';

if (!isProd) {
  console.log(`[vercel] Skipping prisma migrate deploy (VERCEL_ENV=${env || 'undefined'}).`);
  process.exit(0);
}

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('[vercel] DATABASE_URL is required for migrations.');
  process.exit(1);
}

const run = (cmd, args) => {
  const res = spawnSync(cmd, args, { stdio: 'inherit' });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
};

const resolveFailedMigrations = async () => {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const result = await client.query(
      'SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY started_at ASC',
    );
    return result.rows.filter((row) => !row.finished_at || row.rolled_back_at);
  } catch (error) {
    if (error && error.code === '42P01') {
      console.log('[vercel] No _prisma_migrations table found yet.');
      return [];
    }
    throw error;
  } finally {
    await client.end();
  }
};

const main = async () => {
  const failed = await resolveFailedMigrations();
  if (failed.length) {
    const names = failed.map((row) => row.migration_name);
    const allowReset = process.env.ALLOW_DB_RESET_ON_FAILED_MIGRATIONS === '1';

    if (allowReset) {
      console.log('[vercel] Failed migrations detected. Resetting database...');
      run('npx', ['prisma', 'migrate', 'reset', '--force', '--skip-seed']);
    } else {
      console.log('[vercel] Failed migrations detected. Marking as rolled back:');
      for (const name of names) {
        console.log(`- ${name}`);
        run('npx', ['prisma', 'migrate', 'resolve', '--rolled-back', name]);
      }
    }
  }

  console.log('[vercel] Running prisma migrate deploy...');
  run('npx', ['prisma', 'migrate', 'deploy']);
};

main().catch((error) => {
  console.error('[vercel] Migration unblock failed', error);
  process.exit(1);
});
