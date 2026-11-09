import React from "react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-primary text-surface-container-lowest border-t border-outline-variant/20 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-14 border-b border-on-primary-container/20">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-surface-container-lowest text-primary font-display-lg text-lg flex items-center justify-center">
                A
              </span>
              <span className="font-headline-sm text-headline-sm tracking-tight text-surface-container-lowest">
                AGAIN STORE
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-primary-fixed-dim leading-relaxed max-w-sm">
              Nền tảng thời trang tuần hoàn &amp; dịch vụ ký gửi tuyển chọn. Chúng tôi kết nối người gửi đồ và người yêu thời trang bền vững, kéo dài vòng đời cho từng thiết kế.
            </p>
            <div className="pt-2 space-y-1 font-label-sm text-label-sm uppercase tracking-widest text-on-primary-container">
              <p>REUSE • RETHINK • RENEW</p>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-label-md text-label-md uppercase tracking-widest text-secondary-fixed">
              Khám phá &amp; Dịch vụ
            </h3>
            <ul className="space-y-2.5 font-body-sm text-body-sm text-surface-dim">
              <li>
                <Link href="/ve-chung-toi" className="hover:text-white transition-colors">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link href="/dich-vu-ky-gui" className="hover:text-white transition-colors">
                  Dịch vụ ký gửi
                </Link>
              </li>
              <li>
                <Link href="/second-life" className="hover:text-white transition-colors">
                  Bộ sưu tập Second Life
                </Link>
              </li>
              <li>
                <Link href="/thoi-trang-tuan-hoan" className="hover:text-white transition-colors">
                  Thời trang tuần hoàn
                </Link>
              </li>
              <li>
                <Link href="/cong-dong" className="hover:text-white transition-colors">
                  Hoạt động Cộng đồng
                </Link>
              </li>
              <li>
                <Link href="/journal" className="hover:text-white transition-colors">
                  Tạp chí Journal
                </Link>
              </li>
            </ul>
          </div>

          {/* System Pages Column */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-label-md text-label-md uppercase tracking-widest text-secondary-fixed">
              Hỗ trợ &amp; Hệ thống
            </h3>
            <ul className="space-y-2.5 font-body-sm text-body-sm text-surface-dim">
              <li>
                <Link href="/tra-cuu-ky-gui" className="hover:text-white transition-colors">
                  Tra cứu mã ký gửi
                </Link>
              </li>
              <li>
                <Link href="/chinh-sach" className="hover:text-white transition-colors">
                  Chính sách ký gửi &amp; Bảo mật
                </Link>
              </li>
              <li>
                <Link href="/lien-he" className="hover:text-white transition-colors">
                  Liên hệ &amp; Showroom
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-white transition-colors">
                  Đăng nhập Quản trị (CMS)
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social Column */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-label-md text-label-md uppercase tracking-widest text-secondary-fixed">
              Liên hệ &amp; Mạng xã hội
            </h3>
            <div className="space-y-2 font-body-sm text-body-sm text-surface-dim">
              <p>Địa chỉ: 403/34 Đ. TTH21, Tân Thới Hiệp, TP. Hồ Chí Minh</p>
              <p>Email: contact@againstore.vn</p>
              <p>Giờ mở cửa: 09:30 – 21:00 (Thứ 2 – Chủ nhật)</p>
            </div>
            <div className="flex items-center gap-4 pt-2 font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed">
              <a
                href="https://www.facebook.com/shop2handgiarehcm"
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                Facebook
              </a>
              <span>•</span>
              <a
                href="https://www.tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                TikTok
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-label-sm text-label-sm uppercase tracking-wider text-on-primary-container">
          <p>© {new Date().getFullYear()} AGAIN STORE. Circular Fashion &amp; Consignment Platform.</p>
          <p>Thiết kế theo chuẩn Editorial Minimalism</p>
        </div>
      </div>
    </footer>
  );
}
