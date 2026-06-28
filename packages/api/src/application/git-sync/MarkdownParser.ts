import matter from 'gray-matter';
import { z } from 'zod';

const frontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  status: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  contentType: z.string().optional(),
  difficulty: z.string().optional(),
});

export interface ParsedMarkdown {
  frontmatter: Record<string, unknown>;
  body: string;
}

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
}

export class MarkdownParser {
  parse(rawContent: string): ParsedMarkdown {
    const { data, content } = matter(rawContent);

    return {
      frontmatter: data as Record<string, unknown>,
      body: content.trim(),
    };
  }

  validateFrontmatter(frontmatter: Record<string, unknown>): ValidationResult {
    const result = frontmatterSchema.safeParse(frontmatter);
    const missingFields: string[] = [];
    const warnings: string[] = [];

    if (!result.success) {
      for (const error of result.error.errors) {
        const fieldName = error.path.join('.');
        if (fieldName === 'title' || fieldName === 'slug') {
          missingFields.push(fieldName);
        } else {
          warnings.push(`Optional field "${fieldName}" validation failed: ${error.message}`);
        }
      }
    }

    if (!frontmatter.title) {
      missingFields.push('title');
    }
    if (!frontmatter.slug) {
      missingFields.push('slug');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings,
    };
  }

  getRequiredFields(): string[] {
    return ['title', 'slug', 'status', 'author'];
  }
}
