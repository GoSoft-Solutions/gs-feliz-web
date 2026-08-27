import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// Load the monorepo root .env so tests see the same DATABASE_URL /
// MANYCHAT_API_KEY as a locally-run `pnpm dev`, without requiring every
// spec file to do this itself.
loadEnv({ path: resolve(__dirname, '../../../.env') });

process.env.DATABASE_URL ??= 'postgresql://feliz:feliz@localhost:5432/feliz_dev?schema=public';
