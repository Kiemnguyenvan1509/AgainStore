"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getSupabaseClient } from "@/lib/supabase";
import type { Article } from "@/types/database";

const LIFECYCLE_STAGES = [
  { step: "01", title: "Nguyên liệu tự nhiên (Raw Materials)", desc: "Tôn vinh các loại sợi tự nhiên có khả năng phân hủy sinh học và độ bền cơ học cao." },
  { step: "02", title: "Dệt & Xử lý sợi (Fabric)", desc: "Quy trình dệt chắc chắn giúp cấu trúc vải giữ phom qua nhiều năm sử dụng." },
  { step: "03", title: "Sản xuất & May đo (Production)", desc: "Thiết kế vượt thời gian thay vì chạy theo xu hướng ngắn hạn." },
  { step: "04", title: "Tiêu dùng có trách nhiệm (Consumption)", desc: "Lựa chọn trang phục phù hợp nhu cầu thực tế và bảo quản đúng cách." },
  { step: "05", title: "Tái sử dụng & Ký gửi (Reuse & Consignment)", desc: "Chuyển giao những món đồ ít mặc sang người chủ mới thông qua AGAIN STORE." },
  { step: "06", title: "Sửa chữa & Bảo quản (Repair & Care)", desc: "Khâu vá, làm sạch sinh học và phục hồi phom dáng để kéo dài tuổi thọ." },
  { step: "07", title: "Quyên góp cộng đồng (Donation)", desc: "Chia sẻ trang phục còn tốt tới các chương trình thiện nguyện và đổi đồ." },
  { step: "08", title: "Tái chế vật liệu (Recycling)", desc: "Tận dụng sợi vải cuối vòng đời để tái sinh thành nguyên liệu mới." },
];

export default function CircularFashionPage() {
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);

  useEffect(() => {
    async function loadRelated() {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const { data } = await supabase
        .from("articles")
        .select("*, article_categories(*)")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(3);
      if (data) setRelatedArticles(data as Article[]);
    }
    loadRelated();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <SiteHeader />

      <main className="w-full pt-28 flex-1">
        {/* 1. HERO */}
        <section className="w-full bg-surface-container-low py-16 lg:py-24 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto space-y-6">
            <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
              THỜI TRANG TUẦN HOÀN • CIRCULAR FASHION
            </span>
            <h1 className="font-display-lg text-4xl sm:text-5xl lg:text-6xl text-primary tracking-tight max-w-4xl">
              Fashion goes in circles.
            </h1>
            <p className="font-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Thời trang tuần hoàn là mô hình khép kín, nơi mỗi trang phục được thiết kế, sử dụng, tái sử dụng, sửa chữa và lưu thông liên tục nhằm giảm thiểu tối đa rác thải ra môi trường.
            </p>
          </div>
        </section>

        {/* 2. CIRCULAR FASHION MODEL (INFOGRAPHIC 8 BƯỚC) */}
        <section className="w-full py-20 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="max-w-2xl space-y-2">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                01 / MÔ HÌNH VÒNG ĐỜI KHÉP KÍN
              </span>
              <h2 className="font-headline-lg text-3xl text-primary">
                Giải thích mô hình Thời trang Tuần hoàn
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {LIFECYCLE_STAGES.map((stage) => (
                <div
                  key={stage.step}
                  className="p-6 bg-surface-container-low border border-outline-variant/40 space-y-3"
                >
                  <span className="w-9 h-9 bg-primary text-surface-container-lowest font-display-lg text-base flex items-center justify-center">
                    {stage.step}
                  </span>
                  <h3 className="font-headline-sm text-lg text-primary">{stage.title}</h3>
                  <p className="font-body-sm text-on-surface-variant leading-relaxed">
                    {stage.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. FASHION PROBLEM */}
        <section className="w-full bg-primary text-surface-container-lowest py-20 px-6 lg:px-16">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary-fixed">
                02 / FASHION PROBLEM
              </span>
              <h2 className="font-headline-lg text-3xl lg:text-4xl">
                Vấn đề từ Thời trang Nhanh (Fast Fashion)
              </h2>
              <p className="font-body-md text-primary-fixed-dim leading-relaxed">
                Mô hình tuyến tính &ldquo;Khai thác – Sản xuất – Mặc vài lần – Vứt bỏ&rdquo; đang tạo ra áp lực khổng lồ lên nguồn nước, đất đai và bầu khí quyển.
              </p>
            </div>
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-primary-container border border-on-primary-container/30 space-y-2">
                <span className="font-display-lg text-4xl block">92 Triệu Tấn</span>
                <p className="font-body-sm text-primary-fixed-dim">
                  Rác thải dệt may bị thải bỏ mỗi năm trên toàn cầu theo thống kê ngành.
                </p>
              </div>
              <div className="p-6 bg-primary-container border border-on-primary-container/30 space-y-2">
                <span className="font-display-lg text-4xl block">2.700 Lít</span>
                <p className="font-body-sm text-primary-fixed-dim">
                  Lượng nước ngọt trung bình cần để sản xuất mới một chiếc áo thun cotton.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4, 5, 6: REUSE, REPAIR & CARE, RESPONSIBLE CONSUMPTION */}
        <section className="w-full py-20 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-surface-container-low border border-outline-variant/40 space-y-4">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                03 / REUSE — TÁI SỬ DỤNG
              </span>
              <h3 className="font-headline-md text-2xl text-primary">
                Tái sử dụng quần áo
              </h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">
                Ký gửi và mua sắm đồ secondhand tuyển chọn là cách trực tiếp nhất để kéo dài vòng đời sản phẩm mà không tiêu tốn thêm năng lượng sản xuất mới.
              </p>
            </div>

            <div className="p-8 bg-surface-container-low border border-outline-variant/40 space-y-4">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                04 / REPAIR &amp; CARE
              </span>
              <h3 className="font-headline-md text-2xl text-primary">
                Sửa chữa và bảo quản
              </h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">
                Giặt ở nhiệt độ thấp, phơi tự nhiên, dùng móc gỗ giữ phom và khâu sửa các hư tổn nhỏ giúp trang phục bền đẹp qua nhiều thập kỷ.
              </p>
            </div>

            <div className="p-8 bg-surface-container-low border border-outline-variant/40 space-y-4">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                05 / RESPONSIBLE CONSUMPTION
              </span>
              <h3 className="font-headline-md text-2xl text-primary">
                Tiêu dùng có trách nhiệm
              </h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">
                Xây dựng tủ đồ Capsule tối giản, ưu tiên chất lượng hơn số lượng và luôn cân nhắc vòng đời tiếp theo của món đồ trước khi mua.
              </p>
            </div>
          </div>
        </section>

        {/* 7. OUR APPROACH & BÀI VIẾT LIÊN QUAN */}
        <section className="w-full bg-surface-container-low py-20 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="max-w-3xl space-y-3">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                06 / OUR APPROACH
              </span>
              <h2 className="font-headline-lg text-3xl text-primary">
                Cách AGAIN STORE đóng góp vào vòng tuần hoàn
              </h2>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                Chúng tôi chuẩn hóa khâu kiểm định ký gửi, tạo dựng không gian lưu trữ Second Life minh bạch và tổ chức các hoạt động đổi đồ, quyên góp cộng đồng.
              </p>
            </div>

            {relatedArticles.length > 0 && (
              <div className="space-y-6 pt-4">
                <h3 className="font-headline-sm text-xl text-primary">
                  Bài viết liên quan từ Journal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedArticles.map((art) => (
                    <Link
                      key={art.id}
                      href={`/journal/${art.slug}`}
                      className="p-6 bg-surface border border-outline-variant/40 space-y-2 hover:border-primary"
                    >
                      <span className="font-label-sm text-xs uppercase text-secondary">
                        {art.article_categories?.name || "JOURNAL"}
                      </span>
                      <h4 className="font-headline-sm text-lg text-primary">{art.title}</h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 8. CTA */}
        <section className="w-full py-20 px-6 lg:px-16 bg-surface-container-high">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="font-headline-lg text-3xl text-primary">
              Tham gia hành trình tái sử dụng cùng AGAIN STORE
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dich-vu-ky-gui"
                className="px-8 py-4 bg-primary text-surface-container-lowest font-label-md text-label-md uppercase tracking-widest inline-flex items-center gap-2"
              >
                <span>Đăng ký ký gửi</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/second-life"
                className="px-8 py-4 border border-primary text-primary font-label-md text-label-md uppercase tracking-widest"
              >
                Khám phá Second Life
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
