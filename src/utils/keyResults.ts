import type { KeyResult } from '../types';

export type NumericOperator = 'gte' | 'lte';

export function isUpperBound(keyResult: KeyResult) {
  return keyResult.type === 1 && keyResult.target.operator === 'lte';
}

export function validTarget(value: string, operator: NumericOperator) {
  return value.trim() !== '' && Number.isFinite(Number(value)) && (operator === 'lte' ? Number(value) >= 0 : Number(value) > 0);
}

export function numericRule(target: Record<string, unknown>) {
  return `${target.operator === 'lte' ? '不超过' : '至少达到'} ${target.value ?? '?'} ${target.unit ?? ''}`;
}

export function metricLabel(keyResult: KeyResult, archived = false): string {
  if (!isUpperBound(keyResult)) return `${keyResult.progress}%`;
  if (keyResult.current_value === null) return '未记录';
  if (!keyResult.is_achieved) return '未达成';
  return archived || keyResult.status === 1 ? '已达成' : '达标中';
}

export function numericDetails(keyResult: KeyResult, archived = false) {
  if (keyResult.current_value === null) return `未记录 · ${numericRule(keyResult.target)}`;
  const unit = String(keyResult.target.unit ?? '');
  if (!isUpperBound(keyResult)) return `${keyResult.current_value} / ${keyResult.target.value ?? '?'} ${unit} (${keyResult.progress}%)`;
  const difference = Number(keyResult.target.value) - keyResult.current_value;
  const remaining = difference < 0 ? `超出 ${Number((-difference).toFixed(6))} ${unit}` : difference === 0 ? '额度已用完' : `剩余 ${Number(difference.toFixed(6))} ${unit}额度`;
  return `${keyResult.current_value} ${unit} · 上限 ${keyResult.target.value} ${unit} · ${metricLabel(keyResult, archived)} · ${remaining}`;
}

export function metricBar(keyResult: KeyResult) {
  if (!isUpperBound(keyResult)) {
    const progress = keyResult.progress;
    return { width: Math.max(0, Math.min(progress, 100)), color: progress >= 80 ? 'green' : progress >= 50 ? 'blue' : progress >= 25 ? 'orange' : 'red', label: '完成进度' };
  }
  const current = keyResult.current_value;
  const target = Number(keyResult.target.value);
  const usage = current === null ? 0 : target === 0 ? (current > 0 ? 100 : 0) : current / target * 100;
  return { width: Math.min(usage, 100), color: current === null ? 'blue' : current > target ? 'red' : usage >= 80 ? 'orange' : 'green', label: '额度使用情况' };
}

export function numericPreview(keyResult: KeyResult, input: string) {
  if (!input.trim()) return '请输入当前累计值；填 0 表示已确认累计值为 0。';
  const current = Number(input);
  if (!Number.isFinite(current) || current < 0) return '请输入非负有效数值。';
  const target = Number(keyResult.target.value);
  const upperBound = isUpperBound(keyResult);
  const achieved = upperBound ? current <= target : current >= target;
  const progress = upperBound ? (achieved ? 100 : 0) : Math.round(Math.min(100, current / (target || 1) * 100) * 10) / 10;
  return numericDetails({ ...keyResult, current_value: current, is_achieved: achieved, progress });
}
