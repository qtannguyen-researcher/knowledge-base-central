'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
    const el = containerRef.current;
    if (!el) return;

    const id = `mermaid-${Math.random().toString(36).slice(2)}`;
    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        el.innerHTML = svg;
      })
      .catch(() => {
        el.textContent = chart;
      });
  }, [chart]);

  return (
    <div ref={containerRef} className="my-4 overflow-x-auto" role="img" aria-label="Diagram" />
  );
}
