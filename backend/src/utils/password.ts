import bcrypt from 'bcrypt';
import config from '../config';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, config.bcryptRounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Generates a Cleartext-Password value for FreeRADIUS radcheck table.
 * FreeRADIUS PAP compares against this value directly.
 * We store plaintext here because FreeRADIUS PAP requires it for comparison.
 * The password_hash in radius_users (admin-facing) uses bcrypt.
 */
export function formatRadiusPassword(plain: string): string {
  return plain;
}
