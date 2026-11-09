"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getSupabaseClient } from "@/lib/supabase";
import type { PageSectionRecord } from "@/types/database";

export default function AboutUsPage() {
  const [sections, setSections] = useState<Record<string, PageSectionRecord>>({});

  useEffect(() => {
    async function loadSections() {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const { data: page } = await supabase
        .from("pages")
        .select("id")
        .eq("slug", "ve-chung-toi")
        .maybeSingle();

      if (page?.id) {
        const { data: rows } = await supabase
          .from("page_sections")
          .select("*")
          .eq("page_id", page.id)
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (rows) {
          const map: Record<string, PageSectionRecord> = {};
          rows.forEach((r: PageSectionRecord) => {
            map[r.section_key] = r;
          });
          setSections(map);
        }
      }
    }
    loadSections();
  }, []);

  const milestones =
    (sections.our_journey?.content?.milestones as Array<{
      year: string;
      title: string;
      desc: string;
    }>) || [
      {
        year: "Giai đoạn 01",
        title: "Khởi nguồn ý tưởng Thời trang Tuần hoàn",
        desc: "Xây dựng mô hình tiếp nhận, kiểm định và phân loại trang phục secondhand tuyển chọn.",
      },
      {
        year: "Giai đoạn 02",
        title: "Ra mắt không gian lưu trữ Second Life",
        desc: "Thiết lập quy trình định giá minh bạch và hệ thống tra cứu mã ký gửi trực tuyến.",
      },
      {
        year: "Giai đoạn 03",
        title: "Mở rộng Cộng đồng & Sự kiện Đổi đồ",
        desc: "Tổ chức các hoạt động Clothing Swap, quyên góp và lan tỏa lối sống bền vững.",
      },
    ];

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <SiteHeader />

      <main className="w-full pt-28 flex-1">
        {/* 1. Banner */}
        <section className="w-full bg-surface-container-low py-16 lg:py-24 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto space-y-6">
            <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
              VỀ CHÚNG TÔI • ABOUT AGAIN STORE
            </span>
            <h1 className="font-display-lg text-4xl sm:text-5xl lg:text-6xl text-primary tracking-tight max-w-4xl">
              {sections.banner?.title || "EVERY PIECE HAS A STORY."}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
              {sections.banner?.subtitle ||
                "Khởi nguồn từ mong muốn giải quyết bài toán tủ đồ đầy ắp nhưng thiếu tính lưu thông, AGAIN STORE ra đời như một nền tảng thời trang tuần hoàn chuyên nghiệp và bền vững."}
            </p>
          </div>
        </section>

        {/* 2. Brand Story */}
        <section className="w-full py-20 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 space-y-4">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                01 / BRAND STORY
              </span>
              <h2 className="font-headline-lg text-3xl text-primary">
                {sections.brand_story?.title ||
                  "Khởi nguồn từ một tủ đồ đầy ắp nhưng thiếu ý nghĩa."}
              </h2>
            </div>
            <div className="lg:col-span-7 space-y-5 font-body-md text-on-surface-variant leading-relaxed">
              <p>
                {sections.brand_story?.subtitle ||
                  "Mỗi năm, hàng triệu trang phục còn nguyên giá trị sử dụng bị lãng quên trong góc tủ hoặc thải bỏ sớm. Tại AGAIN STORE, chúng tôi nhìn thấy trong từng thiết kế đó công sức của người thợ may, nguồn tài nguyên sợi tự nhiên và một câu chuyện xứng đáng được viết tiếp."}
              </p>
              <p>
                Thay vì hoạt động như một sàn thương mại điện tử bán lẻ đại trà, AGAIN STORE tập trung vào dịch vụ ký gửi tuyển chọn: tiếp nhận, kiểm tra, phân loại, định giá minh bạch và kết nối người gửi đồ với những người thực sự trân trọng.
              </p>
            </div>
          </div>
        </section>

        {/* 3 & 4. Our Vision & Our Mission */}
        <section className="w-full bg-surface-container-low py-20 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-surface p-10 border border-outline-variant/40 space-y-4">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                02 / OUR VISION — TẦM NHÌN
              </span>
              <h3 className="font-headline-md text-2xl text-primary">
                {sections.our_vision?.title ||
                  "Trở thành hệ sinh thái thời trang tuần hoàn đáng tin cậy hàng đầu"}
              </h3>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                {sections.our_vision?.subtitle ||
                  "Định hình chuẩn mực mới cho dịch vụ ký gửi và tái sử dụng quần áo tại Việt Nam, nơi thời trang secondhand được trân trọng như những tác phẩm lưu trữ có giá trị thẩm mỹ cao."}
              </p>
            </div>

            <div className="bg-surface p-10 border border-outline-variant/40 space-y-4">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                03 / OUR MISSION — SỨ MỆNH
              </span>
              <h3 className="font-headline-md text-2xl text-primary">
                {sections.our_mission?.title ||
                  "Kéo dài vòng đời của từng thớ vải và kết nối cộng đồng sống xanh"}
              </h3>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                {sections.our_mission?.subtitle ||
                  "Giúp khách hàng giải phóng tủ đồ một cách có trách nhiệm, minh bạch hóa quy trình định giá ký gửi và truyền cảm hứng tiêu dùng bền vững thông qua giáo dục và hoạt động cộng đồng."}
              </p>
            </div>
          </div>
        </section>

        {/* 5. Core Values */}
        <section className="w-full py-20 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="space-y-2">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                04 / CORE VALUES
              </span>
              <h2 className="font-headline-lg text-3xl text-primary">
                BỐN TRỤ CỘT GIÁ TRỊ CỐT LÕI
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  num: "01",
                  title: "SUSTAINABILITY",
                  sub: "Bền vững thực chất",
                  desc: "Ưu tiên kéo dài vòng đời sản phẩm hiện có, giảm phát thải và hạn chế rác thải thời trang.",
                },
                {
                  num: "02",
                  title: "AUTHENTICITY",
                  sub: "Tuyển chọn & Minh bạch",
                  desc: "Mỗi sản phẩm đều được kiểm định chất liệu, tình trạng và định giá rõ ràng.",
                },
                {
                  num: "03",
                  title: "RESPONSIBILITY",
                  sub: "Trách nhiệm đồng hành",
                  desc: "Bảo vệ quyền lợi của cả người gửi đồ (Consignor) và người tiếp nhận món đồ mới.",
                },
                {
                  num: "04",
                  title: "COMMUNITY",
                  sub: "Gắn kết cộng đồng",
                  desc: "Xây dựng không gian chia sẻ kiến thức bảo quản, phối đồ và sự kiện đổi đồ định kỳ.",
                },
              ].map((val) => (
                <div
                  key={val.num}
                  className="p-8 bg-surface-container-low border border-outline-variant/40 space-y-4"
                >
                  <span className="font-display-lg text-3xl text-secondary block">{val.num}</span>
                  <div>
                    <h3 className="font-label-lg text-label-lg uppercase tracking-wider text-primary">
                      {val.title}
                    </h3>
                    <p className="font-headline-sm text-lg text-primary mt-1">{val.sub}</p>
                  </div>
                  <p className="font-body-sm text-on-surface-variant leading-relaxed">{val.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Brand Philosophy */}
        <section className="w-full bg-primary text-surface-container-lowest py-20 px-6 lg:px-16">
          <div className="max-w-5xl mx-auto space-y-6">
            <span className="font-label-md text-label-md uppercase tracking-widest text-secondary-fixed">
              05 / BRAND PHILOSOPHY
            </span>
            <h2 className="font-headline-lg text-3xl lg:text-4xl">
              {sections.brand_philosophy?.title ||
                "THE ART OF SLOW LIVING & CONSCIOUS WARDROBE."}
            </h2>
            <p className="font-body-lg text-primary-fixed-dim leading-relaxed">
              {sections.brand_philosophy?.subtitle ||
                "Quan điểm của AGAIN STORE về thời trang đã qua sử dụng: Một món đồ secondhand được bảo quản tốt không phải là đồ cũ, mà là minh chứng cho chất lượng vượt thời gian."}
            </p>
          </div>
        </section>

        {/* 7. Our Journey */}
        <section className="w-full py-20 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="space-y-2">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                06 / OUR JOURNEY
              </span>
              <h2 className="font-headline-lg text-3xl text-primary">
                CÁC CỘT MỐC PHÁT TRIỂN
              </h2>
              <p className="font-body-sm text-on-surface-variant">
                Quản trị viên có thể cập nhật nội dung và cột mốc trong trang Quản trị (/admin/content) mà không cần sửa code.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="p-8 bg-surface-container-low border border-outline-variant/40 space-y-3"
                >
                  <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                    {m.year}
                  </span>
                  <h3 className="font-headline-sm text-xl text-primary">{m.title}</h3>
                  <p className="font-body-sm text-on-surface-variant leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. CTA */}
        <section className="w-full bg-surface-container-high py-20 px-6 lg:px-16">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="font-headline-lg text-3xl text-primary">
              Khám phá dịch vụ ký gửi tại AGAIN STORE
            </h2>
            <p className="font-body-md text-on-surface-variant">
              Đồng hành cùng chúng tôi trong hành trình kéo dài vòng đời trang phục ngay hôm nay.
            </p>
            <div className="pt-2">
              <Link
                href="/dich-vu-ky-gui"
                className="inline-flex items-center px-8 py-4 bg-primary text-surface-container-lowest font-label-md text-label-md uppercase tracking-widest hover:bg-secondary transition-colors"
              >
                <span>Khám phá Dịch vụ Ký gửi</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
