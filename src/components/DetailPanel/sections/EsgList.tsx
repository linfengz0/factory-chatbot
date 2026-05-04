import { splitCSV } from '../../../utils/helpers';

export function EsgList({ esg }: { esg: string | null | undefined }) {
  if (!esg) return <div className="empty-state">No ESG certification records</div>;

  const items = splitCSV(esg);

  return (
    <div className="esg-list">
      {items.map((e, i) => (
        <div className="esg-card" key={i}>
          <div className="esg-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M9 15l2 2 4-4" />
            </svg>
          </div>
          <div className="esg-name">{e}</div>
        </div>
      ))}
    </div>
  );
}
