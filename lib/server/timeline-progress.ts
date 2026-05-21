import { MATERIALS, STAGES, TIME_RULES } from "@/types/materials";

const getCountableFieldsForStage = (stageId: number): string[] =>
  MATERIALS.filter((m) => m.stageId === stageId)
    .flatMap((m) => m.fields)
    .filter((fieldKey) => {
      const rule = TIME_RULES[fieldKey];
      return rule?.type !== "empty_field" && rule?.config?.required !== false;
    });

export const computeTimelineProgress = (snapshot: Record<string, string | null>) => {
  const stageProgress = STAGES.map((stage) => {
    const fields = getCountableFieldsForStage(stage.id);
    const total = fields.length;
    const filled = fields.filter((fieldKey) => Boolean(snapshot[fieldKey])).length;
    const percent = total === 0 ? 0 : Math.round((filled / total) * 100);
    return {
      stageId: stage.id,
      stageName: stage.name,
      filled,
      total,
      percent,
    };
  });

  const totalFields = stageProgress.reduce((sum, item) => sum + item.total, 0);
  const filledCount = stageProgress.reduce((sum, item) => sum + item.filled, 0);
  const progressPercent =
    totalFields === 0 ? 0 : Math.round((filledCount / totalFields) * 100);

  const currentStage =
    stageProgress.find((item) => item.percent < 100) ??
    stageProgress[stageProgress.length - 1];

  return {
    filledCount,
    totalFields,
    progressPercent,
    currentStageId: currentStage.stageId,
    currentStageName: currentStage.stageName,
    stageProgress,
  };
};

export const renderStudentStatusLabel = (status: string) => {
  if (status === "completed") return "已完成";
  if (status === "needs-fix") return "待修正";
  return "进行中";
};
