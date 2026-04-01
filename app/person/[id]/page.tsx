"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePersonStore } from "@/store/person-store";
import { useTimeStore } from "@/store/time-store";
import { STAGES, MATERIALS, TIME_RULES, FIELD_LABELS } from "@/types/materials";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimelineOverview } from "@/components/ui/timeline-overview";

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { persons, selectPerson, loadFromStorage: loadPersons } = usePersonStore();
  const { getAllFields, setTimeField, setCurrentPersonId, loadFromStorage: loadTimeFields } = useTimeStore();

  const personId = params.id as string;
  const [activeStageId, setActiveStageId] = useState<number>(1);
  const [personFound, setPersonFound] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  useEffect(() => {
    loadPersons();
    loadTimeFields();
  }, []);

  useEffect(() => {
    const person = persons.find((p) => p.id === personId);
    setPersonFound(!!person);
    if (person) {
      selectPerson(personId);
      setCurrentPersonId(personId);
    }
    setLoaded(true);
  }, [personId, persons]);

  const person = persons.find((p) => p.id === personId);
  const timeFields = getAllFields();

  // 检查字段的前置依赖是否已填写
  const checkDependencies = (fieldKey: string): { satisfied: boolean; missingField?: string } => {
    const rule = TIME_RULES[fieldKey];
    if (!rule || rule.dependencies.length === 0) {
      return { satisfied: true };
    }

    for (const depKey of rule.dependencies) {
      const depField = timeFields[depKey];
      const depRule = TIME_RULES[depKey];
      if (!depField || !depField.value) {
        if (depRule?.config?.required === false) {
          // 选填字段如果没填，我们递归检查它的前置依赖是否满足
          const upstreamCheck = checkDependencies(depKey);
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

  // 获取字段的前置依赖提示信息
  const getDependencyHint = (fieldKey: string): string | null => {
    const { satisfied, missingField } = checkDependencies(fieldKey);
    if (satisfied) return null;
    if (missingField) {
      return `请先填写：${FIELD_LABELS[missingField] || missingField}`;
    }
    return null;
  };

  // 获取某个阶段的完成进度
  const getStageProgress = (stageId: number) => {
    const stageMaterials = MATERIALS.filter((m) => m.stageId === stageId);
    const validFields = stageMaterials
      .flatMap((m) => m.fields)
      .filter(f => {
        const rule = TIME_RULES[f];
        return rule?.type !== 'empty_field' && rule?.config?.required !== false;
      });
    if (validFields.length === 0) return 0;
    const filledFields = validFields.filter((field) => timeFields[field]?.value).length;
    return Math.round((filledFields / validFields.length) * 100);
  };

  // 获取字段状态
  const getFieldStatus = (fieldKey: string) => {
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

  // 获取状态对应的 Badge 配置
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "filled":
      case "sync":
        return <Badge variant="default" className="bg-green-500">已填</Badge>;
      case "conflict":
        return <Badge variant="destructive">冲突</Badge>;
      case "empty_field":
        return <Badge variant="outline" className="text-slate-400 border-slate-200 bg-slate-50">无需填</Badge>;
      case "optional":
        return <Badge variant="outline" className="text-slate-500 bg-slate-100 border-slate-200">选填</Badge>;
      case "empty":
      default:
        return <Badge variant="secondary" className="bg-gray-300 text-gray-600">未填</Badge>;
    }
  };

  // 处理日期变更
  const handleDateChange = (fieldKey: string, date: string | null) => {
    setTimeField(fieldKey, date);
  };

  // 获取同步来源的信息
  const getSyncSourceInfo = (ruleConfig: any) => {
    if (!ruleConfig || ruleConfig.type !== 'sync' || !ruleConfig.config?.syncFrom) return null;
    const sourceKey = ruleConfig.config.syncFrom;
    const sourceMaterial = MATERIALS.find(m => m.fields.includes(sourceKey));
    const materialName = sourceMaterial ? sourceMaterial.name : '未知材料';
    const fieldName = FIELD_LABELS[sourceKey] || sourceKey;
    return `（同步自：${materialName} - ${fieldName}）`;
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!personFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            未找到该人员
          </h2>
          <p className="text-gray-500 mb-6">
            该发展对象可能已被删除或不存在
          </p>
          <Button onClick={() => router.push("/")}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  const currentStage = STAGES.find((s) => s.id === activeStageId);
  const currentMaterials = MATERIALS.filter(
    (m) => m.stageId === activeStageId
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航栏 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push("/")}>
              ← 返回/切换
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">当前发展对象：</span>
              <span className="text-lg font-semibold text-gray-900">
                {person?.name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" disabled>
              导入 Excel
            </Button>
            <Button variant="outline" size="sm" disabled>
              导出
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTimelineOpen(true)}
            >
              <Clock className="mr-2 h-4 w-4" />
              时间轴概览
            </Button>
          </div>
        </div>
      </header>

      {/* 主体内容区 - 左右分栏布局 */}
      <div className="flex h-[calc(100vh-60px)]">
        {/* 左侧阶段导航（1/4 宽度） */}
        <aside className="w-1/4 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              阶段导航
            </h3>
            <Accordion
              value={[activeStageId.toString()]}
              onValueChange={(value) => {
                if (value && value.length > 0) {
                  setActiveStageId(parseInt(value[0]));
                } else {
                  setActiveStageId(1);
                }
              }}
            >
              {STAGES.map((stage) => {
                const progress = getStageProgress(stage.id);
                return (
                  <AccordionItem
                    key={stage.id}
                    value={stage.id.toString()}
                    className={cn(
                      "cursor-pointer transition-colors",
                      activeStageId === stage.id && "bg-blue-50 rounded-lg px-2"
                    )}
                  >
                    <AccordionTrigger className="py-3">
                      <div className="flex flex-col gap-1 w-full">
                        <span className="text-sm font-medium">
                          {stage.name}
                        </span>
                        <div className="flex items-center gap-3 mt-1">
                          <Progress 
                            value={progress} 
                            className="h-2 flex-1 bg-gray-100 overflow-hidden [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-blue-500 [&>[data-slot=progress-indicator]]:to-indigo-500" 
                          />
                          <span className="text-xs font-semibold text-gray-500 min-w-10 text-right">
                            {progress}%
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-2 py-2 space-y-1">
                        {MATERIALS.filter((m) => m.stageId === stage.id).map(
                          (material) => (
                            <div
                              key={material.id}
                              className="text-xs text-gray-600 py-1"
                            >
                              • {material.name}
                            </div>
                          )
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </aside>

        {/* 右侧材料列表（3/4 宽度） */}
        <main className="w-3/4 overflow-y-auto p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {currentStage?.name} - 材料列表
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              完成度：{getStageProgress(activeStageId)}%
            </p>
          </div>

          <div className="space-y-4">
            {currentMaterials.map((material) => (
              <div
                key={material.id}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-900">
                    {material.id}. {material.name}
                  </h3>
                  {/* 材料整体状态 */}
                  <Badge
                    variant={
                      material.fields.every((f) => {
                        const rule = TIME_RULES[f];
                        return timeFields[f]?.value || rule?.type === 'empty_field' || rule?.config?.required === false;
                      })
                        ? "default"
                        : "secondary"
                    }
                    className={
                      material.fields.every((f) => {
                        const rule = TIME_RULES[f];
                        return timeFields[f]?.value || rule?.type === 'empty_field' || rule?.config?.required === false;
                      })
                        ? "bg-green-500"
                        : "bg-gray-300 text-gray-600"
                    }
                  >
                    {material.fields.every((f) => {
                        const rule = TIME_RULES[f];
                        return timeFields[f]?.value || rule?.type === 'empty_field' || rule?.config?.required === false;
                    })
                      ? "已完成"
                      : "未完成"}
                  </Badge>
                </div>

                <Separator className="my-3" />

                {/* 时间字段列表 */}
                <div className="grid gap-4">
                  {material.fields.map((fieldKey) => {
                    const field = timeFields[fieldKey];
                    const status = getFieldStatus(fieldKey);
                    const rule = TIME_RULES[fieldKey];
                    const { satisfied } = checkDependencies(fieldKey);
                    const dependencyHint = getDependencyHint(fieldKey);
                    const hasError = status === "conflict";

                    // 团推优材料中的 applicationTime 是只读的（从入党申请书同步）
                    // 现已统一为 'sync' 和 'empty_field' 类型
                    const isReadOnly = rule?.type === 'sync';
                    const isEmptyField = rule?.type === 'empty_field';

                    return (
                      <div
                        key={fieldKey}
                        className={cn(
                          "p-3 rounded-lg border transition-colors",
                          isEmptyField
                            ? "border-gray-200 bg-gray-100 opacity-60"
                            : hasError
                            ? "border-red-200 bg-red-50"
                            : status === "filled" || status === "sync"
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 bg-gray-50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-700">
                              {FIELD_LABELS[fieldKey] || fieldKey}
                            </span>
                            {isReadOnly && (
                              <span className="text-xs text-gray-400 italic">
                                {getSyncSourceInfo(rule) || "（从前面步骤自动同步）"}
                              </span>
                            )}
                            {rule && !isReadOnly && !isEmptyField && (
                              <span className="text-xs text-gray-400 italic">
                                ({rule.description})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* 日期选择器或占位符 */}
                            {isEmptyField ? (
                              <div className="px-3 py-1.5 bg-gray-200 rounded-md text-sm text-gray-500 min-w-[140px] text-center border border-dashed border-gray-400">
                                此栏空，不需要填
                              </div>
                            ) : isReadOnly ? (
                              <div className="px-3 py-1.5 bg-gray-100 rounded-md text-sm text-gray-500 min-w-[140px] text-center">
                                {field?.value || "等待同步..."}
                              </div>
                            ) : dependencyHint ? (
                              <Tooltip>
                                <TooltipTrigger render={
                                  <div className="relative">
                                    <DatePicker
                                      value={field?.value || undefined}
                                      onChange={(date) => handleDateChange(fieldKey, date)}
                                      disabled={!satisfied}
                                      hasError={hasError}
                                      placeholder="请选择日期"
                                      granularity={rule?.config?.granularity}
                                    />
                                    <AlertCircle className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                                  </div>
                                } />
                                <TooltipContent>
                                  <p className="text-sm">{dependencyHint}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <DatePicker
                                value={field?.value || undefined}
                                onChange={(date) => handleDateChange(fieldKey, date)}
                                disabled={!satisfied}
                                hasError={hasError}
                                placeholder="请选择日期"
                                granularity={rule?.config?.granularity}
                              />
                            )}
                            {/* 状态 Badge */}
                            {isEmptyField ? (
                              getStatusBadge("empty")
                            ) : isReadOnly ? (
                              getStatusBadge(field?.value ? "sync" : "empty")
                            ) : getStatusBadge(status)}
                          </div>
                        </div>
                        {/* 错误提示 */}
                        {hasError && field?.errorMessage && (
                          <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>{field.errorMessage}</span>
                          </div>
                        )}
                        {/* 推荐提示 */}
                        {field?.recommendation && !hasError && (
                          <div className="mt-2 text-blue-600 text-sm">
                            💡 {field.recommendation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* 时间轴概览弹窗 */}
      <TimelineOverview open={isTimelineOpen} onOpenChange={setIsTimelineOpen} />
    </div>
  );
}
