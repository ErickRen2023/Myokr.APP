import { CycleType } from '../types/enums';

function getLastDay(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Compute end date from start date (start must be the 1st of a valid month). */
export function computeEndDate(type: CycleType, startDateStr: string): string {
  const y = parseInt(startDateStr.slice(0, 4), 10);
  const m = parseInt(startDateStr.slice(5, 7), 10);

  switch (type) {
    case CycleType.Monthly: {
      const ld = getLastDay(y, m);
      return `${y}-${pad(m)}-${pad(ld)}`;
    }
    case CycleType.Bimonthly: {
      const em = m + 1;
      const ey = em > 12 ? y + 1 : y;
      const mn = em > 12 ? em - 12 : em;
      const ld = getLastDay(ey, mn);
      return `${ey}-${pad(mn)}-${pad(ld)}`;
    }
    case CycleType.Quarterly: {
      const qEndMonth = Math.ceil(m / 3) * 3;
      const ld = getLastDay(y, qEndMonth);
      return `${y}-${pad(qEndMonth)}-${pad(ld)}`;
    }
    case CycleType.HalfYear: {
      const hEndMonth = m <= 6 ? 6 : 12;
      const ld = getLastDay(y, hEndMonth);
      return `${y}-${pad(hEndMonth)}-${pad(ld)}`;
    }
    case CycleType.Yearly:
      return `${y}-12-31`;
  }
}

/** Given type + year + period, return { start, end } date strings. */
export function getCycleDates(
  type: CycleType,
  year: number,
  period: number,
): { start: string; end: string } {
  switch (type) {
    case CycleType.Monthly: {
      const start = `${year}-${pad(period)}-01`;
      return { start, end: computeEndDate(type, start) };
    }
    case CycleType.Bimonthly: {
      const start = `${year}-${pad(period)}-01`;
      return { start, end: computeEndDate(type, start) };
    }
    case CycleType.Quarterly: {
      const startMonth = (period - 1) * 3 + 1;
      const start = `${year}-${pad(startMonth)}-01`;
      return { start, end: computeEndDate(type, start) };
    }
    case CycleType.HalfYear: {
      const startMonth = period === 1 ? 1 : 7;
      const start = `${year}-${pad(startMonth)}-01`;
      return { start, end: computeEndDate(type, start) };
    }
    case CycleType.Yearly:
      return { start: `${year}-01-01`, end: `${year}-12-31` };
  }
}

/** Default period based on current date. */
export function getDefaultPeriod(type: CycleType): { year: number; period: number } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;

  switch (type) {
    case CycleType.Monthly:
    case CycleType.Bimonthly:
      return { year: y, period: m };
    case CycleType.Quarterly:
      return { year: y, period: Math.ceil(m / 3) };
    case CycleType.HalfYear:
      return { year: y, period: m <= 6 ? 1 : 2 };
    case CycleType.Yearly:
      return { year: y, period: 0 };
  }
}

/** Human-readable cycle name matching backend _generate_name. */
export function getCycleDisplayName(type: CycleType, year: number, period: number): string {
  switch (type) {
    case CycleType.Monthly:
      return `${year}年${period}月`;
    case CycleType.Bimonthly: {
      const em = period + 1;
      const ey = em > 12 ? year + 1 : year;
      const mn = em > 12 ? em - 12 : em;
      if (ey !== year) return `${year}年${period}月-${ey}年${mn}月`;
      return `${year}年${period}月-${mn}月`;
    }
    case CycleType.Quarterly:
      return `${year}年Q${period}`;
    case CycleType.HalfYear:
      return `${year}年${period === 1 ? '上' : '下'}半年`;
    case CycleType.Yearly:
      return `${year}年`;
  }
}

/** Dropdown options for the period selector. */
export function getPeriodOptions(type: CycleType): { value: number; label: string }[] {
  switch (type) {
    case CycleType.Monthly:
      return Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: `${i + 1}月`,
      }));
    case CycleType.Bimonthly:
      return Array.from({ length: 12 }, (_, i) => {
        const em = i + 2;
        if (em > 12) return { value: i + 1, label: `${i + 1}月-${em - 12}月` };
        return { value: i + 1, label: `${i + 1}月-${em}月` };
      });
    case CycleType.Quarterly:
      return [
        { value: 1, label: 'Q1（1月-3月）' },
        { value: 2, label: 'Q2（4月-6月）' },
        { value: 3, label: 'Q3（7月-9月）' },
        { value: 4, label: 'Q4（10月-12月）' },
      ];
    case CycleType.HalfYear:
      return [
        { value: 1, label: '上半年（1月-6月）' },
        { value: 2, label: '下半年（7月-12月）' },
      ];
    case CycleType.Yearly:
      return [];
  }
}

/** Year options: current year -2 to +2. */
export function getYearOptions(): { value: number; label: string }[] {
  const y = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => {
    const v = y - 2 + i;
    return { value: v, label: `${v}年` };
  });
}
