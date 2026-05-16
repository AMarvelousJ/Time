"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentActor } from "@/lib/services/actor-service";
import { getSystemAdminStatus } from "@/lib/services/auth-service";

const isLikelyRemoteTlsOrNetwork = (msg: string) =>
  /ECONNRESET|ETIMEDOUT|ENOTFOUND|fetch failed|TLS|ssl|handshake|socket disconnected|certificate/i.test(
    msg
  );

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const status = await getSystemAdminStatus();
        if (!status.exists) {
          router.replace("/setup/system-admin");
          return;
        }

        const actor = await getCurrentActor();
        if (actor.primaryRole === "system_admin") {
          router.replace("/dashboard/system");
          return;
        }
        if (actor.primaryRole === "branch_admin") {
          router.replace("/dashboard/branch");
          return;
        }
        router.replace("/dashboard/student");
      } catch (e) {
        const message = e instanceof Error ? e.message : "角色信息读取失败";
        if (
          message.includes("Missing actorProfileId") ||
          message.includes("Actor profile not found")
        ) {
          router.replace("/login");
          return;
        }
        if (message.includes("Actor has no role")) {
          router.replace("/pending");
          return;
        }
        setError(message);
      }
    };

    void run();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="bg-white rounded-xl border border-zinc-200 p-6 w-[420px] shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-900">正在进入角色首页</h1>
        <p className="text-sm text-zinc-500 mt-2">系统会根据当前角色自动跳转。</p>
        {error && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-red-600 break-words max-h-40 overflow-y-auto whitespace-pre-wrap">
              跳转失败：{error}
            </p>
            {isLikelyRemoteTlsOrNetwork(error) && (
              <p className="text-xs text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
                服务端访问 Supabase（HTTPS）时网络被中断，常见于本机代理/VPN、公司防火墙、杀毒 HTTPS
                扫描或运营商线路问题。可依次尝试：关闭系统代理后重试；换手机热点；终端执行{" "}
                <code className="rounded bg-zinc-100 px-1">
                  curl -I https://你的项目.supabase.co
                </code>{" "}
                确认能否握手；开发时加{" "}
                <code className="rounded bg-zinc-100 px-1">
                  NODE_OPTIONS=--dns-result-order=ipv4first
                </code>{" "}
                再运行 <code className="rounded bg-zinc-100 px-1">npm run dev</code>（规避异常 IPv6 路径）。
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
