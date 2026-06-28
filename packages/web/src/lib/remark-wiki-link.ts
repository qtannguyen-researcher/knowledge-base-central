import type { Root, Text } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

const WIKI_LINK_PATTERN = /\[\[([^\]]+)\]\]/g;

export interface WikiLinkOptions {
  validSlugs: Set<string>;
  titleToSlug?: Map<string, string>;
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function resolveSlug(
  target: string,
  validSlugs: Set<string>,
  titleToSlug?: Map<string, string>,
): { slug: string; resolved: boolean } {
  const trimmed = target.trim();
  if (validSlugs.has(trimmed)) {
    return { slug: trimmed, resolved: true };
  }

  const fromTitle = titleToSlug?.get(trimmed.toLowerCase());
  if (fromTitle && validSlugs.has(fromTitle)) {
    return { slug: fromTitle, resolved: true };
  }

  const slugified = slugifyTitle(trimmed);
  if (validSlugs.has(slugified)) {
    return { slug: slugified, resolved: true };
  }

  return { slug: slugified || trimmed, resolved: false };
}

export const remarkWikiLink: Plugin<[WikiLinkOptions], Root> = (options) => {
  const { validSlugs, titleToSlug } = options;

  return (tree) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (index === undefined || !parent || parent.type === 'link') return;

      const value = node.value;
      if (!WIKI_LINK_PATTERN.test(value)) {
        WIKI_LINK_PATTERN.lastIndex = 0;
        return;
      }
      WIKI_LINK_PATTERN.lastIndex = 0;

      const parts: Array<
        Text | { type: 'link'; url: string; children: Text[] } | { type: 'html'; value: string }
      > = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = WIKI_LINK_PATTERN.exec(value)) !== null) {
        if (match.index > lastIndex) {
          parts.push({ type: 'text', value: value.slice(lastIndex, match.index) });
        }

        const target = match[1]!;
        const { slug, resolved } = resolveSlug(target, validSlugs, titleToSlug);

        if (resolved) {
          parts.push({
            type: 'link',
            url: `/articles/${slug}`,
            children: [{ type: 'text', value: target }],
          });
        } else {
          parts.push({
            type: 'html',
            value: `<span class="wiki-link-unresolved" title="Unresolved link">[unresolved: ${slug}]</span>`,
          });
        }

        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < value.length) {
        parts.push({ type: 'text', value: value.slice(lastIndex) });
      }

      if (parts.length > 1) {
        parent.children.splice(index, 1, ...parts);
        return index + parts.length;
      }
    });
  };
};
