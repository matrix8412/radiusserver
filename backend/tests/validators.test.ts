import { sanitizeSearchQuery } from '../src/utils/validators';

describe('Validators', () => {
  describe('sanitizeSearchQuery', () => {
    it('should trim whitespace', () => {
      expect(sanitizeSearchQuery('  hello  ')).toBe('hello');
    });

    it('should remove special characters', () => {
      expect(sanitizeSearchQuery("test'; DROP TABLE--")).not.toContain("'");
      expect(sanitizeSearchQuery("test'; DROP TABLE--")).not.toContain(";");
    });

    it('should handle empty string', () => {
      expect(sanitizeSearchQuery('')).toBe('');
    });
  });
});
