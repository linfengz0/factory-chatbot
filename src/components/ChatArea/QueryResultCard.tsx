import { useState } from 'react';
import * as XLSX from 'xlsx';
import type { QueryResultState, QueryResultRow, InternalFactory, ExternalFactory } from '../../types';
import { useChatDispatch } from '../../context/ChatContext';

interface Props {
  data: QueryResultState;
}

const FIXED_COLUMNS: Record<string, string> = {
  factoryname: 'Factory Name',
  moq: 'MOQ',
  coostring: 'Country',
  factorystatus: 'Status',
};

const DYNAMIC_LABELS: Record<string, string> = {
  subcategory: 'Sub Category',
  historysubcategory: 'History Sub Category',
  inhousevap: 'In-house Process',
  outsourcevap: 'Outsource Process',
  esg: 'ESG Certification',
  historyservicedbrand: 'History Serviced Brand',
  mainhistorybrand: 'Main History Brand',
  positioning: 'Market Positioning',
  pricepoint: 'Price Point',
  tradeterm: 'Trade Terms',
  annual_revenue: 'Annual Revenue',
  productCat: 'Product Category',
  month: 'Month',
  originalCapacity: 'Original Capacity',
  totalDemand: 'Total Demand',
  remainingCapacity: 'Remaining Capacity',
  status: 'Capacity Status',
};

const DISPLAY_LIMIT = 20;
const COLLAPSE_LIMIT = 12;

const CAPACITY_COLUMNS = ['productCat', 'month', 'originalCapacity', 'totalDemand', 'remainingCapacity', 'status'];

// ----- capacity types -----

interface CapacityMonth {
  month: string;
  monthLabel: string;
  originalCapacity: number;
  totalDemand: number;
  remainingCapacity: number;
  status: string;
}

interface CapacityResultItem {
  productCat: string;
  months: CapacityMonth[];
}

interface DisplayRow {
  rowData: QueryResultRow;
  isFirstSubRow: boolean;
  infoRowSpan: number;
  productCat: string;
  month: string;
  originalCapacity: string | number;
  totalDemand: string | number;
  remainingCapacity: string | number;
  capacityStatus: string;
}

// ----- helpers -----

function colLabel(col: string): string {
  return FIXED_COLUMNS[col] || DYNAMIC_LABELS[col] || col.toUpperCase();
}

function cellDisplay(full: string, shouldTruncate: boolean): { text: string; title?: string } {
  if (!shouldTruncate || full.length <= 10) return { text: full };
  return { text: full.slice(0, 10) + '...', title: full };
}

function TruncatedTd({ value, rowSpan }: { value: string; rowSpan?: number }) {
  const { text, title } = cellDisplay(value, true);
  return <td rowSpan={rowSpan} title={title}>{text}</td>;
}

function CapacityTd({ value }: { value: string | number }) {
  const str = typeof value === 'string' ? value : value.toLocaleString();
  const { text, title } = cellDisplay(str, true);
  return <td title={title}>{text}</td>;
}

function normalizeCapacityResult(raw: unknown): CapacityResultItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as CapacityResultItem[];
  if (typeof raw === 'object') return [raw as CapacityResultItem];
  return [];
}

function emptyCapacityRow(row: QueryResultRow): DisplayRow {
  return {
    rowData: row,
    isFirstSubRow: true,
    infoRowSpan: 1,
    productCat: '—',
    month: '—',
    originalCapacity: '—',
    totalDemand: '—',
    remainingCapacity: '—',
    capacityStatus: '—',
  };
}

function flattenRows(rows: QueryResultRow[], hasCapacityResult: boolean): DisplayRow[] {
  if (!hasCapacityResult) {
    return rows.map((row) => ({
      rowData: row,
      isFirstSubRow: true,
      infoRowSpan: 1,
      productCat: '',
      month: '',
      originalCapacity: '',
      totalDemand: '',
      remainingCapacity: '',
      capacityStatus: '',
    }));
  }

  const result: DisplayRow[] = [];
  for (const row of rows) {
    const capResults = normalizeCapacityResult(row.capacity_result);
    if (capResults.length === 0) {
      result.push(emptyCapacityRow(row));
      continue;
    }

    let totalSubRows = 0;
    for (const cr of capResults) {
      totalSubRows += Array.isArray(cr.months) ? cr.months.length : 0;
    }
    if (totalSubRows === 0) {
      result.push(emptyCapacityRow(row));
      continue;
    }

    let subRowIndex = 0;
    for (const cr of capResults) {
      const months = Array.isArray(cr.months) ? cr.months : [];
      for (const m of months) {
        result.push({
          rowData: row,
          isFirstSubRow: subRowIndex === 0,
          infoRowSpan: totalSubRows,
          productCat: cr.productCat ?? '',
          month: m.month ?? '',
          originalCapacity: m.originalCapacity ?? 0,
          totalDemand: m.totalDemand ?? 0,
          remainingCapacity: m.remainingCapacity ?? 0,
          capacityStatus: m.status ?? '',
        });
        subRowIndex++;
      }
    }
  }
  return result;
}

function toInternalFactory(row: QueryResultRow): InternalFactory {
  return {
    type: 'internal',
    id: String(row.id ?? ''),
    factoryid: String(row.factoryid ?? ''),
    factorystatus: String(row.factorystatus ?? ''),
    factoryname: String(row.factoryname ?? ''),
    subcategory: String(row.subcategory ?? ''),
    historysubcategory: String(row.historysubcategory ?? ''),
    esg: row.esg ? String(row.esg) : '',
    moq: Number(row.moq ?? 0),
    coostring: String(row.coostring ?? ''),
    inhousevap: String(row.inhousevap ?? ''),
    outsourcevap: String(row.outsourcevap ?? ''),
    partyaudit3rd: Number(row.partyaudit3rd ?? 0),
    positioning: String(row.positioning ?? ''),
    pricepoint: String(row.pricepoint ?? ''),
    tradeterm: String(row.tradeterm ?? ''),
    historyservicedbrand: String(row.historyservicedbrand ?? ''),
    mainhistorybrand: String(row.mainhistorybrand ?? ''),
    factorycodelong: String(row.factorycodelong ?? ''),
    factorycodeshort: String(row.factorycodeshort ?? ''),
    categorysplit: String(row.categorysplit ?? ''),
    createddate: String(row.createddate ?? ''),
    capacity: [],
  };
}

function toExternalFactory(row: QueryResultRow): ExternalFactory {
  return {
    type: 'external',
    id: null,
    factoryname: String(row.factoryname ?? ''),
    coostring: String(row.coostring ?? ''),
    productimages: row.productimages ? String(row.productimages) : null,
    description: String(row.description ?? ''),
    historysubcategory: String(row.historysubcategory ?? ''),
    logo: row.logo ? String(row.logo) : null,
    employeecount: String(row.employeecount ?? ''),
    keyexportmarket: String(row.keyexportmarket ?? ''),
    esg: row.esg ? String(row.esg) : '',
    subcategory: String(row.subcategory ?? ''),
    emails: String(row.emails ?? ''),
    phones: String(row.phones ?? ''),
    mainhistorybrand: String(row.mainhistorybrand ?? ''),
    yearfounded: String(row.yearfounded ?? ''),
    address: String(row.address ?? ''),
    businesstype: String(row.businesstype ?? ''),
    websites: String(row.websites ?? ''),
  };
}

function factoryFromRow(row: QueryResultRow): InternalFactory | ExternalFactory {
  if (row.type === 'External Factory') {
    return toExternalFactory(row);
  }
  return toInternalFactory(row);
}

function exportExcel(rows: QueryResultRow[], extraColumns: string[]) {
  const hasCapacityResult = extraColumns.includes('capacity_result');
  const infoExtraColumns = extraColumns.filter((c) => c !== 'capacity_result');
  const allInfoColumns = [...Object.keys(FIXED_COLUMNS), ...infoExtraColumns];
  const nonFactoryInfoColumns = allInfoColumns.filter((c) => c !== 'factoryname');
  const allColumns = hasCapacityResult
    ? ['factoryname', ...CAPACITY_COLUMNS, ...nonFactoryInfoColumns]
    : allInfoColumns;
  const headers = allColumns.map(colLabel);

  const data: string[][] = [];
  for (const row of rows) {
    const factoryName = row.factoryname != null ? String(row.factoryname) : '';
    const otherInfoVals = nonFactoryInfoColumns.map((c) => (row[c] != null ? String(row[c]) : ''));
    const capacityVals = (productCat: string, month: string, orig: string | number, demand: string | number, remain: string | number, status: string) =>
      [productCat, month, String(orig ?? ''), String(demand ?? ''), String(remain ?? ''), status];

    const capResults = hasCapacityResult ? normalizeCapacityResult(row.capacity_result) : [];
    if (capResults.length > 0) {
      let hasMonths = false;
      for (const cr of capResults) {
        const months = Array.isArray(cr.months) ? cr.months : [];
        for (const m of months) {
          hasMonths = true;
          data.push([
            factoryName,
            ...capacityVals(cr.productCat ?? '', m.month ?? '', m.originalCapacity ?? '', m.totalDemand ?? '', m.remainingCapacity ?? '', m.status ?? ''),
            ...otherInfoVals,
          ]);
        }
      }
      if (!hasMonths) {
        data.push([factoryName, ...capacityVals('—', '—', '—', '—', '—', '—'), ...otherInfoVals]);
      }
    } else {
      data.push(
        hasCapacityResult
          ? [factoryName, ...capacityVals('—', '—', '—', '—', '—', '—'), ...otherInfoVals]
          : [factoryName, ...otherInfoVals]
      );
    }
  }

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '工厂列表');

  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  XLSX.writeFile(wb, `factory_export_${ts}.xlsx`);
}

// ================================================================
export function QueryResultCard({ data }: Props) {
  const dispatch = useChatDispatch();

  if (data.isError) {
    return (
      <div className="qr-card qr-error">
        <div className="qr-error-icon">!</div>
        <div className="qr-error-msg">{data.errorMessage || '查询出错'}</div>
      </div>
    );
  }

  const rows = data.rows || [];
  const extraColumns = data.extraColumns || [];

  if (rows.length === 0) {
    return (
      <div className="qr-card qr-error">
        <div className="qr-error-icon">!</div>
        <div className="qr-error-msg">No matching factories found.</div>
      </div>
    );
  }

  const hasCapacityResult = extraColumns.includes('capacity_result');

  // info columns = fixed + extra (excluding the capacity_result key itself)
  const infoExtraColumns = extraColumns.filter((c) => c !== 'capacity_result');
  const allInfoColumns = [...Object.keys(FIXED_COLUMNS), ...infoExtraColumns];
  // capacity columns sit right after factoryname
  const nonFactoryInfoColumns = allInfoColumns.filter((c) => c !== 'factoryname');
  const headerColumns = hasCapacityResult
    ? ['factoryname', ...CAPACITY_COLUMNS, ...nonFactoryInfoColumns]
    : allInfoColumns;

  const totalRows = rows.length;
  const needsCollapse = totalRows > COLLAPSE_LIMIT;
  const [expanded, setExpanded] = useState(false);

  const slicedRows = (expanded || !needsCollapse)
    ? rows.slice(0, DISPLAY_LIMIT)
    : rows.slice(0, COLLAPSE_LIMIT);
  const displayRows = flattenRows(slicedRows, hasCapacityResult);
  const hiddenCount = totalRows - slicedRows.length;
  const hasMore = totalRows > DISPLAY_LIMIT;
  const showExportFooter = (expanded || !needsCollapse) && hasMore;

  const externalError = data.externalError ?? null;

  return (
    <div className="qr-card">
      {externalError && (
        <div className="qr-external-warning">
          <span className="qr-external-warning-icon">!</span>
          {externalError}
        </div>
      )}
      <div className="qr-table-wrap">
        <table className="qr-table">
          <thead>
            <tr>
              {headerColumns.map((col) => (
                <th key={col}>{colLabel(col)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((dRow, i) => (
              <tr key={`${dRow.rowData.factoryid ?? i}-${i}`}>
                {/* 1. Factory Name — always first, with rowspan */}
                {dRow.isFirstSubRow && (
                  <td rowSpan={dRow.infoRowSpan}>
                    <span
                      className={`qr-factory-link${
                        dRow.rowData.type === 'Internal Factory' ? ' qr-factory-internal' :
                        dRow.rowData.type === 'External Factory' ? ' qr-factory-external' : ''
                      }`}
                      onClick={() => dispatch({ type: 'OPEN_FACTORY', factory: factoryFromRow(dRow.rowData) })}
                    >
                      {dRow.rowData.factoryname != null ? String(dRow.rowData.factoryname) : ''}
                    </span>
                    {dRow.rowData.type === 'Internal Factory' && (
                      <span className="qr-type-tag qr-type-tag-internal">Internal</span>
                    )}
                    {dRow.rowData.type === 'External Factory' && (
                      <span className="qr-type-tag qr-type-tag-external">External</span>
                    )}
                  </td>
                )}
                {/* 2. Capacity columns — right after factory name, no rowspan */}
                {hasCapacityResult && (
                  <>
                    <TruncatedTd value={String(dRow.productCat)} />
                    <td>{dRow.month}</td>
                    <CapacityTd value={dRow.originalCapacity} />
                    <CapacityTd value={dRow.totalDemand} />
                    <CapacityTd value={dRow.remainingCapacity} />
                    <TruncatedTd value={String(dRow.capacityStatus)} />
                  </>
                )}
                {/* 3. Other info columns — with rowspan */}
                {nonFactoryInfoColumns.map((col) => {
                  if (!dRow.isFirstSubRow) return null;
                  const val = dRow.rowData[col] != null ? String(dRow.rowData[col]) : '';
                  return <TruncatedTd key={col} value={val} rowSpan={dRow.infoRowSpan} />;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {needsCollapse && (
        <div className="qr-footer">
          <button className="qr-collapse-btn" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Show less' : `Show more (${hiddenCount} remaining)`}
          </button>
        </div>
      )}
      {showExportFooter && (
        <div className="qr-footer">
          <span className="qr-count">显示 {DISPLAY_LIMIT}/{totalRows} 条</span>
          <button className="qr-export-btn" onClick={() => exportExcel(rows, extraColumns)}>
            导出 Excel
          </button>
        </div>
      )}
    </div>
  );
}
