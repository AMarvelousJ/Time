import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// 扩展 dayjs 插件
dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(customParseFormat);

/**
 * 格式化日期为 YYYY-MM-DD
 */
export const formatDate = (date: string | Date | dayjs.Dayjs): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

/**
 * 计算两个日期之间的工作日天数
 */
export const getWorkdaysBetween = (start: string, end: string): number => {
  let count = 0;
  let current = dayjs(start);
  const endDate = dayjs(end);

  while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
    const dayOfWeek = current.day();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current = current.add(1, 'day');
  }

  return count;
};

/**
 * 从公示起始日算起，连续 N 个工作日（含起始日）的结束日。
 * 与 store 中 range + workdays 的公示期展示逻辑一致。
 */
export const workdayPublicityEndInclusive = (
  startDateStr: string,
  workdayCount: number
): string => {
  let endDate = dayjs(startDateStr);
  let addedWorkdays = 0;
  if (endDate.day() !== 0 && endDate.day() !== 6) {
    addedWorkdays = 1;
  }
  while (addedWorkdays < workdayCount) {
    endDate = endDate.add(1, 'day');
    const dayOfWeek = endDate.day();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedWorkdays++;
    }
  }
  return formatDate(endDate);
};

/**
 * 计算推荐日期范围
 */
export const calculateDateRange = (
  referenceDate: string,
  minDays: number,
  maxDays: number,
  workdays: boolean = false
): { min: string; max: string } => {
  const start = dayjs(referenceDate);

  if (workdays) {
    // 计算工作日
    let minDate = start;
    let addedWorkdays = 0;
    if (minDate.day() !== 0 && minDate.day() !== 6) {
      addedWorkdays = 1;
    }
    while (addedWorkdays < minDays) {
      minDate = minDate.add(1, 'day');
      const dayOfWeek = minDate.day();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        addedWorkdays++;
      }
    }

    let maxDate = minDate;
    addedWorkdays = 0;
    if (maxDate.day() !== 0 && maxDate.day() !== 6) {
      addedWorkdays = 1;
    }
    while (addedWorkdays < (maxDays - minDays)) {
      maxDate = maxDate.add(1, 'day');
      const dayOfWeek = maxDate.day();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        addedWorkdays++;
      }
    }

    return {
      min: formatDate(minDate),
      max: formatDate(maxDate)
    };
  } else {
    return {
      min: formatDate(start.add(minDays, 'day')),
      max: formatDate(start.add(maxDays, 'day'))
    };
  }
};

/**
 * 检查日期是否超出范围
 */
export const isDateInRange = (
  date: string,
  minDate: string,
  maxDate: string
): boolean => {
  return dayjs(date).isBetween(minDate, maxDate, 'day', '[]');
};

/**
 * 获取季度日期（每季度一篇）
 */
export const getQuarterlyDates = (
  startDate: string,
  count: number
): string[] => {
  const dates: string[] = [];
  let current = dayjs(startDate);

  for (let i = 0; i < count; i++) {
    dates.push(formatDate(current));
    current = current.add(3, 'month');
  }

  return dates;
};

/**
 * 验证时间逻辑
 */
export const validateTimeLogic = (
  currentTime: string,
  referenceTime: string,
  rule: 'after' | 'before' | 'within',
  maxDays?: number
): { valid: boolean; message?: string } => {
  const current = dayjs(currentTime);
  const reference = dayjs(referenceTime);

  if (rule === 'after') {
    if (current.isBefore(reference)) {
      return {
        valid: false,
        message: '时间必须晚于参考时间'
      };
    }
    if (maxDays && current.diff(reference, 'day') > maxDays) {
      return {
        valid: false,
        message: `时间超出范围（最多晚于参考时间 ${maxDays} 天）`
      };
    }
  } else if (rule === 'before') {
    if (current.isAfter(reference)) {
      return {
        valid: false,
        message: '时间必须早于参考时间'
      };
    }
  } else if (rule === 'within') {
    const diff = current.diff(reference, 'day');
    if (diff < 0 || diff > (maxDays || 0)) {
      return {
        valid: false,
        message: `时间必须在参考时间后 ${maxDays} 天内`
      };
    }
  }

  return { valid: true };
};
