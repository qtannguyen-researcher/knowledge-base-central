import { describe, it, expect } from 'vitest';

import { sanitizeText, isXSSPayload } from '../textSanitizer.js';

describe('textSanitizer', () => {
  describe('sanitizeText', () => {
    it('should return empty string for null/undefined input', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(null as unknown as string)).toBe('');
    });

    it('should trim whitespace', () => {
      expect(sanitizeText('  hello world  ')).toBe('hello world');
    });

    it('should strip script tags', () => {
      const input = '<script>alert(1)</script>Hello World';
      const result = sanitizeText(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
      expect(result).toContain('Hello World');
    });

    it('should strip iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>Safe content';
      const result = sanitizeText(input);
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('</iframe>');
      expect(result).toContain('Safe content');
    });

    it('should strip javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">Click me</a>';
      const result = sanitizeText(input);
      expect(result).not.toContain('javascript:');
    });

    it('should strip inline event handlers', () => {
      const input = '<img src="x" onerror="alert(1)">';
      const result = sanitizeText(input);
      expect(result).not.toContain('onerror');
    });

    it('should decode HTML entities', () => {
      const input = '&lt;script&gt;alert(1)&lt;/script&gt;';
      const result = sanitizeText(input);
      expect(result).toBe('<script>alert(1)</script>');
    });

    it('should handle complex XSS payload', () => {
      const input = '<script>alert(String.fromCharCode(88,83,83))</script>';
      const result = sanitizeText(input);
      expect(result).not.toContain('<script>');
    });

    it('should strip all HTML tags', () => {
      const input = '<div><p>Hello <strong>World</strong></p></div>';
      const result = sanitizeText(input);
      expect(result).toBe('Hello World');
    });
  });

  describe('isXSSPayload', () => {
    it('should detect script tags', () => {
      expect(isXSSPayload('<script>alert(1)</script>')).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      expect(isXSSPayload('javascript:alert(1)')).toBe(true);
    });

    it('should detect inline event handlers', () => {
      expect(isXSSPayload('<img onload="alert(1)">')).toBe(true);
      expect(isXSSPayload('<div onclick="evil()">')).toBe(true);
    });

    it('should detect iframe tags', () => {
      expect(isXSSPayload('<iframe src="evil.com"></iframe>')).toBe(true);
    });

    it('should detect object/embed tags', () => {
      expect(isXSSPayload('<object data="evil.swf"></object>')).toBe(true);
      expect(isXSSPayload('<embed src="evil.swf">')).toBe(true);
    });

    it('should detect link/style tags', () => {
      expect(isXSSPayload('<link rel="stylesheet" href="evil.css">')).toBe(true);
      expect(isXSSPayload('<style>@import</style>')).toBe(true);
    });

    it('should return false for safe text', () => {
      expect(isXSSPayload('Hello, this is a normal comment!')).toBe(false);
      expect(isXSSPayload('Plain text without any HTML')).toBe(false);
    });
  });
});
