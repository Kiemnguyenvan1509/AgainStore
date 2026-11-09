import React from "react";
import Link from "next/link";
import { Database, AlertCircle } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";

export function SupabaseStatusBanner() {
  if (isSupabaseConfigured()) {
    return null;
  }

  return (
    <div className="bg-secondary-container/70 border-b border-outline-variant px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-on-surface">
        <div className="flex items-center gap-2.5 font-body-sm text-body-sm">
          <AlertCircle className="w-4 h-4 text-primary shrink-0" />
          <span>
            <strong>Chưa kết nối Supabase:</strong> Hệ thống đang ở trạng thái chờ cấu hình{" "}
            <code className="bg-surface px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> và{" "}
            <code className="bg-surface px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
            trong file <code className="bg-surface px-1.5 py-0.5 text-xs">.env.local</code> (không tạo dữ liệu ảo).
          </span>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 font-label-sm text-label-sm uppercase tracking-wider text-primary underline underline-offset-4 shrink-0"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Mở Admin CMS</span>
        </Link>
      </div>
    </div>
  );
}
