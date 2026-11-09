import React from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <SiteHeader />
      <main className="w-full pt-28 flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-lg text-center space-y-6">
          <span className="font-display-xl text-6xl text-secondary block">404</span>
          <h1 className="font-headline-lg text-3xl text-primary">
            Trang bạn tìm kiếm không tồn tại
          </h1>
          <p className="font-body-md text-on-surface-variant">
            Đường dẫn có thể đã thay đổi hoặc sản phẩm lưu trữ đã được chuyển sang mục khác.
          </p>
          <div className="pt-2 flex items-center justify-center gap-4">
            <Link
              href="/"
              className="px-6 py-3 bg-primary text-surface-container-lowest font-label-md text-label-md uppercase tracking-widest"
            >
              Về Trang chủ
            </Link>
            <Link
              href="/second-life"
              className="px-6 py-3 border border-primary text-primary font-label-md text-label-md uppercase tracking-widest"
            >
              Khám phá Second Life
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
