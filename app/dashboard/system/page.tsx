"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getDashboardSummary, SystemSummary } from "@/lib/services/dashboard-service";

export default function SystemDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SystemSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const payload = await getDashboardSummary();
        if (payload.role !== "system_admin") {
          router.replace("/");
          return;
        }
        setSummary(payload.summary as SystemSummary);
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [router]);

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-zinc-900">学院总览</h1>
        <p className="mt-2 text-zinc-600">当前角色：系统管理员</p>

        {error && <p className="mt-6 text-red-600">{error}</p>}
        {loading && <SystemDashboardSkeleton />}

        {!loading && summary && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
              <StatCard title="党支部数" value={summary.totalBranches} />
              <StatCard title="同学总数" value={summary.totalStudents} />
              <StatCard title="进行中" value={summary.progress} />
              <StatCard title="已完成" value={summary.completed} />
              <StatCard title="待修正" value={summary["needs-fix"]} />
            </div>

            <section className="mt-10 space-y-6">
              {summary.branches.length === 0 && (
                <div className="bg-white border border-zinc-200 rounded-xl p-5 text-sm text-zinc-500">
                  当前学院下暂无支部数据。
                </div>
              )}

              {summary.branches.map((branch) => (
                <div key={branch.branchId} className="bg-white border border-zinc-200 rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-zinc-900">{branch.branchName}</h2>
                    <span className="text-sm text-zinc-500">支部总人数：{branch.studentCount}</span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {branch.students.length === 0 && (
                      <p className="text-sm text-zinc-500">该支部暂无同学</p>
                    )}
                    {branch.students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2">
                        <div>
                          <p className="text-sm text-zinc-900">{student.name}</p>
                          <p className="text-xs text-zinc-500">
                            状态：{student.status} · 最近更新：{new Date(student.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => router.push(`/person/${student.id}`)}>
                          查看档案
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function SystemDashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white border border-zinc-200 rounded-xl p-4 animate-pulse">
            <div className="h-3 w-16 bg-zinc-200 rounded" />
            <div className="mt-3 h-7 w-10 bg-zinc-200 rounded" />
          </div>
        ))}
      </div>

      <section className="mt-10 space-y-6">
        {[...Array(3)].map((_, branchIndex) => (
          <div key={branchIndex} className="bg-white border border-zinc-200 rounded-xl p-5 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-5 w-28 bg-zinc-200 rounded" />
              <div className="h-4 w-24 bg-zinc-200 rounded" />
            </div>
            <div className="mt-4 space-y-3">
              {[...Array(3)].map((__, studentIndex) => (
                <div key={studentIndex} className="rounded-lg border border-zinc-100 px-3 py-2">
                  <div className="h-4 w-20 bg-zinc-200 rounded" />
                  <div className="mt-2 h-3 w-40 bg-zinc-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
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
