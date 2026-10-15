import { useId } from 'react';
import type { NumericOperator } from '../../utils/keyResults';

export function NumericRuleField({ operator, onChange }: { operator: NumericOperator; onChange: (operator: NumericOperator) => void }) {
  const id = useId();
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={{ display: 'block', marginBottom: 6 }}>达成规则</label>
      <select id={id} value={operator} onChange={event => onChange(event.target.value as NumericOperator)} style={{ width: '100%', padding: 10, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--card)', color: 'var(--text)' }}>
        <option value="gte">至少达到（≥）</option>
        <option value="lte">不超过（≤）</option>
      </select>
    </div>
  );
}
