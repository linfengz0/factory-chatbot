import type { CapacityRow } from '../../../types';

export function CapacityTable({ data }: { data: CapacityRow[] }) {
  return (
    <table className="capacity-table">
      <thead>
        <tr>
          <th>Month</th>
          <th>Original Capacity</th>
          <th>Total Demand</th>
          <th>Remaining Capacity</th>
        </tr>
      </thead>
      <tbody>
        {data.map((r) => (
          <tr key={r.month}>
            <td>{r.month}</td>
            <td>{r.original.toLocaleString()}</td>
            <td>{r.totalDemand.toLocaleString()}</td>
            <td><strong>{r.remaining.toLocaleString()}</strong></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
