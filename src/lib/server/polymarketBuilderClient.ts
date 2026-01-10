import 'server-only';

import { ClobClient, Chain } from '@polymarket/clob-client';
import { BuilderConfig } from '@polymarket/builder-signing-sdk';
import { BUILDER_CREDS } from './builderCreds';

const CLOB_HOST =
  process.env.POLYMARKET_CLOB_URL ?? 'https://clob.polymarket.com';

const builderConfig = new BuilderConfig({
  localBuilderCreds: {
    key: BUILDER_CREDS.apiKey,
    secret: BUILDER_CREDS.secret,
    passphrase: BUILDER_CREDS.passphrase,
  },
});

export const getBuilderClient = () =>
  new ClobClient(
    CLOB_HOST,
    Chain.POLYGON,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    builderConfig,
  );
