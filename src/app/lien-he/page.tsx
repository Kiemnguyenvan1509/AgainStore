"use client";

import React, { useEffect, useState } from "react";
import { MapPin, Phone, Mail, Clock, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getSupabaseClient } from "@/lib/supabase";

export default function ContactPage() {
  const [storeInfo, setStoreInfo] = useState({
    brandName: "AGAIN STORE — Circular Fashion & Consignment Platform",
    address: "403/34 Đ. TTH21, Tân Thới Hiệp, Hồ Chí Minh, Việt Nam",
    hotline: "0909 888 777",
    email: "curator@againstore.vn",
    hours: "09:30 – 21:00 (Thứ 2 – Chủ nhật)",
    facebook: "https://www.facebook.com/shop2handgiarehcm",
    tiktok: "https://tiktok.com",
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.343737439176!2d106.63179467480653!3d10.861438889292717!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317529d7c51fac99%3A0x6a1c898ab4399784!2zQWdhaW4gU3RvcmUg4oCTIFNob3AgxJDhu5MgMmhhbmQgU-G7iSAmIEzhursgMTBLIDIwSyBTw6BpIEfDsm4!5e0!3m2!1svi!2s!4v1794216904640!5m2!1svi!2s",
  });

  // Form liên hệ gồm: Họ tên, số điện thoại, email, chủ đề, nội dung (Mục II.8 đặc tả)
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "site_info")
        .maybeSingle();

      if (data?.value && typeof data.value === "object") {
        const val = data.value as Record<string, string>;
        setStoreInfo((prev) => ({
          ...prev,
          brandName: val.store_name || val.brandName || prev.brandName,
          address: val.showroom_address || val.address || prev.address,
          hotline: val.hotline || prev.hotline,
          email: val.email || prev.email,
          hours: val.opening_hours || val.hours || prev.hours,
          facebook: val.facebook_url || val.facebook || prev.facebook,
          tiktok: val.tiktok_url || val.tiktok || prev.tiktok,
        }));
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrorMsg("Chưa kết nối Supabase trong .env.local.");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("contacts").insert({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        subject: subject.trim(),
        message: message.trim(),
        status: "new",
      });

      if (error) throw new Error(error.message);
      setSentSuccess(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi khi gửi liên hệ.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <SiteHeader />

      <main className="w-full pt-28 flex-1">
        {/* Hero */}
        <section className="w-full bg-surface-container-low py-16 lg:py-20 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto space-y-5">
            <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
              LIÊN HỆ &amp; SHOWROOM • CONTACT US
            </span>
            <h1 className="font-display-lg text-4xl sm:text-5xl lg:text-6xl text-primary tracking-tight">
              LET&apos;S START A CONVERSATION.
            </h1>
            <p className="font-body-lg text-on-surface-variant max-w-2xl">
              Kết nối với đội ngũ AGAIN STORE để được tư vấn về dịch vụ ký gửi, thông tin sản phẩm Second Life hoặc hợp tác cộng đồng.
            </p>
          </div>
        </section>

        {/* Main 2-Column Content */}
        <section className="w-full py-16 px-6 lg:px-16">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Store Info & Map */}
            <div className="lg:col-span-5 space-y-8">
              <div className="p-8 bg-surface-container-low border border-outline-variant/50 space-y-5">
                <h2 className="font-headline-md text-2xl text-primary">
                  {storeInfo.brandName}
                </h2>

                <div className="space-y-4 font-body-sm text-on-surface-variant">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-primary block">Địa chỉ cửa hàng:</strong>
                      <span>{storeInfo.address}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-primary block">Hotline:</strong>
                      <span>{storeInfo.hotline}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-primary block">Email:</strong>
                      <span>{storeInfo.email}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-primary block">Giờ hoạt động:</strong>
                      <span>{storeInfo.hours}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-outline-variant/40 space-y-2">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary block">
                    Mạng xã hội chính thức
                  </span>
                  <div className="flex items-center gap-6 font-label-md text-label-md uppercase text-primary">
                    <a href={storeInfo.facebook} target="_blank" rel="noreferrer" className="underline hover:text-secondary">
                      Facebook
                    </a>
                    <a href={storeInfo.tiktok} target="_blank" rel="noreferrer" className="underline hover:text-secondary">
                      TikTok
                    </a>
                  </div>
                </div>
              </div>

              {/* Google Maps */}
              <div className="aspect-[16/10] bg-surface-container border border-outline-variant/50 overflow-hidden">
                <iframe
                  title="AGAIN STORE Google Maps"
                  src={storeInfo.mapEmbedUrl}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="lg:col-span-7 bg-surface-container-low p-8 lg:p-12 border border-outline-variant/50 space-y-6">
              <div className="space-y-2">
                <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                  BIỂU MẪU LIÊN HỆ
                </span>
                <h2 className="font-headline-lg text-3xl text-primary">
                  Gửi tin nhắn cho chúng tôi
                </h2>
              </div>

              {sentSuccess ? (
                <div className="p-8 bg-surface border border-secondary text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
                  <h3 className="font-headline-sm text-xl text-primary">
                    Đã gửi liên hệ thành công!
                  </h3>
                  <p className="font-body-sm text-on-surface-variant">
                    Cảm ơn bạn đã liên hệ với AGAIN STORE. Chúng tôi đã ghi nhận thông tin và sẽ phản hồi sớm nhất.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {errorMsg && (
                    <p className="p-3 bg-error-container text-on-error-container font-body-sm">
                      {errorMsg}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block font-label-md text-label-md uppercase tracking-wider text-primary">
                        Họ tên *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nhập họ và tên"
                        className="w-full px-4 py-3 bg-surface border border-outline-variant focus:border-primary focus:outline-none font-body-md"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-label-md text-label-md uppercase tracking-wider text-primary">
                        Số điện thoại *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Nhập số điện thoại"
                        className="w-full px-4 py-3 bg-surface border border-outline-variant focus:border-primary focus:outline-none font-body-md"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block font-label-md text-label-md uppercase tracking-wider text-primary">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full px-4 py-3 bg-surface border border-outline-variant focus:border-primary focus:outline-none font-body-md"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-label-md text-label-md uppercase tracking-wider text-primary">
                        Chủ đề *
                      </label>
                      <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Tư vấn ký gửi / Hỏi sản phẩm / Hợp tác..."
                        className="w-full px-4 py-3 bg-surface border border-outline-variant focus:border-primary focus:outline-none font-body-md"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-label-md text-label-md uppercase tracking-wider text-primary">
                      Nội dung *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Nhập nội dung tin nhắn của bạn..."
                      className="w-full px-4 py-3 bg-surface border border-outline-variant focus:border-primary focus:outline-none font-body-md"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-4 bg-primary text-surface-container-lowest font-label-md text-label-md uppercase tracking-widest hover:bg-secondary transition-colors"
                  >
                    {sending ? "Đang gửi..." : "Gửi tin nhắn liên hệ"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
