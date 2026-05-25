import dayjs from 'dayjs';
import type { ValidationResult } from '@/lib/rules';
import type { TimeField } from '@/types';
import { TIME_RULES } from '@/types/materials';
import { workdayPublicityEndInclusive } from '@/utils/date-utils';

export type CustomTimelineValidator = (params: {
  fieldKey: string;
  value: string;
  fields: Record<string, TimeField>;
  baseResult: ValidationResult;
}) => ValidationResult;

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

const committeeTimeValidator: CustomTimelineValidator = ({
  value,
  fields,
  baseResult,
}) => {
  const partyOpinionTime = fields['partyOpinionTime']?.value;
  let valid = baseResult.valid;
  let message = baseResult.message;

  if (partyOpinionTime && dayjs(value).isBefore(dayjs(partyOpinionTime), 'day')) {
    valid = false;
    message = '时间必须晚于或等于党组织意见时间';
  }
  return { valid, message, recommendation: baseResult.recommendation };
};

const partyFilingTimeValidator: CustomTimelineValidator = ({
  value,
  fields,
  baseResult,
}) => {
  const pubTime = fields['activistPublicityTime']?.value;
  const signTime = fields['m6_branchSecretarySignTime']?.value;
  let valid = baseResult.valid;
  let message = baseResult.message;

  if (pubTime) {
    const pubEnd = getWorkdaysAfter(pubTime, 5);
    if (!dayjs(value).isAfter(pubEnd, 'day')) {
      valid = false;
      message = '时间必须在积极分子公示结束之后';
    }
  }

  if (valid && signTime && dayjs(value).isBefore(dayjs(signTime), 'day')) {
    valid = false;
    message = '时间必须晚于或等于党支部书记签字时间';
  }
  return { valid, message, recommendation: baseResult.recommendation };
};

const developmentPublicityEndValidator: CustomTimelineValidator = ({
  fieldKey,
  value,
  fields,
  baseResult,
}) => {
  const devPubTime = fields['developmentPublicityTime']?.value;
  let valid = baseResult.valid;
  let message = baseResult.message;

  if (devPubTime) {
    const pubEnd = getWorkdaysAfter(devPubTime, 5);
    if (!dayjs(value).isAfter(pubEnd, 'day')) {
      valid = false;
      message = '时间必须在发展对象公示结束（5个工作日）之后';
    }
  }

  if (valid && fieldKey === 'developmentFilingTime') {
    const branchReview = fields['branchReviewTime']?.value;
    if (branchReview && dayjs(value).isBefore(dayjs(branchReview), 'day')) {
      valid = false;
      message = '时间必须晚于或等于党支部审查意见签字时间';
    }
  }

  return { valid, message, recommendation: baseResult.recommendation };
};

const relativePoliticalReviewValidator: CustomTimelineValidator = ({
  value,
  fields,
  baseResult,
}) => {
  let valid = baseResult.valid;
  let message = baseResult.message;
  const compTime = fields['comprehensiveReviewTime']?.value;
  if (valid && compTime && dayjs(value).isAfter(dayjs(compTime), 'day')) {
    valid = false;
    message = '时间必须早于或等于所在党组织政审意见党组织盖章时间';
  }
  return { valid, message, recommendation: baseResult.recommendation };
};

const comprehensiveReviewValidator: CustomTimelineValidator = ({
  value,
  fields,
  baseResult,
}) => {
  let valid = baseResult.valid;
  let message = baseResult.message;
  const workUnitTime = fields['m14_workUnitReviewTime']?.value;
  const residenceTime = fields['m14_residenceReviewTime']?.value;

  if (workUnitTime && !dayjs(value).isAfter(dayjs(workUnitTime), 'day')) {
    valid = false;
  }
  if (residenceTime && !dayjs(value).isAfter(dayjs(residenceTime), 'day')) {
    valid = false;
  }

  if (!valid) {
    message = '时间必须晚于直系亲属政审表中的时间';
  }

  return { valid, message, recommendation: baseResult.recommendation };
};

const probationPublicityTimeValidator: CustomTimelineValidator = ({
  value,
  fields,
  baseResult,
}) => {
  const onlineTime = fields['onlineStudyTime']?.value;
  let valid = baseResult.valid;
  let message = baseResult.message;

  if (onlineTime) {
    const monthStart = dayjs(onlineTime).startOf('month');
    if (dayjs(value).isBefore(monthStart, 'day')) {
      valid = false;
      message = '时间必须在网络党校证明时间所在月份或之后';
    }
  }
  return { valid, message, recommendation: baseResult.recommendation };
};

const probationPublicityEndValidator: CustomTimelineValidator = ({
  value,
  fields,
  baseResult,
}) => {
  const probationPubStart = fields['probationPublicityTime']?.value;
  let valid = baseResult.valid;
  let message = baseResult.message;

  if (probationPubStart) {
    const pubEnd = getWorkdaysAfter(probationPubStart, 5);
    if (!dayjs(value).isAfter(pubEnd, 'day')) {
      valid = false;
      message = '时间必须在预备党员公示结束（5个工作日）之后';
    }
  }

  return { valid, message, recommendation: baseResult.recommendation };
};

const partyCommitteeTimeValidator: CustomTimelineValidator = ({
  value,
  fields,
  baseResult,
}) => {
  const branchPreReview = fields['m17_branchPreReviewTime']?.value;
  let valid = baseResult.valid;
  let message = baseResult.message;

  if (branchPreReview && !dayjs(value).isAfter(dayjs(branchPreReview), 'day')) {
    valid = false;
    message = '时间必须在党支部预审意见时间之后';
  }

  return { valid, message, recommendation: baseResult.recommendation };
};

const transferPublicityEndValidator: CustomTimelineValidator = ({
  value,
  fields,
  baseResult,
}) => {
  const transferPubStart = fields['transferPublicityTime']?.value;
  let valid = baseResult.valid;
  let message = baseResult.message;

  if (transferPubStart) {
    const maxDays = TIME_RULES['transferPublicityTime']?.config?.maxDays ?? 5;
    const pubEndStr = workdayPublicityEndInclusive(transferPubStart, maxDays);
    if (!dayjs(value).isAfter(dayjs(pubEndStr), 'day')) {
      valid = false;
      message = '时间必须在预备党员转正公示结束（5个工作日）之后';
    }
  }

  return { valid, message, recommendation: baseResult.recommendation };
};

const transferPublicityTimeValidator: CustomTimelineValidator = ({
  value,
  fields,
  baseResult,
}) => {
  const branchMeeting = fields['branchMeetingTime']?.value;
  let valid = baseResult.valid;
  let message = baseResult.message;

  if (valid && branchMeeting && value) {
    const maxDays = TIME_RULES['transferPublicityTime']?.config?.maxDays ?? 5;
    const pubEnd = workdayPublicityEndInclusive(value, maxDays);
    const probationEndDay = dayjs(branchMeeting).add(1, 'year');
    if (!dayjs(pubEnd).isBefore(probationEndDay, 'day')) {
      valid = false;
      message =
        '转正公示最后一天须早于预备期满日（须早于支部大会通过接受申请人为预备党员决议时间起满一年当日）';
    }
  }

  return { valid, message, recommendation: baseResult.recommendation };
};

const customValidators: Record<string, CustomTimelineValidator> = {
  committeeTime: committeeTimeValidator,
  partyFilingTime: partyFilingTimeValidator,
  introducerOpinionTime: developmentPublicityEndValidator,
  developmentFilingTime: developmentPublicityEndValidator,
  m14_workUnitReviewTime: relativePoliticalReviewValidator,
  m14_residenceReviewTime: relativePoliticalReviewValidator,
  comprehensiveReviewTime: comprehensiveReviewValidator,
  probationPublicityTime: probationPublicityTimeValidator,
  m17_branchPreReviewTime: probationPublicityEndValidator,
  m17_partyCommitteeTime: partyCommitteeTimeValidator,
  m22_branchSecretarySignTime: transferPublicityEndValidator,
  m22_contactPerson1Time: transferPublicityEndValidator,
  transferPublicityTime: transferPublicityTimeValidator,
};

export const runCustomTimelineValidation = (
  fieldKey: string,
  value: string,
  fields: Record<string, TimeField>,
  baseResult: ValidationResult
): ValidationResult => {
  const validator = customValidators[fieldKey];
  if (!validator) return baseResult;
  return validator({ fieldKey, value, fields, baseResult });
};
