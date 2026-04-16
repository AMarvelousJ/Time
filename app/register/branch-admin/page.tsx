"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setActorCookie } from "@/lib/auth/session";
import { createRegistrationRequest } from "@/lib/services/registration-service";

export default function BranchAdminRegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const submit = async () => {
    if (!email || !password || !displayName || !phone) {
      setError("请完整填写所有必填项");
      return;
    }
    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = await createRegistrationRequest({
        requestedRole: "branch_admin",
        email,
        password,
        displayName,
        phone,
        note,
      });
      if (payload.request.applicant_user_id) {
        setActorCookie(payload.request.applicant_user_id);
      }
      router.replace("/pending");
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-zinc-900">申请普通管理员角色</h1>
        <p className="mt-2 text-zinc-600">普通管理员申请仅由系统管理员审批并绑定支部。</p>

        <div className="mt-6 bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
          <Field label="邮箱">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱" />
          </Field>
          <Field label="姓名">
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="请输入姓名" />
          </Field>
          <Field label="密码">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请设置登录密码（至少 6 位）"
            />
          </Field>
          <Field label="电话">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="请输入手机号" />
          </Field>
          <Field label="申请说明（可选）">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="可填写职责说明或备注" />
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => router.push("/pending")}>
              返回
            </Button>
            <Button onClick={() => void submit()} disabled={submitting}>
              {submitting ? "提交中..." : "提交申请"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
