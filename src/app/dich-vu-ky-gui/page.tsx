"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Upload, Plus, Trash2, AlertCircle, ShieldCheck, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getSupabaseClient, generateConsignmentCode } from "@/lib/supabase";

const PRODUCT_GROUPS = [
  "Áo (Áo sơ mi, Áo khoác, Blazer, Áo len...)",
  "Quần (Quần âu, Denim, Culottes...)",
  "Váy & Đầm thiết kế",
  "Giày dép tuyển chọn",
  "Túi xách & Ví da",
  "Phụ kiện (Khăn lụa, Thắt lưng, Mũ...)",
];

const CONDITION_OPTIONS = [
  "Mới nguyên tag (100% - New with tags)",
  "Như mới (95%–99% - Mặc 1–2 lần, không lỗi)",
  "Tình trạng tốt (85%–94% - Đã qua sử dụng, giữ phom tốt)",
];

export default function ConsignmentPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [categoryName, setCategoryName] = useState(PRODUCT_GROUPS[0]);
  const [brandName, setBrandName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [conditionStatus, setConditionStatus] = useState(CONDITION_OPTIONS[1]);
  const [customerNote, setCustomerNote] = useState("");
  const [agreedPolicy, setAgreedPolicy] = useState(false);

  // Hỗ trợ cả tải file lên Supabase Storage (bucket 'media') và nhập link ảnh trực tiếp
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const [pricingTiers, setPricingTiers] = useState([
    { tier: "Dưới 500.000đ", consignor: "65%", fee: "35%" },
    { tier: "500.000đ – 2.000.000đ", consignor: "75%", fee: "25%" },
    { tier: "Trên 2.000.000đ (Archive/Luxury)", consignor: "80%", fee: "20%" },
  ]);

  useEffect(() => {
    async function loadPricing() {
      const client = getSupabaseClient();
      if (!client) return;
      const { data } = await client
        .from("settings")
        .select("value")
        .eq("key", "consignment_pricing")
        .maybeSingle();
      if (data?.value?.tiers) {
        setPricingTiers(data.value.tiers);
      }
    }
    loadPricing();
  }, []);

  const handleAddImageInput = () => {
    setImageUrls((prev) => [...prev, ""]);
  };

  const handleImageChange = (index: number, value: string) => {
    setImageUrls((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const handleRemoveImageInput = (index: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrorMsg("Chưa cấu hình kết nối Supabase trong .env.local để tải ảnh lên Storage.");
      return;
    }

    setUploadingFile(true);
    setErrorMsg(null);
    const uploaded: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File "${file.name}" vượt quá dung lượng tối đa 5MB.`);
        }
        const ext = file.name.split(".").pop() || "jpg";
        const filePath = `consignments/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("products")
          .upload(filePath, file, { upsert: false });

        if (uploadErr) {
          throw new Error(
            `Không thể tải ảnh lên Supabase Storage (${uploadErr.message}).`
          );
        }

        const { data: pubData } = supabase.storage.from("products").getPublicUrl(filePath);
        if (pubData?.publicUrl) {
          uploaded.push(pubData.publicUrl);
        }
      }

      if (uploaded.length > 0) {
        setImageUrls((prev) => [...prev.filter((u) => u.trim() !== ""), ...uploaded]);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi khi tải ảnh lên.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !phone.trim()) {
      setErrorMsg("Vui lòng nhập đầy đủ Họ và tên cùng Số điện thoại liên hệ.");
      return;
    }
    if (!agreedPolicy) {
      setErrorMsg("Vui lòng tích chọn đồng ý với chính sách ký gửi của AGAIN STORE.");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrorMsg(
        "Chưa kết nối cơ sở dữ liệu Supabase. Vui lòng cấu hình NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trong file .env.local."
      );
      return;
    }

    setSubmitting(true);
    try {
      // 1. Tìm hoặc tạo bản ghi Người gửi đồ (consignors) theo số điện thoại
      let consignorId: string | null = null;
      const { data: existingConsignor } = await supabase
        .from("consignors")
        .select("id")
        .eq("phone", phone.trim())
        .maybeSingle();

      if (existingConsignor?.id) {
        consignorId = existingConsignor.id;
      } else {
        const { data: newConsignor, error: consignorErr } = await supabase
          .from("consignors")
          .insert({
            full_name: fullName.trim(),
            phone: phone.trim(),
            email: email.trim() || null,
          })
          .select("id")
          .single();

        if (consignorErr || !newConsignor) {
          throw new Error(consignorErr?.message || "Không thể lưu thông tin người gửi.");
        }
        consignorId = newConsignor.id;
      }

      // 2. Sinh mã yêu cầu ký gửi tự động & lưu vào bảng consignment_requests
      const requestCode = generateConsignmentCode();
      const { data: requestRow, error: reqErr } = await supabase
        .from("consignment_requests")
        .insert({
          request_code: requestCode,
          consignor_id: consignorId,
          category_name: categoryName,
          brand_name: brandName.trim() || null,
          quantity: Number(quantity) || 1,
          condition_status: conditionStatus,
          customer_note: customerNote.trim() || null,
          status: "pending_confirmation",
          agreed_policy: agreedPolicy,
        })
        .select("id, request_code")
        .single();

      if (reqErr || !requestRow) {
        throw new Error(reqErr?.message || "Không thể tạo yêu cầu ký gửi.");
      }

      // 3. Lưu danh sách hình ảnh sản phẩm (nếu có) vào bảng consignment_images
      const validImages = imageUrls.map((u) => u.trim()).filter(Boolean);
      if (validImages.length > 0) {
        await supabase.from("consignment_images").insert(
          validImages.map((url, idx) => ({
            consignment_request_id: requestRow.id,
            image_url: url,
            angle_label: `Ảnh ${idx + 1}`,
            sort_order: idx,
          }))
        );
      }

      // 4. Lưu lịch sử trạng thái ban đầu vào bảng consignment_history
      await supabase.from("consignment_history").insert({
        consignment_request_id: requestRow.id,
        old_status: null,
        new_status: "pending_confirmation",
        note: "Khách hàng gửi biểu mẫu đăng ký ký gửi trực tuyến.",
      });

      setCreatedCode(requestRow.request_code);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Đã xảy ra lỗi khi gửi yêu cầu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <SiteHeader />

      <main className="w-full pt-28 flex-1">
        {/* SECTION 1: BANNER */}
        <section className="w-full bg-surface-container-low py-16 lg:py-24 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto space-y-6">
            <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
              DỊCH VỤ KÝ GỬI • CONSIGNMENT SERVICE
            </span>
            <h1 className="font-display-lg text-4xl sm:text-5xl lg:text-6xl text-primary tracking-tight max-w-4xl">
              MAKE ROOM FOR NEW STORIES.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Giải phóng tủ đồ cá nhân một cách có trách nhiệm. Chúng tôi tiếp nhận, kiểm định, định giá minh bạch và giúp trang phục của bạn tìm thấy người chủ mới phù hợp.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <a
                href="#form-ky-gui"
                className="px-8 py-4 bg-primary text-surface-container-lowest font-label-md text-label-md uppercase tracking-widest hover:bg-secondary transition-colors"
              >
                Đăng ký gửi đồ ngay
              </a>
              <Link
                href="/tra-cuu-ky-gui"
                className="px-8 py-4 border border-primary text-primary font-label-md text-label-md uppercase tracking-widest hover:bg-primary hover:text-surface-container-lowest transition-colors"
              >
                Tra cứu mã ký gửi
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 2 & 3: GIỚI THIỆU & QUYỀN LỢI NGƯỜI GỬI ĐỒ */}
        <section className="w-full py-20 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="max-w-3xl space-y-3">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                01 / KÝ GỬI TẠI AGAIN STORE LÀ GÌ? &amp; QUYỀN LỢI
              </span>
              <h2 className="font-headline-lg text-3xl text-primary">
                Ký gửi tại AGAIN STORE có gì khác biệt?
              </h2>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                Không chỉ là nơi nhận bán hộ, AGAIN STORE thực hiện đầy đủ các khâu từ kiểm tra chất lượng, làm sạch cơ bản, chụp ảnh editorial đến trưng bày trên chuyên trang Second Life.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "Tối ưu giá trị tủ đồ",
                  desc: "Định giá sát với chất lượng, chất liệu và giá trị thương hiệu gốc của từng sản phẩm.",
                },
                {
                  title: "Tiết kiệm thời gian",
                  desc: "Bạn không cần tự chụp ảnh, trả lời tin nhắn hay đóng gói lẻ từng món đồ.",
                },
                {
                  title: "Theo dõi mã yêu cầu",
                  desc: "Mỗi đợt ký gửi đều sinh mã tự động (#CR-...) để tra cứu lịch sử trạng thái bất cứ lúc nào.",
                },
                {
                  title: "Lan tỏa lối sống bền vững",
                  desc: "Kéo dài vòng đời trang phục và đóng góp trực tiếp vào hệ sinh thái thời trang tuần hoàn.",
                },
              ].map((benefit, idx) => (
                <div
                  key={idx}
                  className="p-8 bg-surface-container-low border border-outline-variant/40 space-y-3"
                >
                  <ShieldCheck className="w-6 h-6 text-primary" />
                  <h3 className="font-headline-sm text-xl text-primary">{benefit.title}</h3>
                  <p className="font-body-sm text-on-surface-variant leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: ĐIỀU KIỆN TIẾP NHẬN */}
        <section className="w-full bg-surface-container-low py-20 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-6 space-y-6">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                02 / ĐIỀU KIỆN NHẬN ĐỒ
              </span>
              <h2 className="font-headline-lg text-3xl text-primary">
                Các nhóm sản phẩm được tiếp nhận
              </h2>
              <ul className="space-y-3 font-body-md text-on-surface-variant">
                {PRODUCT_GROUPS.map((group) => (
                  <li key={group} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>{group}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-6 bg-surface p-8 border border-outline-variant/50 space-y-4">
              <h3 className="font-headline-sm text-2xl text-primary">
                Tiêu chuẩn chất lượng bắt buộc
              </h3>
              <ul className="space-y-3 font-body-sm text-on-surface-variant leading-relaxed">
                <li>• Sản phẩm chính hãng hoặc thiết kế có đường may, chất liệu tốt, độ mới từ 85% trở lên.</li>
                <li>• Đã được giặt sạch, không có vết ố bẩn vĩnh viễn, không rách thủng hoặc hỏng khóa kéo.</li>
                <li>• Không tiếp nhận đồ lót, đồ ngủ, hàng giả/nhái (counterfeit) hoặc trang phục bị mục sợi vải.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 5: QUY TRÌNH KÝ GỬI 5 BƯỚC CHI TIẾT */}
        <section className="w-full py-20 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="space-y-2">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                03 / QUY TRÌNH KÝ GỬI (3.1 ĐẶC TẢ)
              </span>
              <h2 className="font-headline-lg text-3xl text-primary">
                5 bước ký gửi chuẩn mực tại AGAIN STORE
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {[
                {
                  step: "1",
                  title: "Đăng ký gửi đồ",
                  desc: "Khách hàng điền thông tin cá nhân và thông tin sản phẩm vào form bên dưới.",
                },
                {
                  step: "2",
                  title: "Tiếp nhận sản phẩm",
                  desc: "Nhân viên xác nhận yêu cầu và hướng dẫn khách gửi đồ tới cửa hàng.",
                },
                {
                  step: "3",
                  title: "Kiểm tra & định giá",
                  desc: "Kiểm tra tình trạng, phân loại và đề xuất giá bán niêm yết.",
                },
                {
                  step: "4",
                  title: "Trưng bày & bán hàng",
                  desc: "Sản phẩm đạt điều kiện được chụp ảnh, đăng tải trên Second Life và trưng bày.",
                },
                {
                  step: "5",
                  title: "Đối soát & thanh toán",
                  desc: "Cập nhật kết quả bán và thực hiện thanh toán theo chính sách.",
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="p-6 bg-surface-container-low border border-outline-variant/40 space-y-3"
                >
                  <span className="w-8 h-8 bg-primary text-surface-container-lowest font-display-lg text-base flex items-center justify-center">
                    {s.step}
                  </span>
                  <h3 className="font-headline-sm text-lg text-primary">{s.title}</h3>
                  <p className="font-body-sm text-on-surface-variant leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6 & 7: CHÍNH SÁCH & BẢNG GIÁ THAM KHẢO */}
        <section className="w-full bg-surface-container-low py-20 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-6 space-y-6">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                04 / CHÍNH SÁCH KÝ GỬI
              </span>
              <h2 className="font-headline-lg text-3xl text-primary">
                Thời hạn, thanh toán &amp; xử lý đồ tồn
              </h2>
              <div className="space-y-4 font-body-sm text-on-surface-variant leading-relaxed">
                <div className="p-5 bg-surface border border-outline-variant/40">
                  <strong className="text-primary block mb-1">1. Thời hạn trưng bày:</strong>
                  60 ngày kể từ thời điểm sản phẩm được duyệt và xuất bản lên hệ thống Second Life.
                </div>
                <div className="p-5 bg-surface border border-outline-variant/40">
                  <strong className="text-primary block mb-1">2. Đối soát &amp; Thanh toán:</strong>
                  Thanh toán chuyển khoản định kỳ sau khi sản phẩm chuyển sang trạng thái &ldquo;Đã hoàn tất&rdquo;.
                </div>
                <div className="p-5 bg-surface border border-outline-variant/40">
                  <strong className="text-primary block mb-1">3. Xử lý đồ tồn sau kỳ hạn:</strong>
                  Người gửi có thể nhận lại sản phẩm hoặc đồng ý chuyển vào quỹ quyên góp cộng đồng (Wardrobe Donation).
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                05 / BẢNG TỶ LỆ &amp; BIỂU PHÍ THAM KHẢO
              </span>
              <h2 className="font-headline-lg text-3xl text-primary">
                Biểu giá chiết khấu theo nhóm giá trị
              </h2>
              <div className="bg-surface border border-outline-variant/50 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-primary text-surface-container-lowest font-label-sm text-label-sm uppercase">
                      <th className="p-4">Nhóm giá niêm yết</th>
                      <th className="p-4">Người gửi nhận</th>
                      <th className="p-4">Phí dịch vụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40 font-body-sm">
                    {pricingTiers.map((tier, idx) => (
                      <tr key={idx}>
                        <td className="p-4 font-medium text-primary">{tier.tier}</td>
                        <td className="p-4">{tier.consignor}</td>
                        <td className="p-4">{tier.fee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: FAQ */}
        <section className="w-full py-16 px-6 lg:px-16 border-b border-outline-variant/40">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="space-y-2">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                06 / CÂU HỎI THƯỜNG GẶP (FAQ)
              </span>
              <h2 className="font-headline-lg text-3xl text-primary">
                Giải đáp thắc mắc khi ký gửi
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-surface-container-low border border-outline-variant/40 space-y-2">
                <h3 className="font-headline-sm text-lg text-primary">
                  Số lượng tối thiểu mỗi lần gửi là bao nhiêu?
                </h3>
                <p className="font-body-sm text-on-surface-variant">
                  Bạn có thể đăng ký từ 1 sản phẩm trở lên đối với dòng thiết kế/cao cấp hoặc từ 3–5 sản phẩm thông thường.
                </p>
              </div>
              <div className="p-6 bg-surface-container-low border border-outline-variant/40 space-y-2">
                <h3 className="font-headline-sm text-lg text-primary">
                  Làm sao để biết sản phẩm của tôi đã được duyệt?
                </h3>
                <p className="font-body-sm text-on-surface-variant">
                  Ngay sau khi gửi form, hệ thống cấp cho bạn một Mã yêu cầu ký gửi (#CR-...). Bạn có thể tra cứu trực tiếp trên website hoặc nhận thông báo từ nhân viên phụ trách.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 9: FORM ĐĂNG KÝ KÝ GỬI TRỰC TUYẾN (3.2 ĐẶC TẢ) */}
        <section id="form-ky-gui" className="w-full py-20 px-6 lg:px-16 bg-surface-container-high">
          <div className="max-w-4xl mx-auto bg-surface p-8 lg:p-12 border border-outline-variant/60 space-y-8">
            <div className="space-y-2 border-b border-outline-variant/40 pb-6">
              <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                07 / BIỂU MẪU ĐĂNG KÝ TRỰC TUYẾN
              </span>
              <h2 className="font-headline-lg text-3xl text-primary">
                Đăng ký ký gửi trang phục
              </h2>
              <p className="font-body-sm text-on-surface-variant">
                Dữ liệu được lưu trực tiếp vào hệ thống quản trị Supabase với trạng thái ban đầu là <strong>Chờ xác nhận</strong> và tự động sinh mã yêu cầu.
              </p>
            </div>

            {createdCode ? (
              <div className="p-8 bg-secondary-container/40 border border-secondary space-y-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
                <div className="space-y-2">
                  <span className="font-label-md text-label-md uppercase tracking-widest text-secondary">
                    ĐĂNG KÝ KÝ GỬI THÀNH CÔNG
                  </span>
                  <h3 className="font-headline-md text-2xl text-primary">
                    Mã yêu cầu ký gửi của bạn:{" "}
                    <span className="underline decoration-secondary">{createdCode}</span>
                  </h3>
                  <p className="font-body-md text-on-surface-variant max-w-lg mx-auto">
                    Hồ sơ của bạn đã được lưu vào hệ thống quản trị ở trạng thái <strong>Chờ xác nhận</strong>. Nhân viên phụ trách sẽ liên hệ với bạn sớm nhất.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                  <Link
                    href={`/tra-cuu-ky-gui?code=${encodeURIComponent(createdCode)}`}
                    className="px-6 py-3 bg-primary text-surface-container-lowest font-label-sm text-label-sm uppercase tracking-widest inline-flex items-center gap-2"
                  >
                    <span>Tra cứu trạng thái yêu cầu</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedCode(null);
                      setCustomerNote("");
                      setImageUrls([""]);
                    }}
                    className="px-6 py-3 border border-primary text-primary font-label-sm text-label-sm uppercase tracking-widest"
                  >
                    Tạo yêu cầu ký gửi khác
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMsg && (
                  <div className="p-4 bg-error-container text-on-error-container flex items-start gap-3 font-body-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Họ và tên */}
                  <div className="space-y-2">
                    <label className="block font-label-md text-label-md uppercase tracking-wider text-primary">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập họ và tên người gửi"
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-md"
                    />
                  </div>

                  {/* Số điện thoại */}
                  <div className="space-y-2">
                    <label className="block font-label-md text-label-md uppercase tracking-wider text-primary">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ví dụ: 0901234567"
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email (không bắt buộc) */}
                  <div className="space-y-2">
                    <label className="block font-label-md text-label-md uppercase tracking-wider text-primary">
                      Email (Không bắt buộc)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-md"
                    />
                  </div>

                  {/* Thương hiệu gốc */}
                  <div className="space-y-2">
                    <label className="block font-label-md text-label-md uppercase tracking-wider text-primary">
                      Thương hiệu nổi bật (Nếu có)
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Ví dụ: Massimo Dutti, Zara, Local Brand..."
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Nhóm sản phẩm */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="block font-label-md text-label-md uppercase tracking-wider text-primary">
                      Nhóm sản phẩm *
                    </label>
                    <select
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-md"
                    >
                      {PRODUCT_GROUPS.map((grp) => (
                        <option key={grp} value={grp}>
                          {grp}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Số lượng sản phẩm */}
                  <div className="space-y-2">
                    <label className="block font-label-md text-label-md uppercase tracking-wider text-primary">
                      Số lượng sản phẩm *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-md"
                    />
                  </div>
                </div>

                {/* Tình trạng sản phẩm */}
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md uppercase tracking-wider text-primary">
                    Tình trạng sản phẩm *
                  </label>
                  <select
                    value={conditionStatus}
                    onChange={(e) => setConditionStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-md"
                  >
                    {CONDITION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hình ảnh sản phẩm (Upload nhiều ảnh hoặc dán URL) */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block font-label-md text-label-md uppercase tracking-wider text-primary">
                      Hình ảnh sản phẩm (Upload nhiều ảnh hoặc dán link ảnh)
                    </label>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container text-primary font-label-sm text-label-sm uppercase tracking-wider cursor-pointer hover:bg-secondary-container transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>{uploadingFile ? "Đang tải lên..." : "Chọn file từ máy"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="space-y-2">
                    {imageUrls.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => handleImageChange(idx, e.target.value)}
                          placeholder={`URL hình ảnh sản phẩm #${idx + 1} (https://...)`}
                          className="flex-1 px-4 py-2.5 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-sm"
                        />
                        {imageUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImageInput(idx)}
                            className="p-2.5 text-error hover:bg-error-container/40"
                            title="Xóa dòng ảnh"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddImageInput}
                      className="inline-flex items-center gap-1.5 font-label-sm text-label-sm uppercase tracking-wider text-secondary hover:text-primary"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm link ảnh sản phẩm</span>
                    </button>
                  </div>
                </div>

                {/* Ghi chú */}
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md uppercase tracking-wider text-primary">
                    Ghi chú
                  </label>
                  <textarea
                    rows={3}
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Ghi chú thêm về các món đồ, thời gian bạn muốn gửi đồ hoặc yêu cầu đặc biệt..."
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none font-body-md"
                  />
                </div>

                {/* Đồng ý chính sách */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedPolicy}
                    onChange={(e) => setAgreedPolicy(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-primary"
                  />
                  <span className="font-body-sm text-on-surface-variant">
                    Tôi đã đọc và đồng ý với{" "}
                    <Link href="/chinh-sach" className="text-primary underline">
                      điều kiện &amp; chính sách ký gửi
                    </Link>{" "}
                    của AGAIN STORE (cam kết sản phẩm thuộc quyền sở hữu hợp pháp và đạt tiêu chuẩn vệ sinh).
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-primary text-surface-container-lowest font-label-md text-label-md uppercase tracking-widest hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  {submitting ? "Đang lưu vào hệ thống..." : "Gửi đăng ký ký gửi"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
