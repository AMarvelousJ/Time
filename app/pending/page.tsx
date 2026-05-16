"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { clearActorCookie } from "@/lib/auth/session";
import {
  RegistrationRequest,
  listRegistrationRequests,
} from "@/lib/services/registration-service";

export default function PendingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const payload = await listRegistrationRequests({ mine: true, status: "all" });
        setRequests(payload.requests);
      } catch (e) {
        const message = e instanceof Error ? e.message : "加载失败";
        if (message.includes("Missing actorProfileId")) {
          router.replace("/login");
          return;
        }
        setError(message);
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

  const requestedRoleLock = requests[0]?.requested_role ?? null;
  const canApplyStudent = !requestedRoleLock || requestedRoleLock === "student";
  const canApplyBranchAdmin = !requestedRoleLock || requestedRoleLock === "branch_admin";

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">角色申请与审批状态</h1>
          <Button variant="outline" onClick={() => void handleLogout()}>
            退出登录
          </Button>
        </div>

        <p className="mt-2 text-zinc-600">你当前还没有生效角色，请先提交申请并等待审核。</p>

        {!loading && (
          <div className="mt-6 flex flex-wrap gap-3">
            {canApplyStudent && (
              <Link href="/register/student" className={buttonVariants()}>
                申请学生角色
              </Link>
            )}
            {canApplyBranchAdmin && (
              <Link
                href="/register/branch-admin"
                className={buttonVariants({ variant: "outline" })}
              >
                申请普通管理员角色
              </Link>
            )}
          </div>
        )}

        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

        <section className="mt-8 bg-white rounded-xl border border-zinc-200 p-5">
          <h2 className="text-lg font-semibold text-zinc-900">我的申请记录</h2>
          {loading && <p className="mt-3 text-sm text-zinc-500">加载中...</p>}
          {!loading && requests.length === 0 && (
            <p className="mt-3 text-sm text-zinc-500">暂无申请记录。</p>
          )}
          <div className="mt-4 space-y-3">
            {requests.map((item) => (
              <div key={item.id} className="rounded-lg border border-zinc-100 p-3">
                <p className="text-sm text-zinc-900">
                  申请角色：{item.requested_role === "student" ? "学生" : "普通管理员"}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  支部：{item.party_branch_name} · 状态：{renderStatus(item.status)}
                </p>
                {item.review_note && (
                  <p className="text-xs text-zinc-500 mt-1">备注：{item.review_note}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

const renderStatus = (status: string) => {
  if (status === "approved") return "已通过";
  if (status === "rejected") return "已拒绝";
  return "待审批";
};
