"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { PageRecord, PageSectionRecord } from "@/types/database";

const STANDARD_PAGES = [
  { slug: "home", title: "Trang chủ (Again Store)" },
  { slug: "ve-chung-toi", title: "Về chúng tôi" },
  { slug: "dich-vu-ky-gui", title: "Dịch vụ ký gửi" },
  { slug: "second-life", title: "Second Life" },
  { slug: "thoi-trang-tuan-hoan", title: "Thời trang tuần hoàn" },
  { slug: "cong-dong", title: "Hoạt động & Cộng đồng" },
  { slug: "journal", title: "Journal" },
  { slug: "lien-he", title: "Liên hệ & Showroom" },
];

// Danh sách Section Key gợi ý cho từng trang
const SUGGESTED_SECTIONS_BY_PAGE: Record<
  string,
  Array<{ key: string; name: string; defaultSort: number }>
> = {
  home: [
    { key: "hero", name: "Hero Banner chính (Đầu trang)", defaultSort: 1 },
    { key: "brand_intro", name: "Giới thiệu thương hiệu Again", defaultSort: 2 },
    { key: "philosophy", name: "Triết lý thời trang tuần hoàn", defaultSort: 3 },
    { key: "consignment_service", name: "Dịch vụ ký gửi tuyển chọn", defaultSort: 4 },
    { key: "how_it_works", name: "Quy trình 4 bước tiếp nhận đồ", defaultSort: 5 },
    { key: "second_life", name: "Bộ sưu tập Second Life nổi bật", defaultSort: 6 },
    { key: "impact", name: "Tác động môi trường (Thống kê)", defaultSort: 7 },
    { key: "community", name: "Hoạt động & Sự kiện cộng đồng", defaultSort: 8 },
    { key: "journal", name: "Bài viết Journal mới nhất", defaultSort: 9 },
    { key: "cta", name: "Banner kêu gọi hành động cuối trang", defaultSort: 10 },
  ],
  "ve-chung-toi": [
    { key: "story_hero", name: "Banner câu chuyện thương hiệu", defaultSort: 1 },
    { key: "vision_mission", name: "Tầm nhìn & Sứ mệnh", defaultSort: 2 },
    { key: "curation_standard", name: "Tiêu chuẩn giám tuyển đồ ký gửi", defaultSort: 3 },
    { key: "team_curators", name: "Đội ngũ chuyên gia thẩm định", defaultSort: 4 },
  ],
  "dich-vu-ky-gui": [
    { key: "consignment_hero", name: "Banner Dịch vụ Ký gửi", defaultSort: 1 },
    { key: "benefits", name: "Quyền lợi người gửi đồ", defaultSort: 2 },
    { key: "criteria", name: "Tiêu chí tiếp nhận & thẩm định", defaultSort: 3 },
    { key: "faqs", name: "Câu hỏi thường gặp về ký gửi", defaultSort: 4 },
  ],
  "thoi-trang-tuan-hoan": [
    { key: "circular_hero", name: "Banner Triết lý tuần hoàn", defaultSort: 1 },
    { key: "circular_loop", name: "Sơ đồ Vòng tuần hoàn khép kín", defaultSort: 2 },
    { key: "care_guides", name: "Hướng dẫn chăm sóc trang phục", defaultSort: 3 },
  ],
  "lien-he": [
    { key: "showroom_hero", name: "Ảnh toàn cảnh Showroom Thảo Điền", defaultSort: 1 },
    { key: "visiting_info", name: "Hướng dẫn di chuyển & Đặt lịch hẹn", defaultSort: 2 },
  ],
};

export default function AdminContentPage() {
  const configured = isSupabaseConfigured();
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [sections, setSections] = useState<PageSectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Section form
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState({
    section_key: "hero_banner",
    title: "",
    subtitle: "",
    desktop_banner_url: "",
    mobile_banner_url: "",
    cta_text: "",
    cta_url: "",
    sort_order: 1,
    is_active: true,
  });

  const fetchPages = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("pages")
        .select("*")
        .order("slug", { ascending: true });
      if (data) {
        const list = data as PageRecord[];
        setPages(list);
        if (!selectedPageId && list.length > 0) {
          setSelectedPageId(list[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [configured, selectedPageId]);

  const fetchSections = useCallback(async () => {
    if (!configured || !selectedPageId) {
      setSections([]);
      return;
    }
    const { data } = await supabase
      .from("page_sections")
      .select("*")
      .eq("page_id", selectedPageId)
      .order("sort_order", { ascending: true });
    if (data) {
      setSections(data as PageSectionRecord[]);
    }
  }, [configured, selectedPageId]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const handleInitStandardPages = async () => {
    if (!configured) return;
    setSaving(true);
    try {
      for (const p of STANDARD_PAGES) {
        const exists = pages.some((existing) => existing.slug === p.slug);
        if (!exists) {
          await supabase.from("pages").insert({
            slug: p.slug,
            title: p.title,
            is_published: true,
          });
        }
      }
      setFeedback("Đã khởi tạo danh sách 8 khung trang chuẩn của Again Store.");
      await fetchPages();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured || !selectedPageId) return;
    setSaving(true);
    setFeedback(null);

    try {
      const payload = {
        page_id: selectedPageId,
        section_key: sectionForm.section_key.trim(),
        title: sectionForm.title.trim() || null,
        subtitle: sectionForm.subtitle.trim() || null,
        desktop_banner_url: sectionForm.desktop_banner_url.trim() || null,
        mobile_banner_url: sectionForm.mobile_banner_url.trim() || null,
        cta_text: sectionForm.cta_text.trim() || null,
        cta_url: sectionForm.cta_url.trim() || null,
        sort_order: Number(sectionForm.sort_order) || 0,
        is_active: sectionForm.is_active,
      };

      if (editingSectionId) {
        const { error } = await supabase
          .from("page_sections")
          .update(payload)
          .eq("id", editingSectionId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("page_sections").insert(payload);
        if (error) throw error;
      }

      setEditingSectionId(null);
      setSectionForm({
        section_key: "section_block",
        title: "",
        subtitle: "",
        desktop_banner_url: "",
        mobile_banner_url: "",
        cta_text: "",
        cta_url: "",
        sort_order: sections.length + 1,
        is_active: true,
      });
      setFeedback("Đã lưu cấu hình khối nội dung (Page Section) thành công.");
      await fetchSections();
    } catch (err: unknown) {
      setFeedback(
        `Lỗi: ${err instanceof Error ? err.message : "Không thể lưu section"}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSectionActive = async (sec: PageSectionRecord) => {
    if (!configured) return;
    await supabase
      .from("page_sections")
      .update({ is_active: !sec.is_active })
      .eq("id", sec.id);
    await fetchSections();
  };

  const handleDeleteSection = async (id: string) => {
    if (!configured || !confirm("Xóa khối nội dung này?")) return;
    await supabase.from("page_sections").delete().eq("id", id);
    await fetchSections();
  };

  const selectedPage = pages.find((p) => p.id === selectedPageId);
  const currentSlug = selectedPage?.slug || "home";
  const suggestedSections = SUGGESTED_SECTIONS_BY_PAGE[currentSlug] || [];

  return (
    <AdminShell
      title="Quản lý nội dung (CMS Pages & Sections)"
      subtitle="Module 2: Quản lý các trang tĩnh, Hero Banner (Desktop/Mobile), CTA, thứ tự hiển thị và bật/tắt từng khối nội dung."
    >
      {/* Top Bar: Select Page or Initialize 8 Standard Pages */}
      <div className="bg-surface-container-lowest border border-outline-variant/25 p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold whitespace-nowrap">
            Chọn trang cần biên tập:
          </label>
          <select
            value={selectedPageId}
            onChange={(e) => setSelectedPageId(e.target.value)}
            className="bg-surface border border-outline-variant/40 px-3.5 py-2 text-sm focus:outline-none focus:border-primary flex-1 sm:w-72"
          >
            {pages.length === 0 && (
              <option value="">-- Chưa có trang nào trong DB --</option>
            )}
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} (/{p.slug === "home" ? "" : p.slug})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleInitStandardPages}
          disabled={!configured || saving}
          className="border border-primary text-primary px-4 py-2 text-xs uppercase tracking-widest font-semibold hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-40"
        >
          Khởi tạo khung 8 trang chuẩn
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 mb-6 bg-secondary-fixed/50 text-primary text-xs font-medium border border-outline-variant/30">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Form to add/edit a Section (5 cols) */}
        <div className="xl:col-span-5 bg-surface-container-lowest border border-outline-variant/25 p-6">
          <h2 className="font-serif text-xl text-primary border-b border-outline-variant/20 pb-3 mb-4">
            {editingSectionId
              ? "Chỉnh sửa khối nội dung (Section)"
              : "Thêm khối nội dung / Banner mới"}
          </h2>

          <form onSubmit={handleSaveSection} className="space-y-4 text-xs">
            <div>
              <label className="block uppercase tracking-wider text-on-surface-variant mb-1 font-semibold">
                Chọn Section Key (Mã khối nội dung của trang này) *
              </label>
              
              {/* Menu thả xuống gợi ý toàn bộ Section Key của trang đang chọn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                <div>
                  <select
                    value={
                      suggestedSections.some((s) => s.key === sectionForm.section_key)
                        ? sectionForm.section_key
                        : "custom"
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== "custom") {
                        const matched = suggestedSections.find((s) => s.key === val);
                        setSectionForm((prev) => ({
                          ...prev,
                          section_key: val,
                          sort_order: matched?.defaultSort || prev.sort_order,
                        }));
                      }
                    }}
                    className="w-full bg-surface border border-primary/50 text-primary font-medium px-3 py-2 text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="" disabled>
                      -- Bấm chọn khối Section chuẩn ({suggestedSections.length} khối) --
                    </option>
                    {suggestedSections.map((sec) => (
                      <option key={sec.key} value={sec.key}>
                        #{sec.defaultSort} [{sec.key}] — {sec.name}
                      </option>
                    ))}
                    <option value="custom">-- Tùy chỉnh mã khác (Custom Key) --</option>
                  </select>
                </div>

                <div>
                  <input
                    required
                    type="text"
                    value={sectionForm.section_key}
                    onChange={(e) =>
                      setSectionForm({
                        ...sectionForm,
                        section_key: e.target.value,
                      })
                    }
                    placeholder="Mã section_key..."
                    className="w-full bg-surface border border-outline-variant/40 px-3 py-2 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Thứ tự hiển thị (Sort Order)
                </label>
                <input
                  type="number"
                  value={sectionForm.sort_order}
                  onChange={(e) =>
                    setSectionForm({
                      ...sectionForm,
                      sort_order: Number(e.target.value),
                    })
                  }
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                />
              </div>
              <div className="flex items-end pb-2">
                <span className="text-[11px] text-on-surface-variant">
                  Số nhỏ hơn sẽ xếp trên đầu trang
                </span>
              </div>
            </div>

            <div>
              <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                Tiêu đề chính (Headline)
              </label>
              <input
                type="text"
                value={sectionForm.title}
                onChange={(e) =>
                  setSectionForm({ ...sectionForm, title: e.target.value })
                }
                placeholder="VD: Vẻ đẹp xứng đáng có thêm một vòng đời mới"
                className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                Mô tả phụ / Nội dung dẫn nhập
              </label>
              <textarea
                rows={3}
                value={sectionForm.subtitle}
                onChange={(e) =>
                  setSectionForm({ ...sectionForm, subtitle: e.target.value })
                }
                className="w-full bg-surface border border-outline-variant/40 p-2.5"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                Ảnh Banner Desktop (Tải từ máy tính hoặc dán URL)
              </label>
              <div className="mb-2">
                <ImageUploader
                  bucket="products"
                  folder="banners"
                  multiple={false}
                  label="Chọn ảnh Banner Desktop từ máy"
                  onUploadSuccess={(urls) => {
                    if (urls.length > 0) {
                      setSectionForm((prev) => ({
                        ...prev,
                        desktop_banner_url: urls[0],
                      }));
                    }
                  }}
                />
              </div>
              <input
                type="url"
                value={sectionForm.desktop_banner_url}
                onChange={(e) =>
                  setSectionForm({
                    ...sectionForm,
                    desktop_banner_url: e.target.value,
                  })
                }
                placeholder="https://..."
                className="w-full bg-surface border border-outline-variant/40 px-3 py-2 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                Ảnh Banner Mobile (Tải từ máy tính hoặc dán URL)
              </label>
              <div className="mb-2">
                <ImageUploader
                  bucket="products"
                  folder="banners"
                  multiple={false}
                  label="Chọn ảnh Banner Mobile từ máy"
                  onUploadSuccess={(urls) => {
                    if (urls.length > 0) {
                      setSectionForm((prev) => ({
                        ...prev,
                        mobile_banner_url: urls[0],
                      }));
                    }
                  }}
                />
              </div>
              <input
                type="url"
                value={sectionForm.mobile_banner_url}
                onChange={(e) =>
                  setSectionForm({
                    ...sectionForm,
                    mobile_banner_url: e.target.value,
                  })
                }
                placeholder="https://..."
                className="w-full bg-surface border border-outline-variant/40 px-3 py-2 font-mono text-[11px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Nhãn nút bấm (CTA Text)
                </label>
                <input
                  type="text"
                  value={sectionForm.cta_text}
                  onChange={(e) =>
                    setSectionForm({ ...sectionForm, cta_text: e.target.value })
                  }
                  placeholder="Ký gửi ngay"
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Đường dẫn nút (CTA URL)
                </label>
                <input
                  type="text"
                  value={sectionForm.cta_url}
                  onChange={(e) =>
                    setSectionForm({ ...sectionForm, cta_url: e.target.value })
                  }
                  placeholder="/dich-vu-ky-gui"
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="sec_active"
                type="checkbox"
                checked={sectionForm.is_active}
                onChange={(e) =>
                  setSectionForm({
                    ...sectionForm,
                    is_active: e.target.checked,
                  })
                }
              />
              <label htmlFor="sec_active" className="text-xs font-medium">
                Hiển thị khối nội dung này trên giao diện khách hàng
              </label>
            </div>

            <button
              type="submit"
              disabled={saving || !configured || !selectedPageId}
              className="w-full bg-primary text-on-primary py-3 text-xs uppercase tracking-widest font-semibold hover:bg-primary-container transition-colors disabled:opacity-40"
            >
              {saving
                ? "Đang lưu..."
                : editingSectionId
                ? "Cập nhật Section"
                : "Thêm Section vào trang"}
            </button>
          </form>
        </div>

        {/* Right: Sections List (7 cols) */}
        <div className="xl:col-span-7 bg-surface-container-lowest border border-outline-variant/25">
          <div className="p-4 border-b border-outline-variant/20">
            <span className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
              Các khối nội dung của trang đang chọn ({sections.length})
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-on-surface-variant">
              Đang tải dữ liệu nội dung...
            </div>
          ) : sections.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-serif text-lg text-primary mb-1">
                Trang này chưa có khối nội dung tùy chỉnh trong DB
              </p>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                Giao diện khách hàng sẽ hiển thị bố cục Editorial mặc định theo
                thiết kế Google Stitch cho đến khi bạn thêm hoặc tùy biến các
                Section tại đây.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/15">
              {sections.map((sec) => (
                <div
                  key={sec.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] uppercase px-2 py-0.5 bg-surface-container-high text-primary">
                        #{sec.sort_order} • {sec.section_key}
                      </span>
                      <span
                        className={`text-[10px] uppercase tracking-wider px-2 py-0.5 ${
                          sec.is_active
                            ? "bg-secondary-fixed text-primary"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {sec.is_active ? "Đang bật" : "Đang ẩn"}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg text-primary">
                      {sec.title || "(Không có tiêu đề)"}
                    </h3>
                    {sec.subtitle && (
                      <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                        {sec.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleSectionActive(sec)}
                      className="underline text-secondary"
                    >
                      {sec.is_active ? "Ẩn khối" : "Bật hiển thị"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSectionId(sec.id);
                        setSectionForm({
                          section_key: sec.section_key,
                          title: sec.title || "",
                          subtitle: sec.subtitle || "",
                          desktop_banner_url: sec.desktop_banner_url || "",
                          mobile_banner_url: sec.mobile_banner_url || "",
                          cta_text: sec.cta_text || "",
                          cta_url: sec.cta_url || "",
                          sort_order: sec.sort_order,
                          is_active: sec.is_active,
                        });
                      }}
                      className="underline text-primary font-medium"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSection(sec.id)}
                      className="underline text-error"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
