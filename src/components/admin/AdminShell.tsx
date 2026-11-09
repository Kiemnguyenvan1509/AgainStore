"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  FileText,
  BookOpen,
  Users,
  Settings,
  ExternalLink,
  LogOut,
  UserCheck,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const ADMIN_NAV = [
  { label: "Dashboard Tổng quan", href: "/admin", icon: LayoutDashboard },
  { label: "3. Yêu cầu Ký gửi", href: "/admin/consignments", icon: ClipboardList },
  { label: "4. Sản phẩm Second Life", href: "/admin/products", icon: Package },
  { label: "2. Quản lý Nội dung", href: "/admin/content", icon: FileText },
  { label: "5. Quản lý Journal", href: "/admin/journal", icon: BookOpen },
  { label: "6. Hoạt động Cộng đồng", href: "/admin/community", icon: Users },
  { label: "7. Cấu hình & Phân quyền", href: "/admin/settings", icon: Settings },
];

export function AdminShell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const connected = isSupabaseConfigured();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function verifyAdminAuth() {
      if (!connected) {
        setCheckingAuth(false);
        return;
      }

      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        // Chưa đăng nhập -> Chuyển hướng ngay về trang Login
        router.replace("/admin/login");
        return;
      }

      setCurrentUserEmail(data.user.email || null);
      setCheckingAuth(false);
    }

    verifyAdminAuth();
  }, [connected, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="font-label-md text-xs uppercase tracking-widest text-primary">
            Đang xác thực quyền truy cập CMS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-primary text-surface-container-lowest flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-on-primary-container/20 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3">
              <span className="w-8 h-8 bg-surface-container-lowest text-primary font-display-lg text-lg flex items-center justify-center">
                A
              </span>
              <div>
                <span className="font-headline-sm text-base tracking-tight block leading-none">
                  AGAIN STORE
                </span>
                <span className="font-label-sm text-[10px] uppercase tracking-widest text-secondary-fixed">
                  ADMIN CMS CONSOLE
                </span>
              </div>
            </Link>
          </div>

          <nav className="p-4 space-y-1">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 font-label-md text-label-md uppercase tracking-wider transition-colors ${
                    isActive
                      ? "bg-primary-container text-surface-container-lowest border-l-2 border-secondary-fixed"
                      : "text-primary-fixed-dim hover:bg-primary-container/50 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-5 border-t border-on-primary-container/20 space-y-3">
          {currentUserEmail && (
            <div className="p-2.5 bg-primary-container/90 flex items-center gap-2 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-secondary-fixed shrink-0" />
              <span className="truncate text-secondary-fixed font-mono text-[11px]">
                {currentUserEmail}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <Link
              href="/"
              className="flex-1 py-2.5 px-3 bg-primary-container text-center font-label-sm text-[11px] uppercase tracking-wider hover:bg-secondary transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <span>Xem Web</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="py-2.5 px-3 border border-on-primary-container/40 font-label-sm text-[11px] uppercase tracking-wider hover:bg-error hover:border-error transition-colors inline-flex items-center gap-1.5 text-surface-container-lowest"
              title="Đăng xuất khỏi CMS"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Thoát</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-surface-container-low border-b border-outline-variant/50 px-6 lg:px-10 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
              HỆ THỐNG QUẢN TRỊ WEBSITE • /ADMIN
            </span>
            <h1 className="font-headline-md text-2xl lg:text-3xl text-primary mt-0.5">
              {title}
            </h1>
            {subtitle && (
              <p className="font-body-sm text-on-surface-variant mt-1">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </header>

        {!connected && (
          <div className="bg-secondary-container/70 border-b border-outline-variant px-6 lg:px-10 py-3 font-body-sm text-on-surface">
            <strong>Lưu ý kết nối:</strong> Hãy điền{" "}
            <code className="bg-surface px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> và{" "}
            <code className="bg-surface px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
            vào file <code className="bg-surface px-1.5 py-0.5 text-xs">.env.local</code> và chạy{" "}
            <code className="bg-surface px-1.5 py-0.5 text-xs">supabase/schema.sql</code> để bắt đầu thêm dữ liệu thật.
          </div>
        )}

        <main className="p-6 lg:p-10 flex-1 space-y-8 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
