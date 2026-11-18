import { createClient, type Client, type InArgs } from '@libsql/client';

let tursoClient: Client | null = null;

export function getTursoClient(): Client | null {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    return null;
  }

  if (!tursoClient) {
    tursoClient = createClient({
      url,
      authToken,
    });
  }

  return tursoClient;
}

export async function executeQuery(sql: string, args?: InArgs) {
  const client = getTursoClient();
  if (!client) {
    throw new Error(
      'Turso database is not configured. Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN.'
    );
  }
  return await client.execute(args ? { sql, args } : sql);
}
