"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDashboardSummary, SystemSummary } from "@/lib/services/dashboard-service";
import { getCurrentActor } from "@/lib/services/actor-service";
import { clearActorCookie } from "@/lib/auth/session";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  RegistrationRequest,
  approveRegistrationRequest,
  listRegistrationRequests,
  rejectRegistrationRequest,
} from "@/lib/services/registration-service";
import {
  BranchAdminOption,
  createBranchAdminAccount,
  createPartyBranch,
  listUnassignedBranchAdmins,
} from "@/lib/services/system-admin-service";

export default function SystemDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [summary, setSummary] = useState<SystemSummary | null>(null);
  const [pendingRequests, setPendingRequests] = useState<RegistrationRequest[]>([]);
  const [branchAdminOptions, setBranchAdminOptions] = useState<BranchAdminOption[]>([]);
  const [actorName, setActorName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [createAdminDialogOpen, setCreateAdminDialogOpen] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [secretaryProfileId, setSecretaryProfileId] = useState("");
  const [branchSubmitting, setBranchSubmitting] = useState(false);
  const [branchFormError, setBranchFormError] = useState<string | null>(null);

  const [adminDisplayName, setAdminDisplayName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminFormError, setAdminFormError] = useState<string | null>(null);

  const loadPageData = async () => {
    const [summaryPayload, requestsPayload, adminsPayload, actorPayload] = await Promise.all([
      getDashboardSummary(),
      listRegistrationRequests({ status: "pending" }),
      listUnassignedBranchAdmins(),
      getCurrentActor(),
    ]);

    if (summaryPayload.role !== "system_admin") {
      router.replace("/");
      return;
    }
    setSummary(summaryPayload.summary as SystemSummary);
    setPendingRequests(requestsPayload.requests);
    setBranchAdminOptions(adminsPayload.options);
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

  const handleLogout = async () => {
    const supabaseClient = getSupabaseClient();
    await supabaseClient.auth.signOut();
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

  const handleCreateBranch = async () => {
    if (!branchName.trim() || !secretaryProfileId) {
      setBranchFormError("请填写党支部名称并选择党支部书记");
      return;
    }
    setBranchSubmitting(true);
    setBranchFormError(null);
    try {
      await createPartyBranch({
        name: branchName.trim(),
        secretaryProfileId,
      });
      setBranchDialogOpen(false);
      setBranchName("");
      setSecretaryProfileId("");
      await loadPageData();
    } catch (e) {
      setBranchFormError(e instanceof Error ? e.message : "创建党支部失败");
    } finally {
      setBranchSubmitting(false);
    }
  };

  const handleCreateBranchAdmin = async () => {
    if (!adminDisplayName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      setAdminFormError("请完整填写普通管理员姓名、邮箱、密码");
      return;
    }
    if (adminPassword.length < 6) {
      setAdminFormError("密码至少 6 位");
      return;
    }
    setAdminSubmitting(true);
    setAdminFormError(null);
    try {
      const payload = await createBranchAdminAccount({
        displayName: adminDisplayName.trim(),
        email: adminEmail.trim(),
        password: adminPassword,
      });
      await loadPageData();
      setSecretaryProfileId(payload.admin.profileId);
      setCreateAdminDialogOpen(false);
      setAdminDisplayName("");
      setAdminEmail("");
      setAdminPassword("");
    } catch (e) {
      setAdminFormError(e instanceof Error ? e.message : "创建普通管理员失败");
    } finally {
      setAdminSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">
              {summary?.collegeName ? `${summary.collegeName}总览` : "学院总览"}
            </h1>
            <p className="mt-2 text-zinc-600">当前角色：系统管理员</p>
            <p className="mt-1 text-zinc-700 font-medium">姓名：{actorName ?? "-"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setBranchDialogOpen(true)}>
              新增党支部
            </Button>
            <Button variant="outline" onClick={() => void handleLogout()}>
              退出登录
            </Button>
          </div>
        </div>

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

            <section className="mt-10 bg-white border border-zinc-200 rounded-xl p-5">
              <h2 className="font-semibold text-zinc-900">待审批申请</h2>
              <div className="mt-4 space-y-3">
                {pendingRequests.length === 0 && (
                  <p className="text-sm text-zinc-500">暂无待审批申请</p>
                )}
                {pendingRequests.map((item) => (
                  <div key={item.id} className="rounded-lg border border-zinc-100 p-3">
                    <p className="text-sm text-zinc-900">
                      {item.display_name} · 申请{item.requested_role === "student" ? "学生" : "普通管理员"}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      支部：{item.party_branch_name} · 电话：{item.phone ?? "-"}
                    </p>
                    {item.requested_role === "student" && (
                      <p className="text-xs text-zinc-500 mt-1">
                        班级：{item.class_name ?? "-"} · 届别：{item.cohort_year ?? "-"}
                      </p>
                    )}
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

      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新增党支部</DialogTitle>
            <DialogDescription>
              请输入党支部名称，并选择党支部书记（普通管理员）。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="branch-name">党支部名称</Label>
              <Input
                id="branch-name"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="请输入党支部名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secretary">党支部书记（普通管理员）</Label>
              <select
                id="secretary"
                className="w-full h-10 rounded-md border border-zinc-300 px-3 bg-white text-sm"
                value={secretaryProfileId}
                onChange={(e) => setSecretaryProfileId(e.target.value)}
              >
                <option value="">请选择普通管理员</option>
                {branchAdminOptions.map((option) => (
                  <option key={option.profileId} value={option.profileId}>
                    {option.displayName}（{option.email}）
                  </option>
                ))}
              </select>
              {branchAdminOptions.length === 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                  当前没有可选普通管理员，请先创建普通管理员。
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCreateAdminDialogOpen(true);
                      }}
                    >
                      先创建普通管理员
                    </Button>
                  </div>
                </div>
              )}
            </div>
            {branchFormError && <p className="text-sm text-red-600">{branchFormError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBranchDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => void handleCreateBranch()}
              disabled={branchSubmitting || branchAdminOptions.length === 0}
            >
              {branchSubmitting ? "创建中..." : "创建党支部"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createAdminDialogOpen} onOpenChange={setCreateAdminDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>创建普通管理员</DialogTitle>
            <DialogDescription>
              当前没有可用普通管理员，请先创建一个账号再分配为党支部书记。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">姓名</Label>
              <Input
                id="admin-name"
                value={adminDisplayName}
                onChange={(e) => setAdminDisplayName(e.target.value)}
                placeholder="请输入姓名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">邮箱</Label>
              <Input
                id="admin-email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="请输入邮箱"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">密码</Label>
              <Input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="请设置密码（至少 6 位）"
              />
            </div>
            {adminFormError && <p className="text-sm text-red-600">{adminFormError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateAdminDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => void handleCreateBranchAdmin()} disabled={adminSubmitting}>
              {adminSubmitting ? "创建中..." : "创建普通管理员"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
