"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { CommunityEvent, EventStatus, Partner } from "@/types/database";

interface EventRegistrationRow {
  id: string;
  event_id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  note?: string | null;
  created_at: string;
  events?: { title: string } | null;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCommunityPage() {
  const configured = isSupabaseConfigured();
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistrationRow[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Event form
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    slug: "",
    event_type: "Workshop",
    description: "",
    thumbnail_url: "",
    event_date: "",
    location: "Showroom Again Store, Thảo Điền, TP.HCM",
    partner_id: "",
    status: "upcoming" as EventStatus,
    allow_registration: true,
    max_participants: 30,
  });

  // Partner form
  const [partnerForm, setPartnerForm] = useState({
    name: "",
    website_url: "",
    description: "",
  });

  const fetchData = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [evRes, partRes, regRes] = await Promise.all([
        supabase
          .from("events")
          .select("*, partners(*)")
          .order("created_at", { ascending: false }),
        supabase
          .from("partners")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase
          .from("event_registrations")
          .select("*, events(title)")
          .order("created_at", { ascending: false }),
      ]);
      if (evRes.data) setEvents(evRes.data as CommunityEvent[]);
      if (partRes.data) setPartners(partRes.data as Partner[]);
      if (regRes.data)
        setRegistrations(regRes.data as unknown as EventRegistrationRow[]);
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) return;
    setSaving(true);
    setFeedback(null);

    try {
      const payload = {
        title: eventForm.title.trim(),
        slug: eventForm.slug.trim() || slugify(eventForm.title),
        event_type: eventForm.event_type,
        description: eventForm.description.trim() || null,
        thumbnail_url: eventForm.thumbnail_url.trim() || null,
        event_date: eventForm.event_date
          ? new Date(eventForm.event_date).toISOString()
          : null,
        location: eventForm.location.trim() || null,
        partner_id: eventForm.partner_id || null,
        status: eventForm.status,
        allow_registration: eventForm.allow_registration,
        max_participants: Number(eventForm.max_participants) || null,
      };

      if (editingEventId) {
        const { error } = await supabase
          .from("events")
          .update(payload)
          .eq("id", editingEventId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert(payload);
        if (error) throw error;
      }

      setEditingEventId(null);
      setEventForm({
        title: "",
        slug: "",
        event_type: "Workshop",
        description: "",
        thumbnail_url: "",
        event_date: "",
        location: "Showroom Again Store, Thảo Điền, TP.HCM",
        partner_id: "",
        status: "upcoming",
        allow_registration: true,
        max_participants: 30,
      });
      setFeedback("Đã lưu thông tin hoạt động cộng đồng thành công.");
      await fetchData();
    } catch (err: unknown) {
      setFeedback(
        `Lỗi: ${err instanceof Error ? err.message : "Không thể lưu sự kiện"}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured || !partnerForm.name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("partners").insert({
        name: partnerForm.name.trim(),
        website_url: partnerForm.website_url.trim() || null,
        description: partnerForm.description.trim() || null,
        sort_order: partners.length + 1,
        is_active: true,
      });
      if (error) throw error;
      setPartnerForm({ name: "", website_url: "", description: "" });
      setFeedback("Đã thêm đối tác đồng hành mới.");
      await fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!configured || !confirm("Xóa hoạt động cộng đồng này?")) return;
    await supabase.from("events").delete().eq("id", id);
    await fetchData();
  };

  return (
    <AdminShell
      title="Quản lý hoạt động cộng đồng & Đối tác"
      subtitle="Module 6: Quản lý Workshop, Clothing Swap, Chiến dịch quyên góp, Đối tác đồng hành và danh sách đăng ký tham gia."
    >
      {feedback && (
        <div className="p-3.5 mb-6 bg-secondary-fixed/50 text-primary text-xs font-medium border border-outline-variant/30">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Create/Edit Event + Partner Form (5 cols) */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant/25 p-6">
            <h2 className="font-serif text-xl text-primary border-b border-outline-variant/20 pb-3 mb-4">
              {editingEventId
                ? "Cập nhật sự kiện / hoạt động"
                : "Tạo hoạt động cộng đồng mới"}
            </h2>
            <form onSubmit={handleSaveEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Tên sự kiện / chiến dịch *
                </label>
                <input
                  required
                  type="text"
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm({
                      ...eventForm,
                      title: e.target.value,
                      slug: editingEventId
                        ? eventForm.slug
                        : slugify(e.target.value),
                    })
                  }
                  placeholder="VD: Workshop Khâu Tay Sashiko & Tái Sinh Denim"
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                    Loại hình hoạt động
                  </label>
                  <select
                    value={eventForm.event_type}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, event_type: e.target.value })
                    }
                    className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Clothing Swap">Đổi đồ (Clothing Swap)</option>
                    <option value="Chiến dịch">Chiến dịch cộng đồng</option>
                    <option value="Triển lãm">Triển lãm tuần hoàn</option>
                  </select>
                </div>
                <div>
                  <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                    Trạng thái (3 bước)
                  </label>
                  <select
                    value={eventForm.status}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        status: e.target.value as EventStatus,
                      })
                    }
                    className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                  >
                    <option value="upcoming">Sắp diễn ra</option>
                    <option value="ongoing">Đang diễn ra</option>
                    <option value="ended">Đã kết thúc</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                    Ngày & Giờ tổ chức
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.event_date}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, event_date: e.target.value })
                    }
                    className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                    Đối tác đồng hành
                  </label>
                  <select
                    value={eventForm.partner_id}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, partner_id: e.target.value })
                    }
                    className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                  >
                    <option value="">-- Không chọn --</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Địa điểm tổ chức
                </label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, location: e.target.value })
                  }
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Ảnh bìa sự kiện (Tải từ máy tính hoặc dán URL)
                </label>
                <div className="mb-2">
                  <ImageUploader
                    bucket="products"
                    folder="community"
                    multiple={false}
                    label="Chọn ảnh sự kiện từ máy tính"
                    onUploadSuccess={(urls) => {
                      if (urls.length > 0) {
                        setEventForm((prev) => ({
                          ...prev,
                          thumbnail_url: urls[0],
                        }));
                      }
                    }}
                  />
                </div>
                <input
                  type="url"
                  value={eventForm.thumbnail_url}
                  onChange={(e) =>
                    setEventForm({
                      ...eventForm,
                      thumbnail_url: e.target.value,
                    })
                  }
                  placeholder="https://..."
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Mô tả chương trình & Ý nghĩa cộng đồng
                </label>
                <textarea
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, description: e.target.value })
                  }
                  className="w-full bg-surface border border-outline-variant/40 p-2.5"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="allow_reg"
                  type="checkbox"
                  checked={eventForm.allow_registration}
                  onChange={(e) =>
                    setEventForm({
                      ...eventForm,
                      allow_registration: e.target.checked,
                    })
                  }
                />
                <label htmlFor="allow_reg" className="text-xs font-medium">
                  Mở cổng nhận đăng ký tham gia trực tuyến (RSVP)
                </label>
              </div>

              <button
                type="submit"
                disabled={saving || !configured}
                className="w-full bg-primary text-on-primary py-3 text-xs uppercase tracking-widest font-semibold hover:bg-primary-container transition-colors disabled:opacity-40"
              >
                {saving
                  ? "Đang lưu..."
                  : editingEventId
                  ? "Cập nhật hoạt động"
                  : "Đăng hoạt động cộng đồng"}
              </button>
            </form>
          </div>

          {/* Partner Form */}
          <div className="bg-surface-container-lowest border border-outline-variant/25 p-6">
            <h3 className="font-serif text-lg text-primary border-b border-outline-variant/20 pb-2.5 mb-4">
              Thêm đối tác đồng hành ({partners.length})
            </h3>
            <form onSubmit={handleCreatePartner} className="space-y-3 text-xs">
              <input
                required
                type="text"
                value={partnerForm.name}
                onChange={(e) =>
                  setPartnerForm({ ...partnerForm, name: e.target.value })
                }
                placeholder="Tên tổ chức / đối tác..."
                className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
              />
              <input
                type="url"
                value={partnerForm.website_url}
                onChange={(e) =>
                  setPartnerForm({
                    ...partnerForm,
                    website_url: e.target.value,
                  })
                }
                placeholder="Website đối tác (https://...)"
                className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
              />
              <button
                type="submit"
                disabled={saving || !configured}
                className="bg-secondary text-on-secondary px-4 py-2 text-xs uppercase tracking-widest font-semibold"
              >
                + Lưu đối tác
              </button>
            </form>
          </div>
        </div>

        {/* Right: Events List & RSVP Registrations (7 cols) */}
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant/25">
            <div className="p-4 border-b border-outline-variant/20">
              <span className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                Danh sách sự kiện & hoạt động ({events.length})
              </span>
            </div>
            {loading ? (
              <div className="p-10 text-center text-sm text-on-surface-variant">
                Đang tải hoạt động cộng đồng...
              </div>
            ) : events.length === 0 ? (
              <div className="p-10 text-center text-xs text-on-surface-variant">
                Chưa có hoạt động cộng đồng nào. Hãy tạo hoạt động mới ở cột bên
                trái.
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/15">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-5 flex items-start justify-between gap-4"
                  >
                    <div>
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-surface-container-high text-primary font-semibold">
                        {ev.event_type} • {ev.status}
                      </span>
                      <h3 className="font-serif text-lg text-primary mt-1">
                        {ev.title}
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {ev.location || "Showroom Again Store"} •{" "}
                        {ev.event_date
                          ? new Date(ev.event_date).toLocaleString("vi-VN")
                          : "Đang cập nhật lịch"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEventId(ev.id);
                          setEventForm({
                            title: ev.title,
                            slug: ev.slug,
                            event_type: ev.event_type,
                            description: ev.description || "",
                            thumbnail_url: ev.thumbnail_url || "",
                            event_date: ev.event_date
                              ? ev.event_date.slice(0, 16)
                              : "",
                            location: ev.location || "",
                            partner_id: ev.partner_id || "",
                            status: ev.status,
                            allow_registration: ev.allow_registration,
                            max_participants: ev.max_participants || 30,
                          });
                        }}
                        className="text-primary underline font-medium"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="text-error underline"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Event Registrations Table */}
          <div className="bg-surface-container-lowest border border-outline-variant/25">
            <div className="p-4 border-b border-outline-variant/20">
              <span className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                Danh sách khách đăng ký tham gia sự kiện ({registrations.length}
                )
              </span>
            </div>
            {registrations.length === 0 ? (
              <div className="p-8 text-center text-xs text-on-surface-variant">
                Chưa có lượt đăng ký sự kiện nào từ trang Cộng đồng.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant/20 bg-surface-container-low text-[10px] uppercase tracking-widest text-on-surface-variant">
                      <th className="py-2.5 px-4">Họ tên</th>
                      <th className="py-2.5 px-4">Điện thoại / Email</th>
                      <th className="py-2.5 px-4">Sự kiện</th>
                      <th className="py-2.5 px-4">Ngày ĐK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15">
                    {registrations.map((reg) => (
                      <tr key={reg.id}>
                        <td className="py-3 px-4 font-medium text-primary">
                          {reg.full_name}
                        </td>
                        <td className="py-3 px-4">
                          <div>{reg.phone}</div>
                          <div className="text-on-surface-variant">
                            {reg.email || ""}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {reg.events?.title || "Sự kiện cộng đồng"}
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant">
                          {new Date(reg.created_at).toLocaleDateString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
