"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight, Clock } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSupabaseClient } from "@/lib/supabase";
import type { ConsignmentRequest, ConsignmentHistory } from "@/types/database";
import { CONSIGNMENT_STATUS_LABELS } from "@/types/database";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    todayRequests: 0,
    processingRequests: 0,
    displayingProducts: 0,
    rehomedProducts: 0,
    totalArticles: 0,
    totalEvents: 0,
  });
  const [recentRequests, setRecentRequests] = useState<ConsignmentRequest[]>([]);
  const [recentHistory, setRecentHistory] = useState<ConsignmentHistory[]>([]);
  const [dailySeries, setDailySeries] = useState<Array<{ label: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const [
          { count: totalRequests },
          { count: todayRequests },
          { count: processingRequests },
          { count: displayingProducts },
          { count: rehomedProducts },
          { count: totalArticles },
          { count: totalEvents },
          { data: reqRows },
          { data: histRows },
        ] = await Promise.all([
          supabase.from("consignment_requests").select("*", { count: "exact", head: true }),
          supabase
            .from("consignment_requests")
            .select("*", { count: "exact", head: true })
            .gte("created_at", startOfToday.toISOString()),
          supabase
            .from("consignment_requests")
            .select("*", { count: "exact", head: true })
            .in("status", ["pending_confirmation", "confirmed", "receiving", "inspecting"]),
          supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("status", "displaying"),
          supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .in("status", ["reserved", "completed"]),
          supabase.from("articles").select("*", { count: "exact", head: true }),
          supabase.from("events").select("*", { count: "exact", head: true }),
          supabase
            .from("consignment_requests")
            .select("*, consignors(*)")
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("consignment_history")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(8),
        ]);

        setMetrics({
          totalRequests: totalRequests || 0,
          todayRequests: todayRequests || 0,
          processingRequests: processingRequests || 0,
          displayingProducts: displayingProducts || 0,
          rehomedProducts: rehomedProducts || 0,
          totalArticles: totalArticles || 0,
          totalEvents: totalEvents || 0,
        });

        const reqList = (reqRows || []) as ConsignmentRequest[];
        setRecentRequests(reqList);
        setRecentHistory((histRows || []) as ConsignmentHistory[]);

        // Tính biểu đồ yêu cầu ký gửi 7 ngày gần nhất từ dữ liệu thực
        const days: Array<{ label: string; dateStr: string; count: number }> = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().slice(0, 10);
          const label = `${d.getDate()}/${d.getMonth() + 1}`;
          days.push({ label, dateStr, count: 0 });
        }
        reqList.forEach((r) => {
          const dStr = r.created_at.slice(0, 10);
          const found = days.find((item) => item.dateStr === dStr);
          if (found) found.count += 1;
        });
        setDailySeries(days.map(({ label, count }) => ({ label, count })));
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const maxCount = Math.max(...dailySeries.map((d) => d.count), 1);

  return (
    <AdminShell
      title="1. Dashboard – Tổng quan vận hành"
      subtitle="Hiển thị đầy đủ 7 chỉ số trọng tâm và biểu đồ yêu cầu ký gửi theo thời gian thực từ Supabase."
      actions={
        <>
          <Link
            href="/admin/consignments"
            className="px-4 py-2.5 bg-surface border border-primary text-primary font-label-sm text-label-sm uppercase tracking-wider"
          >
            Xử lý ký gửi
          </Link>
          <Link
            href="/admin/products"
            className="px-4 py-2.5 bg-primary text-surface-container-lowest font-label-sm text-label-sm uppercase tracking-wider inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm sản phẩm</span>
          </Link>
        </>
      }
    >
      {/* 7 Chỉ số bắt buộc theo mục III.1 File Đặc Tả */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 bg-surface-container-low border border-outline-variant/50 space-y-1">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
            01 / TỔNG YÊU CẦU KÝ GỬI
          </span>
          <p className="font-display-lg text-4xl text-primary">{metrics.totalRequests}</p>
          <span className="font-body-sm text-xs text-on-surface-variant block">
            Toàn bộ hồ sơ trong hệ thống
          </span>
        </div>

        <div className="p-6 bg-surface-container-low border border-outline-variant/50 space-y-1">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
            02 / YÊU CẦU MỚI TRONG NGÀY
          </span>
          <p className="font-display-lg text-4xl text-primary">{metrics.todayRequests}</p>
          <span className="font-body-sm text-xs text-on-surface-variant block">
            Hồ sơ gửi từ 00:00 hôm nay
          </span>
        </div>

        <div className="p-6 bg-surface-container-low border border-outline-variant/50 space-y-1">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
            03 / YÊU CẦU ĐANG XỬ LÝ
          </span>
          <p className="font-display-lg text-4xl text-primary">{metrics.processingRequests}</p>
          <span className="font-body-sm text-xs text-on-surface-variant block">
            Chờ xác nhận / Đang tiếp nhận &amp; kiểm tra
          </span>
        </div>

        <div className="p-6 bg-surface-container-low border border-outline-variant/50 space-y-1">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
            04 / SẢN PHẨM ĐANG TRƯNG BÀY
          </span>
          <p className="font-display-lg text-4xl text-primary">{metrics.displayingProducts}</p>
          <span className="font-body-sm text-xs text-on-surface-variant block">
            Đang hiển thị trên Second Life
          </span>
        </div>

        <div className="p-6 bg-surface-container-low border border-outline-variant/50 space-y-1">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
            05 / ĐÃ TÌM ĐƯỢC CHỦ MỚI
          </span>
          <p className="font-display-lg text-4xl text-primary">{metrics.rehomedProducts}</p>
          <span className="font-body-sm text-xs text-on-surface-variant block">
            Đã có người nhận / Đã hoàn tất
          </span>
        </div>

        <div className="p-6 bg-surface-container-low border border-outline-variant/50 space-y-1">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
            06 / TỔNG SỐ BÀI VIẾT JOURNAL
          </span>
          <p className="font-display-lg text-4xl text-primary">{metrics.totalArticles}</p>
          <span className="font-body-sm text-xs text-on-surface-variant block">
            Tin tức &amp; kiến thức thời trang
          </span>
        </div>

        <div className="p-6 bg-surface-container-low border border-outline-variant/50 space-y-1 sm:col-span-2">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
            07 / SỐ LƯỢNG HOẠT ĐỘNG CỘNG ĐỒNG
          </span>
          <p className="font-display-lg text-4xl text-primary">{metrics.totalEvents}</p>
          <span className="font-body-sm text-xs text-on-surface-variant block">
            Sự kiện đổi đồ (Clothing Swap), quyên góp (Donation) và Workshop
          </span>
        </div>
      </div>

      {/* Biểu đồ yêu cầu ký gửi theo thời gian & Nhật ký hoạt động */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-surface-container-low border border-outline-variant/50 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                VISUAL ANALYTICS
              </span>
              <h2 className="font-headline-sm text-xl text-primary">
                Biểu đồ yêu cầu ký gửi 7 ngày gần nhất
              </h2>
            </div>
          </div>

          <div className="h-56 flex items-end justify-between gap-4 pt-8 px-4 border-b border-outline-variant/40">
            {dailySeries.map((item) => {
              const heightPercent = Math.round((item.count / maxCount) * 100);
              return (
                <div
                  key={item.label}
                  className="flex-1 flex flex-col items-center justify-end gap-2 h-full"
                >
                  <span className="font-label-sm text-xs text-primary">{item.count}</span>
                  <div
                    className="w-full bg-primary transition-all"
                    style={{ height: `${Math.max(heightPercent, 6)}%` }}
                  />
                  <span className="font-label-sm text-xs text-on-surface-variant pb-2">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-surface-container-low border border-outline-variant/50 p-6 space-y-4">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
            AUDIT LOG • NHẬT KÝ HOẠT ĐỘNG
          </span>
          <h2 className="font-headline-sm text-xl text-primary">
            Lịch sử xử lý trạng thái gần nhất
          </h2>

          {recentHistory.length === 0 ? (
            <p className="font-body-sm text-on-surface-variant py-8">
              Chưa có lịch sử thao tác nào trong bảng consignment_history.
            </p>
          ) : (
            <div className="space-y-3">
              {recentHistory.map((h) => (
                <div
                  key={h.id}
                  className="p-3 bg-surface border border-outline-variant/30 flex items-start gap-3 font-body-sm"
                >
                  <Clock className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-primary">
                      {CONSIGNMENT_STATUS_LABELS[
                        h.new_status as keyof typeof CONSIGNMENT_STATUS_LABELS
                      ] || h.new_status}
                    </span>
                    {h.note && <p className="text-on-surface-variant text-xs">{h.note}</p>}
                    <span className="text-[11px] text-on-surface-variant">
                      {new Date(h.created_at).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bảng yêu cầu ký gửi mới nhất */}
      <div className="bg-surface-container-low border border-outline-variant/50 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-sm text-xl text-primary">
            Yêu cầu ký gửi mới gần nhất ({recentRequests.length})
          </h2>
          <Link
            href="/admin/consignments"
            className="inline-flex items-center gap-1 font-label-sm text-label-sm uppercase tracking-wider text-primary underline"
          >
            <span>Quản lý tất cả yêu cầu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <p className="font-body-sm text-on-surface-variant py-6">Đang tải dữ liệu...</p>
        ) : recentRequests.length === 0 ? (
          <p className="font-body-sm text-on-surface-variant py-6">
            Chưa có yêu cầu ký gửi nào trong bảng consignment_requests.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary text-surface-container-lowest font-label-sm text-label-sm uppercase">
                  <th className="p-3.5">Mã yêu cầu</th>
                  <th className="p-3.5">Người gửi</th>
                  <th className="p-3.5">Điện thoại</th>
                  <th className="p-3.5">Nhóm sản phẩm</th>
                  <th className="p-3.5">Số lượng</th>
                  <th className="p-3.5">Ngày đăng ký</th>
                  <th className="p-3.5">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 bg-surface font-body-sm">
                {recentRequests.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3.5 font-medium text-primary">#{r.request_code}</td>
                    <td className="p-3.5">{r.consignors?.full_name || "—"}</td>
                    <td className="p-3.5">{r.consignors?.phone || "—"}</td>
                    <td className="p-3.5">{r.category_name}</td>
                    <td className="p-3.5">{r.quantity}</td>
                    <td className="p-3.5">
                      {new Date(r.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 bg-secondary-container text-on-secondary-container font-label-sm text-xs uppercase">
                        {CONSIGNMENT_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
