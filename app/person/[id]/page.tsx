"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePersonStore } from "@/store/person-store";
import { useTimeStore } from "@/store/time-store";
import { STAGES, MATERIALS, TIME_RULES, FIELD_LABELS } from "@/types/materials";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { AlertCircle, Bot, Clock, Loader2, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimelineOverview } from "@/components/ui/timeline-overview";
import { workdayPublicityEndInclusive } from "@/utils/date-utils";
import { apiFetch } from "@/lib/services/api-client";
import {
  checkFieldDependencies as deriveFieldDependencies,
  getDependencyHint as deriveDependencyHint,
  getFieldStatus as deriveFieldStatus,
  getStageProgress as deriveStageProgress,
  getSyncSourceInfo as deriveSyncSourceInfo,
  isMaterialComplete,
} from "@/lib/domain/timeline-view-model";

type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { persons, selectPerson, loadFromStorage: loadPersons } = usePersonStore();
  const {
    getAllFields,
    setTimeField,
    setCurrentPersonId,
    loadFromStorage: loadTimeFields,
    saveError,
  } = useTimeStore();

  const personId = params.id as string;
  const [activeStageId, setActiveStageId] = useState<number>(1);
  const [loaded, setLoaded] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>(
    [
      {
        id: "welcome",
        role: "assistant",
        content:
          "你好，我是智能助手。可以帮你梳理发展党员材料时间、解释冲突原因，或给出下一步填写建议。",
      },
    ]
  );
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantConversationId, setAssistantConversationId] = useState<
    string | null
  >(null);
  const [isAssistantSending, setIsAssistantSending] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const assistantEndRef = useRef<HTMLDivElement | null>(null);
  const person = persons.find((p) => p.id === personId);
  const personFound = Boolean(person);

  useEffect(() => {
    void loadPersons().finally(() => setLoaded(true));
    void loadTimeFields();
  }, [loadPersons, loadTimeFields]);

  useEffect(() => {
    if (person) {
      selectPerson(personId);
      void setCurrentPersonId(personId);
    }
  }, [person, personId, selectPerson, setCurrentPersonId]);

  useEffect(() => {
    assistantEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [assistantMessages, isAssistantSending]);

  const timeFields = getAllFields();

  // 检查字段的前置依赖是否已填写
  const checkDependencies = (fieldKey: string): { satisfied: boolean; missingField?: string } => {
    return deriveFieldDependencies(fieldKey, timeFields);
  };

  // 获取字段的前置依赖提示信息
  const getDependencyHint = (fieldKey: string): string | null => {
    return deriveDependencyHint(fieldKey, timeFields);
  };

  // 获取某个阶段的完成进度
  const getStageProgress = (stageId: number) => {
    return deriveStageProgress(stageId, timeFields);
  };

  // 获取字段状态
  const getFieldStatus = (fieldKey: string) => {
    return deriveFieldStatus(fieldKey, timeFields);
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
    void setTimeField(fieldKey, date);
  };

  const sendAssistantMessage = async () => {
    const query = assistantInput.trim();
    if (!query || isAssistantSending) return;

    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
    };
    const assistantMessageId = `assistant-${Date.now()}`;

    setAssistantInput("");
    setAssistantError(null);
    setIsAssistantSending(true);
    setAssistantMessages((messages) => [
      ...messages,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      },
    ]);

    try {
      const payload = await apiFetch<{
        answer: string;
        conversationId: string | null;
      }>("/api/assistant/chat", {
        method: "POST",
        body: JSON.stringify({
          query,
          conversationId: assistantConversationId,
          studentId: personId,
          studentName: person?.name ?? "",
        }),
      });

      setAssistantConversationId(payload.conversationId);
      setAssistantMessages((messages) =>
        messages.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content: payload.answer || "我暂时没有生成有效回复。",
              }
            : message
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "发送失败";
      setAssistantError(message);
      setAssistantMessages((messages) =>
        messages.filter((item) => item.id !== assistantMessageId)
      );
    } finally {
      setIsAssistantSending(false);
    }
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
            {saveError && (
              <p className="mt-2 text-sm text-red-600">
                保存失败：{saveError}
              </p>
            )}
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
                      isMaterialComplete(material.fields, timeFields)
                        ? "default"
                        : "secondary"
                    }
                    className={
                      isMaterialComplete(material.fields, timeFields)
                        ? "bg-green-500"
                        : "bg-gray-300 text-gray-600"
                    }
                  >
                    {isMaterialComplete(material.fields, timeFields)
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

                    const isWorkdayPublicityField =
                      rule?.type === "range" && Boolean(rule.config?.workdays);

                    const workdayPublicityRangeEnd =
                      isWorkdayPublicityField && field?.value
                        ? workdayPublicityEndInclusive(
                            field.value,
                            rule.config.maxDays ?? 5
                          )
                        : undefined;

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
                                {deriveSyncSourceInfo(rule) || "（从前面步骤自动同步）"}
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
                                      placeholder={
                                        isWorkdayPublicityField
                                          ? "请选择公示起始日"
                                          : "请选择日期"
                                      }
                                      granularity={rule?.config?.granularity}
                                      rangeEndDate={workdayPublicityRangeEnd}
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
                                placeholder={
                                  isWorkdayPublicityField
                                    ? "请选择公示起始日"
                                    : "请选择日期"
                                }
                                granularity={rule?.config?.granularity}
                                rangeEndDate={workdayPublicityRangeEnd}
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

      <Button
        type="button"
        size="icon-lg"
        className="fixed bottom-6 left-6 z-40 size-12 rounded-full bg-blue-600 shadow-xl shadow-blue-900/20 hover:bg-blue-700"
        onClick={() => setIsAssistantOpen(true)}
        aria-label="打开智能助手"
        title="智能助手"
      >
        <Bot className="h-5 w-5" />
      </Button>

      <Dialog open={isAssistantOpen} onOpenChange={setIsAssistantOpen}>
        <DialogContent className="h-[min(720px,calc(100vh-1.5rem))] w-[min(430px,calc(100vw-1.5rem))] max-w-none grid-rows-[auto_1fr_auto] gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl shadow-slate-900/20 ring-0 sm:max-w-none">
          <DialogHeader className="border-b border-slate-100 bg-white px-5 py-4 pr-12">
            <DialogTitle className="flex items-center gap-3 text-base font-semibold text-slate-950">
              <span className="flex size-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm shadow-blue-900/20">
                <Bot className="h-4 w-4" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span>智能助手</span>
                <span className="text-xs font-normal text-slate-500">
                  发展党员材料时间咨询
                </span>
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 space-y-4 overflow-y-auto bg-slate-50 px-5 py-4">
            {assistantMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                    message.role === "user"
                      ? "rounded-br-md bg-blue-600 text-white"
                      : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                  )}
                >
                  {message.content ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      正在思考
                    </div>
                  )}
                </div>
              </div>
            ))}
            {assistantError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {assistantError}
              </div>
            )}
            <div ref={assistantEndRef} />
          </div>
          <div className="border-t border-slate-100 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              可询问材料时间规则、冲突原因或下一步填写建议
            </div>
            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void sendAssistantMessage();
              }}
            >
              <textarea
                value={assistantInput}
                onChange={(event) => setAssistantInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendAssistantMessage();
                  }
                }}
                rows={2}
                placeholder="输入你的问题..."
                className="min-h-11 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-100"
                disabled={isAssistantSending}
              />
              <Button
                type="submit"
                size="icon-lg"
                className="size-11 rounded-xl"
                disabled={!assistantInput.trim() || isAssistantSending}
                aria-label="发送消息"
              >
                {isAssistantSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
