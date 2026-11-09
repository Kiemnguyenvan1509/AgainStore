"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Filter } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getSupabaseClient, formatVND } from "@/lib/supabase";
import type { Product, Category } from "@/types/database";
import { PRODUCT_STATUS_LABELS } from "@/types/database";

export default function SecondLifePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [selectedCondition, setSelectedCondition] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    async function loadSecondLife() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const [{ data: catData }, { data: prodData }] = await Promise.all([
          supabase
            .from("categories")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
          supabase
            .from("products")
            .select("*, product_images(*), categories(*)")
            .in("status", ["displaying", "reserved", "completed"])
            .order("created_at", { ascending: false }),
        ]);

        if (catData) setCategories(catData as Category[]);
        if (prodData) setProducts(prodData as Product[]);
      } finally {
        setLoading(false);
      }
    }

    loadSecondLife();
  }, []);

  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.size) set.add(p.size);
    });
    return Array.from(set);
  }, [products]);

  const availableConditions = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.condition_label) set.add(p.condition_label);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== "all" && p.category_id !== selectedCategory) return false;
      if (selectedSize !== "all" && p.size !== selectedSize) return false;
      if (selectedCondition !== "all" && p.condition_label !== selectedCondition) return false;

      if (priceRange === "under_500" && Number(p.price) >= 500000) return false;
      if (
        priceRange === "500_to_1500" &&
        (Number(p.price) < 500000 || Number(p.price) > 1500000)
      )
        return false;
      if (priceRange === "over_1500" && Number(p.price) <= 1500000) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchBrand = (p.brand || "").toLowerCase().includes(q);
        const matchCode = p.product_code.toLowerCase().includes(q);
        if (!matchTitle && !matchBrand && !matchCode) return false;
      }

      return true;
    });
  }, [products, selectedCategory, selectedSize, selectedCondition, priceRange, searchTerm]);

  const displayingList = filteredProducts.filter((p) => p.status === "displaying");
  const rehomedList = filteredProducts.filter(
    (p) => p.status === "reserved" || p.status === "completed"
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <SiteHeader />

      <main className="w-full pt-28 flex-1">
        {/* SECTION 1 & 2: BANNER & INTRODUCTION */}
        <section className="w-full bg-surface-container-low py-16 lg:py-20 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto space-y-5">
            <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
              SECOND LIFE ARCHIVE • KHÔNG GIAN LƯU THÔNG QUẦN ÁO
            </span>
            <h1 className="font-display-lg text-4xl sm:text-5xl lg:text-6xl text-primary tracking-tight">
              PRE-LOVED. RE-IMAGINED.
            </h1>
            <p className="font-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
              Đây không phải trang bán lẻ đại trà. Đây là nơi thể hiện kết quả hoạt động ký gửi, tuyển chọn và lưu thông quần áo bền vững tại AGAIN STORE.
            </p>
          </div>
        </section>

        {/* SECTION 3 & 4: CATEGORIES & FILTER BAR */}
        <section className="w-full bg-surface py-8 px-6 lg:px-16 border-b border-outline-variant/40 sticky top-20 z-30">
          <div className="max-w-7xl mx-auto space-y-5">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 font-label-sm text-label-sm uppercase tracking-wider shrink-0 transition-colors ${
                  selectedCategory === "all"
                    ? "bg-primary text-surface-container-lowest"
                    : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                }`}
              >
                Tất cả danh mục
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 font-label-sm text-label-sm uppercase tracking-wider shrink-0 transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-primary text-surface-container-lowest"
                      : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên, thương hiệu gốc, mã sản phẩm..."
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-sm"
                />
              </div>

              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="px-3 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-sm"
              >
                <option value="all">Kích thước: Tất cả</option>
                {availableSizes.map((sz) => (
                  <option key={sz} value={sz}>
                    Size {sz}
                  </option>
                ))}
              </select>

              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="px-3 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-sm"
              >
                <option value="all">Tình trạng: Tất cả</option>
                {availableConditions.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>

              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-3 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-sm"
              >
                <option value="all">Mức giá: Tất cả</option>
                <option value="under_500">Dưới 500.000đ</option>
                <option value="500_to_1500">500.000đ – 1.500.000đ</option>
                <option value="over_1500">Trên 1.500.000đ</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 5: PRODUCT LISTING (ĐANG TRƯNG BÀY) */}
        <section className="w-full py-16 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                  CURATED ARCHIVE
                </span>
                <h2 className="font-headline-md text-2xl text-primary">
                  Sản phẩm đang trưng bày ({displayingList.length})
                </h2>
              </div>
              <div className="flex items-center gap-2 font-label-sm text-on-surface-variant uppercase">
                <Filter className="w-4 h-4" />
                <span>Dữ liệu thực từ Supabase</span>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center font-body-md text-on-surface-variant">
                Đang tải danh sách sản phẩm từ Supabase...
              </div>
            ) : displayingList.length === 0 ? (
              <div className="p-12 bg-surface-container-low border border-outline-variant/50 text-center space-y-4">
                <p className="font-headline-sm text-xl text-primary">
                  Chưa có sản phẩm nào đang ở trạng thái &ldquo;Đang trưng bày&rdquo;
                </p>
                <p className="font-body-sm text-on-surface-variant max-w-lg mx-auto">
                  Hãy thêm sản phẩm và chuyển trạng thái sang &ldquo;Đang trưng bày&rdquo; trong trang Quản trị (/admin/products).
                </p>
                <Link
                  href="/admin/products"
                  className="inline-block px-6 py-3 bg-primary text-surface-container-lowest font-label-sm text-label-sm uppercase tracking-widest"
                >
                  Mở Quản lý Sản phẩm (/admin/products)
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {displayingList.map((product) => {
                  const primaryImage =
                    product.product_images?.find((img) => img.is_primary)?.image_url ||
                    product.product_images?.[0]?.image_url;

                  return (
                    <Link
                      key={product.id}
                      href={`/second-life/${product.slug}`}
                      className="group bg-surface-container-low border border-outline-variant/40 flex flex-col justify-between hover:border-primary transition-colors"
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
                            #{product.product_code}
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
                            Xem chi tiết →
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

        {/* SECTION 6: PREVIOUSLY REHOMED (SẢN PHẨM ĐÃ TÌM ĐƯỢC CHỦ MỚI) */}
        <section className="w-full bg-surface-container-low py-16 px-6 lg:px-16">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="space-y-2">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                PREVIOUSLY REHOMED • VÒNG ĐỜI TIẾP NỐI
              </span>
              <h2 className="font-headline-md text-2xl text-primary">
                Sản phẩm đã tìm được chủ mới ({rehomedList.length})
              </h2>
              <p className="font-body-sm text-on-surface-variant">
                Những thiết kế đã hoàn tất hành trình kết nối từ người gửi đồ sang người chủ mới tại AGAIN STORE.
              </p>
            </div>

            {rehomedList.length === 0 ? (
              <div className="p-8 bg-surface border border-outline-variant/40 text-center font-body-sm text-on-surface-variant">
                Chưa có sản phẩm nào ở trạng thái &ldquo;Đã có người nhận&rdquo; hoặc &ldquo;Đã hoàn tất&rdquo;.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {rehomedList.map((product) => {
                  const primaryImage =
                    product.product_images?.find((img) => img.is_primary)?.image_url ||
                    product.product_images?.[0]?.image_url;

                  return (
                    <Link
                      key={product.id}
                      href={`/second-life/${product.slug}`}
                      className="bg-surface border border-outline-variant/40 p-4 space-y-3 opacity-85 hover:opacity-100 transition-opacity"
                    >
                      <div className="relative aspect-[3/4] bg-surface-container overflow-hidden">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={product.title}
                            className="w-full h-full object-cover grayscale-[30%]"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-label-sm text-on-surface-variant">
                            #{product.product_code}
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-primary/90 text-surface-container-lowest py-2 px-3 text-center font-label-sm text-label-sm uppercase tracking-widest">
                          {PRODUCT_STATUS_LABELS[product.status]}
                        </div>
                      </div>
                      <div>
                        <span className="font-label-sm text-xs uppercase text-secondary">
                          {product.brand || "ARCHIVE"}
                        </span>
                        <h3 className="font-headline-sm text-base text-primary">{product.title}</h3>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
