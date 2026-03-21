import { hashPassword, verifyPassword, formatRadiusPassword } from '../src/utils/password';

describe('Password Utils', () => {
  const testPassword = 'TestP@ssw0rd!';

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const hash = await hashPassword(testPassword);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(testPassword);
      expect(hash.startsWith('$2b$')).toBe(true);
    });

    it('should generate different hashes for same password', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const hash = await hashPassword(testPassword);
      const result = await verifyPassword(testPassword, hash);
      expect(result).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await hashPassword(testPassword);
      const result = await verifyPassword('wrong', hash);
      expect(result).toBe(false);
    });
  });

  describe('formatRadiusPassword', () => {
    it('should return Cleartext-Password format', () => {
      const result = formatRadiusPassword(testPassword);
      expect(result).toEqual({
        attribute: 'Cleartext-Password',
        op: ':=',
        value: testPassword,
      });
    });
  });
});
