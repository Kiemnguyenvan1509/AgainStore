"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { ContactSubmission, Role, UserProfile } from "@/types/database";

export default function AdminSettingsPage() {
  const configured = isSupabaseConfigured();
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  // Form tự đổi mật khẩu cá nhân
  const [passwordChange, setPasswordChange] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);

  // Site info settings (stored in public.settings with key = 'site_info')
  const [siteInfo, setSiteInfo] = useState({
    store_name: "Again Store — Circular Fashion & Consignment",
    hotline: "0909 888 777",
    email: "curator@againstore.vn",
    showroom_address: "28 Thảo Điền, Phường Thảo Điền, TP. Thủ Đức, TP.HCM",
    opening_hours: "09:30 – 20:30 (Thứ Hai – Chủ Nhật)",
    tiktok_url: "https://www.tiktok.com",
    facebook_url: "https://www.facebook.com/shop2handgiarehcm",
    zalo_url: "https://zalo.me/0909888777",
  });

  // Pricing policy tiers
  const [pricingTiers, setPricingTiers] = useState([
    { tier: "Dưới 500.000đ", consignor: "65%", fee: "35%" },
    { tier: "500.000đ – 2.000.000đ", consignor: "75%", fee: "25%" },
    { tier: "Trên 2.000.000đ (Archive/Luxury)", consignor: "80%", fee: "20%" },
  ]);
  const [userForm, setUserForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role_id: "",
  });

  const fetchData = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Lấy thông tin user hiện tại đang đăng nhập
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser?.user?.email) {
        const userEmail = authUser.user.email.trim();
        setCurrentUserEmail(userEmail);
        
        // Tìm profile theo email không phân biệt chữ hoa/thường (ilike)
        const { data: profile } = await supabase
          .from("users")
          .select("*, roles(*)")
          .ilike("email", userEmail)
          .maybeSingle();

        if (profile?.roles?.code) {
          setCurrentUserRole(profile.roles.code);
        } else {
          // Mặc định an toàn là nhân viên thường nếu không tìm thấy role
          setCurrentUserRole("staff");
        }
      } else {
        setCurrentUserRole("staff");
      }

      const [roleRes, userRes, contactRes, settingRes] = await Promise.all([
        supabase.from("roles").select("*").order("name", { ascending: true }),
        supabase
          .from("users")
          .select("*, roles(*)")
          .order("created_at", { ascending: false }),
        supabase
          .from("contacts")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("settings")
          .select("*")
          .in("key", ["site_info", "consignment_pricing"]),
      ]);

      if (roleRes.data) {
        const rList = roleRes.data as Role[];
        setRoles(rList);
        if (!userForm.role_id && rList.length > 0) {
          setUserForm((prev) => ({ ...prev, role_id: rList[0].id }));
        }
      }
      if (userRes.data) setUsers(userRes.data as UserProfile[]);
      if (contactRes.data) setContacts(contactRes.data as ContactSubmission[]);
      if (settingRes.data) {
        for (const row of settingRes.data) {
          if (row.key === "site_info" && row.value) {
            setSiteInfo((prev) => ({
              ...prev,
              ...(row.value as Record<string, string>),
            }));
          } else if (row.key === "consignment_pricing" && row.value?.tiers) {
            setPricingTiers(row.value.tiers);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [configured, userForm.role_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveSiteInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) return;
    setSaving(true);
    setFeedback(null);
    try {
      const { error } = await supabase.from("settings").upsert(
        {
          key: "site_info",
          value: siteInfo,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
      if (error) throw error;
      setFeedback("Đã lưu cấu hình thông tin Showroom & Website thành công.");
    } catch (err: unknown) {
      setFeedback(
        `Lỗi: ${err instanceof Error ? err.message : "Không thể lưu cấu hình"}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) return;
    setSaving(true);
    setFeedback(null);
    try {
      const { error } = await supabase.from("settings").upsert(
        {
          key: "consignment_pricing",
          value: { tiers: pricingTiers },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
      if (error) throw error;
      setFeedback("Đã lưu bảng tỷ lệ chiết khấu ký gửi thành công.");
    } catch (err: unknown) {
      setFeedback(
        `Lỗi: ${err instanceof Error ? err.message : "Không thể lưu bảng giá"}`
      );
    } finally {
      setSaving(false);
    }
  };
  const handleSelfChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) return;
    setPasswordFeedback(null);

    if (passwordChange.newPassword.length < 6) {
      setPasswordFeedback("Lỗi: Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }

    if (passwordChange.newPassword !== passwordChange.confirmPassword) {
      setPasswordFeedback("Lỗi: Xác nhận mật khẩu mới không trùng khớp.");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordChange.newPassword,
      });

      if (error) throw error;

      setPasswordChange({ newPassword: "", confirmPassword: "" });
      setPasswordFeedback("Đổi mật khẩu tài khoản thành công!");
    } catch (err: unknown) {
      setPasswordFeedback(
        `Lỗi: ${err instanceof Error ? err.message : "Không thể đổi mật khẩu"}`
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Không thể tạo tài khoản");
      }

      setUserForm({
        email: "",
        password: "",
        full_name: "",
        phone: "",
        role_id: roles[0]?.id || "",
      });
      setFeedback(result.message || "Đã tạo tài khoản quản trị thành công!");
      await fetchData();
    } catch (err: unknown) {
      setFeedback(
        `Lỗi: ${
          err instanceof Error ? err.message : "Không thể tạo tài khoản"
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!configured) return;
    if (
      currentUserEmail &&
      userEmail.trim().toLowerCase() === currentUserEmail.trim().toLowerCase()
    ) {
      alert("Bạn không thể tự xóa tài khoản của chính mình!");
      return;
    }

    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa tài khoản "${userEmail}" khỏi hệ thống không?`
      )
    ) {
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userEmail,
          currentAdminEmail: currentUserEmail,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Không thể xóa nhân sự");
      }

      setFeedback(result.message || "Đã xóa tài khoản thành công!");
      await fetchData();
    } catch (err: unknown) {
      setFeedback(
        `Lỗi: ${err instanceof Error ? err.message : "Không thể xóa nhân sự"}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateContactStatus = async (
    id: string,
    status: "new" | "processing" | "resolved"
  ) => {
    if (!configured) return;
    await supabase.from("contacts").update({ status }).eq("id", id);
    await fetchData();
  };

  return (
    <AdminShell
      title="Cấu hình hệ thống, Liên hệ & Phân quyền"
      subtitle="Module 7: Quản lý thông tin Showroom, hộp thư liên hệ của khách hàng và phân quyền 3 cấp (Super Admin, Admin, Nhân viên)."
    >
      {feedback && (
        <div className="p-3.5 mb-6 bg-secondary-fixed/50 text-primary text-xs font-medium border border-outline-variant/30">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Site Settings & Role Matrix (5 cols) */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant/25 p-6">
            <h2 className="font-serif text-xl text-primary border-b border-outline-variant/20 pb-3 mb-4">
              Thông tin Showroom & Liên hệ chung
            </h2>
            <form onSubmit={handleSaveSiteInfo} className="space-y-3.5 text-xs">
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Tên thương hiệu hiển thị
                </label>
                <input
                  type="text"
                  value={siteInfo.store_name}
                  onChange={(e) =>
                    setSiteInfo({ ...siteInfo, store_name: e.target.value })
                  }
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                    Hotline Showroom
                  </label>
                  <input
                    type="text"
                    value={siteInfo.hotline}
                    onChange={(e) =>
                      setSiteInfo({ ...siteInfo, hotline: e.target.value })
                    }
                    className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                    Email chính thức
                  </label>
                  <input
                    type="email"
                    value={siteInfo.email}
                    onChange={(e) =>
                      setSiteInfo({ ...siteInfo, email: e.target.value })
                    }
                    className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Địa chỉ Showroom
                </label>
                <input
                  type="text"
                  value={siteInfo.showroom_address}
                  onChange={(e) =>
                    setSiteInfo({
                      ...siteInfo,
                      showroom_address: e.target.value,
                    })
                  }
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                />
              </div>
              <div>
                <label className="block uppercase tracking-wider text-on-surface-variant mb-1">
                  Giờ mở cửa
                </label>
                <input
                  type="text"
                  value={siteInfo.opening_hours}
                  onChange={(e) =>
                    setSiteInfo({ ...siteInfo, opening_hours: e.target.value })
                  }
                  className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="url"
                  value={siteInfo.tiktok_url || ""}
                  onChange={(e) =>
                    setSiteInfo({ ...siteInfo, tiktok_url: e.target.value })
                  }
                  placeholder="TikTok URL"
                  className="bg-surface border border-outline-variant/40 px-2.5 py-2"
                />
                <input
                  type="url"
                  value={siteInfo.facebook_url || ""}
                  onChange={(e) =>
                    setSiteInfo({ ...siteInfo, facebook_url: e.target.value })
                  }
                  placeholder="Facebook URL"
                  className="bg-surface border border-outline-variant/40 px-2.5 py-2"
                />
                <input
                  type="url"
                  value={siteInfo.zalo_url || ""}
                  onChange={(e) =>
                    setSiteInfo({ ...siteInfo, zalo_url: e.target.value })
                  }
                  placeholder="Zalo URL"
                  className="bg-surface border border-outline-variant/40 px-2.5 py-2"
                />
              </div>
              <button
                type="submit"
                disabled={saving || !configured}
                className="w-full bg-primary text-on-primary py-3 text-xs uppercase tracking-widest font-semibold hover:bg-primary-container transition-colors disabled:opacity-40"
              >
                Lưu thông tin Website
              </button>
            </form>
          </div>

          {/* Form chỉnh sửa Bảng tỷ lệ & Biểu phí ký gửi */}
          <div className="bg-surface-container-lowest border border-outline-variant/25 p-6">
            <h2 className="font-serif text-xl text-primary border-b border-outline-variant/20 pb-3 mb-4">
              Bảng tỷ lệ chiết khấu ký gửi (Trang /dich-vu-ky-gui)
            </h2>
            <form onSubmit={handleSavePricing} className="space-y-4 text-xs">
              <div className="space-y-3">
                {pricingTiers.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-surface-container-low border border-outline-variant/30 space-y-2"
                  >
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-0.5">
                        Nhóm giá niêm yết
                      </label>
                      <input
                        type="text"
                        value={item.tier}
                        onChange={(e) => {
                          const updated = [...pricingTiers];
                          updated[index].tier = e.target.value;
                          setPricingTiers(updated);
                        }}
                        className="w-full bg-surface border border-outline-variant/40 px-2.5 py-1.5 font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-0.5">
                          Khách nhận (%)
                        </label>
                        <input
                          type="text"
                          value={item.consignor}
                          onChange={(e) => {
                            const updated = [...pricingTiers];
                            updated[index].consignor = e.target.value;
                            setPricingTiers(updated);
                          }}
                          className="w-full bg-surface border border-outline-variant/40 px-2.5 py-1.5"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-0.5">
                          Phí dịch vụ (%)
                        </label>
                        <input
                          type="text"
                          value={item.fee}
                          onChange={(e) => {
                            const updated = [...pricingTiers];
                            updated[index].fee = e.target.value;
                            setPricingTiers(updated);
                          }}
                          className="w-full bg-surface border border-outline-variant/40 px-2.5 py-1.5"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={saving || !configured}
                className="w-full bg-primary text-on-primary py-3 text-xs uppercase tracking-widest font-semibold hover:bg-primary-container transition-colors disabled:opacity-40"
              >
                Lưu bảng tỷ lệ chiết khấu
              </button>
            </form>
          </div>

          {/* 3-Role Permission Matrix Info */}
          <div className="bg-surface-container-low border border-outline-variant/25 p-6 text-xs space-y-3">
            <h3 className="font-serif text-lg text-primary">
              Ma trận phân quyền 3 cấp (Theo đặc tả)
            </h3>
            <div className="p-3 bg-surface-container-lowest border-l-2 border-primary">
              <strong className="text-primary block">
                1. Super Admin (super_admin)
              </strong>
              <span className="text-on-surface-variant">
                Toàn quyền quản trị hệ thống, cấu hình website, phân quyền tài
                khoản và xuất dữ liệu.
              </span>
            </div>
            <div className="p-3 bg-surface-container-lowest border-l-2 border-secondary">
              <strong className="text-primary block">
                2. Admin Quản lý (admin)
              </strong>
              <span className="text-on-surface-variant">
                Quản lý nội dung các trang, duyệt sản phẩm Second Life, duyệt
                phiếu ký gửi, bài viết Journal và sự kiện cộng đồng.
              </span>
            </div>
            <div className="p-3 bg-surface-container-lowest border-l-2 border-outline">
              <strong className="text-primary block">
                3. Nhân viên phụ trách (staff)
              </strong>
              <span className="text-on-surface-variant">
                Tiếp nhận và xử lý yêu cầu ký gửi được phân công, cập nhật trạng
                thái kiểm định và khởi tạo sản phẩm nháp.
              </span>
            </div>
          </div>
        </div>

        {/* Right: User Management & Customer Contact Inbox (7 cols) */}
        <div className="xl:col-span-7 space-y-6">
          {/* Mục tự đổi mật khẩu cá nhân cho mọi Role */}
          <div className="bg-surface-container-lowest border border-outline-variant/25 p-6">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 mb-2">
              <h2 className="font-serif text-xl text-primary">
                Đổi mật khẩu tài khoản của bạn
              </h2>
              {currentUserEmail && (
                <span className="text-[11px] font-mono text-secondary px-2 py-0.5 bg-surface-container-high">
                  {currentUserEmail}
                </span>
              )}
            </div>
            <p className="text-[11px] text-on-surface-variant mb-4">
              Mọi tài khoản (Admin, Nhân viên) đều có thể tự thay đổi mật khẩu đăng nhập tại đây.
            </p>

            <form onSubmit={handleSelfChangePassword} className="space-y-3 text-xs bg-surface-container-low p-4 border border-outline-variant/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1 font-semibold">
                    Mật khẩu mới *
                  </label>
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={passwordChange.newPassword}
                    onChange={(e) =>
                      setPasswordChange({ ...passwordChange, newPassword: e.target.value })
                    }
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1 font-semibold">
                    Xác nhận mật khẩu mới *
                  </label>
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={passwordChange.confirmPassword}
                    onChange={(e) =>
                      setPasswordChange({ ...passwordChange, confirmPassword: e.target.value })
                    }
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                  />
                </div>
              </div>

              {passwordFeedback && (
                <div
                  className={`p-2.5 text-xs font-medium border ${
                    passwordFeedback.startsWith("Lỗi")
                      ? "bg-error-container text-on-error-container border-error/30"
                      : "bg-secondary-fixed text-primary border-primary/20"
                  }`}
                >
                  {passwordFeedback}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={changingPassword || !configured}
                  className="bg-secondary text-on-secondary px-5 py-2 text-xs uppercase tracking-widest font-semibold hover:bg-primary transition-colors disabled:opacity-50"
                >
                  {changingPassword ? "Đang cập nhật..." : "CẬP NHẬT MẬT KHẨU MỚI"}
                </button>
              </div>
            </form>
          </div>

          {/* Add Staff / Admin - CHỈ HIỂN THỊ KHI LÀ ADMIN HOẶC SUPER_ADMIN */}
          {currentUserRole !== "staff" ? (
            <div className="bg-surface-container-lowest border border-outline-variant/25 p-6">
              <h2 className="font-serif text-xl text-primary border-b border-outline-variant/20 pb-3 mb-2">
                Đăng ký tài khoản Quản trị & Phân quyền ({users.length})
              </h2>
              <p className="text-[11px] text-on-surface-variant mb-4">
                (Chức năng dành riêng cho Admin): Tạo tài khoản đăng nhập trực tiếp vào hệ thống CMS (/admin/login) kèm mật khẩu và phân quyền tương ứng.
              </p>
              <form
                onSubmit={handleCreateUser}
                className="space-y-3 text-xs mb-6 bg-surface-container-low p-4 border border-outline-variant/30"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1 font-semibold">
                      Họ và tên *
                    </label>
                    <input
                      required
                      type="text"
                      value={userForm.full_name}
                      onChange={(e) =>
                        setUserForm({ ...userForm, full_name: e.target.value })
                      }
                      placeholder="Nguyễn Văn A"
                      className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1 font-semibold">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={userForm.phone}
                      onChange={(e) =>
                        setUserForm({ ...userForm, phone: e.target.value })
                      }
                      placeholder="0901234567"
                      className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1 font-semibold">
                      Email đăng nhập *
                    </label>
                    <input
                      required
                      type="email"
                      value={userForm.email}
                      onChange={(e) =>
                        setUserForm({ ...userForm, email: e.target.value })
                      }
                      placeholder="staff@againstore.vn"
                      className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1 font-semibold">
                      Mật khẩu khởi tạo *
                    </label>
                    <input
                      required
                      type="password"
                      minLength={6}
                      value={userForm.password}
                      onChange={(e) =>
                        setUserForm({ ...userForm, password: e.target.value })
                      }
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1 font-semibold">
                      Vai trò (Phân quyền) *
                    </label>
                    <select
                      value={userForm.role_id}
                      onChange={(e) =>
                        setUserForm({ ...userForm, role_id: e.target.value })
                      }
                      className="w-full bg-surface border border-outline-variant/40 px-3 py-2"
                    >
                      <option value="">-- Chọn vai trò --</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving || !configured}
                    className="bg-primary text-on-primary px-6 py-2.5 text-xs uppercase tracking-widest font-semibold hover:bg-primary-container transition-colors disabled:opacity-50"
                  >
                    {saving ? "Đang khởi tạo tài khoản..." : "+ ĐĂNG KÝ TÀI KHOẢN MỚI"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-surface-container-low border border-outline-variant/25 p-4 text-xs text-on-surface-variant">
              <em>Bạn đang đăng nhập với vai trò Nhân viên (Staff). Chức năng tạo tài khoản và phân quyền mới chỉ dành riêng cho Admin.</em>
            </div>
          )}

          {/* Bảng danh sách nhân sự */}
          <div className="bg-surface-container-lowest border border-outline-variant/25 p-6">
            <h3 className="font-serif text-lg text-primary border-b border-outline-variant/20 pb-2 mb-4">
              Danh sách nhân sự & Trạng thái hoạt động ({users.length})
            </h3>
            {loading ? (
              <div className="py-6 text-center text-xs text-on-surface-variant">
                Đang tải danh sách nhân sự...
              </div>
            ) : users.length === 0 ? (
              <div className="p-6 bg-surface-container-low text-center text-xs text-on-surface-variant">
                Chưa có hồ sơ nhân sự nào trong bảng <code>public.users</code>.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant/20 bg-surface-container-low text-[10px] uppercase tracking-widest text-on-surface-variant">
                      <th className="py-2.5 px-4">Họ tên</th>
                      <th className="py-2.5 px-4">Email</th>
                      <th className="py-2.5 px-4">Vai trò (Role)</th>
                      <th className="py-2.5 px-4">Trạng thái</th>
                      {currentUserRole !== "staff" && (
                        <th className="py-2.5 px-4 text-right">Thao tác</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15">
                    {users.map((u) => {
                      const isSelf =
                        currentUserEmail &&
                        u.email.trim().toLowerCase() ===
                          currentUserEmail.trim().toLowerCase();

                      return (
                        <tr key={u.id}>
                          <td className="py-3 px-4 font-medium text-primary">
                            {u.full_name}
                            {isSelf && (
                              <span className="ml-2 text-[10px] text-secondary font-normal">
                                (Bạn)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">{u.email}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-surface-container-high text-primary text-[10px] uppercase tracking-wider font-semibold">
                              {u.roles?.name || "Nhân viên"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {u.is_active ? "Đang hoạt động" : "Tạm khóa"}
                          </td>
                          {currentUserRole !== "staff" && (
                            <td className="py-3 px-4 text-right">
                              {isSelf ? (
                                <span className="text-[10px] text-on-surface-variant italic">
                                  Tài khoản hiện tại
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u.id, u.email)}
                                  className="text-error hover:underline font-semibold text-[11px]"
                                  title="Xóa tài khoản này khỏi hệ thống"
                                >
                                  Xóa
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Customer Contact & Product Inquiry Inbox */}
          <div className="bg-surface-container-lowest border border-outline-variant/25 p-6">
            <h2 className="font-serif text-xl text-primary border-b border-outline-variant/20 pb-3 mb-4">
              Hộp thư Liên hệ & Đặt lịch xem đồ ({contacts.length})
            </h2>
            {contacts.length === 0 ? (
              <div className="p-8 text-center text-xs text-on-surface-variant">
                Chưa có tin nhắn liên hệ hoặc yêu cầu giữ sản phẩm nào từ khách
                hàng.
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/15">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">
                          {c.full_name}
                        </span>
                        <span className="text-on-surface-variant">
                          • {c.phone}
                        </span>
                        {c.email && (
                          <span className="text-on-surface-variant">
                            • {c.email}
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-secondary mt-1">
                        Chủ đề: {c.subject}
                      </div>
                      <p className="text-on-surface mt-1">{c.message}</p>
                    </div>
                    <div className="shrink-0">
                      <select
                        value={c.status}
                        onChange={(e) =>
                          handleUpdateContactStatus(
                            c.id,
                            e.target.value as "new" | "processing" | "resolved"
                          )
                        }
                        className="bg-surface border border-outline-variant/40 px-2.5 py-1.5 text-[11px]"
                      >
                        <option value="new">Mới nhận</option>
                        <option value="processing">Đang phản hồi</option>
                        <option value="resolved">Đã xử lý xong</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
