export type RuleType =
  | 'fixed_offset'
  | 'range'
  | 'after'
  | 'before'
  | 'quarterly'
  | 'sequential'
  | 'sync'
  | 'empty_field';

export interface TimeRule {
  type: RuleType;
  description: string;
  dependencies: string[];
  config: RuleConfig;
}

export interface RuleConfig {
  offset?: number;
  unit?: 'days' | 'months' | 'years';
  direction?: 'before' | 'after';
  workdays?: boolean;
  minDays?: number;
  maxDays?: number;
  strictAfter?: boolean;
  strictBefore?: boolean;
  referenceField?: string;
  syncFrom?: string;
  offsetYears?: number;
  offsetMonths?: number;
  offsetDays?: number;
  required?: boolean;
  periodType?: 'quarter' | 'half_year';
  periodIndex?: number;
  granularity?: 'day' | 'month';
}
