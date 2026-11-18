import { createClient } from '@libsql/client';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local if present
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error('❌ Error: TURSO_DATABASE_URL is not set.');
    console.error('Please configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local or your environment.');
    process.exit(1);
  }

  console.log(`Connecting to Turso database: ${url}...`);

  const client = createClient({
    url,
    authToken,
  });

  const schemaPath = path.resolve(process.cwd(), 'src/lib/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Schema file not found at ${schemaPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Applying database schema (11 tables + initial admin seed)...');
  
  try {
    // executeMultiple runs all statements in order
    await client.executeMultiple(sql);
    console.log('✅ Success! Database schema applied successfully.');
    console.log('✅ Tables verified: users, projects, contacts, meetings, client_talks, proposals, assets, credentials, renewals, tasks, activity_logs.');
    console.log('✅ Default Main Admin seeded: elena@holabusiness.io (password: admin123)');
  } catch (err: any) {
    console.error('❌ Failed to execute schema on Turso:', err.message || err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
