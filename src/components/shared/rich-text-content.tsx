'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

interface RichTextContentProps {
  html: string | null | undefined;
  className?: string;
}

/** Renders Tiptap-authored HTML, sanitized defensively since it round-trips through the API. */
export function RichTextContent({ html, className }: RichTextContentProps) {
  const clean = useMemo(() => {
    if (!html) return '';
    if (typeof window === 'undefined') return html;
    return DOMPurify.sanitize(html);
  }, [html]);

  if (!clean) return null;

  return (
    <div
      className={cn('prose prose-sm max-w-none prose-headings:font-semibold prose-p:my-1.5', className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
