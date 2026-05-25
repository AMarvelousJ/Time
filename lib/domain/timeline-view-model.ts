import { TimeField } from '@/types';
import { TimeRule } from '@/types/rules';
import { FIELD_LABELS, MATERIALS, TIME_RULES } from '@/types/materials';

export const checkFieldDependencies = (
  fieldKey: string,
  timeFields: Record<string, TimeField>
): { satisfied: boolean; missingField?: string } => {
  const rule = TIME_RULES[fieldKey];
  if (!rule || rule.dependencies.length === 0) {
    return { satisfied: true };
  }

  for (const depKey of rule.dependencies) {
    const depField = timeFields[depKey];
    const depRule = TIME_RULES[depKey];
    if (!depField || !depField.value) {
      if (depRule?.config?.required === false) {
        const upstreamCheck = checkFieldDependencies(depKey, timeFields);
        if (!upstreamCheck.satisfied) return upstreamCheck;
      } else {
        return {
          satisfied: false,
          missingField: depKey,
        };
      }
    }
  }

  return { satisfied: true };
};

export const getDependencyHint = (
  fieldKey: string,
  timeFields: Record<string, TimeField>
): string | null => {
  const { satisfied, missingField } = checkFieldDependencies(fieldKey, timeFields);
  if (satisfied) return null;
  if (missingField) {
    return `请先填写：${FIELD_LABELS[missingField] || missingField}`;
  }
  return null;
};

export const getStageProgress = (
  stageId: number,
  timeFields: Record<string, TimeField>
) => {
  const stageMaterials = MATERIALS.filter((m) => m.stageId === stageId);
  const validFields = stageMaterials
    .flatMap((m) => m.fields)
    .filter((fieldKey) => {
      const rule = TIME_RULES[fieldKey];
      return rule?.type !== 'empty_field' && rule?.config?.required !== false;
    });

  if (validFields.length === 0) return 0;

  const filledFields = validFields.filter((field) => timeFields[field]?.value).length;
  return Math.round((filledFields / validFields.length) * 100);
};

export const getFieldStatus = (
  fieldKey: string,
  timeFields: Record<string, TimeField>
) => {
  const field = timeFields[fieldKey];
  if (!field || !field.value) {
    if (TIME_RULES[fieldKey]?.type === 'empty_field') return 'empty_field';
    if (TIME_RULES[fieldKey]?.config?.required === false) return 'optional';
    return 'empty';
  }
  if (field.status === 'conflict') return 'conflict';
  if (field.status === 'sync') return 'sync';
  return 'filled';
};

export const isMaterialComplete = (
  fields: string[],
  timeFields: Record<string, TimeField>
) =>
  fields.every((fieldKey) => {
    const rule = TIME_RULES[fieldKey];
    return (
      timeFields[fieldKey]?.value ||
      rule?.type === 'empty_field' ||
      rule?.config?.required === false
    );
  });

export const getSyncSourceInfo = (ruleConfig: TimeRule | undefined) => {
  if (!ruleConfig || ruleConfig.type !== 'sync' || !ruleConfig.config?.syncFrom) {
    return null;
  }

  const sourceKey = ruleConfig.config.syncFrom;
  const sourceMaterial = MATERIALS.find((m) => m.fields.includes(sourceKey));
  const materialName = sourceMaterial ? sourceMaterial.name : '未知材料';
  const fieldName = FIELD_LABELS[sourceKey] || sourceKey;
  const y = ruleConfig.config.offsetYears;
  const om = ruleConfig.config.offsetMonths;
  const od = ruleConfig.config.offsetDays;
  let offsetHint = '';

  if (typeof y === 'number' && y !== 0) {
    offsetHint = y === 1 ? '，加 1 年' : `，加 ${y} 年`;
  } else if (typeof om === 'number') {
    const q = om / 3;
    if (typeof od === 'number') {
      offsetHint = `，满第 ${q} 个季度次日（+${om}月${od}天）`;
    } else {
      offsetHint = `，${om}月`;
    }
  }

  return `（同步自：${materialName} - ${fieldName}${offsetHint}）`;
};
