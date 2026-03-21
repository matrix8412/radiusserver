import { execSync } from 'child_process';
import pool from '../db/pool';
import { CertificateMetadata } from '../types';

export async function getCertificates(): Promise<CertificateMetadata[]> {
  const result = await pool.query<CertificateMetadata>(
    'SELECT * FROM certificate_metadata ORDER BY cert_type, name',
  );
  return result.rows;
}

export async function refreshCertificateMetadata(): Promise<CertificateMetadata[]> {
  const certDir = '/etc/raddb/certs';
  const certs = [
    { name: 'CA Certificate', file: 'ca.pem', type: 'ca' },
    { name: 'Server Certificate', file: 'server.pem', type: 'server' },
    { name: 'Client Certificate', file: 'client.pem', type: 'client' },
  ];

  for (const cert of certs) {
    try {
      const filePath = `${certDir}/${cert.file}`;
      const info = execSync(
        `openssl x509 -in ${filePath} -noout -subject -issuer -serial -dates -fingerprint -sha256 2>/dev/null`,
        { encoding: 'utf-8' },
      );

      const subject = info.match(/subject=(.+)/)?.[1]?.trim() || '';
      const issuer = info.match(/issuer=(.+)/)?.[1]?.trim() || '';
      const serial = info.match(/serial=(.+)/)?.[1]?.trim() || '';
      const notBefore = info.match(/notBefore=(.+)/)?.[1]?.trim() || '';
      const notAfter = info.match(/notAfter=(.+)/)?.[1]?.trim() || '';
      const fingerprint = info.match(/sha256 Fingerprint=(.+)/i)?.[1]?.trim() || '';

      await pool.query(
        `INSERT INTO certificate_metadata (name, cert_type, subject, issuer, serial_number, not_before, not_after, fingerprint, file_path)
         VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7::timestamptz, $8, $9)
         ON CONFLICT DO NOTHING`,
        [cert.name, cert.type, subject, issuer, serial,
         notBefore ? new Date(notBefore).toISOString() : null,
         notAfter ? new Date(notAfter).toISOString() : null,
         fingerprint, filePath],
      );
    } catch {
      // Certificate file doesn't exist or can't be read – skip
    }
  }

  return getCertificates();
}

export async function generateCertificates(): Promise<string> {
  try {
    const output = execSync('/app/scripts/generate-certs.sh 2>&1', { encoding: 'utf-8' });
    await refreshCertificateMetadata();
    return output;
  } catch (err) {
    throw new Error(`Certificate generation failed: ${(err as Error).message}`);
  }
}
