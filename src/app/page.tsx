"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, ShieldCheck, RefreshCw, Calendar, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SupabaseStatusBanner } from "@/components/ui/SupabaseStatusBanner";
import { getSupabaseClient, formatVND } from "@/lib/supabase";
import type { Product, Article, CommunityEvent, PageSectionRecord } from "@/types/database";
import { PRODUCT_STATUS_LABELS } from "@/types/database";

const DEFAULT_SECTION_ORDER = [
  "hero",
  "brand_intro",
  "philosophy",
  "consignment_service",
  "how_it_works",
  "second_life",
  "impact",
  "community",
  "journal",
  "cta",
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [sections, setSections] = useState<Record<string, PageSectionRecord>>({});
  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_SECTION_ORDER);
  const [stats, setStats] = useState({
    totalConsignments: 0,
    displayingProducts: 0,
    rehomedProducts: 0,
    communityEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        // 1. Lấy cấu hình section động của trang chủ (nếu đã cấu hình trong CMS)
        const { data: homePage } = await supabase
          .from("pages")
          .select("id")
          .eq("slug", "home")
          .maybeSingle();

        if (homePage?.id) {
          const { data: sectionRows } = await supabase
            .from("page_sections")
            .select("*")
            .eq("page_id", homePage.id)
            .order("sort_order", { ascending: true });

          if (sectionRows && sectionRows.length > 0) {
            const map: Record<string, PageSectionRecord> = {};
            const activeKeys: string[] = [];
            sectionRows.forEach((row: PageSectionRecord) => {
              map[row.section_key] = row;
              if (row.is_active) activeKeys.push(row.section_key);
            });
            setSections(map);
            if (activeKeys.length > 0) {
              setSectionOrder(activeKeys);
            }
          }
        }

        // 2. Lấy danh sách sản phẩm đang trưng bày trên Second Life
        const { data: prodData } = await supabase
          .from("products")
          .select("*, product_images(*), categories(*)")
          .in("status", ["displaying", "reserved", "completed"])
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(4);

        if (prodData) setProducts(prodData as Product[]);

        // 3. Lấy bài viết Journal mới nhất
        const { data: artData } = await supabase
          .from("articles")
          .select("*, article_categories(*)")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(3);

        if (artData) setArticles(artData as Article[]);

        // 4. Lấy hoạt động cộng đồng
        const { data: evtData } = await supabase
          .from("events")
          .select("*, partners(*)")
          .order("event_date", { ascending: true })
          .limit(3);

        if (evtData) setEvents(evtData as CommunityEvent[]);

        // 5. Lấy số liệu thực tế cho phần Our Impact
        const [
          { count: totalConsignments },
          { count: displayingProducts },
          { count: rehomedProducts },
          { count: communityEvents },
        ] = await Promise.all([
          supabase.from("consignment_requests").select("*", { count: "exact", head: true }),
          supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("status", "displaying"),
          supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .in("status", ["reserved", "completed"]),
          supabase.from("events").select("*", { count: "exact", head: true }),
        ]);

        setStats({
          totalConsignments: totalConsignments || 0,
          displayingProducts: displayingProducts || 0,
          rehomedProducts: rehomedProducts || 0,
          communityEvents: communityEvents || 0,
        });
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  const isSectionVisible = (key: string) => {
    if (sections[key]) return sections[key].is_active;
    return sectionOrder.includes(key);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <SiteHeader />

      <main className="w-full pt-28 flex-1">
        <SupabaseStatusBanner />

        {/* Editorial Motto Strip */}
        <section className="w-full bg-surface-container-low py-3.5 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-label-md text-label-md tracking-widest uppercase text-on-surface-variant">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2 text-secondary">
                <span className="w-1.5 h-1.5 bg-secondary inline-block" />
                ARCHIVAL CONSIGNMENT
              </span>
              <span className="hidden sm:inline text-outline-variant">•</span>
              <span className="hidden sm:inline">CIRCULAR FASHION ARCHIVE &amp; CARE</span>
              <span className="hidden md:inline text-outline-variant">•</span>
              <span className="hidden md:inline">AUTHENTICITY VERIFIED</span>
            </div>
            <div className="flex items-center gap-4 text-secondary font-medium">
              <Link href="/tra-cuu-ky-gui" className="hover:underline text-primary">
                TRA CỨU MÃ KÝ GỬI →
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 2: HERO BANNER */}
        {isSectionVisible("hero") && (
          <section className="w-full bg-surface py-14 lg:py-24 px-6 lg:px-16 border-b border-outline-variant/40">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              <div className="lg:col-span-7 flex flex-col justify-center space-y-8">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-widest">
                    Consignment • Second Life
                  </span>
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                    Circular Fashion Platform
                  </span>
                </div>

                <div className="space-y-4">
                  <h1 className="font-display-lg text-4xl sm:text-5xl lg:text-[4.25rem] lg:leading-[4.75rem] text-primary tracking-tight">
                    {sections.hero?.title || (
                      <>
                        GOOD CLOTHES <br />
                        <span className="italic font-normal text-secondary">DESERVE</span> ANOTHER LIFE.
                      </>
                    )}
                  </h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl leading-relaxed pt-2">
                    {sections.hero?.subtitle ||
                      "Trao cho từng món đồ tuyển chọn một vòng đời mới, bắt đầu từ sự trân trọng chất liệu, tôn vinh kỹ nghệ may đo và lối tiêu dùng có ý thức trách nhiệm."}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <Link
                    href={sections.hero?.cta_url || "/dich-vu-ky-gui#form-ky-gui"}
                    className="inline-flex items-center justify-center px-8 py-4 bg-primary text-surface-container-lowest font-label-md text-label-md uppercase tracking-widest hover:bg-secondary transition-colors duration-300"
                  >
                    <span>{sections.hero?.cta_text || "Gửi đồ ký gửi ngay"}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                  <Link
                    href="/ve-chung-toi"
                    className="inline-flex items-center justify-center px-8 py-4 border border-primary text-primary font-label-md text-label-md uppercase tracking-widest hover:bg-primary hover:text-surface-container-lowest transition-colors duration-300"
                  >
                    <span>Khám phá AGAIN STORE</span>
                  </Link>
                </div>

                <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-6 bg-surface-container-low p-6 border border-outline-variant/40">
                  <div className="space-y-1">
                    <span className="block font-headline-sm text-headline-sm text-primary">100%</span>
                    <p className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider">
                      Thẩm định thủ công
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="block font-headline-sm text-headline-sm text-primary">5 Bước</span>
                    <p className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider">
                      Quy trình minh bạch
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1 space-y-1">
                    <span className="block font-headline-sm text-headline-sm text-secondary">Zero Waste</span>
                    <p className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider">
                      Cam kết vòng đời
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Editorial Frame (Supports separate Desktop & Mobile Banner from CMS) */}
              <div className="lg:col-span-5 relative">
                <div className="relative bg-surface-container-high aspect-[3/4] w-full overflow-hidden border border-outline-variant/50 flex flex-col justify-between p-8">
                  {sections.hero?.desktop_banner_url ? (
                    <>
                      <img
                        src={sections.hero.desktop_banner_url}
                        alt={sections.hero.title || "AGAIN STORE Hero Banner"}
                        className="hidden md:block absolute inset-0 w-full h-full object-cover"
                      />
                      <img
                        src={sections.hero.mobile_banner_url || sections.hero.desktop_banner_url}
                        alt={sections.hero.title || "AGAIN STORE Hero Banner Mobile"}
                        className="block md:hidden absolute inset-0 w-full h-full object-cover"
                      />
                    </>
                  ) : (
                    <div className="my-auto space-y-4 text-left">
                      <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary block">
                        EDITORIAL MONOGRAPH • ARCHIVE
                      </span>
                      <p className="font-display-lg text-3xl text-primary leading-snug">
                        “Mỗi nếp gấp là một ký ức, mỗi đường chỉ là một lời hứa dài lâu.”
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Quản trị viên có thể tải ảnh Banner Desktop &amp; Mobile riêng biệt trong trang Quản trị (/admin/content).
                      </p>
                    </div>
                  )}

                  <div className="relative z-10 mt-auto p-6 bg-surface-bright/95 backdrop-blur-md border border-outline-variant/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">
                        CIRCULAR ARCHIVE
                      </span>
                      <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                        AGAIN STORE
                      </span>
                    </div>
                    <p className="font-headline-sm text-lg text-primary leading-tight">
                      Thời trang tuần hoàn &amp; Ký gửi tuyển chọn
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: BRAND INTRODUCTION ("MORE THAN SECONDHAND") */}
        {isSectionVisible("brand_intro") && (
          <section className="w-full bg-surface-container-low py-20 lg:py-24 px-6 lg:px-16 border-b border-outline-variant/40">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-5 space-y-6">
                <span className="font-label-md text-label-md uppercase tracking-widest text-secondary font-semibold block">
                  01 / TÔN CHỈ THƯƠNG HIỆU
                </span>
                <h2 className="font-headline-lg text-3xl lg:text-headline-lg text-primary tracking-tight">
                  MORE THAN <br />
                  SECONDHAND.
                </h2>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-4 py-2 bg-surface-container text-primary font-label-sm text-label-sm uppercase tracking-wider">
                    Tuyển chọn khắt khe
                  </span>
                  <span className="px-4 py-2 bg-surface-container text-primary font-label-sm text-label-sm uppercase tracking-wider">
                    Minh bạch định giá
                  </span>
                  <span className="px-4 py-2 bg-surface-container text-primary font-label-sm text-label-sm uppercase tracking-wider">
                    Chăm sóc chuyên nghiệp
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <blockquote className="font-headline-md text-2xl leading-relaxed italic text-primary font-normal border-l-2 border-secondary pl-6">
                  “AGAIN STORE không đơn thuần là nơi trao đổi quần áo đã qua sử dụng. Chúng tôi là nhịp cầu kết nối những giá trị thẩm mỹ trường tồn, trao cho từng sợi vải cơ hội tiếp tục tỏa sáng.”
                </blockquote>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Chúng tôi tin rằng thời trang chất lượng không bị đo đếm bởi số mùa mốt đi qua, mà bởi sự hoàn thiện của đường kim mũi chỉ, cấu trúc sợi vải và cảm xúc người mặc giữ lại. Bằng quy trình tiếp nhận, phân loại, kiểm định và định giá minh bạch, AGAIN STORE nâng tầm trải nghiệm ký gửi quần áo thành một lối sống bền vững.
                </p>
                <div className="pt-2">
                  <Link
                    href="/ve-chung-toi"
                    className="inline-flex items-center font-label-md text-label-md uppercase tracking-widest text-primary hover:text-secondary transition-colors"
                  >
                    <span>Đọc câu chuyện thương hiệu</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: OUR PHILOSOPHY ("FASHION SHOULD NEVER BE ONE-TIME") */}
        {isSectionVisible("philosophy") && (
          <section className="w-full bg-surface py-20 lg:py-24 px-6 lg:px-16 border-b border-outline-variant/40">
            <div className="max-w-7xl mx-auto space-y-12">
              <div className="max-w-2xl space-y-3">
                <span className="font-label-md text-label-md uppercase tracking-widest text-secondary font-semibold">
                  02 / TRIẾT LÝ TUẦN HOÀN
                </span>
                <h2 className="font-headline-lg text-3xl lg:text-headline-lg text-primary tracking-tight">
                  FASHION SHOULD NEVER BE ONE-TIME.
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                  Ngành thời trang nhanh tạo ra những chu kỳ ngắn ngủi. Chúng tôi xây dựng một văn hóa đối lập: tái sử dụng, suy ngẫm và làm mới vòng đời trang phục.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-surface-container-low p-8 border border-outline-variant/40 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display-lg text-4xl text-secondary">01</span>
                      <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                        GIAI ĐOẠN I
                      </span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary uppercase">
                      REUSE — TÁI SỬ DỤNG
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      Kéo dài vòng đời trang phục thêm 9 tháng giúp giảm 20–30% lượng phát thải carbon và nước thải dệt may. Món đồ cũ của một người trở thành lựa chọn mới đầy giá trị của người khác.
                    </p>
                  </div>
                  <div className="p-3 bg-surface-container-high/60 font-label-sm text-label-sm text-secondary uppercase">
                    Tác động: Giảm thiểu rác thải dệt may
                  </div>
                </div>

                <div className="bg-surface-container-low p-8 border border-outline-variant/40 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display-lg text-4xl text-secondary">02</span>
                      <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                        GIAI ĐOẠN II
                      </span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary uppercase">
                      RETHINK — Ý THỨC MỚI
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      Định nghĩa lại giá trị của tủ đồ cá nhân: mua ít hơn nhưng tinh chọn hơn, ưu tiên chất liệu bền bỉ và trao đi những món đồ không còn sử dụng thay vì để lãng phí.
                    </p>
                  </div>
                  <div className="p-3 bg-surface-container-high/60 font-label-sm text-label-sm text-secondary uppercase">
                    Tác động: Tiêu dùng có trách nhiệm
                  </div>
                </div>

                <div className="bg-surface-container-low p-8 border border-outline-variant/40 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display-lg text-4xl text-secondary">03</span>
                      <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                        GIAI ĐOẠN III
                      </span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-primary uppercase">
                      RENEW — TÁI SINH VÒNG ĐỜI
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      Mỗi sản phẩm ký gửi đều được kiểm tra chất lượng, làm sạch, phân loại và định giá chuẩn mực trước khi trưng bày trên không gian Second Life.
                    </p>
                  </div>
                  <div className="p-3 bg-surface-container-high/60 font-label-sm text-label-sm text-secondary uppercase">
                    Tác động: Kéo dài tuổi thọ trang phục
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5 & 6: CONSIGNMENT SERVICE & HOW IT WORKS (5 STEPS) */}
        {isSectionVisible("consignment_service") && (
          <section className="w-full bg-surface-container-high py-20 lg:py-24 px-6 lg:px-16 border-b border-outline-variant/40">
            <div className="max-w-7xl mx-auto space-y-16">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-5 space-y-6">
                  <span className="font-label-md text-label-md uppercase tracking-widest text-secondary font-semibold">
                    03 / DỊCH VỤ KÝ GỬI
                  </span>
                  <h2 className="font-headline-lg text-3xl lg:text-headline-lg text-primary tracking-tight">
                    YOUR CLOSET, <br />
                    ANOTHER STORY.
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Tủ đồ của bạn chứa đựng những món đồ đẹp đang chờ đợi người chủ kế tiếp. Hãy để AGAIN STORE đồng hành tiếp nhận, kiểm định, định giá và kết nối chúng tới cộng đồng yêu thời trang bền vững.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-4">
                    <Link
                      href="/dich-vu-ky-gui"
                      className="inline-flex items-center px-7 py-3.5 bg-primary text-surface-container-lowest font-label-md text-label-md uppercase tracking-widest hover:bg-secondary transition-colors"
                    >
                      <span>Xem chi tiết &amp; Đăng ký ký gửi</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-surface p-6 border border-outline-variant/40 space-y-2">
                    <ShieldCheck className="w-6 h-6 text-primary mb-2" />
                    <h3 className="font-label-lg text-label-lg uppercase tracking-wide text-primary">
                      Minh bạch tuyệt đối
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Mỗi yêu cầu ký gửi đều có mã hồ sơ riêng (#CR-...) để theo dõi trạng thái xử lý và sản phẩm liên kết.
                    </p>
                  </div>
                  <div className="bg-surface p-6 border border-outline-variant/40 space-y-2">
                    <CheckCircle2 className="w-6 h-6 text-primary mb-2" />
                    <h3 className="font-label-lg text-label-lg uppercase tracking-wide text-primary">
                      Định giá chuẩn mực
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Đội ngũ nhân viên kiểm tra tình trạng thực tế, chất liệu và thương hiệu gốc để đề xuất mức giá hợp lý.
                    </p>
                  </div>
                  <div className="bg-surface p-6 border border-outline-variant/40 space-y-2">
                    <Sparkles className="w-6 h-6 text-primary mb-2" />
                    <h3 className="font-label-lg text-label-lg uppercase tracking-wide text-primary">
                      Trưng bày tuyển chọn
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Sản phẩm đạt chuẩn được chụp ảnh và xuất bản trên chuyên trang Second Life với đầy đủ thông số.
                    </p>
                  </div>
                  <div className="bg-surface p-6 border border-outline-variant/40 space-y-2">
                    <RefreshCw className="w-6 h-6 text-primary mb-2" />
                    <h3 className="font-label-lg text-label-lg uppercase tracking-wide text-primary">
                      Đối soát rõ ràng
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Cập nhật trạng thái từ lúc tiếp nhận đến khi sản phẩm tìm được chủ mới và hoàn tất thanh toán.
                    </p>
                  </div>
                </div>
              </div>

              {/* 5-Step Process */}
              {isSectionVisible("how_it_works") && (
                <div className="pt-8 border-t border-outline-variant/50 space-y-8">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <span className="font-label-md text-label-md uppercase tracking-widest text-secondary font-semibold">
                        04 / QUY TRÌNH 5 BƯỚC
                      </span>
                      <h3 className="font-headline-md text-2xl text-primary mt-1">
                        HÀNH TRÌNH KÝ GỬI TẠI AGAIN STORE
                      </h3>
                    </div>
                    <Link
                      href="/dich-vu-ky-gui#form-ky-gui"
                      className="font-label-md text-label-md uppercase tracking-widest text-primary underline underline-offset-4"
                    >
                      Bắt đầu gửi đồ ngay →
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {[
                      {
                        step: "01",
                        title: "Đăng ký gửi đồ",
                        desc: "Khách hàng điền thông tin cá nhân và tải hình ảnh sản phẩm lên biểu mẫu trực tuyến.",
                      },
                      {
                        step: "02",
                        title: "Tiếp nhận sản phẩm",
                        desc: "Nhân viên xác nhận yêu cầu theo mã ký gửi và hướng dẫn khách gửi sản phẩm.",
                      },
                      {
                        step: "03",
                        title: "Kiểm tra & Định giá",
                        desc: "Kiểm tra tình trạng, phân loại danh mục và đề xuất giá niêm yết phù hợp.",
                      },
                      {
                        step: "04",
                        title: "Trưng bày Second Life",
                        desc: "Sản phẩm đạt điều kiện được chụp ảnh, duyệt nội dung và trưng bày trên website.",
                      },
                      {
                        step: "05",
                        title: "Đối soát & Thanh toán",
                        desc: "Cập nhật kết quả khi sản phẩm tìm được chủ mới và thanh toán theo chính sách.",
                      },
                    ].map((item) => (
                      <div
                        key={item.step}
                        className="bg-surface p-6 border border-outline-variant/40 flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <span className="w-9 h-9 bg-primary text-surface-container-lowest font-display-lg text-base flex items-center justify-center">
                            {item.step}
                          </span>
                          <h4 className="font-headline-sm text-lg text-primary">{item.title}</h4>
                          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* SECTION 7: SECOND LIFE COLLECTION */}
        {isSectionVisible("second_life") && (
          <section className="w-full bg-surface py-20 lg:py-24 px-6 lg:px-16 border-b border-outline-variant/40">
            <div className="max-w-7xl mx-auto space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                  <span className="font-label-md text-label-md uppercase tracking-widest text-secondary font-semibold">
                    05 / BỘ SƯU TẬP TUYỂN CHỌN
                  </span>
                  <h2 className="font-headline-lg text-3xl lg:text-headline-lg text-primary tracking-tight">
                    SECOND LIFE CURATION.
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
                    Các sản phẩm ký gửi đã qua tuyển chọn và đang trưng bày trực tiếp từ cơ sở dữ liệu hệ thống.
                  </p>
                </div>
                <Link
                  href="/second-life"
                  className="inline-flex items-center font-label-md text-label-md uppercase tracking-widest text-primary hover:text-secondary transition-colors"
                >
                  <span>Khám phá toàn bộ Second Life</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>

              {loading ? (
                <div className="py-16 text-center font-body-md text-on-surface-variant">
                  Đang tải dữ liệu sản phẩm từ Supabase...
                </div>
              ) : products.length === 0 ? (
                <div className="bg-surface-container-low border border-outline-variant/50 p-12 text-center space-y-4">
                  <p className="font-headline-sm text-xl text-primary">
                    Chưa có sản phẩm nào đang trưng bày trong cơ sở dữ liệu
                  </p>
                  <p className="font-body-sm text-on-surface-variant max-w-lg mx-auto">
                    Sau khi kết nối Supabase, bạn có thể tạo sản phẩm mới hoặc duyệt từ yêu cầu ký gửi tại trang Quản trị (/admin/products) để hiển thị tại đây.
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-4">
                    <Link
                      href="/admin/products"
                      className="px-6 py-3 bg-primary text-surface-container-lowest font-label-sm text-label-sm uppercase tracking-widest"
                    >
                      Tạo sản phẩm trong Admin
                    </Link>
                    <Link
                      href="/dich-vu-ky-gui#form-ky-gui"
                      className="px-6 py-3 border border-primary text-primary font-label-sm text-label-sm uppercase tracking-widest"
                    >
                      Gửi yêu cầu ký gửi
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {products.map((product) => {
                    const primaryImage =
                      product.product_images?.find((img) => img.is_primary)?.image_url ||
                      product.product_images?.[0]?.image_url;

                    return (
                      <Link
                        key={product.id}
                        href={`/second-life/${product.slug}`}
                        className="group bg-surface-container-low border border-outline-variant/40 flex flex-col justify-between transition-all hover:border-primary"
                      >
                        <div className="relative aspect-[3/4] bg-surface-container overflow-hidden">
                          {primaryImage ? (
                            <img
                              src={primaryImage}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center p-6 text-center font-label-sm text-on-surface-variant uppercase">
                              {product.product_code}
                            </div>
                          )}
                          <div className="absolute top-3 left-3 bg-surface-bright/95 px-3 py-1 text-primary font-label-sm text-label-sm uppercase tracking-wider border border-outline-variant/40">
                            {PRODUCT_STATUS_LABELS[product.status]}
                          </div>
                          {product.condition_label && (
                            <div className="absolute top-3 right-3 bg-primary text-surface-container-lowest px-2.5 py-1 font-label-sm text-label-sm uppercase">
                              {product.condition_label}
                            </div>
                          )}
                        </div>

                        <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-secondary font-label-sm text-label-sm uppercase tracking-widest">
                              <span>{product.brand || product.categories?.name || "AGAIN ARCHIVE"}</span>
                              {product.size && <span>Size {product.size}</span>}
                            </div>
                            <h3 className="font-headline-sm text-lg text-primary leading-snug">
                              {product.title}
                            </h3>
                            {product.material && (
                              <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
                                {product.material}
                              </p>
                            )}
                          </div>

                          <div className="pt-3 border-t border-outline-variant/40 flex items-center justify-between">
                            <span className="font-headline-sm text-lg text-primary">
                              {formatVND(product.price)}
                            </span>
                            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary group-hover:text-primary underline underline-offset-4">
                              Chi tiết →
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* SECTION 8: OUR IMPACT (LIVE METRICS FROM SUPABASE) */}
        {isSectionVisible("impact") && (
          <section className="w-full bg-primary text-surface-container-lowest py-20 px-6 lg:px-16">
            <div className="max-w-7xl mx-auto space-y-12">
              <div className="max-w-2xl space-y-2">
                <span className="font-label-md text-label-md uppercase tracking-widest text-secondary-fixed">
                  06 / TÁC ĐỘNG XÃ HỘI &amp; THỐNG KÊ THỰC TẾ
                </span>
                <h2 className="font-headline-lg text-3xl lg:text-headline-lg text-surface-container-lowest">
                  OUR CIRCULAR IMPACT.
                </h2>
                <p className="font-body-md text-primary-fixed-dim">
                  Số liệu được tổng hợp trực tiếp theo thời gian thực từ hoạt động ký gửi và tái sử dụng trên hệ thống AGAIN STORE.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-8 bg-primary-container border border-on-primary-container/30 space-y-2">
                  <span className="font-display-lg text-4xl lg:text-5xl text-surface-container-lowest block">
                    {stats.totalConsignments}
                  </span>
                  <p className="font-label-md text-label-md uppercase tracking-widest text-secondary-fixed">
                    Yêu cầu ký gửi đã tiếp nhận
                  </p>
                </div>
                <div className="p-8 bg-primary-container border border-on-primary-container/30 space-y-2">
                  <span className="font-display-lg text-4xl lg:text-5xl text-surface-container-lowest block">
                    {stats.displayingProducts}
                  </span>
                  <p className="font-label-md text-label-md uppercase tracking-widest text-secondary-fixed">
                    Sản phẩm đang trưng bày
                  </p>
                </div>
                <div className="p-8 bg-primary-container border border-on-primary-container/30 space-y-2">
                  <span className="font-display-lg text-4xl lg:text-5xl text-surface-container-lowest block">
                    {stats.rehomedProducts}
                  </span>
                  <p className="font-label-md text-label-md uppercase tracking-widest text-secondary-fixed">
                    Sản phẩm đã tìm chủ mới
                  </p>
                </div>
                <div className="p-8 bg-primary-container border border-on-primary-container/30 space-y-2">
                  <span className="font-display-lg text-4xl lg:text-5xl text-surface-container-lowest block">
                    {stats.communityEvents}
                  </span>
                  <p className="font-label-md text-label-md uppercase tracking-widest text-secondary-fixed">
                    Hoạt động cộng đồng
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 9: COMMUNITY */}
        {isSectionVisible("community") && (
          <section className="w-full bg-surface-container-low py-20 px-6 lg:px-16 border-b border-outline-variant/40">
            <div className="max-w-7xl mx-auto space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                  <span className="font-label-md text-label-md uppercase tracking-widest text-secondary font-semibold">
                    07 / CỘNG ĐỒNG BỀN VỮNG
                  </span>
                  <h2 className="font-headline-lg text-3xl text-primary">
                    HOẠT ĐỘNG &amp; SỰ KIỆN ĐỔI ĐỒ.
                  </h2>
                </div>
                <Link
                  href="/cong-dong"
                  className="inline-flex items-center font-label-md text-label-md uppercase tracking-widest text-primary hover:text-secondary"
                >
                  <span>Xem trang Cộng đồng</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>

              {events.length === 0 ? (
                <div className="bg-surface p-10 border border-outline-variant/40 text-center space-y-3">
                  <p className="font-headline-sm text-lg text-primary">
                    Chưa có sự kiện cộng đồng nào được tạo trong Database
                  </p>
                  <p className="font-body-sm text-on-surface-variant">
                    Bạn có thể thêm sự kiện mới tại mục Quản lý Cộng đồng (/admin/community).
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {events.map((evt) => (
                    <div
                      key={evt.id}
                      className="bg-surface p-6 border border-outline-variant/40 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <span className="px-2.5 py-1 bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase">
                          {evt.status === "upcoming"
                            ? "Sắp diễn ra"
                            : evt.status === "ongoing"
                            ? "Đang diễn ra"
                            : "Đã kết thúc"}
                        </span>
                        <h3 className="font-headline-sm text-xl text-primary">{evt.title}</h3>
                        {evt.description && (
                          <p className="font-body-sm text-on-surface-variant line-clamp-3">
                            {evt.description}
                          </p>
                        )}
                      </div>
                      <div className="pt-4 border-t border-outline-variant/30 space-y-1.5 font-body-sm text-on-surface-variant">
                        {evt.event_date && (
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-secondary" />
                            <span>{new Date(evt.event_date).toLocaleDateString("vi-VN")}</span>
                          </p>
                        )}
                        {evt.location && (
                          <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-secondary" />
                            <span>{evt.location}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* SECTION 10: JOURNAL */}
        {isSectionVisible("journal") && (
          <section className="w-full bg-surface py-20 px-6 lg:px-16 border-b border-outline-variant/40">
            <div className="max-w-7xl mx-auto space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                  <span className="font-label-md text-label-md uppercase tracking-widest text-secondary font-semibold">
                    08 / JOURNAL &amp; KIẾN THỨC
                  </span>
                  <h2 className="font-headline-lg text-3xl text-primary">
                    CÂU CHUYỆN THỜI TRANG BỀN VỮNG.
                  </h2>
                </div>
                <Link
                  href="/journal"
                  className="inline-flex items-center font-label-md text-label-md uppercase tracking-widest text-primary hover:text-secondary"
                >
                  <span>Đọc tất cả bài viết</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>

              {articles.length === 0 ? (
                <div className="bg-surface-container-low p-10 border border-outline-variant/40 text-center space-y-3">
                  <p className="font-headline-sm text-lg text-primary">
                    Chưa có bài viết Journal nào được xuất bản
                  </p>
                  <p className="font-body-sm text-on-surface-variant">
                    Bạn có thể đăng bài viết mới trong trang Quản trị (/admin/journal).
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {articles.map((art) => (
                    <Link
                      key={art.id}
                      href={`/journal/${art.slug}`}
                      className="group bg-surface-container-low border border-outline-variant/40 flex flex-col justify-between hover:border-primary transition-colors"
                    >
                      {art.thumbnail_url && (
                        <div className="aspect-[16/10] bg-surface-container overflow-hidden">
                          <img
                            src={art.thumbnail_url}
                            alt={art.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                            {art.article_categories?.name || "JOURNAL"}
                          </span>
                          <h3 className="font-headline-sm text-xl text-primary group-hover:underline">
                            {art.title}
                          </h3>
                          {art.excerpt && (
                            <p className="font-body-sm text-on-surface-variant line-clamp-3">
                              {art.excerpt}
                            </p>
                          )}
                        </div>
                        <span className="pt-3 font-label-sm text-label-sm uppercase tracking-wider text-primary">
                          Đọc bài viết →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* SECTION 11: CTA */}
        {isSectionVisible("cta") && (
          <section className="w-full bg-surface-container-high py-20 px-6 lg:px-16">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                JOIN THE CIRCULAR MOVEMENT
              </span>
              <h2 className="font-headline-lg text-3xl lg:text-5xl text-primary">
                Sẵn sàng trao cho trang phục của bạn một vòng đời mới?
              </h2>
              <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto">
                Đăng ký ký gửi trực tuyến chỉ trong 2 phút hoặc tham gia các hoạt động đổi đồ cùng cộng đồng AGAIN STORE.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/dich-vu-ky-gui#form-ky-gui"
                  className="w-full sm:w-auto px-8 py-4 bg-primary text-surface-container-lowest font-label-md text-label-md uppercase tracking-widest hover:bg-secondary transition-colors"
                >
                  Đăng ký ký gửi ngay
                </Link>
                <Link
                  href="/cong-dong"
                  className="w-full sm:w-auto px-8 py-4 border border-primary text-primary font-label-md text-label-md uppercase tracking-widest hover:bg-primary hover:text-surface-container-lowest transition-colors"
                >
                  Tham gia Cộng đồng
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
