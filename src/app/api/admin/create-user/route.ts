import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name, phone, role_id } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu phải có tối thiểu 6 ký tự." },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Chưa cấu hình Supabase hợp lệ trong .env.local." },
        { status: 500 }
      );
    }

    // 1. Tạo tài khoản trong Supabase Auth (auth.users) với email_confirm = true
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: email.trim(),
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name.trim(),
        },
      });

    if (authError) {
      return NextResponse.json(
        { error: `Lỗi Auth: ${authError.message}` },
        { status: 400 }
      );
    }

    const newUserId = authData.user?.id;

    // 2. Lưu thông tin hồ sơ và vai trò vào bảng public.users (sử dụng upsert để luôn đồng bộ cả id và email)
    const { error: dbError } = await adminClient.from("users").upsert(
      {
        id: newUserId,
        auth_user_id: newUserId,
        email: email.trim().toLowerCase(),
        full_name: full_name.trim(),
        phone: phone?.trim() || null,
        role_id: role_id || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    if (dbError) {
      // Nếu ghi profile lỗi thì xóa user auth vừa tạo để tránh rác
      if (newUserId) {
        await adminClient.auth.admin.deleteUser(newUserId);
      }
      return NextResponse.json(
        { error: `Lỗi Database: ${dbError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Đã tạo tài khoản quản trị thành công cho ${email}.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
