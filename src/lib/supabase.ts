import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Kiểm tra xem biến môi trường Supabase đã được cấu hình hợp lệ hay chưa
 */
export function isSupabaseConfigured(): boolean {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl.startsWith("http") &&
    !supabaseUrl.includes("your-project-id")
  );
}

let browserClient: SupabaseClient | null = null;

/**
 * Instance Supabase Client trực tiếp (dùng trong các trang Admin/Client sau khi kiểm tra isSupabaseConfigured())
 */
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? supabaseUrl : "https://placeholder.supabase.co",
  isSupabaseConfigured() ? supabaseAnonKey : "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/**
 * Client dùng cho cả Client Components và Server Components thông thường
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return browserClient;
}

/**
 * Admin Client dùng phía Server (ưu tiên Service Role Key nếu có, fallback về Anon Key)
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const key =
    supabaseServiceKey && !supabaseServiceKey.includes("your-service-role")
      ? supabaseServiceKey
      : supabaseAnonKey;

  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Hàm tiện ích sinh mã yêu cầu ký gửi tự động (#CR-YYYY-XXXX)
 */
export function generateConsignmentCode(): string {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `CR-${year}-${randomDigits}`;
}

/**
 * Hàm tiện ích sinh mã sản phẩm tự động (#AS-ARC-XXXX)
 */
export function generateProductCode(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `AS-ARC-${randomDigits}`;
}

/**
 * Hàm tiện ích chuẩn hóa chuỗi tiếng Việt sang URL Slug
 */
export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Hàm định dạng tiền tệ VNĐ
 */
export function formatVND(amount: number | string | null | undefined): string {
  const num = Number(amount || 0);
  return new Intl.NumberFormat("vi-VN").format(num) + "đ";
}
