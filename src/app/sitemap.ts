import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://againstore.vn";
  const routes = [
    "",
    "/ve-chung-toi",
    "/dich-vu-ky-gui",
    "/second-life",
    "/thoi-trang-tuan-hoan",
    "/cong-dong",
    "/journal",
    "/lien-he",
    "/tra-cuu-ky-gui",
    "/chinh-sach",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: route === "" ? 1 : 0.8,
  }));
}
