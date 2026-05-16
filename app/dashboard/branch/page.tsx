"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BranchSummary, getDashboardSummary } from "@/lib/services/dashboard-service";
import { getCurrentActor } from "@/lib/services/actor-service";
import { clearActorCookie } from "@/lib/auth/session";
import {
  RegistrationRequest,
  approveRegistrationRequest,
  listRegistrationRequests,
  rejectRegistrationRequest,
} from "@/lib/services/registration-service";

export default function BranchDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [summary, setSummary] = useState<BranchSummary | null>(null);
  const [pendingRequests, setPendingRequests] = useState<RegistrationRequest[]>([]);
  const [actorName, setActorName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPageData = async () => {
    const [summaryPayload, requestsPayload, actorPayload] = await Promise.all([
      getDashboardSummary(),
      listRegistrationRequests({ status: "pending", requestedRole: "student" }),
      getCurrentActor(),
    ]);

    if (summaryPayload.role !== "branch_admin") {
      router.replace("/");
      return;
    }
    setSummary(summaryPayload.summary as BranchSummary);
    setPendingRequests(requestsPayload.requests);
    setActorName(actorPayload.displayName);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadPageData();
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [router]);

  const handleLogout = () => {
    clearActorCookie();
    router.replace("/login");
  };

  const handleApprove = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      await approveRegistrationRequest(requestId);
      await loadPageData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "审批失败");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      await rejectRegistrationRequest(requestId);
      await loadPageData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "驳回失败");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">支部总览</h1>
            <p className="mt-2 text-zinc-600">当前角色：普通管理员</p>
            <p className="mt-1 text-zinc-700 font-medium">姓名：{actorName ?? "-"}</p>
            {!loading && summary && (
              <p className="mt-1 text-zinc-700 font-medium">
                当前支部：{summary.branchName ?? "未分配"}
              </p>
            )}
          </div>
          <Button variant="outline" onClick={() => void handleLogout()}>
            退出登录
          </Button>
        </div>

        {error && <p className="mt-6 text-red-600">{error}</p>}
        {loading && <BranchDashboardSkeleton />}

        {!loading && summary && (
          <>
            {summary.assignmentPending && (
              <section className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-5">
                <h2 className="font-semibold text-amber-800">账号待分配支部</h2>
                <p className="mt-2 text-sm text-amber-700">
                  当前账号已是普通管理员，但尚未绑定党支部，请联系系统管理员完成支部分配。
                </p>
              </section>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <StatCard title="同学总数" value={summary.totalStudents} />
              <StatCard title="进行中" value={summary.progress} />
              <StatCard title="已完成" value={summary.completed} />
              <StatCard title="待修正" value={summary["needs-fix"]} />
            </div>

            <section className="mt-10 bg-white border border-zinc-200 rounded-xl p-5">
              <h2 className="font-semibold text-zinc-900">支部同学</h2>
              <div className="mt-4 space-y-3">
                {summary.recentStudents.length === 0 && (
                  <p className="text-sm text-zinc-500">暂无同学数据</p>
                )}
                {summary.recentStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-900">{student.name}</p>
                      <p className="text-xs text-zinc-500">{student.status}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/person/${student.id}`)}>
                      查看档案
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 bg-white border border-zinc-200 rounded-xl p-5">
              <h2 className="font-semibold text-zinc-900">待审批学生申请</h2>
              <div className="mt-4 space-y-3">
                {pendingRequests.length === 0 && (
                  <p className="text-sm text-zinc-500">暂无待审批学生申请</p>
                )}
                {pendingRequests.map((item) => (
                  <div key={item.id} className="rounded-lg border border-zinc-100 p-3">
                    <p className="text-sm text-zinc-900">{item.display_name}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      班级：{item.class_name ?? "-"} · 届别：{item.cohort_year ?? "-"} · 电话：{item.phone ?? "-"}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        disabled={actionLoadingId === item.id}
                        onClick={() => void handleApprove(item.id)}
                      >
                        通过
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoadingId === item.id}
                        onClick={() => void handleReject(item.id)}
                      >
                        驳回
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function BranchDashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white border border-zinc-200 rounded-xl p-4 animate-pulse">
            <div className="h-3 w-16 bg-zinc-200 rounded" />
            <div className="mt-3 h-7 w-10 bg-zinc-200 rounded" />
          </div>
        ))}
      </div>

      <section className="mt-10 bg-white border border-zinc-200 rounded-xl p-5 animate-pulse">
        <div className="h-5 w-20 bg-zinc-200 rounded" />
        <div className="mt-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <div className="h-4 w-16 bg-zinc-200 rounded" />
                <div className="mt-2 h-3 w-12 bg-zinc-100 rounded" />
              </div>
              <div className="h-8 w-16 bg-zinc-200 rounded" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4">
      <p className="text-xs text-zinc-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}
