"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search, User, ArrowRight } from "lucide-react";

const NAV_ITEMS = [
  { label: "Trang chủ", href: "/" },
  { label: "Về chúng tôi", href: "/ve-chung-toi" },
  { label: "Dịch vụ ký gửi", href: "/dich-vu-ky-gui" },
  { label: "Second Life", href: "/second-life" },
  { label: "Thời trang tuần hoàn", href: "/thoi-trang-tuan-hoan" },
  { label: "Cộng đồng", href: "/cong-dong" },
  { label: "Journal", href: "/journal" },
  { label: "Liên hệ", href: "/lien-he" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      {/* Editorial Announcement Strip */}
      <div className="bg-primary-container text-surface-container-lowest px-4 py-2 flex items-center justify-center text-center">
        <p className="font-label-sm text-label-sm tracking-widest uppercase text-surface-bright/90">
          RETHINK FASHION. GIVE CLOTHES ANOTHER LIFE. • TRA CỨU &amp; ĐỐI SOÁT HỒ SƠ KÝ GỬI TRỰC TUYẾN
        </p>
      </div>

      {/* Main Navigation Bar */}
      <div className="h-20 bg-surface/95 backdrop-blur-md border-b border-outline-variant/40">
        <div className="h-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-80"
            >
              <span className="w-8 h-8 bg-primary text-surface-container-lowest font-display-lg text-lg flex items-center justify-center">
                A
              </span>
              <span className="font-headline-sm text-headline-sm font-medium tracking-tight text-primary whitespace-nowrap">
                AGAIN STORE
              </span>
            </Link>
          </div>

          <nav className="hidden xl:flex items-center gap-4 2xl:gap-6 shrink-0">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-label-md text-[13px] 2xl:text-label-md uppercase tracking-wider whitespace-nowrap transition-colors py-2 ${
                    isActive
                      ? "text-primary font-semibold border-b-2 border-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              href="/second-life"
              aria-label="Tìm kiếm kho lưu trữ"
              className="p-2 text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center shrink-0"
            >
              <Search className="w-5 h-5" />
            </Link>

            <Link
              href="/dich-vu-ky-gui#form-ky-gui"
              className="hidden sm:inline-flex items-center justify-center px-4 2xl:px-5 py-2.5 bg-primary-container text-surface-container-lowest font-label-md text-[13px] 2xl:text-label-md uppercase tracking-wider hover:bg-secondary transition-colors duration-200 whitespace-nowrap shrink-0"
            >
              Ký gửi ngay
            </Link>

            <Link
              href="/admin/login"
              title="Đăng nhập Quản trị CMS"
              className="w-9 h-9 bg-primary text-on-primary flex items-center justify-center hover:bg-secondary transition-colors shrink-0"
            >
              <User className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="xl:hidden p-2 text-primary"
              aria-label="Mở menu điều hướng"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="xl:hidden bg-surface border-b border-outline-variant/60 px-6 py-6 space-y-4 shadow-lg">
          <div className="flex flex-col space-y-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="py-2 border-b border-outline-variant/30 font-label-lg text-label-lg uppercase tracking-wider text-primary flex items-center justify-between"
              >
                <span>{item.label}</span>
                <ArrowRight className="w-4 h-4 text-secondary" />
              </Link>
            ))}
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/dich-vu-ky-gui#form-ky-gui"
              onClick={() => setMobileOpen(false)}
              className="w-full py-3 bg-primary text-surface-container-lowest text-center font-label-md text-label-md uppercase tracking-widest"
            >
              Đăng ký ký gửi ngay
            </Link>
            <Link
              href="/tra-cuu-ky-gui"
              onClick={() => setMobileOpen(false)}
              className="w-full py-3 border border-primary text-primary text-center font-label-md text-label-md uppercase tracking-widest"
            >
              Tra cứu mã ký gửi
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
