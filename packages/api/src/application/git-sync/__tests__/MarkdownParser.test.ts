import { describe, it, expect } from 'vitest';
import { MarkdownParser } from '../MarkdownParser.js';

describe('MarkdownParser', () => {
  const parser = new MarkdownParser();

  describe('parse', () => {
    it('should parse valid markdown with frontmatter', () => {
      const rawContent = `---
title: Test Article
slug: test-article
author: John Doe
status: published
tags:
  - test
  - example
---

# Hello World

This is the body content.`;

      const result = parser.parse(rawContent);

      expect(result.frontmatter).toEqual({
        title: 'Test Article',
        slug: 'test-article',
        author: 'John Doe',
        status: 'published',
        tags: ['test', 'example'],
      });
      expect(result.body).toContain('# Hello World');
      expect(result.body).toContain('This is the body content.');
    });

    it('should handle markdown without frontmatter', () => {
      const rawContent = '# Just a Header\n\nSome content without frontmatter.';

      const result = parser.parse(rawContent);

      expect(result.frontmatter).toEqual({});
      expect(result.body).toBe(rawContent);
    });

    it('should trim body content', () => {
      const rawContent = `---
title: Trim Test
---

# Title

Content here.

`;

      const result = parser.parse(rawContent);

      expect(result.body).toBe('# Title\n\nContent here.');
    });
  });

  describe('validateFrontmatter', () => {
    it('should validate complete frontmatter', () => {
      const frontmatter = {
        title: 'Valid Article',
        slug: 'valid-article',
        status: 'published',
        author: 'Jane Doe',
      };

      const result = parser.validateFrontmatter(frontmatter);

      expect(result.isValid).toBe(true);
      expect(result.missingFields).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should report missing title and slug', () => {
      const frontmatter = {
        status: 'draft',
        author: 'Jane Doe',
      };

      const result = parser.validateFrontmatter(frontmatter);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('title');
      expect(result.missingFields).toContain('slug');
    });

    it('should accept empty frontmatter with warnings', () => {
      const frontmatter = {};

      const result = parser.validateFrontmatter(frontmatter);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('title');
      expect(result.missingFields).toContain('slug');
    });

    it('should handle malformed frontmatter types', () => {
      const frontmatter = {
        title: 123,
        slug: '',
        tags: 'not-an-array',
      };

      const result = parser.validateFrontmatter(frontmatter);

      expect(result.isValid).toBe(false);
    });
  });

  describe('getRequiredFields', () => {
    it('should return the list of required fields', () => {
      const fields = parser.getRequiredFields();

      expect(fields).toContain('title');
      expect(fields).toContain('slug');
      expect(fields).toContain('status');
      expect(fields).toContain('author');
    });
  });
});
