"use client";

import { useMemo } from "react";
import { useTimeStore } from "@/store/time-store";
import { MATERIALS, FIELD_LABELS } from "@/types/materials";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineOverviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 字段 ID 到材料名称的映射
const getFieldMaterialName = (fieldKey: string): string => {
  const material = MATERIALS.find((m) => m.fields.includes(fieldKey));
  return material ? material.name : fieldKey;
};

// 获取字段所属阶段
const getFieldStage = (fieldKey: string): number => {
  const material = MATERIALS.find((m) => m.fields.includes(fieldKey));
  return material ? material.stageId : 1;
};

// 阶段颜色
const STAGE_COLORS = [
  "border-blue-500 bg-blue-50 text-blue-700",   // 阶段 1
  "border-green-500 bg-green-50 text-green-700", // 阶段 2
  "border-purple-500 bg-purple-50 text-purple-700", // 阶段 3
  "border-orange-500 bg-orange-50 text-orange-700", // 阶段 4
  "border-red-500 bg-red-50 text-red-700",     // 阶段 5
];

export function TimelineOverview({ open, onOpenChange }: TimelineOverviewProps) {
  const { getAllFields } = useTimeStore();
  const timeFields = getAllFields();

  // 提取已填和冲突的字段，按时间排序
  const sortedTimeline = useMemo(() => {
    const filledFields = Object.entries(timeFields)
      .filter(([, field]) => field?.value && (field.status === "filled" || field.status === "conflict"))
      .map(([key, field]) => ({
        key,
        value: field.value!,
        status: field.status,
        errorMessage: field.errorMessage,
        materialName: getFieldMaterialName(key),
        stageId: getFieldStage(key),
        label: FIELD_LABELS[key] || key,
      }))
      .sort((a, b) => new Date(a.value).getTime() - new Date(b.value).getTime());

    return filledFields;
  }, [timeFields]);

  // 统计
  const stats = useMemo(() => {
    const total = sortedTimeline.length;
    const conflict = sortedTimeline.filter((f) => f.status === "conflict").length;
    const normal = total - conflict;
    return { total, conflict, normal };
  }, [sortedTimeline]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[480px]">
        <SheetHeader>
          <SheetTitle>时间轴概览</SheetTitle>
          <SheetDescription>
            按时间顺序展示所有已填写的时间字段
          </SheetDescription>
        </SheetHeader>

        {/* 统计信息 */}
        <div className="flex gap-4 py-4">
          <div className="flex-1 rounded-lg bg-gray-100 p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-gray-500">已填字段</div>
          </div>
          <div className="flex-1 rounded-lg bg-green-100 p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.normal}</div>
            <div className="text-xs text-green-600">正常</div>
          </div>
          <div className="flex-1 rounded-lg bg-red-100 p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.conflict}</div>
            <div className="text-xs text-red-600">冲突</div>
          </div>
        </div>

        <Separator />

        {/* 时间轴列表 */}
        <ScrollArea className="h-[calc(100vh-250px)] pr-4">
          {sortedTimeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-gray-100 p-4">
                <CheckCircle2 className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">暂无已填时间数据</p>
              <p className="mt-1 text-xs text-gray-400">请先填写时间字段</p>
            </div>
          ) : (
            <div className="space-y-0">
              {sortedTimeline.map((item, index) => {
                const isConflict = item.status === "conflict";
                const stageColor = STAGE_COLORS[item.stageId - 1] || STAGE_COLORS[0];

                return (
                  <div key={item.key} className="relative flex gap-3 py-3">
                    {/* 时间线和节点 */}
                    <div className="relative flex flex-col items-center">
                      {/* 节点 */}
                      <div
                        className={cn(
                          "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                          isConflict
                            ? "border-red-500 bg-red-50 text-red-600"
                            : "border-green-500 bg-green-50 text-green-600"
                        )}
                      >
                        {isConflict ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </div>
                      {/* 连接线 */}
                      {index < sortedTimeline.length - 1 && (
                        <div
                          className={cn(
                            "absolute top-8 h-full w-0.5",
                            isConflict ? "bg-red-200" : "bg-green-200"
                          )}
                        />
                      )}
                    </div>

                    {/* 内容卡片 */}
                    <div className="flex-1">
                      <div
                        className={cn(
                          "rounded-lg border p-3",
                          isConflict
                            ? "border-red-200 bg-red-50"
                            : "border-gray-200 bg-white"
                        )}
                      >
                        {/* 时间和阶段标签 */}
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isConflict ? "text-red-700" : "text-gray-900"
                            )}
                          >
                            {item.value}
                          </span>
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-xs",
                              stageColor
                            )}
                          >
                            阶段{item.stageId}
                          </span>
                        </div>

                        {/* 字段名称 */}
                        <div className="mt-1 text-sm text-gray-600">
                          {item.label}
                        </div>

                        {/* 材料名称 */}
                        <div className="mt-0.5 text-xs text-gray-400">
                          {item.materialName}
                        </div>

                        {/* 冲突提示 */}
                        {isConflict && item.errorMessage && (
                          <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
                            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                            <span>{item.errorMessage}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
