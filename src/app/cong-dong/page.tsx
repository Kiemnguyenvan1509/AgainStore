"use client";

import React, { useEffect, useState } from "react";
import { Calendar, MapPin, CheckCircle2, Users } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getSupabaseClient } from "@/lib/supabase";
import type { CommunityEvent, Partner } from "@/types/database";

const STATUS_LABELS = {
  upcoming: "Sắp diễn ra",
  ongoing: "Đang diễn ra",
  ended: "Đã kết thúc",
};

export default function CommunityPage() {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  // Form đăng ký tham gia sự kiện cộng đồng (Join Us)
  const [selectedEventId, setSelectedEventId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [itemsCount, setItemsCount] = useState(0);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadCommunity() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const [{ data: evtData }, { data: partData }] = await Promise.all([
          supabase
            .from("events")
            .select("*, partners(*)")
            .order("event_date", { ascending: true }),
          supabase
            .from("partners")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
        ]);

        if (evtData) {
          const typed = evtData as CommunityEvent[];
          setEvents(typed);
          const firstOpen = typed.find(
            (e) => e.allow_registration && e.status !== "ended"
          );
          if (firstOpen) setSelectedEventId(firstOpen.id);
        }
        if (partData) setPartners(partData as Partner[]);
      } finally {
        setLoading(false);
      }
    }

    loadCommunity();
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedEventId) {
      setErrorMsg("Vui lòng chọn một sự kiện đang mở đăng ký.");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrorMsg("Chưa kết nối Supabase.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("event_registrations").insert({
        event_id: selectedEventId,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        items_count: Number(itemsCount) || 0,
        note: note.trim() || null,
      });

      if (error) throw new Error(error.message);
      setRegisteredSuccess(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi khi đăng ký tham gia.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <SiteHeader />

      <main className="w-full pt-28 flex-1">
        {/* 1. BANNER */}
        <section className="w-full bg-surface-container-low py-16 lg:py-24 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto space-y-6">
            <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
              CỘNG ĐỒNG • COMMUNITY &amp; ACTIVITIES
            </span>
            <h1 className="font-display-lg text-4xl sm:text-5xl lg:text-6xl text-primary tracking-tight max-w-4xl">
              BETTER FASHION, STRONGER COMMUNITY.
            </h1>
            <p className="font-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Kết nối những con người cùng chung niềm tin rằng mỗi trang phục được tái sử dụng là một hành động thiết thực vì môi trường và cộng đồng.
            </p>
          </div>
        </section>

        {/* 2, 3, 4, 5: COMMUNITY STORY, CLOTHING SWAP & DONATION */}
        <section className="w-full py-20 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="max-w-3xl space-y-3">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                01 / TẠI SAO XÂY DỰNG CỘNG ĐỒNG?
              </span>
              <h2 className="font-headline-lg text-3xl text-primary">
                Các chương trình hoạt động trọng tâm
              </h2>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                Bên cạnh dịch vụ ký gửi thường nhật, AGAIN STORE tổ chức định kỳ các sự kiện cộng đồng để thúc đẩy thói quen trao đổi, bảo quản và sẻ chia quần áo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-surface-container-low border border-outline-variant/40 space-y-3">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                  CLOTHING SWAP
                </span>
                <h3 className="font-headline-sm text-2xl text-primary">
                  Chương trình Đổi đồ
                </h3>
                <p className="font-body-sm text-on-surface-variant leading-relaxed">
                  Mang những món đồ bạn không còn mặc tới sự kiện và đổi lấy trang phục phù hợp từ các thành viên khác trong cộng đồng.
                </p>
              </div>

              <div className="p-8 bg-surface-container-low border border-outline-variant/40 space-y-3">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                  DONATION &amp; CHARITY
                </span>
                <h3 className="font-headline-sm text-2xl text-primary">
                  Hoạt động Quyên góp
                </h3>
                <p className="font-body-sm text-on-surface-variant leading-relaxed">
                  Tiếp nhận, phân loại và trao tặng quần áo còn tốt tới các quỹ thiện nguyện và người lao động có hoàn cảnh khó khăn.
                </p>
              </div>

              <div className="p-8 bg-surface-container-low border border-outline-variant/40 space-y-3">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                  WORKSHOP &amp; MENDING
                </span>
                <h3 className="font-headline-sm text-2xl text-primary">
                  Sửa chữa &amp; Tái chế thủ công
                </h3>
                <p className="font-body-sm text-on-surface-variant leading-relaxed">
                  Hướng dẫn thêu mạng Sashiko, chăm sóc chất liệu tự nhiên và làm mới trang phục cũ cùng các nghệ nhân.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. DANH SÁCH SỰ KIỆN & HOẠT ĐỘNG TỪ SUPABASE */}
        <section className="w-full bg-surface-container-low py-20 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="space-y-2">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                02 / LỊCH SỰ KIỆN &amp; HOẠT ĐỘNG ĐÃ TỔ CHỨC
              </span>
              <h2 className="font-headline-lg text-3xl text-primary">
                Danh sách hoạt động cộng đồng ({events.length})
              </h2>
            </div>

            {loading ? (
              <div className="py-12 text-center font-body-md text-on-surface-variant">
                Đang tải danh sách hoạt động từ Supabase...
              </div>
            ) : events.length === 0 ? (
              <div className="p-10 bg-surface border border-outline-variant/50 text-center space-y-2">
                <p className="font-headline-sm text-xl text-primary">
                  Chưa có hoạt động cộng đồng nào trong Database
                </p>
                <p className="font-body-sm text-on-surface-variant">
                  Quản trị viên có thể thêm hoạt động mới trong trang Quản trị (/admin/community).
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="bg-surface border border-outline-variant/40 flex flex-col justify-between"
                  >
                    {evt.thumbnail_url && (
                      <div className="aspect-[16/10] bg-surface-container overflow-hidden">
                        <img
                          src={evt.thumbnail_url}
                          alt={evt.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase">
                          {STATUS_LABELS[evt.status]}
                        </span>
                        <h3 className="font-headline-sm text-xl text-primary">{evt.title}</h3>
                        {evt.description && (
                          <p className="font-body-sm text-on-surface-variant">
                            {evt.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-outline-variant/30 space-y-1.5 font-body-sm text-on-surface-variant">
                        {evt.event_date && (
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-secondary" />
                            <span>{new Date(evt.event_date).toLocaleString("vi-VN")}</span>
                          </p>
                        )}
                        {evt.location && (
                          <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-secondary" />
                            <span>{evt.location}</span>
                          </p>
                        )}
                        {evt.partners?.name && (
                          <p className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-secondary" />
                            <span>Đối tác: {evt.partners.name}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 7. ĐỐI TÁC ĐỒNG HÀNH (PARTNERS) */}
        <section className="w-full py-16 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="space-y-2">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                03 / PARTNERS
              </span>
              <h2 className="font-headline-lg text-2xl text-primary">
                Đối tác đồng hành ({partners.length})
              </h2>
            </div>

            {partners.length === 0 ? (
              <p className="font-body-sm text-on-surface-variant">
                Chưa có đối tác nào được thêm trong bảng partners.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {partners.map((p) => (
                  <div
                    key={p.id}
                    className="p-6 bg-surface-container-low border border-outline-variant/40 space-y-2"
                  >
                    <h3 className="font-headline-sm text-lg text-primary">{p.name}</h3>
                    {p.description && (
                      <p className="font-body-sm text-on-surface-variant">{p.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 8. JOIN US — ĐĂNG KÝ THAM GIA HOẠT ĐỘNG CỘNG ĐỒNG */}
        <section id="dang-ky-su-kien" className="w-full py-20 px-6 lg:px-16 bg-surface-container-high">
          <div className="max-w-3xl mx-auto bg-surface p-8 lg:p-12 border border-outline-variant/60 space-y-6">
            <div className="space-y-2">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                04 / JOIN US — ĐĂNG KÝ THAM GIA
              </span>
              <h2 className="font-headline-lg text-3xl text-primary">
                Đăng ký tham gia sự kiện cộng đồng
              </h2>
            </div>

            {registeredSuccess ? (
              <div className="p-8 bg-secondary-container/40 border border-secondary text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
                <h3 className="font-headline-sm text-xl text-primary">
                  Đăng ký tham gia thành công!
                </h3>
                <p className="font-body-sm text-on-surface-variant">
                  Thông tin đăng ký của bạn đã được lưu vào hệ thống quản trị cộng đồng của AGAIN STORE.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                {errorMsg && (
                  <p className="p-3 bg-error-container text-on-error-container font-body-sm">
                    {errorMsg}
                  </p>
                )}

                <div className="space-y-2">
                  <label className="block font-label-md text-label-md uppercase tracking-wider text-primary">
                    Chọn chương trình / sự kiện *
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-md"
                  >
                    <option value="">-- Chọn sự kiện từ Database --</option>
                    {events
                      .filter((e) => e.allow_registration && e.status !== "ended")
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.title} ({STATUS_LABELS[e.status]})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Họ và tên *"
                    className="px-4 py-3 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-md"
                  />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Số điện thoại *"
                    className="px-4 py-3 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-md"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="px-4 py-3 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-md"
                  />
                  <input
                    type="number"
                    min={0}
                    value={itemsCount}
                    onChange={(e) => setItemsCount(Number(e.target.value))}
                    placeholder="Số món đồ dự kiến mang tới đổi/quyên góp"
                    className="px-4 py-3 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-md"
                  />
                </div>

                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú thêm..."
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-md"
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-primary text-surface-container-lowest font-label-md text-label-md uppercase tracking-widest hover:bg-secondary transition-colors"
                >
                  {submitting ? "Đang gửi..." : "Gửi đăng ký tham gia"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
