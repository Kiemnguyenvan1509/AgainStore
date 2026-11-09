"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getSupabaseClient } from "@/lib/supabase";
import type { Article, ArticleCategory } from "@/types/database";

const SPEC_CATEGORIES = [
  "Sustainable Fashion",
  "Secondhand Stories",
  "Styling Tips",
  "Clothing Care",
  "Lifestyle",
  "Brand News",
];

export default function JournalPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJournal() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const [{ data: catData }, { data: artData }] = await Promise.all([
          supabase
            .from("article_categories")
            .select("*")
            .order("sort_order", { ascending: true }),
          supabase
            .from("articles")
            .select("*, article_categories(*)")
            .eq("status", "published")
            .order("is_featured", { ascending: false })
            .order("created_at", { ascending: false }),
        ]);

        if (catData) setCategories(catData as ArticleCategory[]);
        if (artData) setArticles(artData as Article[]);
      } finally {
        setLoading(false);
      }
    }

    loadJournal();
  }, []);

  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      if (selectedCategory !== "all") {
        const catName = art.article_categories?.name || "";
        if (art.category_id !== selectedCategory && catName !== selectedCategory) {
          return false;
        }
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = art.title.toLowerCase().includes(q);
        const matchExcerpt = (art.excerpt || "").toLowerCase().includes(q);
        if (!matchTitle && !matchExcerpt) return false;
      }
      return true;
    });
  }, [articles, selectedCategory, searchTerm]);

  const featuredArticle = useMemo(() => {
    return filteredArticles.find((a) => a.is_featured) || filteredArticles[0] || null;
  }, [filteredArticles]);

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <SiteHeader />

      <main className="w-full pt-28 flex-1">
        {/* Hero */}
        <section className="w-full bg-surface-container-low py-16 lg:py-20 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto space-y-5">
            <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
              AGAIN JOURNAL • TIN TỨC &amp; KIẾN THỨC THỜI TRANG
            </span>
            <h1 className="font-display-lg text-4xl sm:text-5xl lg:text-6xl text-primary tracking-tight max-w-4xl">
              Thoughts on a more conscious wardrobe.
            </h1>
            <p className="font-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Chuyên trang biên tập về thời trang bền vững, câu chuyện đằng sau những món đồ secondhand, bí quyết phối đồ và bảo quản chất liệu.
            </p>
          </div>
        </section>

        {/* Search & 6 Categories Bar */}
        <section className="w-full py-8 px-6 lg:px-16 border-b border-outline-variant/40 bg-surface">
          <div className="max-w-7xl mx-auto space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 font-label-sm text-label-sm uppercase tracking-wider ${
                  selectedCategory === "all"
                    ? "bg-primary text-surface-container-lowest"
                    : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                }`}
              >
                Tất cả bài viết
              </button>
              {(categories.length > 0
                ? categories.map((c) => ({ key: c.id, label: c.name }))
                : SPEC_CATEGORIES.map((name) => ({ key: name, label: name }))
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedCategory(item.key)}
                  className={`px-4 py-2 font-label-sm text-label-sm uppercase tracking-wider ${
                    selectedCategory === item.key
                      ? "bg-primary text-surface-container-lowest"
                      : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm bài viết Journal..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-sm"
              />
            </div>
          </div>
        </section>

        {/* Featured Article & Article Grid */}
        <section className="w-full py-16 px-6 lg:px-16">
          <div className="max-w-7xl mx-auto space-y-12">
            {loading ? (
              <div className="py-16 text-center font-body-md text-on-surface-variant">
                Đang tải bài viết từ Supabase...
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="p-12 bg-surface-container-low border border-outline-variant/50 text-center space-y-4">
                <p className="font-headline-sm text-xl text-primary">
                  Chưa có bài viết nào được xuất bản trong cơ sở dữ liệu
                </p>
                <p className="font-body-sm text-on-surface-variant max-w-lg mx-auto">
                  Bạn có thể thêm danh mục và đăng bài viết mới tại trang Quản trị Journal (/admin/journal).
                </p>
                <Link
                  href="/admin/journal"
                  className="inline-block px-6 py-3 bg-primary text-surface-container-lowest font-label-sm text-label-sm uppercase tracking-widest"
                >
                  Tạo bài viết trong Admin (/admin/journal)
                </Link>
              </div>
            ) : (
              <>
                {featuredArticle && (
                  <Link
                    href={`/journal/${featuredArticle.slug}`}
                    className="grid grid-cols-1 lg:grid-cols-12 bg-surface-container-low border border-outline-variant/50 hover:border-primary transition-colors"
                  >
                    {featuredArticle.thumbnail_url && (
                      <div className="lg:col-span-7 aspect-[16/10] bg-surface-container overflow-hidden">
                        <img
                          src={featuredArticle.thumbnail_url}
                          alt={featuredArticle.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div
                      className={`${
                        featuredArticle.thumbnail_url ? "lg:col-span-5" : "lg:col-span-12"
                      } p-8 lg:p-12 flex flex-col justify-center space-y-4`}
                    >
                      <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                        BÀI VIẾT NỔI BẬT • {featuredArticle.article_categories?.name || "JOURNAL"}
                      </span>
                      <h2 className="font-headline-lg text-2xl lg:text-3xl text-primary">
                        {featuredArticle.title}
                      </h2>
                      {featuredArticle.excerpt && (
                        <p className="font-body-md text-on-surface-variant">
                          {featuredArticle.excerpt}
                        </p>
                      )}
                      <span className="font-label-md text-label-md uppercase tracking-widest text-primary underline underline-offset-4 pt-2">
                        Đọc toàn bộ bài viết →
                      </span>
                    </div>
                  </Link>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {filteredArticles.map((art) => (
                    <Link
                      key={art.id}
                      href={`/journal/${art.slug}`}
                      className="group bg-surface-container-low border border-outline-variant/40 flex flex-col justify-between hover:border-primary transition-colors"
                    >
                      {art.thumbnail_url && (
                        <div className="aspect-[16/10] bg-surface-container overflow-hidden">
                          <img
                            src={art.thumbnail_url}
                            alt={art.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                            {art.article_categories?.name || "JOURNAL"}
                          </span>
                          <h3 className="font-headline-sm text-xl text-primary group-hover:underline">
                            {art.title}
                          </h3>
                          {art.excerpt && (
                            <p className="font-body-sm text-on-surface-variant line-clamp-3">
                              {art.excerpt}
                            </p>
                          )}
                        </div>
                        <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between font-label-sm text-xs uppercase text-on-surface-variant">
                          <span>{art.author_name || "Ban biên tập AGAIN"}</span>
                          <span>{new Date(art.created_at).toLocaleDateString("vi-VN")}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
