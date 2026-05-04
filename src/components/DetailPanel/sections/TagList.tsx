import { useRef, useEffect, useState } from 'react';

interface Props {
  items: string[];
  chipClass?: string;
  collapsible?: boolean;
}

export function TagList({ items, chipClass = 'chip', collapsible = false }: Props) {
  if (!items.length) return null;

  if (!collapsible) {
    return (
      <div className="tag-list">
        {items.map((t, i) => (
          <span key={i} className={chipClass}>{t}</span>
        ))}
      </div>
    );
  }

  return <CollapsibleTagList items={items} chipClass={chipClass} />;
}

function CollapsibleTagList({ items, chipClass }: { items: string[]; chipClass: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [lineHeight, setLineHeight] = useState(34);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || items.length <= 3) return;

    const tags = Array.from(container.querySelectorAll(`.${chipClass}`)) as HTMLElement[];
    if (tags.length < 2) return;

    const firstTop = tags[0].offsetTop;
    let hidden = 0;
    for (const tag of tags) {
      if (tag.offsetTop >= firstTop + tags[0].offsetHeight + 6) {
        hidden++;
      }
    }
    if (!hidden) return;

    setHiddenCount(hidden);
    setLineHeight(tags[0].offsetHeight + 6);
  }, [items, chipClass]);

  if (items.length <= 3 || hiddenCount === 0) {
    return (
      <div className="tag-list">
        {items.map((t, i) => (
          <span key={i} className={chipClass}>{t}</span>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`tag-list-collapsible${collapsed ? ' collapsed' : ''}`}
      ref={containerRef}
      style={collapsed ? { maxHeight: lineHeight } : undefined}
    >
      {items.map((t, i) => (
        <span key={i} className={chipClass}>{t}</span>
      ))}
      <button
        className={`tag-more-btn${collapsed ? ' absolute' : ''}`}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? `+${hiddenCount}` : '▲'}
      </button>
    </div>
  );
}
