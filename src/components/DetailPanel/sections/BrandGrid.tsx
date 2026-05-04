interface Props {
  brands: string[];
  showIndicator?: boolean;
}

export function BrandGrid({ brands, showIndicator = false }: Props) {
  if (!brands.length) return null;

  return (
    <div className="brand-card-grid">
      {brands.map((b, i) => (
        <div className="brand-card" key={i}>
          {b}
          {showIndicator && <span className="brand-indicator">Key</span>}
        </div>
      ))}
    </div>
  );
}
