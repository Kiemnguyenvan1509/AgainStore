"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Clock, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getSupabaseClient, formatVND } from "@/lib/supabase";
import type { ConsignmentRequest, Product } from "@/types/database";
import { CONSIGNMENT_STATUS_LABELS, PRODUCT_STATUS_LABELS } from "@/types/database";

function LookupContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";

  const [query, setQuery] = useState(initialCode);
  const [results, setResults] = useState<ConsignmentRequest[]>([]);
  const [linkedProducts, setLinkedProducts] = useState<Record<string, Product[]>>({});
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const performSearch = async (term: string) => {
    if (!term.trim()) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setSearching(true);
    setSearched(true);
    try {
      const clean = term.trim().replace(/^#/, "");

      // Tìm theo mã yêu cầu hoặc theo số điện thoại người gửi
      const { data: reqByCode } = await supabase
        .from("consignment_requests")
        .select("*, consignors(*), consignment_images(*), consignment_history(*)")
        .ilike("request_code", `%${clean}%`)
        .order("created_at", { ascending: false });

      let list = (reqByCode || []) as ConsignmentRequest[];

      if (list.length === 0) {
        const { data: consignorRows } = await supabase
          .from("consignors")
          .select("id")
          .ilike("phone", `%${clean}%`);

        if (consignorRows && consignorRows.length > 0) {
          const ids = consignorRows.map((c) => c.id);
          const { data: reqByPhone } = await supabase
            .from("consignment_requests")
            .select("*, consignors(*), consignment_images(*), consignment_history(*)")
            .in("consignor_id", ids)
            .order("created_at", { ascending: false });
          list = (reqByPhone || []) as ConsignmentRequest[];
        }
      }

      setResults(list);

      if (list.length > 0) {
        const reqIds = list.map((r) => r.id);
        const { data: prods } = await supabase
          .from("products")
          .select("*")
          .in("consignment_request_id", reqIds);

        const prodMap: Record<string, Product[]> = {};
        (prods || []).forEach((p: Product) => {
          const key = p.consignment_request_id || "";
          if (!prodMap[key]) prodMap[key] = [];
          prodMap[key].push(p);
        });
        setLinkedProducts(prodMap);
      }
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      performSearch(initialCode);
    }
  }, [initialCode]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-10">
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
          CONSIGNOR PORTAL • TRA CỨU HỒ SƠ
        </span>
        <h1 className="font-headline-lg text-3xl sm:text-4xl text-primary">
          Tra cứu trạng thái yêu cầu ký gửi
        </h1>
        <p className="font-body-md text-on-surface-variant">
          Nhập Mã yêu cầu ký gửi (ví dụ: CR-2026-1234) hoặc Số điện thoại đăng ký để xem tiến độ xử lý và các sản phẩm liên kết.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          performSearch(query);
        }}
        className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập mã yêu cầu (CR-...) hoặc số điện thoại..."
          className="flex-1 px-4 py-3.5 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-md"
        />
        <button
          type="submit"
          disabled={searching}
          className="px-8 py-3.5 bg-primary text-surface-container-lowest font-label-md text-label-md uppercase tracking-widest inline-flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          <span>{searching ? "Đang tìm..." : "Tra cứu"}</span>
        </button>
      </form>

      {searched && results.length === 0 && !searching && (
        <div className="p-10 bg-surface-container-low border border-outline-variant/50 text-center space-y-2">
          <p className="font-headline-sm text-lg text-primary">
            Không tìm thấy hồ sơ ký gửi phù hợp với &ldquo;{query}&rdquo;
          </p>
          <p className="font-body-sm text-on-surface-variant">
            Vui lòng kiểm tra lại mã yêu cầu hoặc số điện thoại đã dùng khi đăng ký.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {results.map((req) => (
          <div
            key={req.id}
            className="bg-surface-container-low border border-outline-variant/60 p-6 lg:p-8 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/40">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                  MÃ YÊU CẦU KÝ GỬI
                </span>
                <h2 className="font-headline-md text-2xl text-primary">#{req.request_code}</h2>
                <p className="font-body-sm text-on-surface-variant">
                  Người gửi: <strong>{req.consignors?.full_name}</strong> ({req.consignors?.phone}) • Ngày gửi:{" "}
                  {new Date(req.created_at).toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="px-4 py-2 bg-primary text-surface-container-lowest font-label-md text-label-md uppercase tracking-wider self-start">
                {CONSIGNMENT_STATUS_LABELS[req.status]}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-body-sm">
              <div className="p-4 bg-surface border border-outline-variant/30">
                <span className="text-on-surface-variant block">Nhóm sản phẩm:</span>
                <strong className="text-primary">{req.category_name}</strong>
              </div>
              <div className="p-4 bg-surface border border-outline-variant/30">
                <span className="text-on-surface-variant block">Số lượng đăng ký:</span>
                <strong className="text-primary">{req.quantity} sản phẩm</strong>
              </div>
              <div className="p-4 bg-surface border border-outline-variant/30">
                <span className="text-on-surface-variant block">Tình trạng khai báo:</span>
                <strong className="text-primary">{req.condition_status}</strong>
              </div>
            </div>

            {/* Lịch sử xử lý yêu cầu (consignment_history) */}
            {req.consignment_history && req.consignment_history.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                  Lịch sử thay đổi trạng thái
                </h3>
                <div className="space-y-2">
                  {req.consignment_history.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-start gap-3 p-3 bg-surface border border-outline-variant/30 font-body-sm"
                    >
                      <Clock className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-primary">
                          {CONSIGNMENT_STATUS_LABELS[h.new_status as keyof typeof CONSIGNMENT_STATUS_LABELS] ||
                            h.new_status}
                        </span>
                        {h.note && <span className="text-on-surface-variant"> — {h.note}</span>}
                        <span className="block text-xs text-on-surface-variant">
                          {new Date(h.created_at).toLocaleString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sản phẩm đã tạo từ yêu cầu ký gửi này */}
            {linkedProducts[req.id] && linkedProducts[req.id].length > 0 && (
              <div className="space-y-3 pt-2 border-t border-outline-variant/40">
                <h3 className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                  Sản phẩm đã lên kệ từ hồ sơ này ({linkedProducts[req.id].length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {linkedProducts[req.id].map((prod) => (
                    <Link
                      key={prod.id}
                      href={`/second-life/${prod.slug}`}
                      className="p-4 bg-surface border border-outline-variant/40 flex items-center justify-between hover:border-primary"
                    >
                      <div>
                        <span className="font-label-sm text-xs text-secondary uppercase">
                          #{prod.product_code} • {PRODUCT_STATUS_LABELS[prod.status]}
                        </span>
                        <h4 className="font-headline-sm text-base text-primary">{prod.title}</h4>
                        <p className="font-body-sm text-primary font-medium">
                          {formatVND(prod.price)}
                        </p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-secondary" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ConsignmentLookupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <SiteHeader />
      <main className="w-full pt-28 flex-1">
        <Suspense fallback={<div className="p-16 text-center">Đang tải...</div>}>
          <LookupContent />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
