/**
 * 时间规则相关类型定义
 */

export type RuleType =
  | 'fixed_offset'      // 固定偏移：申请后 1 个月内
  | 'range'             // 时间区间：公示 5 个工作日
  | 'after'             // 晚于某时间
  | 'before'            // 早于某时间
  | 'quarterly'         // 季度性：每季度 1 篇
  | 'sequential'        // 顺序递进
  | 'sync'              // 同步字段：从其他已填字段自动同步
  | 'empty_field';      // 空栏字段：此栏空，不需要填

export interface TimeRule {
  type: RuleType;
  description: string;
  dependencies: string[];  // 依赖的字段 key
  config: RuleConfig;
}

export interface RuleConfig {
  offset?: number;        // 偏移天数
  unit?: 'days' | 'months' | 'years';
  direction?: 'before' | 'after';
  workdays?: boolean;     // 是否仅计算工作日
  minDays?: number;
  maxDays?: number;
  strictAfter?: boolean;  // after 规则是否必须严格晚于（不允许同一天）
  strictBefore?: boolean; // before 规则是否必须严格早于（不允许同一天）
  referenceField?: string; // 参考字段
  syncFrom?: string;      // 同步来源字段 key（sync 类型使用）
  offsetYears?: number;   // sync：在 syncFrom 日期基础上加整年（如预备期满日 = 支部大会 +1 年）
  offsetMonths?: number;  // sync：在 syncFrom 基础上加整月（可与 offsetDays 联用，先月后天）
  offsetDays?: number;    // sync：在加月之后再叠加天数（如「满季度次日」）
  required?: boolean;     // 是否必填项（默认为 true，false表示选填）
  periodType?: 'quarter' | 'half_year'; // 周期类型
  periodIndex?: number;   // 周期序号（从0开始）
  granularity?: 'day' | 'month'; // 日期选择粒度，默认为 'day'
}

/**
 * 27 个材料的规则配置
 */
export const MATERIAL_RULES: Record<string, TimeRule> = {
  // 阶段 1: 入党申请阶段
  'talkTime': {
    type: 'fixed_offset',
    description: '收到申请书 1 个月内',
    dependencies: ['applicationTime'],
    config: { offset: 30, unit: 'days', direction: 'after' }
  },
  'publicityTime': {
    type: 'range',
    description: '谈话后，公示 5 工作日',
    dependencies: ['talkTime'],
    config: { minDays: 0, maxDays: 5, workdays: true }
  },

  // 阶段 2: 积极分子阶段
  'activistPublicityTime': {
    type: 'range',
    description: '支委会后，5 工作日',
    dependencies: ['committeeTime'],
    config: { minDays: 0, maxDays: 5, workdays: true }
  },
  'activistRecordTime': {
    type: 'after',
    description: '公示后备案',
    dependencies: ['activistPublicityTime'],
    config: { minDays: 0 }
  },

  // 更多规则待补充...
};
