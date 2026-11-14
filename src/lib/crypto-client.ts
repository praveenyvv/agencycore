import type { } from 'react';

export function maskSecret(length = 12): string {
  return '•'.repeat(length);
}
