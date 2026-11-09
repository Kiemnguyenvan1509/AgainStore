import React from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function PolicySystemPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <SiteHeader />

      <main className="w-full pt-28 flex-1">
        <div className="max-w-4xl mx-auto px-6 py-16 space-y-10">
          <div className="space-y-3 border-b border-outline-variant/40 pb-6">
            <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
              SYSTEM PAGES • CHÍNH SÁCH &amp; ĐIỀU KHOẢN
            </span>
            <h1 className="font-headline-lg text-3xl sm:text-4xl text-primary">
              Chính sách Ký gửi &amp; Bảo mật Thông tin
            </h1>
          </div>

          <section className="space-y-4 font-body-md text-on-surface-variant leading-relaxed">
            <h2 className="font-headline-md text-2xl text-primary">
              1. Chính sách tiếp nhận &amp; định giá ký gửi
            </h2>
            <p>
              Tất cả trang phục gửi tới AGAIN STORE đều được kiểm định thủ công về chất liệu, độ mới và tính nguyên bản. Mỗi đợt ký gửi được quản lý bằng một mã yêu cầu duy nhất (#CR-...) và liên kết chặt chẽ với các sản phẩm được tạo trên chuyên trang Second Life.
            </p>
          </section>

          <section className="space-y-4 font-body-md text-on-surface-variant leading-relaxed">
            <h2 className="font-headline-md text-2xl text-primary">
              2. Bảo vệ thông tin cá nhân người ký gửi
            </h2>
            <p>
              Thông tin cá nhân của người gửi đồ (họ tên, số điện thoại, email, tài khoản đối soát) được lưu trữ độc lập trong bảng dữ liệu người ký gửi (`consignors`) có phân quyền bảo mật và tuyệt đối không hiển thị công khai trên trang sản phẩm.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
