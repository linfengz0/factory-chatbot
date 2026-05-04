import { useState, useEffect } from 'react';
import type { InternalFactory as IFactory, CapacityRow } from '../../types';
import { splitCSV } from '../../utils/helpers';
import { fetchCapacity, type CapacityApiItem } from '../../services/api';
import { KvList } from './sections/KvList';
import { TagList } from './sections/TagList';
import { EsgList } from './sections/EsgList';
import { BrandGrid } from './sections/BrandGrid';
import { CapacityTable } from './sections/CapacityTable';

function mapToCapacityRow(item: CapacityApiItem): CapacityRow {
  return {
    month: item.month,
    original: item.originalCapacity,
    totalDemand: item.totalDemand,
    remaining: item.remainingCapacity,
    status: item.status,
  };
}

interface Props {
  factory: IFactory;
}

export function InternalFactory({ factory: f }: Props) {
  const [capacity, setCapacity] = useState<CapacityRow[]>([]);
  const [capacityError, setCapacityError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCapacityError(null);
    fetchCapacity(f.factoryid)
      .then((items) => {
        if (!cancelled) setCapacity(items.map(mapToCapacityRow));
      })
      .catch((err: Error) => {
        if (!cancelled) setCapacityError(err.message);
      });
    return () => { cancelled = true; };
  }, [f.factoryid]);

  const auditVal = f.partyaudit3rd === 1 ? 'Yes' : 'No';

  return (
    <>
      <div className="anchor-section" id="sec-basic">
        <div className="info-section">
          <div className="info-section-title">General Information</div>
          <KvList
            items={[
              { key: 'Positioning', val: f.positioning },
              { key: 'Price Point', val: f.pricepoint },
              { key: 'CoO', val: f.coostring },
              { key: 'Trade Term', val: f.tradeterm },
              { key: 'Minimum Order Qty', val: f.moq },
              { key: 'Accept 3rd Party Audit', val: auditVal },
              { key: 'Create Date', val: f.createddate },
            ]}
          />
        </div>
      </div>

      <div className="anchor-section" id="sec-categories">
        <div className="info-section">
          <div className="info-section-title">Subcategory With Order Record</div>
          <TagList items={splitCSV(f.historysubcategory)} chipClass="chip chip-lg chip-purple" />
        </div>

        <div className="info-section">
          <div className="info-section-title">Subcategory</div>
          <TagList items={splitCSV(f.subcategory)} collapsible />
        </div>

        <div className="info-section">
          <div className="info-section-title">Gender</div>
          <TagList items={splitCSV(f.categorysplit)} chipClass="chip chip-gray" />
        </div>
      </div>

      <div className="anchor-section" id="sec-vap">
        <div className="info-section">
          <div className="info-section-title">VAP (In House)</div>
          <TagList items={splitCSV(f.inhousevap)} chipClass="chip-subtle" />
        </div>
        <div className="info-section">
          <div className="info-section-title">VAP (Outsource)</div>
          <TagList items={splitCSV(f.outsourcevap)} chipClass="chip-subtle" />
        </div>
      </div>

      <div className="anchor-section" id="sec-esg">
        <div className="info-section">
          <div className="info-section-title">ESG</div>
          <EsgList esg={f.esg} />
        </div>
      </div>

      <div className="anchor-section" id="sec-customers">
        <div className="info-section">
          <div className="info-section-title">Customer With Order Record</div>
          <BrandGrid brands={splitCSV(f.historyservicedbrand)} />
        </div>
        {f.mainhistorybrand && (
          <div className="info-section">
            <div className="info-section-title">Main Customer</div>
            <BrandGrid brands={splitCSV(f.mainhistorybrand)} />
          </div>
        )}
      </div>

      <div className="anchor-section" id="sec-capacity">
        <div className="info-section">
          <div className="info-section-title">Capacity</div>
          <p className="msg-footnote" style={{ marginBottom: 12 }}>
            Remaining Capacity = Original Capacity &minus; Total Demand
          </p>
          {capacityError ? (
            <p className="msg-footnote" style={{ color: 'var(--ls-danger)' }}>
              Failed to load capacity data: {capacityError}
            </p>
          ) : (
            <CapacityTable data={capacity} />
          )}
        </div>
        <div style={{ height: 300 }} />
      </div>
    </>
  );
}
