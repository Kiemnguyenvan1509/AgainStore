-- ============================================================================
-- AGAIN STORE — SUPABASE POSTGRESQL SCHEMA
-- Định hướng: Circular Fashion & Consignment Platform
-- Lưu ý: File này chỉ khởi tạo cấu trúc bảng, khóa ngoại, index và RLS cơ bản,
-- KHÔNG chứa dữ liệu ảo (mock/fake data) theo đúng yêu cầu.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. BẢNG PHÂN QUYỀN (roles)
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL CHECK (code IN ('super_admin', 'admin', 'staff')),
  name TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Khởi tạo 3 cấp vai trò hệ thống bắt buộc theo mục VI đặc tả
INSERT INTO public.roles (code, name, permissions)
VALUES
  ('super_admin', 'Super Admin', '{"all": true}'::jsonb),
  ('admin', 'Admin', '{"content": true, "products": true, "consignments": true, "journal": true, "community": true}'::jsonb),
  ('staff', 'Nhân viên', '{"consignments": true, "products": true}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- 2. BẢNG TÀI KHOẢN QUẢN TRỊ & NHÂN VIÊN (users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role_id UUID REFERENCES public.roles(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. BẢNG NỘI DUNG CÁC TRANG TĨNH (pages)
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. BẢNG CÁC SECTION CỦA TRANG (page_sections)
CREATE TABLE IF NOT EXISTS public.page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  desktop_banner_url TEXT,
  mobile_banner_url TEXT,
  cta_text TEXT,
  cta_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (page_id, section_key)
);

-- 5. BẢNG CẤU HÌNH MENU (menus)
CREATE TABLE IF NOT EXISTS public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'header' CHECK (location IN ('header', 'footer')),
  parent_id UUID REFERENCES public.menus(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. BẢNG THÔNG TIN NGƯỜI GỬI ĐỒ (consignors)
CREATE TABLE IF NOT EXISTS public.consignors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  bank_name TEXT,
  bank_account TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_consignors_phone ON public.consignors(phone);

-- 7. BẢNG YÊU CẦU KÝ GỬI (consignment_requests)
-- 6 trạng thái chuẩn:
-- pending_confirmation (Chờ xác nhận)
-- confirmed (Đã xác nhận)
-- receiving (Đang tiếp nhận đồ)
-- inspecting (Đang kiểm tra)
-- approved (Đã duyệt ký gửi)
-- rejected (Đã từ chối / Đã hủy)
CREATE TABLE IF NOT EXISTS public.consignment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code TEXT UNIQUE NOT NULL,
  consignor_id UUID NOT NULL REFERENCES public.consignors(id) ON DELETE RESTRICT,
  category_name TEXT NOT NULL,
  brand_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  condition_status TEXT NOT NULL,
  customer_note TEXT,
  internal_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending_confirmation' CHECK (
    status IN (
      'pending_confirmation',
      'confirmed',
      'receiving',
      'inspecting',
      'approved',
      'rejected'
    )
  ),
  assigned_staff_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  agreed_policy BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_consignment_requests_status ON public.consignment_requests(status);
CREATE INDEX IF NOT EXISTS idx_consignment_requests_code ON public.consignment_requests(request_code);

-- 8. BẢNG HÌNH ẢNH YÊU CẦU KÝ GỬI (consignment_images)
CREATE TABLE IF NOT EXISTS public.consignment_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consignment_request_id UUID NOT NULL REFERENCES public.consignment_requests(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  angle_label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. BẢNG LỊCH SỬ XỬ LÝ YÊU CẦU KÝ GỬI (consignment_history)
CREATE TABLE IF NOT EXISTS public.consignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consignment_request_id UUID NOT NULL REFERENCES public.consignment_requests(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. BẢNG DANH MỤC SẢN PHẨM (categories)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. BẢNG SẢN PHẨM KÝ GỬI (products)
-- Liên kết trực tiếp với consignment_requests & consignors qua khóa ngoại
-- 6 trạng thái sản phẩm:
-- draft (Bản nháp), pending_review (Chờ duyệt), displaying (Đang trưng bày),
-- reserved (Đã có người nhận), completed (Đã hoàn tất), hidden (Ngừng hiển thị)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  consignment_request_id UUID REFERENCES public.consignment_requests(id) ON DELETE SET NULL,
  consignor_id UUID REFERENCES public.consignors(id) ON DELETE SET NULL,
  brand TEXT,
  size TEXT,
  color TEXT,
  material TEXT,
  condition_label TEXT,
  price NUMERIC(12, 0) NOT NULL DEFAULT 0,
  description TEXT,
  curator_note TEXT,
  showroom_location TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'pending_review', 'displaying', 'reserved', 'completed', 'hidden')
  ),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  seo_title TEXT,
  meta_description TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- 12. BẢNG HÌNH ẢNH SẢN PHẨM (product_images)
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. BẢNG DANH MỤC BÀI VIẾT JOURNAL (article_categories)
CREATE TABLE IF NOT EXISTS public.article_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. BẢNG BÀI VIẾT JOURNAL (articles)
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  thumbnail_url TEXT,
  category_id UUID REFERENCES public.article_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  author_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  seo_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);

-- 15. BẢNG ĐỐI TÁC ĐỒNG HÀNH (partners)
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. BẢNG HOẠT ĐỘNG CỘNG ĐỒNG & SỰ KIỆN (events)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'clothing_swap',
  description TEXT,
  thumbnail_url TEXT,
  event_date TIMESTAMPTZ,
  location TEXT,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'ended')),
  allow_registration BOOLEAN NOT NULL DEFAULT true,
  max_participants INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. BẢNG ĐĂNG KÝ THAM GIA SỰ KIỆN CỘNG ĐỒNG (event_registrations)
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  items_count INTEGER DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. BẢNG YÊU CẦU LIÊN HỆ & HỎI THÔNG TIN SẢN PHẨM (contacts)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processing', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 19. BẢNG CẤU HÌNH WEBSITE (settings)
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  group_name TEXT NOT NULL DEFAULT 'general',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20. BẢNG THƯ VIỆN HÌNH ẢNH & TÀI LIỆU (media)
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  alt_text TEXT,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 21. BẢNG THÔNG TIN SEO (seo_metadata)
CREATE TABLE IF NOT EXISTS public.seo_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT UNIQUE NOT NULL,
  seo_title TEXT NOT NULL,
  meta_description TEXT,
  og_image_url TEXT,
  schema_json JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- CẤU HÌNH ROW LEVEL SECURITY (RLS) CHO SUPABASE
-- Cho phép đọc công khai các dữ liệu hiển thị và gửi form ký gửi/liên hệ/RSVP,
-- đồng thời cho phép thao tác quản trị khi thử nghiệm hoặc qua Service Role.
-- ============================================================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consignors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consignment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consignment_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;

-- Policy cho phép đọc/ghi thuận tiện trong quá trình phát triển & test
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all access for AgainStore" ON public.%I;', t);
    EXECUTE format('CREATE POLICY "Allow all access for AgainStore" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t);
  END LOOP;
END
$$;
