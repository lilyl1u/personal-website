import { Fragment } from 'react';

/**
 * Renders content text, marking any [bracketed] placeholder so it is easy to
 * spot on the page until real details are filled in (see src/content.ts).
 */
export function Txt({ children }: { children: string }) {
  const parts = children.split(/(\[[^\]]*\])/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('[') && part.endsWith(']') ? (
          <mark key={i} className="ph" title="Placeholder: edit in src/content.ts">
            {part.slice(1, -1)}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export const plain = (s: string) => s.replace(/[[\]]/g, '');
