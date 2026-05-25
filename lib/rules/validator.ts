/**
 * 时间规则验证引擎
 */
import dayjs from 'dayjs';
import { TimeRule, RuleConfig } from '@/types/rules';
import { getWorkdaysBetween } from '@/utils/date-utils';

export interface ValidationResult {
  valid: boolean;
  message?: string;
  recommendation?: string;
}

/**
 * 验证固定偏移规则
 */
const validateFixedOffset = (
  currentTime: string,
  referenceTime: string,
  config: RuleConfig,
  referenceLabel: string
): ValidationResult => {
  const current = dayjs(currentTime);
  const reference = dayjs(referenceTime);
  const maxDays = config.offset || 30;

  const diff = current.diff(reference, 'day');

  if (diff < 0) {
    return {
      valid: false,
      message: `时间不得早于${referenceLabel}，并且在${referenceLabel}后${maxDays}天内`
    };
  }

  if (diff > maxDays) {
    return {
      valid: false,
      message: `时间不得早于${referenceLabel}，并且在${referenceLabel}后${maxDays}天内`
    };
  }

  return {
    valid: true,
    recommendation: `建议在 ${reference.format('YYYY-MM-DD')} 至 ${reference.add(maxDays, 'day').format('YYYY-MM-DD')} 之间`
  };
};

/**
 * 验证范围规则
 */
const validateRange = (
  currentTime: string,
  referenceTime: string,
  config: RuleConfig,
  referenceLabel: string
): ValidationResult => {
  const current = dayjs(currentTime);
  const reference = dayjs(referenceTime);
  const minDays = config.minDays || 0;
  const maxDays = config.maxDays || 5;
  const workdays = config.workdays || false;

  // 检查时间是否晚于参考时间（minDays>0 时要求严格晚于，文案不含「或等于」）
  if (minDays >= 0 && current.isBefore(reference)) {
    return {
      valid: false,
      message:
        minDays > 0
          ? `时间需晚于${referenceLabel}`
          : `时间需晚于或等于${referenceLabel}`
    };
  }

  let actualDays = current.diff(reference, 'day');
  let maxAllowed = maxDays;

  if (workdays) {
    actualDays = getWorkdaysBetween(reference.format('YYYY-MM-DD'), currentTime);
    maxAllowed = maxDays;
  }

  if (actualDays < minDays) {
    return {
      valid: false,
      message: `时间间隔不足（距离${referenceLabel}至少 ${minDays}${workdays ? ' 个工作日' : ' 天'}）`
    };
  }

  if (actualDays > maxAllowed) {
    return {
      valid: false,
      message: `超出规定范围（距离${referenceLabel}最多 ${maxAllowed}${workdays ? ' 个工作日' : ' 天'}）`
    };
  }

  return { valid: true };
};

/**
 * 验证 After 规则
 */
const validateAfter = (
  currentTime: string,
  referenceTime: string,
  config: RuleConfig,
  referenceLabel: string
): ValidationResult => {
  const current = dayjs(currentTime);
  const reference = dayjs(referenceTime);
  const minDays = config.minDays || 0;

  const diff = current.diff(reference, 'day');

  if (config.strictAfter) {
    if (diff <= 0) {
      return {
        valid: false,
        message: `时间必须晚于${referenceLabel}`
      };
    }
    return { valid: true };
  }

  if (diff < minDays) {
    return {
      valid: false,
      message: `时间必须晚于或等于${referenceLabel}${minDays > 0 ? `至少 ${minDays} 天` : ''}`
    };
  }

  return { valid: true };
};

/**
 * 验证 Before 规则
 */
const validateBefore = (
  currentTime: string,
  referenceTime: string,
  config: RuleConfig,
  referenceLabel: string
): ValidationResult => {
  const current = dayjs(currentTime);
  const reference = dayjs(referenceTime);
  const maxDays = config.maxDays;

  if (config.strictBefore) {
    if (!current.isBefore(reference, 'day')) {
      return {
        valid: false,
        message: `时间必须早于${referenceLabel}`
      };
    }
    return { valid: true };
  }

  if (current.isAfter(reference)) {
    return {
      valid: false,
      message: `时间必须早于或等于${referenceLabel}`
    };
  }

  if (maxDays !== undefined) {
    const diff = reference.diff(current, 'day');
    if (diff > maxDays) {
      return {
        valid: false,
        message: `距离${referenceLabel}过远（应在 ${maxDays} 天内）`
      };
    }
  }

  return { valid: true };
};

/**
 * 验证季度性规则
 */
const validateQuarterly = (
  currentTime: string,
  referenceTime: string,
  config: RuleConfig,
  referenceLabel: string
): ValidationResult => {
  const current = dayjs(currentTime);
  const reference = dayjs(referenceTime);

  // 兼容旧逻辑
  if (config.periodType === undefined) {
    if (current.isBefore(reference, 'day')) {
      return { valid: false, message: `时间不能早于${referenceLabel}` };
    }
    const maxDays = config.maxDays || 90;
    const maxMonths = maxDays >= 180 ? 6 : 3;
    const maxAllowedDate = reference.add(maxMonths, 'month');

    if (current.isAfter(maxAllowedDate, 'day')) {
      return {
        valid: false,
        message: `必须在${referenceLabel}后的 ${maxMonths === 6 ? '半年' : '一季度'}内`
      };
    }
    return { valid: true };
  }

  // 新逻辑：绝对周期
  const periodType = config.periodType;
  const periodIndex = config.periodIndex || 0;
  const monthPerPeriod = periodType === 'half_year' ? 6 : 3;

  const startOffsetMonths = periodIndex * monthPerPeriod;
  const endOffsetMonths = (periodIndex + 1) * monthPerPeriod;

  const periodStart = reference.add(startOffsetMonths, 'month');
  const periodEnd = reference.add(endOffsetMonths, 'month');

  if (current.isBefore(periodStart, 'day') || current.isAfter(periodEnd, 'day')) {
    const periodName = periodType === 'half_year' ? '半年' : '季度';
    return {
      valid: false,
      message: `必须位于${referenceLabel}后的第 ${periodIndex + 1} 个${periodName}内（${periodStart.format('YYYY-MM-DD')} 至 ${periodEnd.format('YYYY-MM-DD')}）`
    };
  }

  return { valid: true };
};

/**
 * 主验证函数
 */
export const validateTimeRule = (
  currentTime: string,
  referenceTime: string,
  rule: TimeRule,
  referenceLabel: string = '参考时间'
): ValidationResult => {
  switch (rule.type) {
    case 'fixed_offset':
      return validateFixedOffset(currentTime, referenceTime, rule.config, referenceLabel);
    case 'range':
      return validateRange(currentTime, referenceTime, rule.config, referenceLabel);
    case 'after':
      return validateAfter(currentTime, referenceTime, rule.config, referenceLabel);
    case 'before':
      return validateBefore(currentTime, referenceTime, rule.config, referenceLabel);
    case 'quarterly':
      return validateQuarterly(currentTime, referenceTime, rule.config, referenceLabel);
    case 'sequential':
      return { valid: true }; // 顺序递进只需确保有值即可
    default:
      return { valid: true };
  }
};

/**
 * 计算推荐日期范围
 */
export const getRecommendation = (
  referenceTime: string | null,
  rule: TimeRule
): string | null => {
  if (!referenceTime) {
    return null;
  }

  const reference = dayjs(referenceTime);

  switch (rule.type) {
    case 'fixed_offset': {
      const maxDays = rule.config.offset || 30;
      return `${reference.format('YYYY-MM-DD')} 至 ${reference.add(maxDays, 'day').format('YYYY-MM-DD')}（${rule.description}）`;
    }
    case 'range': {
      const minDays = rule.config.minDays || 0;
      const maxDays = rule.config.maxDays || 5;
      const workdays = rule.config.workdays;

      if (workdays) {
        // 计算工作日范围
        let minDate = reference;
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

        return `公示期：${minDate.format('YYYY-MM-DD')} 至 ${maxDate.format('YYYY-MM-DD')}（${rule.description}）`;
      } else {
        return `${reference.add(minDays, 'day').format('YYYY-MM-DD')} 至 ${reference.add(maxDays, 'day').format('YYYY-MM-DD')}（${rule.description}）`;
      }
    }
    case 'quarterly': {
      if (rule.config.periodType === undefined) {
        // Fallback for old config
        const maxDays = rule.config.maxDays || 90;
        return `${reference.format('YYYY-MM-DD')} 至 ${reference.add(maxDays, 'day').format('YYYY-MM-DD')}（${rule.description}）`;
      }
      const periodType = rule.config.periodType;
      const periodIndex = rule.config.periodIndex || 0;
      const monthPerPeriod = periodType === 'half_year' ? 6 : 3;
      const startOffsetMonths = periodIndex * monthPerPeriod;
      const endOffsetMonths = (periodIndex + 1) * monthPerPeriod;
      const periodStart = reference.add(startOffsetMonths, 'month');
      const periodEnd = reference.add(endOffsetMonths, 'month');
      return `${periodStart.format('YYYY-MM-DD')} 至 ${periodEnd.format('YYYY-MM-DD')}（${rule.description}）`;
    }
    case 'after': {
      const minDays = rule.config.minDays || 0;
      return `${reference.add(minDays, 'day').format('YYYY-MM-DD')} 之后（${rule.description}）`;
    }
    case 'before': {
      const maxDays = rule.config.maxDays;
      if (maxDays) {
        return `${reference.subtract(maxDays, 'day').format('YYYY-MM-DD')} 之前（${rule.description}）`;
      }
      return `${reference.format('YYYY-MM-DD')} 之前（${rule.description}）`;
    }
    default:
      return null;
  }
};
