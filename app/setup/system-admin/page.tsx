"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setActorCookie } from "@/lib/auth/session";
import { getSystemAdminStatus, setupSystemAdmin } from "@/lib/services/auth-service";

export default function SetupSystemAdminPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const status = await getSystemAdminStatus();
        if (status.exists) {
          router.replace("/login");
          return;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "系统状态检测失败");
      } finally {
        setChecking(false);
      }
    };
    void run();
  }, [router]);

  const submit = async () => {
    if (!displayName.trim() || !collegeName.trim() || !email.trim() || !password.trim()) {
      setError("请完整填写姓名、学院、邮箱、密码");
      return;
    }
    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = await setupSystemAdmin({
        displayName: displayName.trim(),
        collegeName: collegeName.trim(),
        email: email.trim(),
        password,
      });
      setActorCookie(payload.actorProfileId);
      router.replace("/dashboard/system");
    } catch (e) {
      setError(e instanceof Error ? e.message : "初始化失败");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-zinc-600">正在检查系统初始化状态...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">初始化系统管理员</h1>
        <p className="mt-1 text-sm text-zinc-500">
          首次使用系统，请先创建系统管理员账号。
        </p>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">姓名</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="请输入姓名"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="college-name">学院</Label>
            <Input
              id="college-name"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              placeholder="请输入学院名称"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请设置登录密码（至少 6 位）"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <Button className="mt-6 w-full" onClick={() => void submit()} disabled={loading}>
          {loading ? "创建中..." : "创建并进入系统"}
        </Button>
      </div>
    </main>
  );
}
