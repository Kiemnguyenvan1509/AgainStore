"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  Category,
  ConsignmentRequest,
  PRODUCT_STATUS_LABELS,
  Product,
  ProductStatus,
} from "@/types/database";

const ALL_PRODUCT_STATUSES: ProductStatus[] = [
  "draft",
  "pending_review",
  "displaying",
  "reserved",
  "completed",
  "hidden",
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

function AdminProductsContent() {
  const configured = isSupabaseConfigured();
  const searchParams = useSearchParams();
  const fromRequestId = searchParams.get("from_request");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<
    ConsignmentRequest[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Form state for Create / Edit Product
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    product_code: "",
    title: "",
    slug: "",
    category_id: "",
    consignment_request_id: "",
    consignor_id: "",
    brand: "",
    size: "",
    color: "",
    material: "",
    condition_label: "98% — Tuyển chọn hoàn hảo",
    price: 0,
    description: "",
    curator_note: "",
    showroom_location: "Showroom Thảo Điền, TP.HCM",
    status: "displaying" as ProductStatus,
    is_featured: false,
    seo_title: "",
    meta_description: "",
    image_urls: "" as string, // newline separated URLs
  });

  // Category quick-create
  const [newCatName, setNewCatName] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [prodRes, catRes, reqRes] = await Promise.all([
        supabase
          .from("products")
          .select(
            "*, categories(*), product_images(*), consignors(*), consignment_requests(*)"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("categories")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase
          .from("consignment_requests")
          .select("*, consignors(*), consignment_images(*)")
          .order("created_at", { ascending: false }),
      ]);

      if (prodRes.data) setProducts(prodRes.data as Product[]);
      if (catRes.data) setCategories(catRes.data as Category[]);
      if (reqRes.data) {
        const reqList = reqRes.data as ConsignmentRequest[];
        setApprovedRequests(reqList);

        if (fromRequestId) {
          const matched = reqList.find((r) => r.id === fromRequestId);
          if (matched) {
            const rand = Math.floor(100 + Math.random() * 900);
            setEditingId(null);
            setForm((prev) => ({
              ...prev,
              product_code: `SL-${matched.request_code.slice(-4)}-${rand}`,
              title: `${matched.category_name} ${matched.brand_name || ""}`.trim(),
              slug: slugify(
                `${matched.category_name}-${matched.brand_name || ""}-${rand}`
              ),
              consignment_request_id: matched.id,
              consignor_id: matched.consignor_id,
              brand: matched.brand_name || "",
              condition_label: matched.condition_status || "98%",
              image_urls: (matched.consignment_images || [])
                .map((i) => i.image_url)
                .join("\n"),
            }));
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [configured, fromRequestId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setEditingId(null);
    setForm({
      product_code: `SL-${rand}`,
      title: "",
      slug: "",
      category_id: categories[0]?.id || "",
      consignment_request_id: "",
      consignor_id: "",
      brand: "",
      size: "",
      color: "",
      material: "",
      condition_label: "98% — Tuyển chọn hoàn hảo",
      price: 0,
      description: "",
      curator_note: "",
      showroom_location: "Showroom Thảo Điền, TP.HCM",
      status: "displaying",
      is_featured: false,
      seo_title: "",
      meta_description: "",
      image_urls: "",
    });
    setFeedback(null);
  };

  const handleEditProduct = (prod: Product) => {
    setEditingId(prod.id);
    setForm({
      product_code: prod.product_code,
      title: prod.title,
      slug: prod.slug,
      category_id: prod.category_id || "",
      consignment_request_id: prod.consignment_request_id || "",
      consignor_id: prod.consignor_id || "",
      brand: prod.brand || "",
      size: prod.size || "",
      color: prod.color || "",
      material: prod.material || "",
      condition_label: prod.condition_label || "",
      price: Number(prod.price) || 0,
      description: prod.description || "",
      curator_note: prod.curator_note || "",
      showroom_location: prod.showroom_location || "",
      status: prod.status,
      is_featured: prod.is_featured,
      seo_title: prod.seo_title || "",
      meta_description: prod.meta_description || "",
      image_urls: (prod.product_images || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((img) => img.image_url)
        .join("\n"),
    });
    setFeedback(null);
  };

  const handleSelectConsignmentLink = (reqId: string) => {
    const matched = approvedRequests.find((r) => r.id === reqId);
    if (!matched) {
      setForm({ ...form, consignment_request_id: "", consignor_id: "" });
      return;
    }
    setForm({
      ...form,
      consignment_request_id: matched.id,
      consignor_id: matched.consignor_id,
      brand: form.brand || matched.brand_name || "",
      condition_label: form.condition_label || matched.condition_status,
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) return;
    setSaving(true);
    setFeedback(null);

    try {
      const code =
        form.product_code.trim() ||
        `SL-${Math.floor(1000 + Math.random() * 9000)}`;
      const finalSlug =
        form.slug.trim() || slugify(`${form.title}-${code}`);

      const payload = {
        product_code: code,
        title: form.title.trim(),
        slug: finalSlug,
        category_id: form.category_id || null,
        consignment_request_id: form.consignment_request_id || null,
        consignor_id: form.consignor_id || null,
        brand: form.brand.trim() || null,
        size: form.size.trim() || null,
        color: form.color.trim() || null,
        material: form.material.trim() || null,
        condition_label: form.condition_label.trim() || null,
        price: Number(form.price) || 0,
        description: form.description.trim() || null,
        curator_note: form.curator_note.trim() || null,
        showroom_location: form.showroom_location.trim() || null,
        status: form.status,
        is_featured: form.is_featured,
        seo_title: form.seo_title.trim() || null,
        meta_description: form.meta_description.trim() || null,
        updated_at: new Date().toISOString(),
      };

      let targetProductId = editingId;

      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        targetProductId = data.id;
      }

      // Sync product_images
      if (targetProductId) {
        await supabase
          .from("product_images")
          .delete()
          .eq("product_id", targetProductId);

        const urls = form.image_urls
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean);

        if (urls.length > 0) {
          await supabase.from("product_images").insert(
            urls.map((url, idx) => ({
              product_id: targetProductId,
              image_url: url,
              alt_text: form.title.trim(),
              sort_order: idx,
              is_primary: idx === 0,
            }))
          );
        }
      }

      setFeedback(
        editingId
          ? "Đã cập nhật sản phẩm Second Life thành công."
          : "Đã tạo sản phẩm mới vào danh mục Second Life."
      );
      if (!editingId) resetForm();
      await fetchData();
    } catch (err: unknown) {
      console.error("Save product error details:", err);
      let errorText = "Không thể lưu sản phẩm";
      if (err && typeof err === "object") {
        const anyErr = err as Record<string, unknown>;
        errorText = (anyErr.message as string) || (anyErr.error_description as string) || JSON.stringify(err);
      } else if (err instanceof Error) {
        errorText = err.message;
      }
      setFeedback(`Lỗi: ${errorText}`);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusChange = async (
    productId: string,
    status: ProductStatus
  ) => {
    if (!configured) return;
    await supabase
      .from("products")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", productId);
    await fetchData();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!configured || !confirm("Bạn có chắc chắn muốn xóa sản phẩm này?"))
      return;
    await supabase.from("products").delete().eq("id", productId);
    if (editingId === productId) resetForm();
    await fetchData();
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured || !newCatName.trim()) return;
    const name = newCatName.trim();
    const { error } = await supabase.from("categories").insert({
      name,
      slug: slugify(name),
      sort_order: categories.length + 1,
      is_active: true,
    });
    if (!error) {
      setNewCatName("");
      await fetchData();
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.product_code.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      (p.brand || "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || p.category_id === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <AdminShell
      title="Quản lý sản phẩm (Second Life)"
      subtitle="Luồng 2 (Product Curation): Tạo hồ sơ sản phẩm liên kết từ phiếu ký gửi (FK), quản lý 6 trạng thái trưng bày và danh mục."
    >
      {/* Category Management Strip */}
      <div className="bg-surface-container-low border border-outline-variant/25 p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-widest text-on-surface-variant font-semibold mr-2">
            Danh mục hiện có ({categories.length}):
          </span>
          {categories.length === 0 ? (
            <span className="text-xs text-on-surface-variant italic">
              Chưa có danh mục nào. Hãy tạo danh mục bên phải để phân loại sản
              phẩm.
            </span>
          ) : (
            categories.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-lowest border border-outline-variant/30 text-xs text-primary"
              >
                {cat.name}
              </span>
            ))
          )}
        </div>
        <form
          onSubmit={handleCreateCategory}
          className="flex items-center gap-2 w-full md:w-auto"
        >
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Tên danh mục mới (VD: Đầm lụa)..."
            className="bg-surface-container-lowest border border-outline-variant/40 px-3 py-1.5 text-xs focus:outline-none focus:border-primary flex-1 md:w-56"
          />
          <button
            type="submit"
            disabled={!configured || !newCatName.trim()}
            className="bg-primary text-on-primary px-3.5 py-1.5 text-xs uppercase tracking-widest font-semibold disabled:opacity-40"
          >
            + Thêm danh mục
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Product Form (5 cols) */}
        <div className="xl:col-span-5 bg-surface-container-lowest border border-outline-variant/25 p-6">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 mb-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-secondary font-semibold block">
                {editingId ? "Chỉnh sửa hồ sơ" : "Khởi tạo sản phẩm mới"}
              </span>
              <h2 className="font-serif text-xl text-primary">
                {editingId ? form.title : "Hồ sơ sản phẩm Second Life"}
              </h2>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-primary underline"
              >
                + Tạo mới
              </button>
            )}
          </div>

          <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
            {/* Link to Consignment Request (FK) */}
            <div className="bg-surface-container-low p-3.5 border border-outline-variant/25">
              <label className="block text-[10px] uppercase tracking-widest text-primary font-semibold mb-1.5">
                Liên kết Phiếu Ký Gửi & Người Ký Gửi (Foreign Key)
              </label>
              <select
                value={form.consignment_request_id}
                onChange={(e) => handleSelectConsignmentLink(e.target.value)}
                className="w-full bg-surface border border-outline-variant/40 px-3 py-2 text-xs focus:outline-none focus:border-primary"
              >
                <option value="">
                  -- Sản phẩm độc lập / Không gắn phiếu ký gửi --
                </option>
                {approvedRequests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.request_code} — {r.consignors?.full_name} (
                    {r.category_name})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-on-surface-variant mt-1.5">
                Hệ thống tự động liên kết khóa ngoại{" "}
                <code>consignment_request_id</code> & <code>consignor_id</code>{" "}
                mà không lặp lại thông tin cá nhân của khách trên bảng sản phẩm.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Mã sản phẩm *
                </label>
                <input
                  required
                  type="text"
                  value={form.product_code}
                  onChange={(e) =>
                    setForm({ ...form, product_code: e.target.value })
                  }
                  placeholder="VD: SL-2026-01"
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Trạng thái (6 bước) *
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as ProductStatus,
                    })
                  }
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                >
                  {ALL_PRODUCT_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {PRODUCT_STATUS_LABELS[st]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                Tên sản phẩm *
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
                placeholder="VD: Áo Khoác Blazer Linen Khâu Tay"
                className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Danh mục
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Giá niêm yết (VNĐ) *
                </label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Thương hiệu
                </label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Kích cỡ (Size)
                </label>
                <input
                  type="text"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  placeholder="S / M / L"
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Màu sắc
                </label>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Chất liệu
                </label>
                <input
                  type="text"
                  value={form.material}
                  onChange={(e) =>
                    setForm({ ...form, material: e.target.value })
                  }
                  placeholder="100% Organic Linen"
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Độ mới / Tình trạng
                </label>
                <input
                  type="text"
                  value={form.condition_label}
                  onChange={(e) =>
                    setForm({ ...form, condition_label: e.target.value })
                  }
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                Hình ảnh sản phẩm (Tải trực tiếp từ máy tính)
              </label>
              <div className="mb-2">
                <ImageUploader
                  bucket="products"
                  folder="items"
                  multiple={true}
                  label="Chọn một hoặc nhiều ảnh từ máy tính để tải lên"
                  onUploadSuccess={(urls) => {
                    setForm((prev) => ({
                      ...prev,
                      image_urls: prev.image_urls
                        ? `${prev.image_urls}\n${urls.join("\n")}`
                        : urls.join("\n"),
                    }));
                  }}
                />
              </div>
              <label className="block uppercase tracking-wider text-on-surface-variant text-[10px] mb-1">
                Danh sách URL ảnh (Tự động điền khi tải ảnh lên, dòng đầu là ảnh chính):
              </label>
              <textarea
                rows={3}
                value={form.image_urls}
                onChange={(e) =>
                  setForm({ ...form, image_urls: e.target.value })
                }
                placeholder="https://..."
                className="w-full bg-surface border border-outline-variant/40 p-2.5 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                Mô tả chi tiết & Phom dáng
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full bg-surface border border-outline-variant/40 p-2.5"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                Ghi chú Giám tuyển (Curator&apos;s Note)
              </label>
              <textarea
                rows={2}
                value={form.curator_note}
                onChange={(e) =>
                  setForm({ ...form, curator_note: e.target.value })
                }
                className="w-full bg-surface border border-outline-variant/40 p-2.5"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="is_featured"
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) =>
                  setForm({ ...form, is_featured: e.target.checked })
                }
              />
              <label
                htmlFor="is_featured"
                className="text-xs text-on-surface font-medium"
              >
                Hiển thị nổi bật tại Trang chủ (Featured Curated Piece)
              </label>
            </div>

            {feedback && (
              <div className="p-3 bg-secondary-fixed/50 text-primary text-xs font-medium">
                {feedback}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !configured}
              className="w-full bg-primary text-on-primary py-3 text-xs uppercase tracking-widest font-semibold hover:bg-primary-container transition-colors disabled:opacity-50"
            >
              {saving
                ? "Đang lưu..."
                : editingId
                ? "Cập nhật sản phẩm"
                : "Lưu & Đăng tải sản phẩm"}
            </button>
          </form>
        </div>

        {/* Right: Products List & Quick Status Switcher (7 cols) */}
        <div className="xl:col-span-7 bg-surface-container-lowest border border-outline-variant/25">
          <div className="p-4 border-b border-outline-variant/20 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã SP, tên, thương hiệu..."
              className="bg-surface border border-outline-variant/40 px-3 py-2 text-xs"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface border border-outline-variant/40 px-3 py-2 text-xs"
            >
              <option value="all">Tất cả trạng thái (6)</option>
              {ALL_PRODUCT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {PRODUCT_STATUS_LABELS[st]}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-surface border border-outline-variant/40 px-3 py-2 text-xs"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-on-surface-variant">
              Đang tải kho sản phẩm Second Life...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-serif text-lg text-primary mb-1">
                Chưa có sản phẩm nào trong kho Second Life
              </p>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                Hãy điền biểu mẫu bên trái hoặc chọn một phiếu ký gửi đã duyệt
                để khởi tạo sản phẩm đầu tiên.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/25 bg-surface-container-low text-[10px] uppercase tracking-widest text-on-surface-variant">
                    <th className="py-3 px-4">Sản phẩm</th>
                    <th className="py-3 px-4">Giá & Danh mục</th>
                    <th className="py-3 px-4">Nguồn ký gửi</th>
                    <th className="py-3 px-4">Trạng thái trưng bày</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 text-xs">
                  {filteredProducts.map((prod) => (
                    <tr
                      key={prod.id}
                      className="hover:bg-surface-container-low/60"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[10px] text-secondary">
                          {prod.product_code}
                        </div>
                        <div className="font-medium text-primary">
                          {prod.title}
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          {prod.brand || "Unbranded"} • Size{" "}
                          {prod.size || "Free"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface">
                          {Number(prod.price).toLocaleString("vi-VN")} ₫
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          {prod.categories?.name || "Chưa phân loại"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {prod.consignment_requests ? (
                          <div>
                            <span className="font-mono text-[11px] text-primary block">
                              {prod.consignment_requests.request_code}
                            </span>
                            <span className="text-[11px] text-on-surface-variant">
                              {prod.consignors?.full_name || ""}
                            </span>
                          </div>
                        ) : (
                          <span className="text-on-surface-variant">
                            Showroom Curation
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={prod.status}
                          onChange={(e) =>
                            handleQuickStatusChange(
                              prod.id,
                              e.target.value as ProductStatus
                            )
                          }
                          className="bg-surface border border-outline-variant/40 px-2 py-1 text-[11px]"
                        >
                          {ALL_PRODUCT_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {PRODUCT_STATUS_LABELS[st]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditProduct(prod)}
                          className="text-primary underline font-medium"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="text-error underline"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <AdminShell title="Quản lý sản phẩm (Second Life)">
          <div className="p-12 text-center text-sm text-on-surface-variant">
            Đang tải trình quản lý sản phẩm...
          </div>
        </AdminShell>
      }
    >
      <AdminProductsContent />
    </Suspense>
  );
}
