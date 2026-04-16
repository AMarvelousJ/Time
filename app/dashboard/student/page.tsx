"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getDashboardSummary, StudentSummary } from "@/lib/services/dashboard-service";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const payload = await getDashboardSummary();
        if (payload.role !== "student") {
          router.replace("/");
          return;
        }
        setSummary(payload.summary as StudentSummary);
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
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-zinc-900">我的档案首页</h1>
        <p className="mt-2 text-zinc-600">当前角色：同学</p>

        {error && <p className="mt-6 text-red-600">{error}</p>}
        {loading && <StudentDashboardSkeleton />}

        {!loading && summary && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <StatCard title="档案状态" value={summary.status} />
              <StatCard title="已填写字段数" value={`${summary.filledFields}`} />
              <StatCard title="冲突数" value={`${summary.conflictCount}`} />
            </div>

            <div className="mt-6 bg-white border border-zinc-200 rounded-xl p-5">
              <p className="text-sm text-zinc-600">
                你的档案由系统自动创建，档案本身不可删除。你可以在档案中增删改查自己的时间线数据。
              </p>
              <Button className="mt-4" onClick={() => router.push(`/person/${summary.studentId}`)}>
                进入我的档案
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function StudentDashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white border border-zinc-200 rounded-xl p-4 animate-pulse">
            <div className="h-3 w-16 bg-zinc-200 rounded" />
            <div className="mt-3 h-6 w-12 bg-zinc-200 rounded" />
          </div>
        ))}
      </div>
      <div className="mt-6 bg-white border border-zinc-200 rounded-xl p-5 animate-pulse">
        <div className="h-3 w-full bg-zinc-200 rounded" />
        <div className="mt-2 h-3 w-5/6 bg-zinc-100 rounded" />
        <div className="mt-4 h-9 w-28 bg-zinc-200 rounded" />
      </div>
    </>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4">
      <p className="text-xs text-zinc-500">{title}</p>
      <p className="mt-2 text-xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}
