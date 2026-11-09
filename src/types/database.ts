export type ConsignmentStatus =
  | "pending_confirmation"
  | "confirmed"
  | "receiving"
  | "inspecting"
  | "approved"
  | "rejected";

export type ProductStatus =
  | "draft"
  | "pending_review"
  | "displaying"
  | "reserved"
  | "completed"
  | "hidden";

export type ArticleStatus = "draft" | "scheduled" | "published";

export type EventStatus = "upcoming" | "ongoing" | "ended";

export interface Role {
  id: string;
  code: "super_admin" | "admin" | "staff";
  name: string;
  permissions: Record<string, boolean>;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role_id?: string | null;
  is_active: boolean;
  created_at: string;
  roles?: Role | null;
}

export interface PageRecord {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  is_published: boolean;
  updated_at: string;
}

export interface PageSectionRecord {
  id: string;
  page_id: string;
  section_key: string;
  title?: string | null;
  subtitle?: string | null;
  content: Record<string, unknown>;
  desktop_banner_url?: string | null;
  mobile_banner_url?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Consignor {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  bank_name?: string | null;
  bank_account?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface ConsignmentImage {
  id: string;
  consignment_request_id: string;
  image_url: string;
  angle_label?: string | null;
  sort_order: number;
}

export interface ConsignmentHistory {
  id: string;
  consignment_request_id: string;
  old_status?: string | null;
  new_status: string;
  note?: string | null;
  changed_by?: string | null;
  created_at: string;
}

export interface ConsignmentRequest {
  id: string;
  request_code: string;
  consignor_id: string;
  category_name: string;
  brand_name?: string | null;
  quantity: number;
  condition_status: string;
  customer_note?: string | null;
  internal_note?: string | null;
  status: ConsignmentStatus;
  assigned_staff_id?: string | null;
  agreed_policy: boolean;
  created_at: string;
  updated_at: string;
  consignors?: Consignor | null;
  consignment_images?: ConsignmentImage[];
  consignment_history?: ConsignmentHistory[];
  users?: UserProfile | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface Product {
  id: string;
  product_code: string;
  title: string;
  slug: string;
  category_id?: string | null;
  consignment_request_id?: string | null;
  consignor_id?: string | null;
  brand?: string | null;
  size?: string | null;
  color?: string | null;
  material?: string | null;
  condition_label?: string | null;
  price: number;
  description?: string | null;
  curator_note?: string | null;
  showroom_location?: string | null;
  status: ProductStatus;
  is_featured: boolean;
  seo_title?: string | null;
  meta_description?: string | null;
  created_at: string;
  updated_at: string;
  categories?: Category | null;
  product_images?: ProductImage[];
  consignors?: Consignor | null;
  consignment_requests?: ConsignmentRequest | null;
}

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sort_order: number;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  thumbnail_url?: string | null;
  category_id?: string | null;
  author_name?: string | null;
  status: ArticleStatus;
  is_featured: boolean;
  published_at?: string | null;
  seo_title?: string | null;
  meta_description?: string | null;
  created_at: string;
  article_categories?: ArticleCategory | null;
}

export interface Partner {
  id: string;
  name: string;
  logo_url?: string | null;
  website_url?: string | null;
  description?: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface CommunityEvent {
  id: string;
  title: string;
  slug: string;
  event_type: string;
  description?: string | null;
  thumbnail_url?: string | null;
  event_date?: string | null;
  location?: string | null;
  partner_id?: string | null;
  status: EventStatus;
  allow_registration: boolean;
  max_participants?: number | null;
  created_at: string;
  partners?: Partner | null;
}

export interface ContactSubmission {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  subject: string;
  message: string;
  product_id?: string | null;
  status: "new" | "processing" | "resolved";
  created_at: string;
}

export const CONSIGNMENT_STATUS_LABELS: Record<ConsignmentStatus, string> = {
  pending_confirmation: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  receiving: "Đang tiếp nhận đồ",
  inspecting: "Đang kiểm tra",
  approved: "Đã duyệt ký gửi",
  rejected: "Đã từ chối / Đã hủy",
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Bản nháp",
  pending_review: "Chờ duyệt",
  displaying: "Đang trưng bày",
  reserved: "Đã có người nhận",
  completed: "Đã hoàn tất",
  hidden: "Ngừng hiển thị",
};
