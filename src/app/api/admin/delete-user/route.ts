import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, userEmail, currentAdminEmail } = body;

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "Thiếu thông tin người dùng cần xóa." },
        { status: 400 }
      );
    }

    // Kiểm tra không cho phép tự xóa tài khoản của chính Admin đang đăng nhập
    if (
      currentAdminEmail &&
      userEmail.trim().toLowerCase() === currentAdminEmail.trim().toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Bạn không thể tự xóa tài khoản của chính mình." },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Chưa cấu hình Supabase hợp lệ trong .env." },
        { status: 500 }
      );
    }

    // 1. Xóa hồ sơ trong bảng public.users
    const { error: dbError } = await adminClient
      .from("users")
      .delete()
      .eq("id", userId);

    if (dbError) {
      return NextResponse.json(
        { error: `Lỗi khi xóa trong Database: ${dbError.message}` },
        { status: 400 }
      );
    }

    // 2. Xóa tài khoản đăng nhập trong auth.users
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
    if (authError) {
      console.warn("Lỗi xóa trong auth.users (có thể user chưa có trong Auth):", authError.message);
    }

    return NextResponse.json({
      success: true,
      message: `Đã xóa tài khoản ${userEmail} khỏi hệ thống.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
