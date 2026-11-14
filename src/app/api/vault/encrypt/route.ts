import { NextResponse } from 'next/server';
import { z } from 'zod';
import { encryptSecret } from '@/lib/crypto';

const encryptSchema = z.object({
  plaintext: z.string().min(1, 'Secret value is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = encryptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const encrypted = encryptSecret(parsed.data.plaintext);
    return NextResponse.json(encrypted);
  } catch (err) {
    console.error('Vault encrypt error:', err);
    return NextResponse.json(
      { error: 'Failed to encrypt credential' },
      { status: 500 }
    );
  }
}
