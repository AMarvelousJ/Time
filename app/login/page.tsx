"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setActorCookie } from "@/lib/auth/session";
import { getSystemAdminStatus, loginUser } from "@/lib/services/auth-service";
import { bootstrapAuthProfile } from "@/lib/services/registration-service";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const status = await getSystemAdminStatus();
        if (!status.exists) {
          router.replace("/setup/system-admin");
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

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("请输入邮箱和密码");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { userId } = await loginUser(email.trim(), password);

      setActorCookie(userId);
      await bootstrapAuthProfile(userId);
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-zinc-600">正在检查系统初始化状态...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">系统登录</h1>
        <p className="mt-1 text-sm text-zinc-500">使用邮箱 + 密码登录</p>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleSubmit();
                }
              }}
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <Button className="mt-6 w-full" onClick={() => void handleSubmit()} disabled={loading}>
          {loading ? "登录中..." : "登录"}
        </Button>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link
            href="/register/student"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            学生注册
          </Link>
          <Link
            href="/register/branch-admin"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            普通管理员注册
          </Link>
        </div>
      </div>
    </main>
  );
}

