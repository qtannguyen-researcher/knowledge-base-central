import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

import { remarkWikiLink } from '@/lib/remark-wiki-link';

async function processMarkdown(
  markdown: string,
  validSlugs: string[],
  titleToSlug?: Map<string, string>,
): Promise<string> {
  const options: { validSlugs: Set<string>; titleToSlug?: Map<string, string> } = {
    validSlugs: new Set(validSlugs),
  };
  if (titleToSlug) {
    options.titleToSlug = titleToSlug;
  }

  const file = await unified()
    .use(remarkParse)
    .use(remarkWikiLink, options)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);
  return String(file);
}

describe('remarkWikiLink', () => {
  const validSlugs = ['intro-to-algorithms', 'binary-search-deep-dive'];

  it('resolves wiki-links by slug', async () => {
    const html = await processMarkdown('See [[intro-to-algorithms]] for more.', validSlugs);
    expect(html).toContain('href="/articles/intro-to-algorithms"');
    expect(html).toContain('intro-to-algorithms');
  });

  it('resolves wiki-links by title', async () => {
    const titleToSlug = new Map([['introduction to algorithms', 'intro-to-algorithms']]);
    const html = await processMarkdown(
      'See [[Introduction to Algorithms]] for more.',
      validSlugs,
      titleToSlug,
    );
    expect(html).toContain('href="/articles/intro-to-algorithms"');
  });

  it('renders unresolved slugs with indicator', async () => {
    const html = await processMarkdown('See [[missing-article]] for more.', validSlugs);
    expect(html).toContain('[unresolved: missing-article]');
    expect(html).toContain('wiki-link-unresolved');
    expect(html).not.toContain('href="/articles/missing-article"');
  });

  it('leaves plain text without wiki-links unchanged', async () => {
    const html = await processMarkdown('No links here.', validSlugs);
    expect(html).toContain('No links here.');
    expect(html).not.toContain('href=');
  });
});
