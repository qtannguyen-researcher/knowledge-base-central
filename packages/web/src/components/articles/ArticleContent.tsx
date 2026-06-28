'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { Components } from 'react-markdown';

import { MermaidDiagram } from '@/components/mermaid/MermaidDiagram';
import { remarkWikiLink } from '@/lib/remark-wiki-link';

interface ArticleContentProps {
  content: string;
  validSlugs: string[];
  titleToSlug?: Map<string, string>;
}

export function ArticleContent({ content, validSlugs, titleToSlug }: ArticleContentProps) {
  const components: Components = {
    a: ({ href, children }) => {
      if (href?.startsWith('/')) {
        return (
          <Link href={href} className="text-brand-600 underline hover:text-brand-700">
            {children}
          </Link>
        );
      }
      return (
        <a
          href={href}
          className="text-brand-600 underline hover:text-brand-700"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    },
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className ?? '');
      const lang = match?.[1];
      const text = String(children).replace(/\n$/, '');

      if (lang === 'mermaid') {
        return <MermaidDiagram chart={text} />;
      }

      const isBlock = className?.includes('language-');
      if (isBlock) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }

      return (
        <code className="rounded bg-gray-100 px-1 py-0.5 text-sm" {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div className="prose prose-gray max-w-none prose-headings:scroll-mt-20 prose-a:text-brand-600">
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          remarkMath,
          [remarkWikiLink, { validSlugs: new Set(validSlugs), titleToSlug }],
        ]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
