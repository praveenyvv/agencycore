import { NextResponse } from 'next/server';
import { z } from 'zod';
import { decryptSecret } from '@/lib/crypto';

const decryptSchema = z.object({
  encrypted_secret: z.string().min(1),
  iv: z.string().min(1),
  auth_tag: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = decryptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid encrypted payload' },
        { status: 400 }
      );
    }

    const plaintext = decryptSecret(parsed.data);
    return NextResponse.json({ plaintext });
  } catch (err) {
    console.error('Vault decrypt error:', err);
    return NextResponse.json(
      { error: 'Failed to decrypt credential' },
      { status: 500 }
    );
  }
}
