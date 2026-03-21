import { signToken, verifyToken } from '../src/utils/jwt';

// Override config for testing
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.JWT_EXPIRY = '1h';

describe('JWT Utils', () => {
  const testPayload = { id: 1, username: 'admin' };

  describe('signToken', () => {
    it('should create a valid token string', () => {
      const token = signToken(testPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = signToken(testPayload);
      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(testPayload.id);
      expect(decoded.username).toBe(testPayload.username);
    });

    it('should throw on invalid token', () => {
      expect(() => verifyToken('invalid.token.here')).toThrow();
    });
  });
});
