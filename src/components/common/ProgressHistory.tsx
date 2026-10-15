import { useEffect, useState } from 'react';
import { listProgressRecords, type ProgressRecord } from '../../api/progress';
import { numericRule } from '../../utils/keyResults';

export function ProgressHistory({ keyResultId }: { keyResultId: number }) {
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    listProgressRecords(keyResultId).then(response => {
      if (response.code !== 0) throw new Error(response.message);
      if (!cancelled) setRecords(response.data.records);
    }).catch(() => {
      if (!cancelled) setError(true);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [keyResultId, open, retry]);

  return (
    <details style={{ marginTop: 14, fontSize: 13 }} open={open} onToggle={event => setOpen(event.currentTarget.open)}>
      <summary>进度记录（最近 50 条）</summary>
      {loading ? <p>正在加载…</p> : error ? <p role="alert">加载失败 <button type="button" onClick={() => setRetry(value => value + 1)}>重试</button></p> : records.length === 0 ? <p>暂无记录</p> : (
        <ul style={{ paddingLeft: 20 }}>
          {records.map(record => (
            <li key={record.id} style={{ marginTop: 10 }}>
              <div>{record.recorded_at ? new Date(record.recorded_at.endsWith('Z') ? record.recorded_at : `${record.recorded_at}Z`).toLocaleString() : '时间未知'}</div>
              <div>{record.value} {record.target_snapshot?.unit ?? ''} · 当时{record.is_achieved ? '达标' : '未达标'}</div>
              <div>{record.target_snapshot ? numericRule(record.target_snapshot) : '旧记录 · 未保存当时目标，保留原始判定'}</div>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
