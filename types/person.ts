/**
 * 人员相关类型定义
 */
import { TimeRule } from './rules';

export interface Person {
  id: string;
  name: string;
  createdAt: string;
  status: PersonStatus;
  materials: Material[];
}

export type PersonStatus = 'progress' | 'completed' | 'needs-fix';

export interface Material {
  id: number;
  name: string;
  stageId: number;
  timeFields: TimeField[];
  status: MaterialStatus;
}

export type MaterialStatus = 'empty' | 'filled' | 'conflict' | 'needs-fix';

export interface TimeField {
  key: string;
  label: string;
  value: string | null;
  rule?: TimeRule;
  status: TimeFieldStatus;
  conflictWith?: string[];
  errorMessage?: string;
  recommendation?: string;
}

export type TimeFieldStatus = 'empty' | 'filled' | 'conflict' | 'locked';
