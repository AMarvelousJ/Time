/**
 * 时间字段状态管理
 */
import { create } from 'zustand';
import dayjs from 'dayjs';
import { TimeField, TimeFieldStatus } from '@/types';
import { validateTimeRule } from '@/lib/rules';
import { TIME_RULES, FIELD_LABELS } from '@/types/materials';
import { workdayPublicityEndInclusive } from '@/utils/date-utils';

const STORAGE_KEY = 'party_dev_time_fields';

interface TimeHistory {
  timestamp: string;
  personId: string;
  fieldKey: string;
  oldValue: string | null;
  newValue: string | null;
}

interface TimeState {
  timeFields: Record<string, Record<string, TimeField>>; // personId -> fieldKey -> TimeField
  currentPersonId: string | null;
  history: TimeHistory[];

  // Actions
  setCurrentPersonId: (personId: string) => void;
  setTimeField: (key: string, value: string | null) => void;
  getField: (key: string) => TimeField | undefined;
  getAllFields: () => Record<string, TimeField>;
  getHistory: (fieldKey?: string) => TimeHistory[];
  restoreHistory: (index: number) => void;
  loadFromStorage: () => void;
  clearAll: () => void;
}

export const useTimeStore = create<TimeState>((set, get) => ({
  timeFields: {},
  currentPersonId: null,
  history: [],

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // 数据迁移：检测是旧格式还是新格式
        // 旧格式：{ [fieldKey]: TimeField }
        // 新格式：{ [personId]: { [fieldKey]: TimeField } }
        const isFirstFieldTimeField = (obj: any): boolean => {
          const firstKey = Object.keys(obj)[0];
          if (!firstKey) return false;
          const firstValue = obj[firstKey];
          return typeof firstValue === 'object' && 'value' in firstValue && 'status' in firstValue;
        };

        let timeFields: Record<string, Record<string, TimeField>>;
        if (isFirstFieldTimeField(parsed)) {
          // 旧格式，迁移到新格式：创建一个默认分组
          // 由于无法确定属于哪个 person，我们保留数据但标记为 'default'
          console.log('Migrating old format to new format');
          timeFields = { default: parsed as Record<string, TimeField> };
        } else {
          // 新格式
          timeFields = parsed as Record<string, Record<string, TimeField>>;
        }

        set({ timeFields });
      }
    } catch (e) {
      console.error('Failed to load from storage', e);
    }
  },

  clearAll: () => {
    set({ timeFields: {}, currentPersonId: null, history: [] });
    localStorage.removeItem(STORAGE_KEY);
  },

  setCurrentPersonId: (personId: string) => {
    set({ currentPersonId: personId });
  },

  setTimeField: (key: string, value: string | null) => {
    const personId = get().currentPersonId;
    if (!personId) {
      console.error('No current person ID set');
      return;
    }

    const personFields = get().timeFields[personId] || {};
    const oldField = personFields[key];
    const rule = TIME_RULES[key];

    const allFields = get().getAllFields();

    // 查找前置依赖字段的值（当前人员的）
    let referenceValue: string | null = null;
    if (rule && rule.dependencies.length > 0) {
      const depKey = rule.dependencies[0];
      const depField = allFields[depKey];
      referenceValue = depField?.value || null;
    }

    // 如果有值和规则，进行校验
    let validationResult: { valid: boolean; message?: string; recommendation?: string } = { valid: true, message: undefined, recommendation: undefined };
    // 特例：网络党校学时证明是“月份”，预备党员公示时间只需在该月份及之后
    // 不应被 range(workdays) 的“天数范围”校验限制在该月第 1 天起 5 个工作日内
    const shouldSkipBaseRuleValidation =
      key === 'probationPublicityTime' ||
      key === 'm22_branchSecretarySignTime' ||
      key === 'm22_contactPerson1Time';

    if (value && referenceValue && rule && !shouldSkipBaseRuleValidation) {
      const referenceLabel = rule.dependencies.length > 0 ? (FIELD_LABELS[rule.dependencies[0]] || '参考时间') : '参考时间';
      validationResult = validateTimeRule(value, referenceValue, rule, referenceLabel);
    }

    // 对于 range 类型且 workdays=true 的规则，计算从用户选择日期往后 5 个工作日的范围
    let recommendation: string | undefined = validationResult.recommendation;
    if (value && rule?.type === 'range' && rule.config.workdays) {
      const selectedDate = dayjs(value);
      const maxDays = rule.config.maxDays || 5;
      const endStr = workdayPublicityEndInclusive(value, maxDays);
      recommendation = `公示期：${selectedDate.format('YYYY-MM-DD')} 至 ${endStr}（${rule.description}）`;
    }

    // Custom validation helper for complex fields
    const runCustomValidation = (
      fKey: string,
      fValue: string,
      fields: Record<string, TimeField>,
      baseResult: { valid: boolean; message?: string; recommendation?: string }
    ) => {
      // 辅助函数：计算 N 个工作日后的日期
      const getWorkdaysAfter = (startDateStr: string, days: number): dayjs.Dayjs => {
        let d = dayjs(startDateStr);
        let added = 0;
        if (d.day() !== 0 && d.day() !== 6) added = 1;
        while (added < days) {
          d = d.add(1, 'day');
          if (d.day() !== 0 && d.day() !== 6) added++;
        }
        return d;
      };

      if (fKey === 'committeeTime') {
        // 支委会讨论时间需要同时满足：
        // 1. 距离入党申请书申请时间至少 3 个月（基础验证已处理）
        // 2. 在党组织意见时间之后
        const partyOpinionTime = fields['partyOpinionTime']?.value;
        let valid = baseResult.valid;
        let message = baseResult.message;

        if (partyOpinionTime) {
          if (dayjs(fValue).isBefore(dayjs(partyOpinionTime), 'day')) {
             valid = false;
             message = '时间必须晚于或等于党组织意见时间';
          }
        }
        return { valid, message, recommendation: baseResult.recommendation };
      } else if (fKey === 'partyFilingTime') {
        const pubTime = fields['activistPublicityTime']?.value;
        const signTime = fields['m6_branchSecretarySignTime']?.value;
        let valid = baseResult.valid;
        let message = baseResult.message;

        if (pubTime) {
          const pubEnd = getWorkdaysAfter(pubTime, 5);
          if (!dayjs(fValue).isAfter(pubEnd, 'day')) {
             valid = false;
             message = '时间必须在积极分子公示结束之后';
          }
        }

        if (valid && signTime) {
          if (dayjs(fValue).isBefore(dayjs(signTime), 'day')) {
             valid = false;
             message = '时间必须晚于或等于党支部书记签字时间';
          }
        }
        return { valid, message, recommendation: baseResult.recommendation };
      } else if (fKey === 'introducerOpinionTime' || fKey === 'developmentFilingTime') {
        const devPubTime = fields['developmentPublicityTime']?.value;
        let valid = baseResult.valid;
        let message = baseResult.message;
        
        if (devPubTime) {
          const pubEnd = getWorkdaysAfter(devPubTime, 5);
          if (!dayjs(fValue).isAfter(pubEnd, 'day')) {
             valid = false;
             message = '时间必须在发展对象公示结束（5个工作日）之后';
          }
        }

        // Add user requirement: developmentFilingTime must be after or equal to branchReviewTime
        if (valid && fKey === 'developmentFilingTime') {
          const branchReview = fields['branchReviewTime']?.value;
          if (branchReview && dayjs(fValue).isBefore(dayjs(branchReview), 'day')) {
            valid = false;
            message = '时间必须晚于或等于党支部审查意见签字时间';
          }
        }

        return { valid, message, recommendation: baseResult.recommendation };
      } else if (fKey === 'm14_workUnitReviewTime' || fKey === 'm14_residenceReviewTime') {
        let valid = baseResult.valid;
        let message = baseResult.message;
        const compTime = fields['comprehensiveReviewTime']?.value;
        if (valid && compTime) {
          if (dayjs(fValue).isAfter(dayjs(compTime), 'day')) {
            valid = false;
            message = '时间必须早于或等于所在党组织政审意见党组织盖章时间';
          }
        }
        return { valid, message, recommendation: baseResult.recommendation };
      } else if (fKey === 'comprehensiveReviewTime') {
        let valid = baseResult.valid;
        let message = baseResult.message;
        const workUnitTime = fields['m14_workUnitReviewTime']?.value;
        const residenceTime = fields['m14_residenceReviewTime']?.value;
        
        if (workUnitTime && !dayjs(fValue).isAfter(dayjs(workUnitTime), 'day')) {
          valid = false;
        }
        if (residenceTime && !dayjs(fValue).isAfter(dayjs(residenceTime), 'day')) {
          valid = false;
        }

        if (!valid) {
          message = '时间必须晚于直系亲属政审表中的时间';
        }

        return { valid, message, recommendation: baseResult.recommendation };
      } else if (fKey === 'probationPublicityTime') {
        const onlineTime = fields['onlineStudyTime']?.value;
        let valid = baseResult.valid;
        let message = baseResult.message;

        if (onlineTime) {
          // 网络党校证明时间是 YYYY-MM，只要在当月或之后即可
          const monthStart = dayjs(onlineTime).startOf('month');
          if (dayjs(fValue).isBefore(monthStart, 'day')) {
            valid = false;
            message = '时间必须在网络党校证明时间所在月份或之后';
          }
        }
        return { valid, message, recommendation: baseResult.recommendation };
      } else if (fKey === 'm17_branchPreReviewTime') {
        // 党支部预审意见时间：必须在“预备党员公示期最后一天”之后
        const probationPubStart = fields['probationPublicityTime']?.value;
        let valid = baseResult.valid;
        let message = baseResult.message;

        if (probationPubStart) {
          const pubEnd = getWorkdaysAfter(probationPubStart, 5);
          if (!dayjs(fValue).isAfter(pubEnd, 'day')) {
            valid = false;
            message = '时间必须在预备党员公示结束（5个工作日）之后';
          }
        }

        return { valid, message, recommendation: baseResult.recommendation };
      } else if (fKey === 'm17_partyCommitteeTime') {
        // 二级党委或党委组织部时间：必须在党支部预审意见时间之后
        const branchPreReview = fields['m17_branchPreReviewTime']?.value;
        let valid = baseResult.valid;
        let message = baseResult.message;

        if (branchPreReview) {
          if (!dayjs(fValue).isAfter(dayjs(branchPreReview), 'day')) {
            valid = false;
            message = '时间必须在党支部预审意见时间之后';
          }
        }

        return { valid, message, recommendation: baseResult.recommendation };
      } else if (
        fKey === 'm22_branchSecretarySignTime' ||
        fKey === 'm22_contactPerson1Time'
      ) {
        // 须晚于预备党员转正公示（5 个工作日）的最后一天
        const transferPubStart = fields['transferPublicityTime']?.value;
        let valid = baseResult.valid;
        let message = baseResult.message;

        if (transferPubStart) {
          const maxDays = TIME_RULES['transferPublicityTime']?.config?.maxDays ?? 5;
          const pubEndStr = workdayPublicityEndInclusive(transferPubStart, maxDays);
          if (!dayjs(fValue).isAfter(dayjs(pubEndStr), 'day')) {
            valid = false;
            message = '时间必须在预备党员转正公示结束（5个工作日）之后';
          }
        }

        return { valid, message, recommendation: baseResult.recommendation };
      } else if (fKey === 'transferPublicityTime') {
        // 预备党员转正公示：公示期最后一天须早于「支部大会通过接受申请人为预备党员决议时间」起满一年之日
        const branchMeeting = fields['branchMeetingTime']?.value;
        let valid = baseResult.valid;
        let message = baseResult.message;

        if (valid && branchMeeting && fValue) {
          const maxDays = TIME_RULES[fKey]?.config?.maxDays ?? 5;
          const pubEnd = workdayPublicityEndInclusive(fValue, maxDays);
          const probationEndDay = dayjs(branchMeeting).add(1, 'year');
          if (!dayjs(pubEnd).isBefore(probationEndDay, 'day')) {
            valid = false;
            message =
              '转正公示最后一天须早于预备期满日（须早于支部大会通过接受申请人为预备党员决议时间起满一年当日）';
          }
        }

        return { valid, message, recommendation: baseResult.recommendation };
      }

      return baseResult;
    };

    validationResult = runCustomValidation(key, value || '', allFields, validationResult);

    // 确定字段状态
    let status: TimeFieldStatus = value ? 'filled' : 'empty';
    if (value && !validationResult.valid) {
      status = 'conflict';
    }

    const newField: TimeField = {
      key,
      label: oldField?.label || key,
      value,
      rule,
      status,
      errorMessage: validationResult.valid ? undefined : validationResult.message,
      recommendation,
    };

    set((state) => {
      const newPersonFields = {
        ...personFields,
        [key]: newField,
      };
      const newTimeFields = {
        ...state.timeFields,
        [personId]: newPersonFields,
      };
      // 保存到 localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTimeFields));

      return {
        timeFields: newTimeFields,
        history: [
          ...state.history,
          {
            timestamp: new Date().toISOString(),
            personId,
            fieldKey: key,
            oldValue: oldField?.value || null,
            newValue: value,
          },
        ],
      };
    });

    // 如果这个字段是其他字段的依赖，需要重新校验那些字段
    if (value) {
      // 找出依赖这个字段的所有字段（含深层嵌套）
      const getDeepDependencies = (sourceKey: string): string[] => {
        const directDeps = Object.entries(TIME_RULES)
          .filter(([, r]) => r.dependencies.includes(sourceKey) || (r.type === 'sync' && r.config.syncFrom === sourceKey))
          .map(([k]) => k);
        let allDeps = [...directDeps];
        for (const dep of directDeps) {
          allDeps = [...allDeps, ...getDeepDependencies(dep)];
        }
        return [...new Set(allDeps)];
      };

      const allDependentKeys = getDeepDependencies(key);

      allDependentKeys.forEach((depKey) => {
        const currentAllFields = get().getAllFields();
        const depField = currentAllFields[depKey];
        if (depField?.value && TIME_RULES[depKey].type !== 'sync') {
          // 重新校验非同步类型的依赖字段
          const depRule = TIME_RULES[depKey];
          const referenceLabel = depRule.dependencies.length > 0 ? (FIELD_LABELS[depRule.dependencies[0]] || '参考时间') : '参考时间';
          const refKey = depRule.dependencies[0];
          const freshReferenceValue = refKey ? currentAllFields[refKey]?.value : null;

          if (freshReferenceValue) {
            let depValidation = validateTimeRule(depField.value, freshReferenceValue, depRule, referenceLabel);
            
            depValidation = runCustomValidation(depKey, depField.value, currentAllFields, depValidation);

          set((state) => {
            const updatedField: TimeField = {
              ...depField,
              status: depValidation.valid ? 'filled' : 'conflict',
              errorMessage: depValidation.valid ? undefined : depValidation.message,
            };
            const updatedPersonFields = {
              ...(state.timeFields[personId] || {}),
              [depKey]: updatedField,
            };
            const newTimeFields = {
              ...state.timeFields,
              [personId]: updatedPersonFields,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newTimeFields));
            return { timeFields: newTimeFields };
          });
          }
        }
      });
    }
  },

  getField: (key: string) => {
    const personId = get().currentPersonId;
    if (!personId) return undefined;
    return get().timeFields[personId]?.[key];
  },

  getAllFields: () => {
    const personId = get().currentPersonId;
    if (!personId) return {};
    
    const fields = get().timeFields[personId] || {};
    
    // 生成一个包含所有同步值的完整字段集
    const fullFields: Record<string, TimeField> = { ...fields };
    
    // 遍历所有可能的规则，找到 sync 类型的字段并计算其值
    Object.entries(TIME_RULES).forEach(([key, rule]) => {
      // 如果还没填过且是个空栏字段，自动补充
      if (rule.type === 'empty_field' && !fullFields[key]) {
        fullFields[key] = {
          key,
          label: key,
          value: null,
          status: 'empty_field',
          rule
        };
      }
      
      // 同步字段逻辑
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

        // 如果当前字段在 store 中不存在，或者存在且不是最新值
        if (!fullFields[key] || fullFields[key].value !== computedValue) {
          fullFields[key] = {
            ...fullFields[key],
            key,
            label: fullFields[key]?.label || key,
            value: computedValue,
            status: computedValue ? 'sync' : 'empty', // source有值则是sync，没值显示empty
            rule
          };
        }
      }
    });
    
    return fullFields;
  },

  getHistory: (fieldKey?: string) => {
    const { history } = get();
    if (fieldKey) {
      return history.filter((h) => h.fieldKey === fieldKey);
    }
    return history;
  },

  restoreHistory: (index: number) => {
    const { history, timeFields } = get();
    const record = history[index];

    if (record) {
      const personFields = timeFields[record.personId] || {};
      const oldField = personFields[record.fieldKey];

      set({
        timeFields: {
          ...timeFields,
          [record.personId]: {
            ...personFields,
            [record.fieldKey]: {
              ...oldField,
              value: record.oldValue,
              status: (record.oldValue ? 'filled' : 'empty') as TimeFieldStatus,
            },
          },
        },
      });
    }
  },
}));
