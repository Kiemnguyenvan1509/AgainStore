"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, MessageSquare, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getSupabaseClient, formatVND } from "@/lib/supabase";
import type { Product } from "@/types/database";
import { PRODUCT_STATUS_LABELS } from "@/types/database";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rehomedProducts, setRehomedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Form liên hệ hỏi thông tin sản phẩm (mục II.4 đặc tả)
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProductDetail() {
      const supabase = getSupabaseClient();
      if (!supabase || !slug) {
        setLoading(false);
        return;
      }

      try {
        const { data: prod } = await supabase
          .from("products")
          .select("*, product_images(*), categories(*), consignment_requests(request_code)")
          .eq("slug", slug)
          .maybeSingle();

        if (prod) {
          const typed = prod as Product;
          setProduct(typed);
          const primary =
            typed.product_images?.find((img) => img.is_primary)?.image_url ||
            typed.product_images?.[0]?.image_url ||
            null;
          setSelectedImage(primary);
        }

        const { data: rehomed } = await supabase
          .from("products")
          .select("*, product_images(*)")
          .in("status", ["reserved", "completed"])
          .limit(3);

        if (rehomed) setRehomedProducts(rehomed as Product[]);
      } finally {
        setLoading(false);
      }
    }

    loadProductDetail();
  }, [slug]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setFormError(null);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setFormError("Chưa kết nối Supabase.");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("contacts").insert({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        subject: `Hỏi thông tin sản phẩm #${product.product_code} - ${product.title}`,
        message:
          message.trim() ||
          `Tôi muốn hỏi thông tin / đặt lịch xem sản phẩm ${product.title} (#${product.product_code}).`,
        product_id: product.id,
        status: "new",
      });

      if (error) throw new Error(error.message);
      setSentSuccess(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Không thể gửi yêu cầu.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <SiteHeader />

      <main className="w-full pt-28 flex-1">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 py-10 space-y-12">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
            <Link
              href="/second-life"
              className="inline-flex items-center gap-2 font-label-md text-label-md uppercase tracking-widest text-secondary hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Second Life</span>
            </Link>
            {product && (
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                MÃ LƯU TRỮ: #{product.product_code}
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-20 text-center font-body-md text-on-surface-variant">
              Đang tải thông tin sản phẩm...
            </div>
          ) : !product ? (
            <div className="p-12 bg-surface-container-low border border-outline-variant/50 text-center space-y-4">
              <h1 className="font-headline-md text-2xl text-primary">
                Không tìm thấy sản phẩm trong cơ sở dữ liệu
              </h1>
              <Link
                href="/second-life"
                className="inline-block px-6 py-3 bg-primary text-surface-container-lowest font-label-sm text-label-sm uppercase tracking-widest"
              >
                Khám phá Second Life
              </Link>
            </div>
          ) : (
            <>
              {/* Main Product 2-Column Exhibition */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Left Column: Image Gallery */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="relative aspect-[3/4] bg-surface-container border border-outline-variant/50 overflow-hidden">
                    {selectedImage ? (
                      <img
                        src={selectedImage}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-headline-sm text-on-surface-variant">
                        #{product.product_code}
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-surface-bright/95 px-3.5 py-1.5 font-label-sm text-label-sm uppercase tracking-widest text-primary border border-outline-variant/40">
                      Trạng thái: {PRODUCT_STATUS_LABELS[product.status]}
                    </div>
                  </div>

                  {product.product_images && product.product_images.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                      {product.product_images.map((img) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => setSelectedImage(img.image_url)}
                          className={`aspect-square border overflow-hidden ${
                            selectedImage === img.image_url
                              ? "border-primary border-2"
                              : "border-outline-variant/40"
                          }`}
                        >
                          <img
                            src={img.image_url}
                            alt={img.alt_text || product.title}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Specifications & Contact Inquiry Form */}
                <div className="lg:col-span-6 space-y-8">
                  <div className="space-y-3 border-b border-outline-variant/40 pb-6">
                    <div className="flex items-center gap-3 font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                      <span>{product.categories?.name || "SECOND LIFE"}</span>
                      {product.brand && (
                        <>
                          <span>•</span>
                          <span>{product.brand}</span>
                        </>
                      )}
                    </div>
                    <h1 className="font-headline-lg text-3xl sm:text-4xl text-primary">
                      {product.title}
                    </h1>
                    <p className="font-display-lg text-3xl text-primary pt-1">
                      {formatVND(product.price)}
                    </p>
                  </div>

                  {/* Bảng thông số chi tiết đầy đủ theo mục II.4 đặc tả */}
                  <div className="space-y-3">
                    <h2 className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                      Thông số kỹ thuật &amp; Hồ sơ món đồ
                    </h2>
                    <div className="grid grid-cols-2 gap-3 bg-surface-container-low p-5 border border-outline-variant/40 font-body-sm">
                      <div>
                        <span className="text-on-surface-variant block">Mã sản phẩm:</span>
                        <strong className="text-primary">#{product.product_code}</strong>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Trạng thái:</span>
                        <strong className="text-primary">
                          {PRODUCT_STATUS_LABELS[product.status]}
                        </strong>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Thương hiệu gốc:</span>
                        <strong className="text-primary">
                          {product.brand || "Đang cập nhật"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Danh mục:</span>
                        <strong className="text-primary">
                          {product.categories?.name || "Tuyển chọn"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Kích thước (Size):</span>
                        <strong className="text-primary">{product.size || "Freesize"}</strong>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Chất liệu:</span>
                        <strong className="text-primary">
                          {product.material || "Sợi tự nhiên"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Tình trạng:</span>
                        <strong className="text-primary">
                          {product.condition_label || "Đã kiểm định"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Màu sắc:</span>
                        <strong className="text-primary">
                          {product.color || "Nguyên bản"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Mô tả và đặc điểm sản phẩm */}
                  {product.description && (
                    <div className="space-y-2">
                      <h2 className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                        Mô tả &amp; Đặc điểm sản phẩm
                      </h2>
                      <div className="font-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">
                        {product.description}
                      </div>
                    </div>
                  )}

                  {product.curator_note && (
                    <div className="p-5 bg-surface-container-low border-l-2 border-primary space-y-1">
                      <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Ghi chú thẩm định từ AGAIN STORE</span>
                      </span>
                      <p className="font-body-sm text-primary italic">{product.curator_note}</p>
                    </div>
                  )}

                  {/* Chức năng: Liên hệ để hỏi thông tin sản phẩm (không tích hợp giỏ hàng/checkout) */}
                  <div className="bg-surface-container-high p-6 lg:p-8 border border-outline-variant/60 space-y-5">
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <h3 className="font-headline-sm text-xl text-primary">
                        Liên hệ hỏi thông tin sản phẩm
                      </h3>
                    </div>

                    {sentSuccess ? (
                      <div className="p-6 bg-surface border border-secondary space-y-2 text-center">
                        <CheckCircle2 className="w-8 h-8 text-primary mx-auto" />
                        <p className="font-headline-sm text-lg text-primary">
                          Đã gửi yêu cầu hỏi thông tin sản phẩm!
                        </p>
                        <p className="font-body-sm text-on-surface-variant">
                          Nhân viên AGAIN STORE sẽ liên hệ lại với bạn qua số điện thoại {phone} để tư vấn chi tiết về mã #{product.product_code}.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleInquirySubmit} className="space-y-4">
                        {formError && (
                          <p className="p-3 bg-error-container text-on-error-container font-body-sm">
                            {formError}
                          </p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Họ và tên của bạn *"
                            className="px-4 py-3 bg-surface border border-outline-variant focus:border-primary focus:outline-none font-body-sm"
                          />
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Số điện thoại liên hệ *"
                            className="px-4 py-3 bg-surface border border-outline-variant focus:border-primary focus:outline-none font-body-sm"
                          />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email (không bắt buộc)"
                          className="w-full px-4 py-3 bg-surface border border-outline-variant focus:border-primary focus:outline-none font-body-sm"
                        />
                        <textarea
                          rows={3}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={`Câu hỏi của bạn về sản phẩm ${product.title} (số đo chi tiết, đặt lịch thử đồ tại cửa hàng...)`}
                          className="w-full px-4 py-3 bg-surface border border-outline-variant focus:border-primary focus:outline-none font-body-sm"
                        />
                        <button
                          type="submit"
                          disabled={sending}
                          className="w-full py-4 bg-primary text-surface-container-lowest font-label-md text-label-md uppercase tracking-widest hover:bg-secondary transition-colors"
                        >
                          {sending ? "Đang gửi..." : "Gửi yêu cầu tư vấn sản phẩm"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>

              {/* Những món đồ đã tìm được chủ mới */}
              {rehomedProducts.length > 0 && (
                <div className="pt-12 border-t border-outline-variant/40 space-y-6">
                  <h2 className="font-headline-md text-2xl text-primary">
                    Những món đồ đã tìm được chủ mới
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {rehomedProducts.map((rp) => (
                      <Link
                        key={rp.id}
                        href={`/second-life/${rp.slug}`}
                        className="p-4 bg-surface-container-low border border-outline-variant/40 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-label-sm text-xs uppercase text-secondary">
                            #{rp.product_code}
                          </span>
                          <h3 className="font-headline-sm text-base text-primary">{rp.title}</h3>
                        </div>
                        <span className="px-2.5 py-1 bg-primary text-surface-container-lowest font-label-sm text-xs uppercase">
                          {PRODUCT_STATUS_LABELS[rp.status]}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
