import { splitCSV } from '../../../utils/helpers';

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22 6 12 13 2 6" />
  </svg>
);

export function EmailList({ emails }: { emails: string | null | undefined }) {
  const items = splitCSV(emails);
  if (!items.length) return null;

  return (
    <div className="email-list">
      {items.map((e, i) => (
        <a href={`mailto:${e}`} className="email-card" key={i}>
          <MailIcon />
          <span>{e}</span>
        </a>
      ))}
    </div>
  );
}
