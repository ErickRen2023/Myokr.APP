import { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './DateInput.module.css';

interface DateInputProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  filterDate?: (date: Date) => boolean;
  disabled?: boolean;
}

const CustomInput = forwardRef<HTMLInputElement, { value?: string; placeholder?: string; onClick?: () => void; className?: string }>(
  ({ value, placeholder, onClick, className }, ref) => (
    <button type="button" className={`${styles.trigger} ${className ?? ''}`} onClick={onClick} ref={ref as never}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.icon}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <span className={value ? styles.value : styles.placeholder}>{value || placeholder || '请选择日期'}</span>
    </button>
  )
);

CustomInput.displayName = 'CustomInput';

export function DateInput({ value, onChange, placeholder, className, minDate, maxDate, filterDate, disabled }: DateInputProps) {
  const selected = value ? new Date(value + 'T00:00:00') : null;

  return (
    <DatePicker
      selected={selected}
      onChange={(date: Date | null) => {
        if (date) {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          onChange(`${y}-${m}-${d}`);
        }
      }}
      dateFormat="yyyy-MM-dd"
      placeholderText={placeholder}
      customInput={<CustomInput className={className} />}
      calendarClassName={styles.calendar}
      showPopperArrow={false}
      popperPlacement="bottom-start"
      popperProps={{ strategy: 'fixed' }}
      minDate={minDate}
      maxDate={maxDate}
      filterDate={filterDate}
      disabled={disabled}
    />
  );
}
