"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { Article, ArticleCategory, ArticleStatus } from "@/types/database";

const STANDARD_JOURNAL_CATEGORIES = [
  { name: "Thời trang bền vững", slug: "thoi-trang-ben-vung" },
  { name: "Chăm sóc trang phục", slug: "cham-soc-trang-phuc" },
  { name: "Phối đồ cùng đồ tái sinh", slug: "phoi-do-cung-do-tai-sinh" },
  { name: "Câu chuyện món đồ", slug: "cau-chuyen-mon-do" },
  { name: "Lối sống xanh", slug: "loi-song-xanh" },
  { name: "Hậu trường Again", slug: "hau-truong-again" },
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminJournalPage() {
  const configured = isSupabaseConfigured();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    category_id: "",
    excerpt: "",
    content: "",
    thumbnail_url: "",
    author_name: "Ban Biên Tập Again Store",
    status: "published" as ArticleStatus,
    is_featured: false,
    seo_title: "",
    meta_description: "",
  });

  const fetchData = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [artRes, catRes] = await Promise.all([
        supabase
          .from("articles")
          .select("*, article_categories(*)")
          .order("created_at", { ascending: false }),
        supabase
          .from("article_categories")
          .select("*")
          .order("sort_order", { ascending: true }),
      ]);
      if (artRes.data) setArticles(artRes.data as Article[]);
      if (catRes.data) {
        const list = catRes.data as ArticleCategory[];
        setCategories(list);
        if (!form.category_id && list.length > 0) {
          setForm((prev) => ({ ...prev, category_id: list[0].id }));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [configured, form.category_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInitStandardCategories = async () => {
    if (!configured) return;
    setSaving(true);
    try {
      for (let i = 0; i < STANDARD_JOURNAL_CATEGORIES.length; i++) {
        const c = STANDARD_JOURNAL_CATEGORIES[i];
        const exists = categories.some((item) => item.slug === c.slug);
        if (!exists) {
          await supabase.from("article_categories").insert({
            name: c.name,
            slug: c.slug,
            sort_order: i + 1,
          });
        }
      }
      setFeedback("Đã khởi tạo 6 chuyên mục Journal chuẩn theo đặc tả.");
      await fetchData();
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: "",
      slug: "",
      category_id: categories[0]?.id || "",
      excerpt: "",
      content: "",
      thumbnail_url: "",
      author_name: "Ban Biên Tập Again Store",
      status: "published",
      is_featured: false,
      seo_title: "",
      meta_description: "",
    });
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) return;
    setSaving(true);
    setFeedback(null);

    try {
      const finalSlug = form.slug.trim() || slugify(form.title);
      const payload = {
        title: form.title.trim(),
        slug: finalSlug,
        category_id: form.category_id || null,
        excerpt: form.excerpt.trim() || null,
        content: form.content,
        thumbnail_url: form.thumbnail_url.trim() || null,
        author_name: form.author_name.trim() || null,
        status: form.status,
        is_featured: form.is_featured,
        published_at:
          form.status === "published" ? new Date().toISOString() : null,
        seo_title: form.seo_title.trim() || null,
        meta_description: form.meta_description.trim() || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("articles")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("articles").insert(payload);
        if (error) throw error;
      }

      setFeedback(
        editingId
          ? "Đã cập nhật bài viết Journal thành công."
          : "Đã xuất bản bài viết mới lên Journal."
      );
      resetForm();
      await fetchData();
    } catch (err: unknown) {
      setFeedback(
        `Lỗi: ${err instanceof Error ? err.message : "Không thể lưu bài viết"}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!configured || !confirm("Xóa bài viết này khỏi Journal?")) return;
    await supabase.from("articles").delete().eq("id", id);
    if (editingId === id) resetForm();
    await fetchData();
  };

  return (
    <AdminShell
      title="Quản lý Journal (Editorial & SEO)"
      subtitle="Module 5: Quản lý 6 chuyên mục nội dung biên tập, xuất bản bài viết, hẹn giờ đăng và cấu hình SEO."
    >
      {/* Top Bar: Categories status */}
      <div className="bg-surface-container-low border border-outline-variant/25 p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-widest text-on-surface-variant font-semibold mr-2">
            Chuyên mục Journal ({categories.length}/6 chuẩn):
          </span>
          {categories.map((cat) => (
            <span
              key={cat.id}
              className="px-2.5 py-1 bg-surface-container-lowest border border-outline-variant/30 text-xs text-primary"
            >
              {cat.name}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={handleInitStandardCategories}
          disabled={!configured || saving}
          className="border border-primary text-primary px-4 py-2 text-xs uppercase tracking-widest font-semibold hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-40 shrink-0"
        >
          Khởi tạo 6 chuyên mục chuẩn
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 mb-6 bg-secondary-fixed/50 text-primary text-xs font-medium border border-outline-variant/30">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Article Editor (6 cols) */}
        <div className="xl:col-span-6 bg-surface-container-lowest border border-outline-variant/25 p-6">
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3 mb-4">
            <h2 className="font-serif text-xl text-primary">
              {editingId ? "Biên tập bài viết" : "Soạn bài viết Journal mới"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-primary underline"
              >
                + Soạn bài mới
              </button>
            )}
          </div>

          <form onSubmit={handleSaveArticle} className="space-y-4 text-xs">
            <div>
              <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                Tiêu đề bài viết *
              </label>
              <input
                required
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                    slug: editingId ? form.slug : slugify(e.target.value),
                  })
                }
                placeholder="VD: Nghệ thuật bảo quản lụa tơ tằm tự nhiên qua nhiều thập kỷ"
                className="w-full bg-surface border border-outline-variant/40 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Đường dẫn tĩnh (Slug) *
                </label>
                <input
                  required
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Chuyên mục
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                >
                  <option value="">-- Chọn chuyên mục --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Tác giả / Người viết
                </label>
                <input
                  type="text"
                  value={form.author_name}
                  onChange={(e) =>
                    setForm({ ...form, author_name: e.target.value })
                  }
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Trạng thái xuất bản
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as ArticleStatus,
                    })
                  }
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                >
                  <option value="draft">Bản nháp (Draft)</option>
                  <option value="scheduled">Hẹn giờ đăng (Scheduled)</option>
                  <option value="published">Đã xuất bản (Published)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                Ảnh đại diện bài viết (Tải từ máy tính hoặc dán URL)
              </label>
              <div className="mb-2">
                <ImageUploader
                  bucket="products"
                  folder="journal"
                  multiple={false}
                  label="Chọn ảnh Thumbnail từ máy tính"
                  onUploadSuccess={(urls) => {
                    if (urls.length > 0) {
                      setForm((prev) => ({ ...prev, thumbnail_url: urls[0] }));
                    }
                  }}
                />
              </div>
              <input
                type="url"
                value={form.thumbnail_url}
                onChange={(e) =>
                  setForm({ ...form, thumbnail_url: e.target.value })
                }
                placeholder="https://..."
                className="w-full bg-surface border border-outline-variant/40 px-3 py-2 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                Đoạn trích dẫn ngắn (Excerpt)
              </label>
              <textarea
                rows={2}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="w-full bg-surface border border-outline-variant/40 p-2.5"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                Nội dung bài viết *
              </label>
              <textarea
                required
                rows={8}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Nhập nội dung bài viết..."
                className="w-full bg-surface border border-outline-variant/40 p-3 text-sm leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-outline-variant/20">
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={form.seo_title}
                  onChange={(e) =>
                    setForm({ ...form, seo_title: e.target.value })
                  }
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Meta Description
                </label>
                <input
                  type="text"
                  value={form.meta_description}
                  onChange={(e) =>
                    setForm({ ...form, meta_description: e.target.value })
                  }
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="art_featured"
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) =>
                  setForm({ ...form, is_featured: e.target.checked })
                }
              />
              <label htmlFor="art_featured" className="text-xs font-medium">
                Ghim làm bài viết tiêu điểm (Featured Editorial)
              </label>
            </div>

            <button
              type="submit"
              disabled={saving || !configured}
              className="w-full bg-primary text-on-primary py-3 text-xs uppercase tracking-widest font-semibold hover:bg-primary-container transition-colors disabled:opacity-40"
            >
              {saving
                ? "Đang lưu..."
                : editingId
                ? "Lưu cập nhật bài viết"
                : "Xuất bản bài viết"}
            </button>
          </form>
        </div>

        {/* Right: Articles List (6 cols) */}
        <div className="xl:col-span-6 bg-surface-container-lowest border border-outline-variant/25">
          <div className="p-4 border-b border-outline-variant/20">
            <span className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
              Danh sách bài viết ({articles.length})
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-on-surface-variant">
              Đang tải bài viết Journal...
            </div>
          ) : articles.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-serif text-lg text-primary mb-1">
                Chưa có bài viết nào trên Journal
              </p>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                Hãy khởi tạo 6 chuyên mục chuẩn và viết bài đầu tiên ở khung bên
                trái.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/15">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="p-5 flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-surface-container-high text-primary font-medium">
                        {art.article_categories?.name || "Chưa phân mục"}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                        • {art.status}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg text-primary">
                      {art.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                      {art.excerpt || art.content.slice(0, 120)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(art.id);
                        setForm({
                          title: art.title,
                          slug: art.slug,
                          category_id: art.category_id || "",
                          excerpt: art.excerpt || "",
                          content: art.content,
                          thumbnail_url: art.thumbnail_url || "",
                          author_name: art.author_name || "",
                          status: art.status,
                          is_featured: art.is_featured,
                          seo_title: art.seo_title || "",
                          meta_description: art.meta_description || "",
                        });
                      }}
                      className="text-primary underline font-medium"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteArticle(art.id)}
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
      </div>
    </AdminShell>
  );
}
