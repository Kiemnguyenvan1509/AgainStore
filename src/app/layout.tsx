import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AGAIN STORE — Circular Fashion & Archival Consignment",
    template: "%s | AGAIN STORE",
  },
  description:
    "Nền tảng thời trang tuần hoàn và dịch vụ ký gửi tuyển chọn. Tái sử dụng trang phục, kéo dài vòng đời quần áo và lan tỏa lối sống bền vững.",
  openGraph: {
    title: "AGAIN STORE — Circular Fashion & Archival Consignment",
    description:
      "Nền tảng thời trang tuần hoàn và dịch vụ ký gửi tuyển chọn. Trao cho từng món đồ một vòng đời mới.",
    type: "website",
    locale: "vi_VN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface font-body-md text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
