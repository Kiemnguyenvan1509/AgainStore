"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  CONSIGNMENT_STATUS_LABELS,
  ConsignmentRequest,
  ConsignmentStatus,
  UserProfile,
} from "@/types/database";

const ALL_STATUSES: ConsignmentStatus[] = [
  "pending_confirmation",
  "confirmed",
  "receiving",
  "inspecting",
  "approved",
  "rejected",
];

export default function AdminConsignmentsPage() {
  const configured = isSupabaseConfigured();
  const [requests, setRequests] = useState<ConsignmentRequest[]>([]);
  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Selected request for right-side inspection panel
  const [selectedRequest, setSelectedRequest] =
    useState<ConsignmentRequest | null>(null);
  const [newStatus, setNewStatus] = useState<ConsignmentStatus>(
    "pending_confirmation"
  );
  const [internalNote, setInternalNote] = useState("");
  const [assignedStaffId, setAssignedStaffId] = useState<string>("");
  const [historyNote, setHistoryNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal to create walk-in consignment at showroom
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    category_name: "Đầm / Váy Thiết Kế",
    brand_name: "",
    quantity: 1,
    condition_status: "Mới 95% - Không lỗi",
    customer_note: "",
  });

  const fetchData = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [reqRes, staffRes] = await Promise.all([
        supabase
          .from("consignment_requests")
          .select(
            "*, consignors(*), consignment_images(*), consignment_history(*), users(*)"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("users")
          .select("*, roles(*)")
          .eq("is_active", true)
          .order("full_name", { ascending: true }),
      ]);

      if (reqRes.data) {
        const list = reqRes.data as ConsignmentRequest[];
        setRequests(list);
        if (selectedRequest) {
          const updated = list.find((r) => r.id === selectedRequest.id);
          if (updated) {
            setSelectedRequest(updated);
          }
        } else if (list.length > 0) {
          setSelectedRequest(list[0]);
          setNewStatus(list[0].status);
          setInternalNote(list[0].internal_note || "");
          setAssignedStaffId(list[0].assigned_staff_id || "");
        }
      }
      if (staffRes.data) {
        setStaffList(staffRes.data as UserProfile[]);
      }
    } finally {
      setLoading(false);
    }
  }, [configured, selectedRequest]);

  useEffect(() => {
    fetchData();
  }, [configured]);

  const handleSelectRequest = (req: ConsignmentRequest) => {
    setSelectedRequest(req);
    setNewStatus(req.status);
    setInternalNote(req.internal_note || "");
    setAssignedStaffId(req.assigned_staff_id || "");
    setHistoryNote("");
    setFeedback(null);
  };

  const handleUpdateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !configured) return;
    setSaving(true);
    setFeedback(null);

    try {
      const oldStatus = selectedRequest.status;
      const { error: updateErr } = await supabase
        .from("consignment_requests")
        .update({
          status: newStatus,
          internal_note: internalNote || null,
          assigned_staff_id: assignedStaffId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedRequest.id);

      if (updateErr) throw updateErr;

      if (oldStatus !== newStatus || historyNote.trim()) {
        await supabase.from("consignment_history").insert({
          consignment_request_id: selectedRequest.id,
          old_status: oldStatus,
          new_status: newStatus,
          note:
            historyNote.trim() ||
            `Cập nhật trạng thái sang ${CONSIGNMENT_STATUS_LABELS[newStatus]}`,
        });
      }

      setFeedback("Đã lưu cập nhật hồ sơ ký gửi thành công.");
      setHistoryNote("");
      await fetchData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Không thể cập nhật yêu cầu.";
      setFeedback(`Lỗi: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) return;
    setSaving(true);
    try {
      const { data: consignorData, error: consignorErr } = await supabase
        .from("consignors")
        .insert({
          full_name: walkInForm.full_name.trim(),
          phone: walkInForm.phone.trim(),
          email: walkInForm.email.trim() || null,
        })
        .select()
        .single();

      if (consignorErr) throw consignorErr;

      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");
      const requestCode = `AG-${datePart}-${randomDigits}`;

      const { data: reqData, error: reqErr } = await supabase
        .from("consignment_requests")
        .insert({
          request_code: requestCode,
          consignor_id: consignorData.id,
          category_name: walkInForm.category_name,
          brand_name: walkInForm.brand_name.trim() || null,
          quantity: Number(walkInForm.quantity) || 1,
          condition_status: walkInForm.condition_status,
          customer_note: walkInForm.customer_note.trim() || null,
          status: "receiving",
          agreed_policy: true,
        })
        .select()
        .single();

      if (reqErr) throw reqErr;

      await supabase.from("consignment_history").insert({
        consignment_request_id: reqData.id,
        old_status: null,
        new_status: "receiving",
        note: "Tạo phiếu tiếp nhận trực tiếp tại Showroom",
      });

      setShowCreateModal(false);
      setWalkInForm({
        full_name: "",
        phone: "",
        email: "",
        category_name: "Đầm / Váy Thiết Kế",
        brand_name: "",
        quantity: 1,
        condition_status: "Mới 95% - Không lỗi",
        customer_note: "",
      });
      await fetchData();
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : "Lỗi khi tạo phiếu ký gửi mới"
      );
    } finally {
      setSaving(false);
    }
  };

  // Filtered requests
  const filteredRequests = requests.filter((req) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      req.request_code.toLowerCase().includes(q) ||
      (req.consignors?.full_name || "").toLowerCase().includes(q) ||
      (req.consignors?.phone || "").toLowerCase().includes(q) ||
      (req.brand_name || "").toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" || req.status === statusFilter;

    const matchesDate =
      !dateFilter || req.created_at.slice(0, 10) === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Export CSV (UTF-8 with BOM for Excel compatibility)
  const handleExportCSV = () => {
    if (filteredRequests.length === 0) return;

    const headers = [
      "Mã yêu cầu",
      "Tên người gửi",
      "Số điện thoại",
      "Email",
      "Ngày đăng ký",
      "Số lượng",
      "Nhóm sản phẩm",
      "Thương hiệu",
      "Tình trạng mô tả",
      "Trạng thái xử lý",
      "Nhân viên phụ trách",
      "Ghi chú nội bộ",
    ];

    const rows = filteredRequests.map((r) => [
      r.request_code,
      r.consignors?.full_name || "",
      r.consignors?.phone || "",
      r.consignors?.email || "",
      new Date(r.created_at).toLocaleString("vi-VN"),
      String(r.quantity),
      r.category_name,
      r.brand_name || "",
      r.condition_status,
      CONSIGNMENT_STATUS_LABELS[r.status],
      r.users?.full_name || "Chưa phân công",
      (r.internal_note || "").replace(/\r?\n/g, " "),
    ]);

    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `again-store-ky-gui-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell
      title="Quản lý yêu cầu ký gửi"
      subtitle="Luồng 1 (Consignment Intake): Tiếp nhận, kiểm định, cập nhật 6 trạng thái và bàn giao sang kho Second Life."
    >
      {/* Top Action Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant/25 p-5 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo Mã, Tên KH, SĐT..."
            className="bg-surface border border-outline-variant/40 px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-outline-variant/40 px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary"
          >
            <option value="all">Tất cả trạng thái (6 bước)</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {CONSIGNMENT_STATUS_LABELS[st]}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-surface border border-outline-variant/40 px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredRequests.length === 0}
            className="border border-primary text-primary px-4 py-2.5 text-xs uppercase tracking-widest font-semibold hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-40"
          >
            Xuất Excel / CSV ({filteredRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            disabled={!configured}
            className="bg-primary text-on-primary px-4 py-2.5 text-xs uppercase tracking-widest font-semibold hover:bg-primary-container transition-colors disabled:opacity-40"
          >
            + Tiếp nhận tại Showroom
          </button>
        </div>
      </div>

      {/* Main Split View: Table + Right Inspection Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Table (7 cols) */}
        <div className="xl:col-span-7 bg-surface-container-lowest border border-outline-variant/25 overflow-hidden">
          <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
              Danh sách phiếu đăng ký ({filteredRequests.length})
            </span>
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter("")}
                className="text-xs text-primary underline"
              >
                Xóa lọc ngày
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-on-surface-variant">
              Đang tải dữ liệu yêu cầu ký gửi...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-serif text-lg text-primary mb-2">
                Chưa có phiếu yêu cầu ký gửi nào
              </p>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                Khi khách hàng gửi biểu mẫu tại trang{" "}
                <Link href="/dich-vu-ky-gui" className="underline text-primary">
                  /dich-vu-ky-gui
                </Link>{" "}
                hoặc nhân viên tạo phiếu tiếp nhận tại Showroom, dữ liệu sẽ hiển
                thị tại đây.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/25 bg-surface-container-low text-[10px] uppercase tracking-widest text-on-surface-variant">
                    <th className="py-3 px-4">Mã YC</th>
                    <th className="py-3 px-4">Người gửi / SĐT</th>
                    <th className="py-3 px-4">Nhóm SP & SL</th>
                    <th className="py-3 px-4">Ngày ĐK</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Phụ trách</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 text-xs">
                  {filteredRequests.map((req) => {
                    const isSelected = selectedRequest?.id === req.id;
                    return (
                      <tr
                        key={req.id}
                        onClick={() => handleSelectRequest(req)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-secondary-fixed/40"
                            : "hover:bg-surface-container-low/60"
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-semibold text-primary">
                          {req.request_code}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-on-surface">
                            {req.consignors?.full_name || "Khách hàng"}
                          </div>
                          <div className="text-on-surface-variant">
                            {req.consignors?.phone || "—"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-on-surface">
                            {req.category_name}
                          </div>
                          <div className="text-on-surface-variant">
                            SL: {req.quantity} món
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant">
                          {new Date(req.created_at).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider bg-surface-container-high text-primary font-medium">
                            {CONSIGNMENT_STATUS_LABELS[req.status]}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant">
                          {req.users?.full_name || "Chưa gán"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Inspection Panel (5 cols) */}
        <div className="xl:col-span-5 bg-surface-container-lowest border border-outline-variant/25 p-6">
          {!selectedRequest ? (
            <div className="py-16 text-center text-sm text-on-surface-variant">
              Chọn một phiếu yêu cầu ký gửi ở bảng bên trái để kiểm định chi
              tiết, xem ảnh và cập nhật trạng thái.
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between border-b border-outline-variant/20 pb-4 mb-5">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-secondary font-semibold block">
                    Hồ sơ kiểm định ký gửi
                  </span>
                  <h2 className="font-serif text-2xl text-primary mt-0.5">
                    {selectedRequest.request_code}
                  </h2>
                </div>
                {selectedRequest.status === "approved" && (
                  <Link
                    href={`/admin/products?from_request=${selectedRequest.id}`}
                    className="bg-primary text-on-primary px-3.5 py-2 text-[11px] uppercase tracking-widest font-semibold hover:bg-primary-container transition-colors"
                  >
                    + Tạo SP Second Life
                  </Link>
                )}
              </div>

              {/* Customer & Item summary */}
              <div className="grid grid-cols-2 gap-4 bg-surface-container-low p-4 mb-5 text-xs">
                <div>
                  <span className="text-on-surface-variant block mb-0.5">
                    Khách hàng ký gửi
                  </span>
                  <p className="font-semibold text-on-surface">
                    {selectedRequest.consignors?.full_name || "—"}
                  </p>
                  <p className="text-on-surface-variant">
                    {selectedRequest.consignors?.phone}
                  </p>
                  {selectedRequest.consignors?.email && (
                    <p className="text-on-surface-variant">
                      {selectedRequest.consignors.email}
                    </p>
                  )}
                </div>
                <div>
                  <span className="text-on-surface-variant block mb-0.5">
                    Thông tin món đồ
                  </span>
                  <p className="font-semibold text-on-surface">
                    {selectedRequest.category_name} (SL:{" "}
                    {selectedRequest.quantity})
                  </p>
                  <p className="text-on-surface-variant">
                    Thương hiệu: {selectedRequest.brand_name || "Không rõ"}
                  </p>
                  <p className="text-on-surface-variant">
                    Tình trạng: {selectedRequest.condition_status}
                  </p>
                </div>
                {selectedRequest.customer_note && (
                  <div className="col-span-2 pt-2 border-t border-outline-variant/20">
                    <span className="text-on-surface-variant block mb-0.5">
                      Lời nhắn của khách hàng:
                    </span>
                    <p className="italic text-on-surface">
                      &ldquo;{selectedRequest.customer_note}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Customer Uploaded Images */}
              <div className="mb-5">
                <h3 className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold mb-2.5">
                  Hình ảnh khách gửi (
                  {selectedRequest.consignment_images?.length || 0})
                </h3>
                {selectedRequest.consignment_images &&
                selectedRequest.consignment_images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2.5">
                    {selectedRequest.consignment_images.map((img) => (
                      <a
                        key={img.id}
                        href={img.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block border border-outline-variant/30 bg-surface aspect-square overflow-hidden relative group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.image_url}
                          alt={img.angle_label || "Consignment"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {img.angle_label && (
                          <span className="absolute bottom-0 inset-x-0 bg-primary/80 text-on-primary text-[10px] px-1.5 py-0.5 truncate">
                            {img.angle_label}
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-on-surface-variant bg-surface-container-low p-3">
                    Khách hàng không đính kèm URL hình ảnh trực tuyến.
                  </p>
                )}
              </div>

              {/* Update Status & Internal Notes Form */}
              <form onSubmit={handleUpdateRequest} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-semibold mb-1.5">
                    Trạng thái xử lý (6 bước chuẩn)
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) =>
                      setNewStatus(e.target.value as ConsignmentStatus)
                    }
                    className="w-full bg-surface border border-outline-variant/40 px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary"
                  >
                    {ALL_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {CONSIGNMENT_STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-semibold mb-1.5">
                    Nhân viên phụ trách
                  </label>
                  <select
                    value={assignedStaffId}
                    onChange={(e) => setAssignedStaffId(e.target.value)}
                    className="w-full bg-surface border border-outline-variant/40 px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="">-- Chưa phân công --</option>
                    {staffList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-semibold mb-1.5">
                    Ghi chú nội bộ (Chỉ Admin/Staff thấy)
                  </label>
                  <textarea
                    rows={2}
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Ghi chú kết quả kiểm định chất liệu, mức giá đề xuất..."
                    className="w-full bg-surface border border-outline-variant/40 p-3 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-semibold mb-1.5">
                    Ghi chú lịch sử chuyển trạng thái (Hiển thị khi KH tra cứu)
                  </label>
                  <input
                    type="text"
                    value={historyNote}
                    onChange={(e) => setHistoryNote(e.target.value)}
                    placeholder="VD: Đã nhận 3 sản phẩm tại Showroom Thảo Điền..."
                    className="w-full bg-surface border border-outline-variant/40 px-3.5 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                {feedback && (
                  <div className="p-3 bg-secondary-fixed/50 text-primary text-xs font-medium">
                    {feedback}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-primary text-on-primary py-3 text-xs uppercase tracking-widest font-semibold hover:bg-primary-container transition-colors disabled:opacity-50"
                  >
                    {saving ? "Đang lưu..." : "Lưu cập nhật hồ sơ"}
                  </button>
                  <Link
                    href={`/admin/products?from_request=${selectedRequest.id}`}
                    className="border border-primary text-primary px-4 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-primary hover:text-on-primary transition-colors text-center"
                  >
                    Tạo SP từ phiếu này
                  </Link>
                </div>
              </form>

              {/* History Timeline */}
              {selectedRequest.consignment_history &&
                selectedRequest.consignment_history.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-outline-variant/20">
                    <h4 className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold mb-3">
                      Nhật ký xử lý ({selectedRequest.consignment_history.length}
                      )
                    </h4>
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {selectedRequest.consignment_history.map((h) => (
                        <div
                          key={h.id}
                          className="text-xs bg-surface-container-low p-2.5 border-l-2 border-primary"
                        >
                          <div className="flex justify-between font-medium text-primary">
                            <span>
                              {CONSIGNMENT_STATUS_LABELS[
                                h.new_status as ConsignmentStatus
                              ] || h.new_status}
                            </span>
                            <span className="text-[10px] text-on-surface-variant">
                              {new Date(h.created_at).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          {h.note && (
                            <p className="text-on-surface-variant mt-0.5">
                              {h.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Walk-In Consignment Request */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface max-w-lg w-full p-6 border border-outline-variant/30">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3 mb-4">
              <h3 className="font-serif text-xl text-primary">
                Tiếp nhận ký gửi trực tiếp tại Showroom
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-sm text-on-surface-variant hover:text-primary"
              >
                Đóng [X]
              </button>
            </div>
            <form onSubmit={handleCreateWalkIn} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant mb-1">
                    Họ tên khách hàng *
                  </label>
                  <input
                    required
                    type="text"
                    value={walkInForm.full_name}
                    onChange={(e) =>
                      setWalkInForm({ ...walkInForm, full_name: e.target.value })
                    }
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    required
                    type="tel"
                    value={walkInForm.phone}
                    onChange={(e) =>
                      setWalkInForm({ ...walkInForm, phone: e.target.value })
                    }
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant mb-1">
                    Nhóm sản phẩm *
                  </label>
                  <input
                    required
                    type="text"
                    value={walkInForm.category_name}
                    onChange={(e) =>
                      setWalkInForm({
                        ...walkInForm,
                        category_name: e.target.value,
                      })
                    }
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant mb-1">
                    Số lượng món *
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={walkInForm.quantity}
                    onChange={(e) =>
                      setWalkInForm({
                        ...walkInForm,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant mb-1">
                    Thương hiệu
                  </label>
                  <input
                    type="text"
                    value={walkInForm.brand_name}
                    onChange={(e) =>
                      setWalkInForm({
                        ...walkInForm,
                        brand_name: e.target.value,
                      })
                    }
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant mb-1">
                    Tình trạng sơ bộ *
                  </label>
                  <input
                    required
                    type="text"
                    value={walkInForm.condition_status}
                    onChange={(e) =>
                      setWalkInForm({
                        ...walkInForm,
                        condition_status: e.target.value,
                      })
                    }
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-on-surface-variant mb-1">
                  Ghi chú tiếp nhận
                </label>
                <textarea
                  rows={2}
                  value={walkInForm.customer_note}
                  onChange={(e) =>
                    setWalkInForm({
                      ...walkInForm,
                      customer_note: e.target.value,
                    })
                  }
                  className="w-full bg-surface-container-lowest border border-outline-variant/40 p-3"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-outline-variant/40 text-xs uppercase tracking-widest"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-primary text-on-primary text-xs uppercase tracking-widest font-semibold"
                >
                  {saving ? "Đang tạo..." : "Tạo phiếu tiếp nhận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
