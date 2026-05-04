import { splitCSV } from '../../../utils/helpers';

export function ImageGrid({ urls }: { urls: string | null | undefined }) {
  const items = splitCSV(urls);
  if (!items.length) return null;

  return (
    <div className="image-grid">
      {items.map((u, i) => (
        <img key={i} src={u} alt="Product" />
      ))}
    </div>
  );
}
