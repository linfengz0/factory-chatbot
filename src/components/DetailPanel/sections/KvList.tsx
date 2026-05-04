interface KvItem {
  key: string;
  val: string | number;
}

export function KvList({ items }: { items: KvItem[] }) {
  return (
    <div className="kv-list">
      {items.map((item) => (
        <div className="kv-row" key={item.key}>
          <span className="kv-key">{item.key}</span>
          <span className="kv-val">{String(item.val)}</span>
        </div>
      ))}
    </div>
  );
}
