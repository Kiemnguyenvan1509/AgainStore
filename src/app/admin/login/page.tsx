"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrorMsg("Chưa cấu hình NEXT_PUBLIC_SUPABASE_URL trong .env.local.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      router.push("/admin");
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Đăng nhập thất bại. Vui lòng kiểm tra tài khoản trong Supabase Auth."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-surface">
      {/* Left Column: Editorial & Brand Provenance (Dark Forest Canvas) */}
      <div className="lg:col-span-6 bg-primary text-surface-container-lowest p-10 lg:p-16 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="w-8 h-8 bg-surface-container-lowest text-primary font-display-lg text-lg flex items-center justify-center">
              A
            </span>
            <span className="font-headline-sm text-lg tracking-tight">AGAIN STORE</span>
          </Link>
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary-fixed">
            RBAC • 3 CẤP TÀI KHOẢN
          </span>
        </div>

        <div className="space-y-6 my-12">
          <span className="font-label-md text-label-md uppercase tracking-widest text-secondary-fixed">
            ADMINISTRATION &amp; ARCHIVE CONSOLE
          </span>
          <h1 className="font-display-lg text-3xl sm:text-4xl lg:text-5xl leading-tight">
            Hệ thống Quản trị &amp; Vận hành Thời trang Tuần hoàn AGAIN STORE
          </h1>
          <p className="font-body-md text-primary-fixed-dim max-w-lg leading-relaxed">
            Phân quyền theo 3 cấp độ: Super Admin (Toàn quyền hệ thống), Admin (Quản lý nội dung, sản phẩm, ký gửi, bài viết) và Nhân viên (Xử lý yêu cầu ký gửi &amp; cập nhật sản phẩm).
          </p>
        </div>

        <div className="pt-6 border-t border-on-primary-container/30 flex items-center justify-between font-label-sm text-xs uppercase text-on-primary-container">
          <span>Supabase Auth &amp; Row Level Security</span>
          <Link href="/" className="inline-flex items-center gap-1 text-secondary-fixed hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về trang khách</span>
          </Link>
        </div>
      </div>

      {/* Right Column: Authentication Console */}
      <div className="lg:col-span-6 p-10 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
              AUTHENTICATION CONSOLE
            </span>
            <h2 className="font-headline-lg text-3xl text-primary">
              Đăng nhập Hệ thống Quản trị
            </h2>
            <p className="font-body-sm text-on-surface-variant">
              Sử dụng tài khoản quản trị đã tạo trong Supabase Authentication.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {errorMsg && (
              <div className="p-4 bg-error-container text-on-error-container font-body-sm">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <label className="block font-label-md text-label-md uppercase tracking-wider text-primary">
                Email quản trị *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@againstore.vn"
                className="w-full px-4 py-3.5 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-md"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-label-md text-label-md uppercase tracking-wider text-primary">
                Mật khẩu *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-md"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-surface-container-lowest font-label-md text-label-md uppercase tracking-widest hover:bg-secondary transition-colors"
            >
              {loading ? "Đang xác thực..." : "Đăng nhập vào /admin"}
            </button>
          </form>

          <div className="p-5 bg-surface-container-low border border-outline-variant/50 space-y-2 font-body-sm text-on-surface-variant">
            <div className="flex items-center gap-2 text-primary font-medium">
              <ShieldCheck className="w-4 h-4 text-secondary" />
              <span>Bảo mật &amp; Phân quyền Hệ thống:</span>
            </div>
            <p>
              Hệ thống CMS chỉ dành cho Quản trị viên và Nhân sự nội bộ của AGAIN STORE. Vui lòng liên hệ Admin nếu bạn cần cấp mới hoặc khôi phục tài khoản.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
