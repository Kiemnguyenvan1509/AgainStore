"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getSupabaseClient } from "@/lib/supabase";
import type { Article } from "@/types/database";

export default function JournalDetailPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadArticle() {
      const supabase = getSupabaseClient();
      if (!supabase || !slug) {
        setLoading(false);
        return;
      }

      try {
        const { data: art } = await supabase
          .from("articles")
          .select("*, article_categories(*)")
          .eq("slug", slug)
          .maybeSingle();

        if (art) {
          const typed = art as Article;
          setArticle(typed);

          const { data: rel } = await supabase
            .from("articles")
            .select("*, article_categories(*)")
            .eq("status", "published")
            .neq("id", typed.id)
            .limit(3);

          if (rel) setRelatedArticles(rel as Article[]);
        }
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [slug]);

  const handleCopyShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <SiteHeader />

      <main className="w-full pt-28 flex-1">
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
            <Link
              href="/journal"
              className="inline-flex items-center gap-2 font-label-md text-label-md uppercase tracking-widest text-secondary hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Journal</span>
            </Link>

            <button
              type="button"
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-low border border-outline-variant/50 font-label-sm text-label-sm uppercase tracking-wider text-primary"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? "Đã sao chép liên kết!" : "Chia sẻ bài viết"}</span>
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center font-body-md text-on-surface-variant">
              Đang tải bài viết...
            </div>
          ) : !article ? (
            <div className="p-12 bg-surface-container-low border border-outline-variant/50 text-center space-y-4">
              <h1 className="font-headline-md text-2xl text-primary">
                Không tìm thấy bài viết
              </h1>
              <Link
                href="/journal"
                className="inline-block px-6 py-3 bg-primary text-surface-container-lowest font-label-sm text-label-sm uppercase tracking-widest"
              >
                Xem tất cả bài viết
              </Link>
            </div>
          ) : (
            <article className="space-y-8">
              <header className="space-y-4">
                <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                  {article.article_categories?.name || "JOURNAL"}
                </span>
                <h1 className="font-display-lg text-3xl sm:text-4xl lg:text-5xl text-primary leading-tight">
                  {article.title}
                </h1>
                <div className="flex items-center gap-4 font-label-sm text-xs uppercase text-on-surface-variant">
                  <span>Tác giả: {article.author_name || "Ban biên tập AGAIN STORE"}</span>
                  <span>•</span>
                  <span>
                    Ngày đăng:{" "}
                    {new Date(article.published_at || article.created_at).toLocaleDateString(
                      "vi-VN"
                    )}
                  </span>
                </div>
              </header>

              {article.thumbnail_url && (
                <div className="aspect-[16/9] bg-surface-container border border-outline-variant/40 overflow-hidden">
                  <img
                    src={article.thumbnail_url}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {article.excerpt && (
                <p className="font-headline-sm text-xl text-primary italic border-l-2 border-secondary pl-5">
                  {article.excerpt}
                </p>
              )}

              <div className="font-body-lg text-on-surface leading-relaxed whitespace-pre-line space-y-4">
                {article.content}
              </div>

              {/* Chia sẻ mạng xã hội */}
              <div className="p-6 bg-surface-container-low border border-outline-variant/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <span className="font-label-md text-label-md uppercase tracking-widest text-primary">
                  Chia sẻ bài viết này lên mạng xã hội:
                </span>
                <div className="flex items-center gap-4 font-label-sm text-xs uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="px-4 py-2 bg-primary text-surface-container-lowest"
                  >
                    Sao chép URL
                  </button>
                </div>
              </div>

              {/* Bài viết liên quan */}
              {relatedArticles.length > 0 && (
                <div className="pt-10 border-t border-outline-variant/40 space-y-6">
                  <h2 className="font-headline-md text-2xl text-primary">Bài viết liên quan</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {relatedArticles.map((rel) => (
                      <Link
                        key={rel.id}
                        href={`/journal/${rel.slug}`}
                        className="p-5 bg-surface-container-low border border-outline-variant/40 space-y-2 hover:border-primary"
                      >
                        <span className="font-label-sm text-xs uppercase text-secondary">
                          {rel.article_categories?.name || "JOURNAL"}
                        </span>
                        <h3 className="font-headline-sm text-lg text-primary">{rel.title}</h3>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </article>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
