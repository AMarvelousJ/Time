/**
 * 27 个发展党员材料完整规则配置
 */
import { TimeRule } from './rules';

/**
 * 5 个阶段定义
 */
export const STAGES = [
  { id: 1, name: '入党申请阶段', materials: [1, 2, 3, 4] },
  { id: 2, name: '积极分子阶段', materials: [5, 6, 7, 8, 9, 10] },
  { id: 3, name: '发展对象阶段', materials: [11, 12, 13, 14, 15, 16, 17, 18] },
  { id: 4, name: '预备党员阶段', materials: [19, 20, 21, 22, 23, 24] },
  { id: 5, name: '转正阶段', materials: [25, 26, 27] }
];

/**
 * 27 个材料定义
 */
export const MATERIALS = [
  { id: 1, name: '入党申请书', stageId: 1, fields: ['applicationTime'] },
  { id: 2, name: '入党申请人谈话表', stageId: 1, fields: ['talkTime'] },
  { id: 3, name: '入党申请人情况公示', stageId: 1, fields: ['publicityTime'] },
  { id: 4, name: '团推优', stageId: 1, fields: ['leagueTime', 'm4_applicationTime', 'recommendTime', 'youthAuditTime', 'partyOpinionTime'] },
  { id: 5, name: '入党积极分子公示单', stageId: 2, fields: ['activistPublicityTime'] },
  { id: 6, name: '入党积极分子备案登记表', stageId: 2, fields: ['m6_leagueTime', 'm6_applicationTime', 'm6_activistConfirmTime', 'committeeTime', 'm6_branchSecretarySignTime', 'm6_subCommitteeStampTime', 'partyFilingTime'] },
  { id: 7, name: '党校结业证明', stageId: 2, fields: ['partySchoolEndTime'] },
  { id: 8, name: '入党积极分子考察登记表', stageId: 2, fields: ['observeFormTime', 'm8_applicationTime', 'm8_recommendConfirmTime', 'observeReportTime1', 'observeReportTime2', 'observeReportTime3', 'observeReportTime4', 'observeReportTime5', 'observeReportTime6', 'm8_devObjectCommitteeTime'] },
  { id: 9, name: '思想汇报', stageId: 2, fields: ['thoughtReportTime1', 'thoughtReportTime2', 'thoughtReportTime3', 'thoughtReportTime4', 'thoughtReportTime5', 'thoughtReportTime6', 'thoughtReportTime7', 'thoughtReportTime8'] },
  { id: 10, name: '群众座谈会纪录表', stageId: 2, fields: ['m10_applicationTime', 'm10_activistConfirmTime', 'm10_partySchoolEndTime', 'symposiumTime', 'branchOpinionTime'] },
  { id: 11, name: '发展对象名单公示', stageId: 3, fields: ['developmentPublicityTime'] },
  { id: 12, name: '发展对象确定备案表', stageId: 3, fields: ['m12_applicationTime', 'm12_recommendTime', 'm12_activistTime', 'introducerOpinionTime', 'branchReviewTime', 'm12_subCommitteeStampTime', 'developmentFilingTime'] },
  { id: 13, name: '个人自传', stageId: 3, fields: ['selfBioTime'] },
  { id: 14, name: '直系亲属政审表', stageId: 3, fields: ['m14_workUnitReviewTime', 'm14_residenceReviewTime'] },
  { id: 15, name: '综合政审表', stageId: 3, fields: ['m15_workStartTime', 'm15_applicationTime', 'm15_activistConfirmTime', 'comprehensiveReviewTime'] },
  { id: 16, name: '网络党校学时证明', stageId: 3, fields: ['onlineStudyTime'] },
  { id: 17, name: '预备党员公示单', stageId: 3, fields: ['probationPublicityTime'] },
  { id: 18, name: '预审情况登记表', stageId: 3, fields: ['m17_applicationTime', 'm17_activistConfirmTime', 'm17_devObjectTime', 'm17_recommendTime', 'm17_publicityTime', 'm17_branchPreReviewTime', 'm17_subCommitteePreReviewTime', 'm17_partyCommitteeTime'] },
  { id: 19, name: '入党志愿书', stageId: 4, fields: ['volunteerTime', 'branchMeetingTime', 'interviewTime', 'partyApprovalTime', 'm19_transferMeetingTime', 'm19_transferApprovalTime'] },
  { id: 20, name: '票决材料', stageId: 4, fields: ['voteTime1', 'voteTime2', 'voteTime3', 'voteTime4'] },
  { id: 21, name: '接收预备党员备案表', stageId: 4, fields: ['m21_applicationTime', 'm21_recommendTime', 'm21_activistTime', 'm21_devObjectTime', 'm21_branchMeetingTime', 'm21_partyApprovalTime', 'm21_introducerTime', 'm21_massOpinionTime', 'm21_branchOpinionTime', 'm21_subOrgReviewTime', 'm21_orgDeptReviewTime'] },
  { id: 22, name: '预备党员考察表', stageId: 4, fields: ['probationObserveFormTime', 'm22_branchMeetingTime', 'probationObserveReportTime1', 'probationObserveReportTime2', 'probationObserveReportTime3', 'm22_branchSecretarySignTime', 'm22_trainingTime', 'm22_oathTime', 'm22_contactPerson1Time', 'm22_contactPerson2Time', 'm22_partyGroupTime', 'm22_committeeOpinionTime', 'm22_generalBranchTime', 'm22_partyCommitteeReviewTime'] },
  { id: 23, name: '预备党员思想汇报', stageId: 4, fields: ['probationThoughtReport1', 'probationThoughtReport2', 'probationThoughtReport3', 'probationThoughtReport4'] },
  { id: 24, name: '预备党员网络培训证明', stageId: 4, fields: ['probationOnlineStudyTime'] },
  { id: 25, name: '预备党员转正公示单', stageId: 5, fields: ['transferPublicityTime'] },
  { id: 26, name: '转正申请书', stageId: 5, fields: ['transferApplicationTime'] },
  { id: 27, name: '党员基本情况登记表', stageId: 5, fields: ['m27_workStartTime', 'partyMemberTime', 'm27_branchOpinionTime', 'm27_generalBranchTime', 'm27_partyCommitteeReviewTime'] }
];

/**
 * 字段显示名称映射
 */
export const FIELD_LABELS: Record<string, string> = {
  applicationTime: '入党申请书申请时间',
  talkTime: '谈话时间',
  publicityTime: '公示时间',
  leagueTime: '入团时间',
  recommendTime: '团支部推荐时间',
  youthAuditTime: '团委审核时间',
  partyOpinionTime: '党组织意见时间',
  activistPublicityTime: '积极分子公示时间',
  committeeTime: '支委会讨论时间',
  activistRecordTime: '积极分子备案时间',
  partyFilingTime: '二级党委或党委盖章时间',
  partySchoolEndTime: '党校结业证明时间',
  observeFormTime: '考察登记表填写时间',
  observeReportTime1: '第一次培养教育考察情况时间',
  observeReportTime2: '第二次培养教育考察情况时间',
  observeReportTime3: '第三次培养教育考察情况时间',
  observeReportTime4: '第四次培养教育考察情况时间',
  observeReportTime5: '第五次培养教育考察情况时间',
  observeReportTime6: '第六次培养教育考察情况时间',
  thoughtReportTime1: '第一篇思想汇报时间',
  thoughtReportTime2: '第二篇思想汇报时间',
  thoughtReportTime3: '第三篇思想汇报时间',
  thoughtReportTime4: '第四篇思想汇报时间',
  thoughtReportTime5: '第五篇思想汇报时间',
  thoughtReportTime6: '第六篇思想汇报时间',
  thoughtReportTime7: '第七篇思想汇报时间',
  thoughtReportTime8: '第八篇思想汇报时间',
  symposiumTime: '座谈会情况时间',
  branchOpinionTime: '党支部意见时间',
  developmentPublicityTime: '发展对象公示时间',
  introducerOpinionTime: '入党介绍人意见签字时间',
  branchReviewTime: '党支部审查意见支部书记签字时间',
  developmentFilingTime: '二级党委或党委组织部备案盖章时间',
  selfBioTime: '写自传的时间',
  politicalReviewTime: '综合政审时间',
  comprehensiveReviewTime: '所在党组织政审意见党组织盖章时间',
  onlineStudyTime: '网络党校证明上有时间',
  preReviewTime: '预审时间',
  probationPublicityTime: '预备党员公示时间',
  volunteerTime: '入党志愿书入党介绍人意见时间',
  branchMeetingTime: '支部大会通过接受申请人为预备党员决议时间',
  interviewTime: '上级党组织谈话时间',
  partyApprovalTime: '基层党委审批意见时间',
  voteTime1: '票决时间1',
  voteTime2: '票决材料2',
  voteTime3: '票决材料3',
  voteTime4: '票决时间4',
  probationFilingTime: '接收预备党员备案时间',
  probationObserveFormTime: '预备党员教育考察登记表填写时间',
  probationObserveReportTime1: '培养考察情况时间 1',
  probationObserveReportTime2: '培养考察情况时间 2',
  probationThoughtReport1: '思想汇报汇报时间 1',
  probationThoughtReport2: '思想汇报汇报时间 2',
  probationThoughtReport3: '思想汇报汇报时间 3',
  probationThoughtReport4: '思想汇报汇报时间 4',
  probationOnlineStudyTime: '预备党员网络党校学时证明纸张证明上有时间',
  transferPublicityTime: '预备党员转正公示时间',
  transferApplicationTime: '转正申请时间',
  partyMemberTime: '入党时间',
  
  // 新增的
  m4_applicationTime: '申请时间',
  m6_leagueTime: '入团时间',
  m6_applicationTime: '入党申请时间',
  m6_activistConfirmTime: '确定为入党积极分子时间',
  m6_branchSecretarySignTime: '党支部审查意见支部书记签字时间',
  m6_subCommitteeStampTime: '党工委、党总支盖章时间',
  m8_applicationTime: '申请入党时间',
  m8_recommendConfirmTime: '推荐和确定入党积极分子时间',

  m8_devObjectCommitteeTime: '确定为发展对象支部委员会意见时间',
  m10_applicationTime: '申请入党时间',
  m10_activistConfirmTime: '确定为入党积极分子时间',
  m10_partySchoolEndTime: '党校结业时间',
  m12_applicationTime: '申请入党时间',
  m12_recommendTime: '团推优时间',
  m12_activistTime: '列为入党积极分子时间',
  m12_subCommitteeStampTime: '党工委、党总支审查意见盖章时间',
  m14_workUnitReviewTime: '工作单位党组织政审意见党组织盖章时间',
  m14_residenceReviewTime: '户口所在地党组织政审意见党组织盖章时间',
  m15_workStartTime: '参加工作时间',
  m15_applicationTime: '递交入党申请书时间',
  m15_activistConfirmTime: '确定为入党积极分子时间',
  m17_applicationTime: '申请入党时间',
  m17_activistConfirmTime: '确定为入党积极分子时间',
  m17_devObjectTime: '确定为发展对象时间',
  m17_recommendTime: '团推优时间',
  m17_publicityTime: '公示时间',
  m17_branchPreReviewTime: '党支部预审意见时间',
  m17_subCommitteePreReviewTime: '党工委、党总支预审意见时间',
  m17_partyCommitteeTime: '二级党委或党委组织部时间',
  m19_transferMeetingTime: '支部大会通过预备党员转正决议时间',
  m19_transferApprovalTime: '基层党委审批意见时间(转正)',
  m21_applicationTime: '申请入党时间',
  m21_recommendTime: '团推优时间',
  m21_activistTime: '列为入党积极分子时间',
  m21_devObjectTime: '列为发展对象时间',
  m21_branchMeetingTime: '支部大会讨论表决时间',
  m21_partyApprovalTime: '基层党委讨论审批时间',
  m21_introducerTime: '入党介绍人意见时间',
  m21_massOpinionTime: '党内外群众意见时间',
  m21_branchOpinionTime: '党支部意见时间',
  m21_subOrgReviewTime: '二级党组织审查意见时间',
  m21_orgDeptReviewTime: '党委组织部门审查意见时间',
  m22_branchMeetingTime: '支部大会通过接收为预备党员的时间',
  probationObserveReportTime3: '培养考察情况时间 3',
  m22_branchSecretarySignTime: '党支部书记签字时间',
  m22_trainingTime: '培训情况时间',
  m22_oathTime: '入党宣誓时间',
  m22_contactPerson1Time: '入党联系人时间',
  m22_contactPerson2Time: '入党联系人时间(p8)',
  m22_partyGroupTime: '党小组意见时间',
  m22_committeeOpinionTime: '支部委员会意见时间',
  m22_generalBranchTime: '党总支审议时间',
  m22_partyCommitteeReviewTime: '党委审查意见时间',
  m27_workStartTime: '参加工作时间',
  m27_branchOpinionTime: '党支部意见时间',
  m27_generalBranchTime: '党总支部时间',
  m27_partyCommitteeReviewTime: '基层党委审核意见时间'
};

/**
 * 时间规则配置
 */
export const TIME_RULES: Record<string, TimeRule> = {
  // === 阶段 1: 入党申请阶段 ===
  applicationTime: { type: 'sequential', description: '手动填写', dependencies: [], config: {} },
  m4_applicationTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'applicationTime' } },
  talkTime: { type: 'fixed_offset', description: '收到申请书 1 个月内', dependencies: ['applicationTime'], config: { offset: 30, unit: 'days', direction: 'after' } },
  publicityTime: { type: 'range', description: '谈话后，公示 5 个工作日', dependencies: ['talkTime'], config: { minDays: 0, maxDays: 5, workdays: true } },
  leagueTime: { type: 'sequential', description: '按实际情况填写', dependencies: [], config: {} },
  recommendTime: { type: 'after', description: '距离申请至少3个月', dependencies: ['applicationTime', 'partyOpinionTime'], config: { minDays: 90 } },
  youthAuditTime: { type: 'after', description: '依次递进', dependencies: ['recommendTime'], config: { minDays: 0 } },
  partyOpinionTime: { type: 'after', description: '依次递进', dependencies: ['youthAuditTime'], config: { minDays: 0 } },

  // === 阶段 2: 积极分子阶段 ===
  activistPublicityTime: { type: 'range', description: '支委会后，5 工作日', dependencies: ['committeeTime'], config: { minDays: 0, maxDays: 5, workdays: true } },
  
  // 新增与补齐规则 m6
  m6_leagueTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'leagueTime' } },
  m6_applicationTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'applicationTime' } },
  committeeTime: { type: 'after', description: '距离入党申请书申请时间至少 3 个月且在党组织意见时间之后', dependencies: ['applicationTime', 'partyOpinionTime'], config: { minDays: 90 } },
  m6_activistConfirmTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'committeeTime' } },
  m6_branchSecretarySignTime: { type: 'after', description: '支委会之后', dependencies: ['committeeTime'], config: { minDays: 0 } },
  m6_subCommitteeStampTime: { type: 'empty_field', description: '此栏空，不需要填', dependencies: [], config: {} },
  partyFilingTime: { type: 'after', description: '公示结束后党委备案', dependencies: ['activistPublicityTime', 'm6_branchSecretarySignTime'], config: { minDays: 0 } },
  
  partySchoolEndTime: { type: 'sequential', description: '落款时间', dependencies: [], config: { granularity: 'month' } },
  
  // m8
  observeFormTime: { type: 'after', description: '党委备案后', dependencies: ['partyFilingTime'], config: { minDays: 0 } },
  m8_applicationTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'applicationTime' } },
  m8_recommendConfirmTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'm6_activistConfirmTime' } },
  observeReportTime1: { type: 'quarterly', description: '第 1 个半年', dependencies: ['m8_recommendConfirmTime'], config: { periodType: 'half_year', periodIndex: 0, required: true } },
  observeReportTime2: { type: 'quarterly', description: '第 2 个半年', dependencies: ['m8_recommendConfirmTime', 'observeReportTime1'], config: { periodType: 'half_year', periodIndex: 1, required: true } },
  observeReportTime3: { type: 'quarterly', description: '第 3 个半年 (选填)', dependencies: ['m8_recommendConfirmTime', 'observeReportTime2'], config: { periodType: 'half_year', periodIndex: 2, required: false } },
  observeReportTime4: { type: 'quarterly', description: '第 4 个半年 (选填)', dependencies: ['m8_recommendConfirmTime', 'observeReportTime3'], config: { periodType: 'half_year', periodIndex: 3, required: false } },
  observeReportTime5: { type: 'quarterly', description: '第 5 个半年 (选填)', dependencies: ['m8_recommendConfirmTime', 'observeReportTime4'], config: { periodType: 'half_year', periodIndex: 4, required: false } },
  observeReportTime6: { type: 'quarterly', description: '第 6 个半年 (选填)', dependencies: ['m8_recommendConfirmTime', 'observeReportTime5'], config: { periodType: 'half_year', periodIndex: 5, required: false } },
  m8_devObjectCommitteeTime: { type: 'after', description: '群众座谈会和个人谈话后', dependencies: ['observeReportTime4'], config: { minDays: 0 } },
  
  thoughtReportTime1: { type: 'quarterly', description: '第 1 季度', dependencies: ['m6_activistConfirmTime'], config: { periodType: 'quarter', periodIndex: 0, required: true } },
  thoughtReportTime2: { type: 'quarterly', description: '第 2 季度', dependencies: ['m6_activistConfirmTime', 'thoughtReportTime1'], config: { periodType: 'quarter', periodIndex: 1, required: true } },
  thoughtReportTime3: { type: 'quarterly', description: '第 3 季度', dependencies: ['m6_activistConfirmTime', 'thoughtReportTime2'], config: { periodType: 'quarter', periodIndex: 2, required: true } },
  thoughtReportTime4: { type: 'quarterly', description: '第 4 季度', dependencies: ['m6_activistConfirmTime', 'thoughtReportTime3'], config: { periodType: 'quarter', periodIndex: 3, required: true } },
  thoughtReportTime5: { type: 'quarterly', description: '第 5 季度 (选填)', dependencies: ['m6_activistConfirmTime', 'thoughtReportTime4'], config: { periodType: 'quarter', periodIndex: 4, required: false } },
  thoughtReportTime6: { type: 'quarterly', description: '第 6 季度 (选填)', dependencies: ['m6_activistConfirmTime', 'thoughtReportTime5'], config: { periodType: 'quarter', periodIndex: 5, required: false } },
  thoughtReportTime7: { type: 'quarterly', description: '第 7 季度 (选填)', dependencies: ['m6_activistConfirmTime', 'thoughtReportTime6'], config: { periodType: 'quarter', periodIndex: 6, required: false } },
  thoughtReportTime8: { type: 'quarterly', description: '第 8 季度 (选填)', dependencies: ['m6_activistConfirmTime', 'thoughtReportTime7'], config: { periodType: 'quarter', periodIndex: 7, required: false } },
  
  // m10
  m10_applicationTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'applicationTime' } },
  m10_activistConfirmTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'm6_activistConfirmTime' } },
  m10_partySchoolEndTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'partySchoolEndTime' } },
  symposiumTime: { type: 'after', description: '满一周年后，支委会前', dependencies: ['m6_activistConfirmTime'], config: { minDays: 365 } },
  branchOpinionTime: { type: 'after', description: '座谈会同天或稍晚', dependencies: ['symposiumTime'], config: { minDays: 0 } },

  // === 阶段 3: 发展对象阶段 ===
  developmentPublicityTime: { type: 'range', description: '公示期满5个工作日', dependencies: ['m8_devObjectCommitteeTime'], config: { minDays: 0, maxDays: 5, workdays: true } },
  
  // m12
  m12_applicationTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'applicationTime' } },
  m12_recommendTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'recommendTime' } },
  m12_activistTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'm6_activistConfirmTime' } },
  introducerOpinionTime: { type: 'after', description: '公示最后一天之后', dependencies: ['developmentPublicityTime'], config: { minDays: 0 } },
  branchReviewTime: { type: 'after', description: '同上', dependencies: ['introducerOpinionTime'], config: { minDays: 0 } },
  m12_subCommitteeStampTime: { type: 'empty_field', description: '此栏空，不需要填', dependencies: [], config: {} },
  developmentFilingTime: { type: 'after', description: '发展对象公示结束之后', dependencies: ['developmentPublicityTime', 'branchReviewTime'], config: { minDays: 0 } },
  
  selfBioTime: { type: 'after', description: '政审后填写', dependencies: ['developmentFilingTime'], config: { minDays: 0 } },
  
  // m14
  m14_workUnitReviewTime: { type: 'after', description: '二级党委或党委组织部盖章时间后，所在党组织政审意见党组织盖章时间前', dependencies: ['developmentFilingTime'], config: { minDays: 0 } },
  m14_residenceReviewTime: { type: 'after', description: '二级党委或党委组织部盖章时间后，所在党组织政审意见党组织盖章时间前', dependencies: ['developmentFilingTime'], config: { minDays: 0 } },
  
  // m15
  m15_workStartTime: { type: 'sequential', description: '按实际情况', dependencies: [], config: {} },
  m15_applicationTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'applicationTime' } },
  m15_activistConfirmTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'm6_activistConfirmTime' } },
  comprehensiveReviewTime: { type: 'after', description: '晚于直系政审', dependencies: ['m14_workUnitReviewTime', 'm14_residenceReviewTime'], config: { minDays: 0 } },
  
  onlineStudyTime: { type: 'sequential', description: '证明时间', dependencies: [], config: { granularity: 'month' } },
  
  // m17
  m17_applicationTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'applicationTime' } },
  m17_activistConfirmTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'm6_activistConfirmTime' } },
  m17_devObjectTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'developmentFilingTime' } },
  m17_recommendTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'recommendTime' } },
  m17_publicityTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'developmentPublicityTime' } },
  m17_branchPreReviewTime: { type: 'after', description: '预备党员公示结束后（且晚于综合政审）', dependencies: ['probationPublicityTime', 'comprehensiveReviewTime'], config: { minDays: 0 } },
  m17_subCommitteePreReviewTime: { type: 'empty_field', description: '此栏空，不需要填', dependencies: [], config: {} },
  m17_partyCommitteeTime: { type: 'after', description: '党支部预审时间后', dependencies: ['m17_branchPreReviewTime'], config: { minDays: 0 } },
  
  probationPublicityTime: { type: 'range', description: '公示 5 个工作日（需在网络党校证明时间所在月份或之后）', dependencies: ['onlineStudyTime'], config: { minDays: 0, maxDays: 5, workdays: true } },

  // === 阶段 4: 预备党员阶段 ===
  // m19
  volunteerTime: { type: 'after', description: '需晚于二级党委或党委组织部时间（一般早于支部大会1-2天）', dependencies: ['m17_partyCommitteeTime'], config: { minDays: 0, strictAfter: true } },
  branchMeetingTime: { type: 'after', description: '支部大会当天', dependencies: ['volunteerTime'], config: { minDays: 0 } },
  interviewTime: { type: 'range', description: '须晚于支部大会（不可同日），早于党委', dependencies: ['branchMeetingTime'], config: { minDays: 1, maxDays: 5 } },
  partyApprovalTime: { type: 'after', description: '听学院组织员通知，党委会当天', dependencies: ['interviewTime'], config: { minDays: 0, strictAfter: true } },
  m19_transferMeetingTime: { type: 'sync', description: '支部大会接受为预备党员之日起满一年当日', dependencies: ['branchMeetingTime'], config: { syncFrom: 'branchMeetingTime', offsetYears: 1 } },
  m19_transferApprovalTime: { type: 'after', description: '听组织员通知，党委会当天', dependencies: ['m19_transferMeetingTime'], config: { minDays: 0, strictAfter: true } },
  
  voteTime1: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'branchMeetingTime' } },
  voteTime2: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'partyApprovalTime' } },
  voteTime3: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'm19_transferMeetingTime' } },
  voteTime4: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'm19_transferApprovalTime' } },
  
  // m21
  m21_applicationTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'applicationTime' } },
  m21_recommendTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'recommendTime' } },
  m21_activistTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'm6_activistConfirmTime' } },
  m21_devObjectTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'developmentFilingTime' } },
  m21_branchMeetingTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'branchMeetingTime' } },
  m21_partyApprovalTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'partyApprovalTime' } },
  m21_introducerTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'volunteerTime' } },
  m21_massOpinionTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'symposiumTime' } },
  m21_branchOpinionTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'branchMeetingTime' } },
  m21_subOrgReviewTime: { type: 'after', description: '审查意见', dependencies: ['branchMeetingTime'], config: { minDays: 0 } },
  m21_orgDeptReviewTime: { type: 'after', description: '党委审批后', dependencies: ['partyApprovalTime'], config: { minDays: 0 } },
  
  // m22
  probationObserveFormTime: { type: 'after', description: '填写时间', dependencies: ['branchMeetingTime'], config: { minDays: 0 } },
  m22_branchMeetingTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'branchMeetingTime' } },
  probationObserveReportTime1: { type: 'sync', description: '满第1个季度次日（自支部大会接收预备党员）', dependencies: ['branchMeetingTime'], config: { syncFrom: 'branchMeetingTime', offsetMonths: 3, offsetDays: 1 } },
  probationObserveReportTime2: { type: 'sync', description: '满第2个季度次日（自支部大会接收预备党员）', dependencies: ['branchMeetingTime'], config: { syncFrom: 'branchMeetingTime', offsetMonths: 6, offsetDays: 1 } },
  probationObserveReportTime3: { type: 'sync', description: '满第3个季度次日（自支部大会接收预备党员）', dependencies: ['branchMeetingTime'], config: { syncFrom: 'branchMeetingTime', offsetMonths: 9, offsetDays: 1 } },
  m22_branchSecretarySignTime: { type: 'after', description: '须晚于预备党员转正公示期最后一日', dependencies: ['transferPublicityTime'], config: { minDays: 0 } },
  m22_trainingTime: { type: 'before', description: '须早于转正申请时间（不可同日）', dependencies: ['transferApplicationTime'], config: { strictBefore: true } },
  m22_oathTime: { type: 'after', description: '党委审批通过预备党员后', dependencies: ['partyApprovalTime'], config: { minDays: 0 } },
  m22_contactPerson1Time: { type: 'after', description: '须晚于预备党员转正公示期最后一日', dependencies: ['transferPublicityTime'], config: { minDays: 0 } },
  m22_contactPerson2Time: { type: 'sync', description: '与入党联系人时间一致', dependencies: ['m22_contactPerson1Time'], config: { syncFrom: 'm22_contactPerson1Time' } },
  m22_partyGroupTime: { type: 'empty_field', description: '此栏空，不需要填', dependencies: [], config: {} },
  m22_committeeOpinionTime: { type: 'after', description: '须晚于入党联系人时间（不可同日）', dependencies: ['m22_contactPerson1Time'], config: { minDays: 0, strictAfter: true } },
  m22_generalBranchTime: { type: 'empty_field', description: '此栏空，不需要填', dependencies: [], config: {} },
  m22_partyCommitteeReviewTime: { type: 'after', description: '支委会之后，转正大会前', dependencies: ['m22_committeeOpinionTime'], config: { minDays: 0 } },
  
  // m23
  probationThoughtReport1: { type: 'quarterly', description: '每季度 1 篇', dependencies: ['branchMeetingTime'], config: { minDays: 0, maxDays: 90 } },
  probationThoughtReport2: { type: 'quarterly', description: '每季度 1 篇', dependencies: ['probationThoughtReport1'], config: { minDays: 0, maxDays: 90 } },
  probationThoughtReport3: { type: 'quarterly', description: '每季度 1 篇', dependencies: ['probationThoughtReport2'], config: { minDays: 0, maxDays: 90 } },
  probationThoughtReport4: { type: 'quarterly', description: '每季度 1 篇', dependencies: ['probationThoughtReport3'], config: { minDays: 0, maxDays: 90 } },
  
  // m24
  probationOnlineStudyTime: { type: 'sequential', description: '手动填写', dependencies: [], config: {} },

  // === 阶段 5: 转正阶段 ===
  transferApplicationTime: { type: 'range', description: '期满前半个月内提出（须距支部大会满预备期 350～364 天，不含满 365 天当日）', dependencies: ['branchMeetingTime'], config: { minDays: 350, maxDays: 364 } },
  transferPublicityTime: { type: 'range', description: '转正申请后，公示 5 个工作日（公示最后一天须早于预备期满日）', dependencies: ['transferApplicationTime', 'branchMeetingTime'], config: { minDays: 0, maxDays: 5, workdays: true } },
  
  m27_workStartTime: { type: 'sequential', description: '手动填写', dependencies: [], config: {} },
  partyMemberTime: { type: 'sync', description: '自动同步', dependencies: [], config: { syncFrom: 'branchMeetingTime' } },
  m27_branchOpinionTime: { type: 'after', description: '填写意见', dependencies: ['partyMemberTime'], config: { minDays: 0 } },
  m27_generalBranchTime: { type: 'empty_field', description: '此栏空，不需要填', dependencies: [], config: {} },
  m27_partyCommitteeReviewTime: { type: 'after', description: '党委审核', dependencies: ['m27_branchOpinionTime'], config: { minDays: 0 } }
};
