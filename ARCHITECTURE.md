# AGAIN STORE — TÀI LIỆU KIẾN TRÚC HỆ THỐNG DỰ ÁN
**Circular Fashion & Archival Consignment Platform**

---

## 1. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)

**Again Store** là nền tảng thương mại thời trang tuần hoàn và dịch vụ ký gửi tuyển chọn cao cấp (Curated Consignment), hướng đến việc kéo dài vòng đời trang phục và lan tỏa phong cách sống bền vững.

### Công nghệ sử dụng (Technology Stack):
* **Frontend Framework:** Next.js 15 (App Router, Server Components & Client Components).
* **Ngôn ngữ:** TypeScript (Strict typing, đảm bảo an toàn kiểu dữ liệu 100%).
* **Styling & Design System:** Tailwind CSS v3, tích hợp chuẩn xác hệ thống thiết kế Google Stitch ("Again Store Design System").
  * **Typography:** `Playfair Display` (tiêu đề serif trang nhã) & `Be Vietnam Pro` (thân bài hiển thị rõ nét).
  * **Color Tokens:** `primary: #0e271d`, `secondary: #56624a`, `surface/background: #fbf9f3`, `surface-container-low: #f5f4ed`.
  * **Border & Corner:** Góc vuông tuyệt đối `0px` (`border-radius: 0px`), viền hairline thanh mảnh `hairline-border`.
* **Backend as a Service & Database:** Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security - RLS, Storage Buckets).
* **Client Library:** `@supabase/supabase-js`.

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN (PROJECT STRUCTURE)

```
c:\Users\dell\Desktop\AgainStore\
├── .env.example                 # Mẫu cấu hình biến môi trường
├── .env.local                   # Cấu hình Supabase thực tế (URL & API Keys)
├── .gitignore                   # Loại trừ node_modules, .next, .env.local
├── package.json                 # Danh sách thư viện & scripts (build, dev, lint)
├── tsconfig.json                # Cấu hình TypeScript & path alias (@/* -> ./src/*)
├── tailwind.config.ts           # Token màu sắc, typography và spacing của Stitch
├── postcss.config.mjs           # Cấu hình xử lý CSS
├── next.config.mjs              # Cấu hình Next.js (cho phép remote image URLs)
│
├── supabase/
│   └── schema.sql               # Script DDL SQL 21 bảng, RLS Policies, Indexes
│
└── src/
    ├── app/                     # Next.js App Router (23 Routes)
    │   ├── layout.tsx           # Global Root Layout (phông chữ, metadata SEO)
    │   ├── globals.css          # Định nghĩa CSS gốc, biến CSS, quy tắc 0px
    │   ├── not-found.tsx        # Trang 404 tùy biến
    │   ├── sitemap.ts           # Tự động sinh sitemap.xml phục vụ SEO
    │   ├── robots.ts            # Tự động sinh robots.txt chuẩn Search Engine
    │   │
    │   │── [CÁC TRANG DÀNH CHO KHÁCH HÀNG - CUSTOMER FACING]
    │   ├── page.tsx                             # Trang chủ (/)
    │   ├── ve-chung-toi/page.tsx                # Trang Về chúng tôi (/ve-chung-toi)
    │   ├── dich-vu-ky-gui/page.tsx              # Quy trình ký gửi & Form gửi đồ online
    │   ├── second-life/
    │   │   ├── page.tsx                         # Danh mục Second Life & lọc sản phẩm
    │   │   └── [slug]/page.tsx                  # Chi tiết sản phẩm & Form đặt lịch xem đồ
    │   ├── thoi-trang-tuan-hoan/page.tsx        # Trang triết lý thời trang tuần hoàn
    │   ├── cong-dong/page.tsx                   # Hoạt động, Workshop, Swap & Form RSVP
    │   ├── journal/
    │   │   ├── page.tsx                         # Danh sách bài viết & 6 chuyên mục
    │   │   └── [slug]/page.tsx                  # Chi tiết bài viết Journal
    │   ├── lien-he/page.tsx                     # Thông tin Showroom & Form liên hệ
    │   ├── tra-cuu-ky-gui/page.tsx              # Tra cứu tiến độ ký gửi theo mã
    │   ├── chinh-sach/page.tsx                  # Điều khoản & Chính sách ký gửi
    │   │
    │   └── admin/                               # [PHÂN HỆ QUẢN TRỊ - ADMIN CMS]
    │       ├── login/page.tsx                   # Trang đăng nhập quản trị
    │       ├── page.tsx                         # Module 1: Dashboard Tổng quan
    │       ├── content/page.tsx                 # Module 2: Quản lý Nội dung (CMS Sections)
    │       ├── consignments/page.tsx            # Module 3: Quản lý Tiếp nhận Ký gửi (Luồng 1)
    │       ├── products/page.tsx                # Module 4: Quản lý Sản phẩm Second Life (Luồng 2)
    │       ├── journal/page.tsx                 # Module 5: Quản lý Bài viết & Danh mục Journal
    │       ├── community/page.tsx               # Module 6: Quản lý Sự kiện & Đối tác
    │       └── settings/page.tsx                # Module 7: Thông tin Showroom & Phân quyền
    │
    ├── components/
    │   ├── layout/
    │   │   ├── SiteHeader.tsx   # Header điều hướng khách hàng + Drawer menu
    │   │   └── SiteFooter.tsx   # Footer thông tin showroom, giờ mở cửa & liên kết
    │   ├── admin/
    │   │   └── AdminShell.tsx   # Khung điều hướng Sidebar/Header cho Admin CMS
    │   └── ui/
    │       └── SupabaseStatusBanner.tsx # Banner hiển thị trạng thái kết nối DB
    │
    ├── lib/
    │   └── supabase.ts          # Khởi tạo Supabase client & tiện ích sinh mã, slug
    │
    └── types/
        └── database.ts          # Định nghĩa TypeScript interface cho 21 bảng & Enum
```

---

## 3. HAI LUỒNG NGHIỆP VỤ CỐT LÕI (CORE WORKFLOWS)

Kiến trúc của Again Store được thiết kế xoay quanh sự gắn kết chặt chẽ giữa 2 luồng nghiệp vụ theo file đặc tả:

```
[KHÁCH HÀNG ĐĂNG KÝ KÝ GỬI]
           │
           ▼ (Form /dich-vu-ky-gui hoặc tiếp nhận tại Showroom)
┌─────────────────────────────────────────────────────────────┐
│ LUỒNG 1: QUẢN LÝ TIẾP NHẬN KÝ GỬI (Consignment Intake)      │
│ Bảng: consignors -> consignment_requests -> images/history  │
│ 6 Trạng thái: Chờ xác nhận -> Đã xác nhận -> Tiếp nhận đồ  │
│              -> Đang kiểm tra -> ĐÃ DUYỆT (hoặc Từ chối)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
            (Nhấn nút "+ Tạo SP từ phiếu ký gửi này")
                               │
                               ▼ (Kế thừa khóa ngoại FK: consignment_request_id, consignor_id)
┌─────────────────────────────────────────────────────────────┐
│ LUỒNG 2: GIÁM TUYỂN & TRƯNG BÀY (Product Curation)         │
│ Bảng: products -> product_images, categories                │
│ 6 Trạng thái: Bản nháp -> Chờ duyệt -> ĐANG TRƯNG BÀY       │
│              -> Đã có người nhận -> Đã hoàn tất -> Ẩn      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ (Hiển thị ra ngoài)
             [TRANG KHÁCH HÀNG: /second-life]
```

### Luồng 1: Quản lý tiếp nhận ký gửi (Consignment Intake)
1. **Khởi tạo:** Khách hàng điền thông tin và tải ảnh tại `/dich-vu-ky-gui` (hoặc nhân viên tạo trực tiếp tại quầy trong CMS). Hệ thống tự sinh mã duy nhất dạng `AG-YYMMDD-XXXX`.
2. **Lưu trữ liên hoàn:** Thông tin khách hàng vào `consignors`, chi tiết món đồ vào `consignment_requests`, ảnh góc chụp vào `consignment_images`, và vết thay đổi vào `consignment_history`.
3. **Thao tác tại CMS (`/admin/consignments`):**
   * Tìm kiếm theo tên, SĐT, mã ký gửi; lọc theo trạng thái và ngày tạo.
   * Cột bên phải (Inspection Panel): Xem cận cảnh hình ảnh kiểm định, phân công nhân viên xử lý (`assigned_staff_id`), ghi chú nội bộ, cập nhật trạng thái.
   * Xuất danh sách ra file Excel/CSV (UTF-8 BOM hiển thị chuẩn tiếng Việt).

### Luồng 2: Giám tuyển & Trưng bày sản phẩm (Product Curation)
1. **Liên kết dữ liệu sạch (Foreign Key):** Khi duyệt phiếu ký gửi thành công, Admin bấm *"+ Tạo SP Second Life"*. Hệ thống mở trang `/admin/products` và tự động điền sẵn `consignment_request_id`, `consignor_id`, thương hiệu, ảnh đã kiểm định mà **không cần nhập lại hay trùng lặp thông tin khách hàng**.
2. **Định danh & Gắn thẻ:** Thiết lập giá bán, kích cỡ, chất liệu, tình trạng độ mới (VD: 98%), mô tả phom dáng, vị trí trưng bày tại Showroom và Curator's Note (lời bình giám tuyển).
3. **Xuất bản:** Khi chuyển trạng thái sang `displaying` (Đang trưng bày), sản phẩm lập tức xuất hiện tại `/second-life` để khách hàng xem, tra cứu và gửi yêu cầu đặt lịch hẹn.

---

## 4. CHIẾN LƯỢC RENDER VÀ HIỆU NĂNG (RENDERING STRATEGY)

* **Server Components (RSC):** Áp dụng cho các trang tĩnh hoặc cần SEO cao (`/`, `/ve-chung-toi`, `/thoi-trang-tuan-hoan`, `/chinh-sach`, layout tổng). Giúp giảm thiểu kích thước bundle gửi xuống trình duyệt, tốc độ First Contentful Paint (FCP) dưới 1s.
* **Client Components (`"use client"`):** Áp dụng tại các điểm tương tác thời gian thực:
  * Biểu mẫu đăng ký ký gửi, tìm kiếm, lọc bộ sưu tập, form đặt lịch hẹn xem đồ.
  * Toàn bộ 7 module trong Admin CMS để hỗ trợ quản lý trạng thái động, modal và thao tác tức thì.
* **Fallback UI khi chưa có dữ liệu:** Tất cả các trang đều xử lý trạng thái rỗng (Empty State) chỉn chu theo phong cách tối giản của Stitch, hiển thị thông báo hướng dẫn người dùng tạo dữ liệu thay vì hiển thị lỗi hay dữ liệu mẫu ảo.
