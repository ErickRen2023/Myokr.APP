import { useId } from 'react';
import type { NumericOperator } from '../../utils/keyResults';

export function NumericRuleField({ operator, onChange, classNames }: { operator: NumericOperator; onChange: (operator: NumericOperator) => void; classNames: { field: string; label: string; input: string } }) {
  const id = useId();
  return (
    <div className={classNames.field}>
      <label htmlFor={id} className={classNames.label}>达成规则</label>
      <select id={id} value={operator} onChange={event => onChange(event.target.value as NumericOperator)} className={classNames.input}>
        <option value="gte">至少达到（≥）</option>
        <option value="lte">不超过（≤）</option>
      </select>
    </div>
  );
}
