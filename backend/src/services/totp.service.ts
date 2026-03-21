import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import pool from '../db/pool';

authenticator.options = {
  digits: 6,
  step: 30,
  window: 1,
};

export async function setupTotp(userId: number): Promise<{ secret: string; qrCodeUrl: string; otpauthUrl: string }> {
  const userResult = await pool.query(
    'SELECT username, totp_enabled, totp_verified FROM radius_users WHERE id = $1',
    [userId],
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];

  // Generate new secret
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(user.username, 'RadiusServer', secret);
  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

  // Store secret (not yet verified)
  await pool.query(
    'UPDATE radius_users SET totp_secret = $1, totp_enabled = true, totp_verified = false WHERE id = $2',
    [secret, userId],
  );

  return { secret, qrCodeUrl, otpauthUrl };
}

export async function verifyTotpSetup(userId: number, token: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT totp_secret FROM radius_users WHERE id = $1 AND totp_enabled = true AND totp_verified = false',
    [userId],
  );

  if (result.rows.length === 0) {
    throw new Error('TOTP setup not in progress');
  }

  const secret = result.rows[0].totp_secret;
  const isValid = authenticator.check(token, secret);

  if (isValid) {
    await pool.query(
      'UPDATE radius_users SET totp_verified = true WHERE id = $1',
      [userId],
    );
  }

  return isValid;
}

export async function disableTotp(userId: number): Promise<void> {
  await pool.query(
    'UPDATE radius_users SET totp_enabled = false, totp_verified = false, totp_secret = NULL WHERE id = $1',
    [userId],
  );
}

export async function validateTotp(username: string, token: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT totp_secret FROM radius_users WHERE username = $1 AND totp_enabled = true AND totp_verified = true',
    [username],
  );

  if (result.rows.length === 0) {
    return false;
  }

  return authenticator.check(token, result.rows[0].totp_secret);
}
