import { useEffect, useState, useRef, useCallback } from 'react';
import { ANCHOR_CONFIG } from '../../data/factories';
import type { Factory } from '../../types';

interface Props {
  factory: Factory;
  panelBodyRef: React.RefObject<HTMLDivElement | null>;
}

export function AnchorNav({ factory, panelBodyRef }: Props) {
  const anchors = ANCHOR_CONFIG[factory.type] || ANCHOR_CONFIG.external;
  const [activeAnchor, setActiveAnchor] = useState(anchors[0]?.id || '');

  const handleClick = useCallback((anchorId: string) => {
    const target = document.getElementById(`sec-${anchorId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    const panelBody = panelBodyRef.current;
    if (!panelBody) return;

    const handleScroll = () => {
      const sections = panelBody.querySelectorAll('.anchor-section');
      const panelRect = panelBody.getBoundingClientRect();

      let current = '';
      sections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= panelRect.top + 60) {
          current = sec.id.replace('sec-', '');
        }
      });

      if (current) setActiveAnchor(current);
    };

    panelBody.addEventListener('scroll', handleScroll, { passive: true });
    return () => panelBody.removeEventListener('scroll', handleScroll);
  }, [panelBodyRef]);

  return (
    <nav className="anchor-nav">
      {anchors.map((a) => (
        <button
          key={a.id}
          className={`anchor-link${a.id === activeAnchor ? ' active' : ''}`}
          onClick={() => handleClick(a.id)}
        >
          {a.label}
        </button>
      ))}
    </nav>
  );
}
