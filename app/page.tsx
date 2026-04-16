"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentActor } from "@/lib/services/actor-service";
import { getSystemAdminStatus } from "@/lib/services/auth-service";

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
          <p className="mt-4 text-sm text-red-600">
            跳转失败：{error}
          </p>
        )}
      </div>
    </div>
  );
}
