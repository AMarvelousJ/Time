import dayjs from 'dayjs';
import { runCustomTimelineValidation } from '@/lib/domain/custom-timeline-validators';
import { validateTimeRule, type ValidationResult } from '@/lib/rules';
import { TimeField, TimeFieldStatus } from '@/types';
import { TimeRule } from '@/types/rules';
import { FIELD_LABELS, TIME_RULES } from '@/types/materials';
import { workdayPublicityEndInclusive } from '@/utils/date-utils';

export const fieldsFromSnapshot = (
  snapshot: Record<string, string | null>
): Record<string, TimeField> => {
  const fields: Record<string, TimeField> = {};

  Object.entries(snapshot).forEach(([key, val]) => {
    const rule = TIME_RULES[key];
    const value = val ?? null;
    fields[key] = {
      key,
      label: FIELD_LABELS[key] || key,
      value,
      rule,
      status: value ? 'filled' : 'empty',
    };
  });

  return fields;
};

export const completeTimelineFields = (
  fields: Record<string, TimeField>
): Record<string, TimeField> => {
  const fullFields: Record<string, TimeField> = { ...fields };

  Object.entries(TIME_RULES).forEach(([key, rule]) => {
    if (rule.type === 'empty_field' && !fullFields[key]) {
      fullFields[key] = {
        key,
        label: key,
        value: null,
        status: 'empty_field',
        rule,
      };
    }

    if (rule.type === 'sync' && rule.config.syncFrom) {
      const sourceField = fullFields[rule.config.syncFrom];
      const sourceValue = sourceField?.value || null;
      let computedValue: string | null = sourceValue;
      if (sourceValue != null) {
        if (typeof rule.config.offsetYears === 'number') {
          computedValue = dayjs(sourceValue)
            .add(rule.config.offsetYears, 'year')
            .format('YYYY-MM-DD');
        } else if (typeof rule.config.offsetMonths === 'number') {
          let d = dayjs(sourceValue).add(rule.config.offsetMonths, 'month');
          if (typeof rule.config.offsetDays === 'number') {
            d = d.add(rule.config.offsetDays, 'day');
          }
          computedValue = d.format('YYYY-MM-DD');
        }
      }

      if (!fullFields[key] || fullFields[key].value !== computedValue) {
        fullFields[key] = {
          ...fullFields[key],
          key,
          label: fullFields[key]?.label || key,
          value: computedValue,
          status: computedValue ? 'sync' : 'empty',
          rule,
        };
      }
    }
  });

  return fullFields;
};

const shouldSkipBaseRuleValidation = (key: string) =>
  key === 'probationPublicityTime' ||
  key === 'm22_branchSecretarySignTime' ||
  key === 'm22_contactPerson1Time';

const runFieldValidation = (
  key: string,
  value: string | null,
  allFields: Record<string, TimeField>
): {
  rule: TimeRule | undefined;
  result: ValidationResult;
  recommendation?: string;
  status: TimeFieldStatus;
} => {
  const rule = TIME_RULES[key];
  let referenceValue: string | null = null;
  if (rule && rule.dependencies.length > 0) {
    const depKey = rule.dependencies[0];
    const depField = allFields[depKey];
    referenceValue = depField?.value || null;
  }

  let result: ValidationResult = {
    valid: true,
    message: undefined,
    recommendation: undefined,
  };

  if (value && referenceValue && rule && !shouldSkipBaseRuleValidation(key)) {
    const referenceLabel =
      rule.dependencies.length > 0
        ? FIELD_LABELS[rule.dependencies[0]] || '参考时间'
        : '参考时间';
    result = validateTimeRule(value, referenceValue, rule, referenceLabel);
  }

  let recommendation: string | undefined = result.recommendation;
  if (value && rule?.type === 'range' && rule.config.workdays) {
    const selectedDate = dayjs(value);
    const maxDays = rule.config.maxDays || 5;
    const endStr = workdayPublicityEndInclusive(value, maxDays);
    recommendation = `公示期：${selectedDate.format('YYYY-MM-DD')} 至 ${endStr}（${rule.description}）`;
  }

  result = runCustomTimelineValidation(key, value || '', allFields, result);

  let status: TimeFieldStatus = value ? 'filled' : 'empty';
  if (value && !result.valid) {
    status = 'conflict';
  }

  return {
    rule,
    result,
    recommendation,
    status,
  };
};

export const validateTimelineField = runFieldValidation;

export const buildTimeField = (
  key: string,
  value: string | null,
  allFields: Record<string, TimeField>,
  oldField?: TimeField
): TimeField => {
  const { rule, result, recommendation, status } = runFieldValidation(
    key,
    value,
    allFields
  );

  return {
    key,
    label: oldField?.label || key,
    value,
    rule,
    status,
    errorMessage: result.valid ? undefined : result.message,
    recommendation,
  };
};

export const getDeepDependentKeys = (
  sourceKey: string,
  visited = new Set<string>()
): string[] => {
  if (visited.has(sourceKey)) return [];
  visited.add(sourceKey);

  const directDeps = Object.entries(TIME_RULES)
    .filter(
      ([key, rule]) =>
        !visited.has(key) &&
        (rule.dependencies.includes(sourceKey) ||
          (rule.type === 'sync' && rule.config.syncFrom === sourceKey))
    )
    .map(([key]) => key);

  const allDeps = [...directDeps];
  for (const dep of directDeps) {
    allDeps.push(...getDeepDependentKeys(dep, visited));
  }
  return [...new Set(allDeps)];
};

export const revalidateDependentFields = (
  changedKey: string,
  fields: Record<string, TimeField>
): Record<string, TimeField> => {
  const updates: Record<string, TimeField> = {};
  const allDependentKeys = getDeepDependentKeys(changedKey);

  allDependentKeys.forEach((depKey) => {
    const depField = fields[depKey];
    const depRule = TIME_RULES[depKey];
    if (!depField?.value || depRule.type === 'sync') return;

    const refKey = depRule.dependencies[0];
    const freshReferenceValue = refKey ? fields[refKey]?.value : null;
    if (!freshReferenceValue) return;

    let result = validateTimeRule(
      depField.value,
      freshReferenceValue,
      depRule,
      depRule.dependencies.length > 0
        ? FIELD_LABELS[depRule.dependencies[0]] || '参考时间'
        : '参考时间'
    );

    result = runCustomTimelineValidation(depKey, depField.value, fields, result);
    updates[depKey] = {
      ...depField,
      status: result.valid ? 'filled' : 'conflict',
      errorMessage: result.valid ? undefined : result.message,
    };
  });

  return updates;
};
