import { useState } from 'react';
import type { ExternalFactory as EFactory } from '../../types';
import { splitCSV } from '../../utils/helpers';
import { KvList } from './sections/KvList';
import { TagList } from './sections/TagList';
import { EsgList } from './sections/EsgList';
import { BrandGrid } from './sections/BrandGrid';
import { EmailList } from './sections/EmailList';
import { PhoneList } from './sections/PhoneList';
import { ImageGrid } from './sections/ImageGrid';

interface Props {
  factory: EFactory;
}

export function ExternalFactory({ factory: f }: Props) {
  const imgUrls = splitCSV(f.productimages);
  const webUrls = splitCSV(f.websites);
  const phoneList = splitCSV(f.phones);
  const histSubcats = f.historysubcategory
    ? f.historysubcategory.split(/,\s*\n/).map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <>
      <div className="anchor-section" id="sec-basic">
        <div className="info-section">
          <div className="info-section-title">General Information</div>
          <KvList
            items={[
              { key: 'CoO', val: f.coostring },
              { key: 'Business Type', val: f.businesstype },
              { key: 'Year Founded', val: f.yearfounded },
              { key: 'Employee Count', val: f.employeecount },
              { key: 'Address', val: f.address },
            ]}
          />
        </div>

        <div className="info-section">
          <div className="info-section-title">Description</div>
          <Description text={f.description} />
        </div>

        <div className="info-section">
          <div className="info-section-title">Websites</div>
          <WebsiteList urls={webUrls} />
        </div>
      </div>

      <div className="anchor-section" id="sec-contact">
        <div className="info-section">
          <div className="info-section-title">Emails</div>
          <EmailList emails={f.emails} />
        </div>
        <div className="info-section">
          <div className="info-section-title">Phones</div>
          <PhoneList phones={f.phones} />
        </div>
      </div>

      <div className="anchor-section" id="sec-categories">
        <div className="info-section">
          <div className="info-section-title">Subcategory</div>
          <TagList items={splitCSV(f.subcategory)} />
        </div>
        <div className="info-section">
          <div className="info-section-title">Subcategory With Order Record</div>
          <div className="history-subcat-list">
            {histSubcats.map((s, i) => (
              <div className="history-subcat-item" key={i}>{s}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="anchor-section" id="sec-customers">
        <div className="info-section">
          <div className="info-section-title">Main Customer</div>
          <BrandGrid brands={splitCSV(f.mainhistorybrand)} />
        </div>
        <div className="info-section">
          <div className="info-section-title">Key Export Market</div>
          <TagList items={splitCSV(f.keyexportmarket)} chipClass="chip chip-purple" />
        </div>
      </div>

      <div className="anchor-section" id="sec-esg">
        <div className="info-section">
          <div className="info-section-title">ESG</div>
          <EsgList esg={f.esg} />
        </div>
      </div>

      <div className="anchor-section" id="sec-images">
        <div className="info-section">
          <div className="info-section-title">Logo</div>
          <img
            src={f.logo || ''}
            alt="Logo"
            style={{ maxWidth: 200, maxHeight: 120, objectFit: 'contain', borderRadius: 10, border: '1px solid var(--ls-border)', background: 'var(--ls-surface)', padding: 8 }}
          />
        </div>
        <div className="info-section">
          <div className="info-section-title">Product Images</div>
          <ImageGrid urls={f.productimages} />
        </div>
      </div>
    </>
  );
}

/* ----------------------------------------------------
   Sub-components for external factory
   ---------------------------------------------------- */

function Description({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const refCallback = (el: HTMLParagraphElement | null) => {
    if (el && el.scrollHeight > el.clientHeight + 2) {
      setNeedsCollapse(true);
    }
  };

  return (
    <div>
      <p className={`desc-text${expanded ? ' expanded' : ''}`} ref={refCallback}>
        {text}
      </p>
      {needsCollapse && (
        <button className="collapse-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? '▲' : 'show more'}
        </button>
      )}
    </div>
  );
}

function WebsiteList({ urls }: { urls: string[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!urls.length) return null;
  if (urls.length === 1) {
    return (
      <a href={urls[0]} target="_blank" rel="noopener noreferrer" className="website-link-item">
        {urls[0]}
      </a>
    );
  }

  return (
    <div className={`website-list${expanded ? ' expanded' : ''}`}>
      {urls.map((url, i) => (
        <a
          key={i}
          className={`website-link-item${i > 0 ? ' website-hidden' : ''}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {url}
        </a>
      ))}
      <button className="collapse-btn" onClick={() => setExpanded(!expanded)}>
        {expanded ? '▲' : 'show more'}
      </button>
    </div>
  );
}
