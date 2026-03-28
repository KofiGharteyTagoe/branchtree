import { describe, it, expect } from 'vitest';
import { isValidEmail, isStrongPassword, sanitizeString } from '../utils/validation.js';

describe('isValidEmail', () => {
  it('should accept a valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('should accept emails with subdomains', () => {
    expect(isValidEmail('user@mail.example.com')).toBe(true);
  });

  it('should reject an email without @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('should reject an email with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
  });

  it('should reject an email that is too long', () => {
    const longLocal = 'a'.repeat(250);
    expect(isValidEmail(`${longLocal}@example.com`)).toBe(false);
  });
});

describe('isStrongPassword', () => {
  it('should reject a password that is too short', () => {
    const result = isStrongPassword('Ab1');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/at least 12 characters/);
  });

  it('should reject a password with no uppercase letter', () => {
    const result = isStrongPassword('abcdefghij1k');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/uppercase/);
  });

  it('should reject a password with no digit', () => {
    const result = isStrongPassword('abcdefghijKl');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/digit/);
  });

  it('should reject a password with no lowercase letter', () => {
    const result = isStrongPassword('ABCDEFGHIJ1K');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/lowercase/);
  });

  it('should accept a strong password', () => {
    const result = isStrongPassword('MyStr0ngPassw0rd');
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });
});

describe('sanitizeString', () => {
  it('should trim whitespace from both ends', () => {
    expect(sanitizeString('  hello  ', 100)).toBe('hello');
  });

  it('should truncate to the specified max length', () => {
    expect(sanitizeString('abcdefghij', 5)).toBe('abcde');
  });

  it('should trim before truncating', () => {
    expect(sanitizeString('  abcdef  ', 3)).toBe('abc');
  });

  it('should return an empty string when given only spaces and maxLength 0', () => {
    expect(sanitizeString('   ', 0)).toBe('');
  });
});
