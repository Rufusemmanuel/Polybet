import 'server-only';

type BuilderCreds = {
  apiKey: string;
  secret: string;
  passphrase: string;
};

if (typeof window !== 'undefined') {
  throw new Error('builderCreds must not be imported in the browser.');
}

const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required server env var: ${key}`);
  }
  return value;
};

const forbidPublicEnv = (key: string) => {
  if (process.env[key]) {
    throw new Error(`Forbidden public env var set: ${key}`);
  }
};

forbidPublicEnv('NEXT_PUBLIC_POLY_BUILDER_API_KEY');
forbidPublicEnv('NEXT_PUBLIC_POLY_BUILDER_SECRET');
forbidPublicEnv('NEXT_PUBLIC_POLY_BUILDER_PASSPHRASE');

export const BUILDER_CREDS: BuilderCreds = {
  apiKey: requireEnv('POLY_BUILDER_API_KEY'),
  secret: requireEnv('POLY_BUILDER_SECRET'),
  passphrase: requireEnv('POLY_BUILDER_PASSPHRASE'),
};
