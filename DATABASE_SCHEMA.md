# AGAIN STORE — TÀI LIỆU CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)
**Hệ thống 21 Bảng Cơ Sở Dữ Liệu trên Supabase (PostgreSQL 15+)**

---

## 1. TỔNG QUAN CÁC NHÓM BẢNG (TABLE CATEGORIES)

Hệ thống cơ sở dữ liệu của Again Store được chuẩn hóa theo chuẩn quan hệ (Relational), gồm 21 bảng được chia thành 7 phân nhóm nghiệp vụ:

| Nhóm | Số bảng | Mục đích chính |
| :--- | :---: | :--- |
| **I. Người dùng & Phân quyền** | 2 | Tài khoản quản trị, nhân viên và phân quyền 3 cấp |
| **II. Quản lý Nội dung CMS** | 4 | Quản lý trang tĩnh, khối giao diện (sections), banner và menu |
| **III. Luồng Ký Gửi (Luồng 1)** | 4 | Hồ sơ người ký gửi, phiếu yêu cầu, ảnh kiểm định, nhật ký lịch sử |
| **IV. Sản phẩm Second Life (Luồng 2)** | 3 | Danh mục phân loại, sản phẩm trưng bày, thư viện ảnh chi tiết |
| **V. Journal & Biên tập** | 2 | Chuyên mục bài viết, nội dung bài viết và cấu hình SEO |
| **VI. Hoạt động & Cộng đồng** | 3 | Sự kiện (Workshop/Swap), đối tác đồng hành, danh sách khách đăng ký |
| **VII. Khách hàng, Liên hệ & Cài đặt** | 3 | Hộp thư liên hệ, cài đặt thông tin Showroom, nhật ký hệ thống |

---

## 2. Ý NGHĨA CHI TIẾT TỪNG BẢNG (TABLE DICTIONARY)

### NHÓM I: NGƯỜI DÙNG & PHÂN QUYỀN

#### 1. `public.roles` — Danh mục vai trò trong hệ thống
* **Ý nghĩa:** Định nghĩa 3 cấp bậc quyền hạn chuẩn theo file đặc tả:
  * `super_admin`: Toàn quyền hệ thống, quản lý cấu hình, xuất dữ liệu và phân quyền.
  * `admin`: Quản lý nội dung, duyệt sản phẩm Second Life, duyệt phiếu ký gửi.
  * `staff`: Nhân viên tiếp nhận, kiểm định đồ và cập nhật hồ sơ ký gửi.
* **Các trường quan trọng:**
  * `id` (UUID, PK): Khóa chính.
  * `code` (VARCHAR, UNIQUE): Mã vai trò (`super_admin`, `admin`, `staff`).
  * `name` (VARCHAR): Tên hiển thị tiếng Việt.
  * `permissions` (JSONB): Danh sách quyền chi tiết dạng cờ Boolean (`can_export`, `can_approve`, ...).

#### 2. `public.users` — Hồ sơ người dùng & Nhân sự quản trị
* **Ý nghĩa:** Lưu trữ thông tin tài khoản nhân sự làm việc trên Admin CMS, liên kết với vai trò tương ứng qua khóa ngoại `role_id`.
* **Các trường quan trọng:**
  * `id` (UUID, PK): Khóa chính (đồng bộ với `auth.users` của Supabase khi đăng ký qua Auth).
  * `email` (VARCHAR, UNIQUE): Email đăng nhập.
  * `full_name` (VARCHAR): Họ và tên nhân viên.
  * `phone` (VARCHAR): Số điện thoại liên hệ.
  * `role_id` (UUID, FK -> `roles.id`): Vai trò được phân công.
  * `is_active` (BOOLEAN): Trạng thái hoạt động (bật/tắt truy cập).

---

### NHÓM II: QUẢN LÝ NỘI DUNG CMS

#### 3. `public.pages` — Danh mục trang trên website
* **Ý nghĩa:** Định danh các trang trên website (Trang chủ, Về chúng tôi, Thời trang tuần hoàn, Liên hệ, ...) để quản lý nội dung động.
* **Các trường quan trọng:**
  * `id` (UUID, PK): Khóa chính.
  * `slug` (VARCHAR, UNIQUE): Đường dẫn URL trang (VD: `home`, `ve-chung-toi`).
  * `title` (VARCHAR): Tiêu đề trang.
  * `is_published` (BOOLEAN): Trạng thái hiển thị công khai.

#### 4. `public.page_sections` — Các khối nội dung trong từng trang
* **Ý nghĩa:** Cho phép biên tập viên cấu hình từng khối giao diện trên một trang: thay đổi Banner Desktop/Mobile, tiêu đề lớn (Headline), mô tả, nút kêu gọi hành động (CTA) và thứ tự hiển thị (`sort_order`).
* **Các trường quan trọng:**
  * `page_id` (UUID, FK -> `pages.id`): Thuộc về trang nào.
  * `section_key` (VARCHAR): Mã định danh khối (VD: `hero_banner`, `brand_story`, `value_pillars`).
  * `title`, `subtitle`: Tiêu đề và nội dung ngắn.
  * `desktop_banner_url`, `mobile_banner_url`: Hình ảnh banner theo từng loại màn hình.
  * `cta_text`, `cta_url`: Nhãn nút bấm và đường dẫn liên kết.
  * `sort_order` (INT): Thứ tự sắp xếp từ trên xuống dưới.
  * `is_active` (BOOLEAN): Bật/tắt hiển thị khối này.

#### 5. `public.page_seo` — Cấu hình thẻ SEO của từng trang
* **Ý nghĩa:** Lưu trữ Meta Title, Meta Description, Open Graph Image (OG Image) và từ khóa Canonical cho từng trang để tối ưu hóa công cụ tìm kiếm (Google SEO).
* **Các trường quan trọng:**
  * `page_id` (UUID, FK -> `pages.id`, UNIQUE): 1 trang có đúng 1 bản ghi cấu hình SEO.
  * `meta_title`, `meta_description`, `og_image_url`, `canonical_url`.

#### 6. `public.menus` — Cây điều hướng Menu website
* **Ý nghĩa:** Lưu trữ danh sách liên kết Header Menu và Footer Menu, hỗ trợ menu phân cấp đa tầng (Cha - Con) qua `parent_id`.
* **Các trường quan trọng:**
  * `menu_location` (VARCHAR): Vị trí menu (`header`, `footer`, `mobile_drawer`).
  * `title`, `url`: Tên hiển thị và link chuyển tiếp.
  * `parent_id` (UUID, FK -> `menus.id`): Menu cha (nếu là menu cấp 2, 3).
  * `sort_order` (INT): Thứ tự hiển thị.

---

### NHÓM III: LUỒNG TIẾP NHẬN KÝ GỬI (LUỒNG 1)

#### 7. `public.consignors` — Hồ sơ người ký gửi
* **Ý nghĩa:** Lưu trữ thông tin định danh của khách hàng mang quần áo đến ký gửi (họ tên, số điện thoại, thông tin tài khoản ngân hàng để nhận thanh toán/đối soát sau khi món đồ được bán).
* **Các trường quan trọng:**
  * `id` (UUID, PK): Khóa chính người ký gửi.
  * `full_name`, `phone` (bắt buộc).
  * `bank_name`, `bank_account`: Phục vụ đối soát tiền bán đồ ký gửi.

#### 8. `public.consignment_requests` — Phiếu yêu cầu ký gửi
* **Ý nghĩa:** Bảng cốt lõi của Luồng 1. Mỗi lần khách gửi một hoặc nhiều món đồ sẽ sinh ra một phiếu có mã duy nhất (VD: `AG-261109-1024`). Phiếu sẽ trải qua đúng 6 trạng thái xử lý theo đặc tả.
* **Các trường quan trọng:**
  * `request_code` (VARCHAR, UNIQUE): Mã tra cứu ký gửi.
  * `consignor_id` (UUID, FK -> `consignors.id`): Khách hàng ký gửi là ai.
  * `category_name`, `brand_name`, `quantity`: Nhóm đồ, thương hiệu và số lượng gửi.
  * `condition_status`: Tình trạng mô tả ban đầu (VD: Mới 98%, qua sử dụng 1 lần).
  * `status` (ENUM 6 bước): 
    * `pending_confirmation`: Chờ xác nhận.
    * `confirmed`: Đã xác nhận hẹn lịch gửi.
    * `receiving`: Đang tiếp nhận đồ tại Showroom/kho.
    * `inspecting`: Đang kiểm định chất liệu & phom dáng.
    * `approved`: Đã duyệt đủ chuẩn ký gửi Again Store.
    * `rejected`: Không đạt chuẩn / Đã từ chối hoặc hủy.
  * `assigned_staff_id` (UUID, FK -> `users.id`): Nhân viên phụ trách xử lý phiếu này.
  * `internal_note` (TEXT): Ghi chú thẩm định nội bộ (chỉ Admin/Staff xem).
  * `agreed_policy` (BOOLEAN): Đã đồng ý điều khoản & chính sách ký gửi.

#### 9. `public.consignment_images` — Hình ảnh món đồ khách gửi kiểm định
* **Ý nghĩa:** Lưu các URL ảnh mà khách hàng chụp đính kèm (ảnh tổng thể, góc nghiêng, cận cảnh tem mác/chất liệu) để nhân viên đối chiếu trước khi nhận đồ.
* **Các trường quan trọng:**
  * `consignment_request_id` (UUID, FK -> `consignment_requests.id`, ON DELETE CASCADE).
  * `image_url`: Đường dẫn hình ảnh.
  * `angle_label`: Nhãn góc chụp (Tổng thể, Tem mác, Lỗi nhỏ nếu có).

#### 10. `public.consignment_history` — Nhật ký thay đổi trạng thái hồ sơ ký gửi
* **Ý nghĩa:** Lưu vết toàn bộ tiến trình xử lý hồ sơ (ai đổi trạng thái, từ bước nào sang bước nào, thời gian nào, ghi chú lý do gì). Khi khách hàng nhập mã tra cứu tại trang `/tra-cuu-ky-gui`, hệ thống sẽ đọc bảng này để hiển thị dòng thời gian (timeline).
* **Các trường quan trọng:**
  * `consignment_request_id` (UUID, FK -> `consignment_requests.id`).
  * `old_status`, `new_status`: Trạng thái cũ và trạng thái mới.
  * `note`: Ghi chú kèm theo tiến trình.
  * `created_at`: Thời điểm cập nhật.

---

### NHÓM IV: SẢN PHẨM TUYỂN CHỌN SECOND LIFE (LUỒNG 2)

#### 11. `public.categories` — Danh mục sản phẩm Second Life
* **Ý nghĩa:** Phân loại sản phẩm trưng bày (Đầm thiết kế, Áo khoác & Blazer, Quần âu, Chân váy, Phụ kiện tuyển chọn).
* **Các trường quan trọng:**
  * `name` (VARCHAR): Tên danh mục.
  * `slug` (VARCHAR, UNIQUE): Đường dẫn lọc trên website (VD: `dam-vay-thiet-ke`).
  * `sort_order` (INT): Thứ tự ưu tiên.
  * `is_active` (BOOLEAN): Bật/tắt hiển thị.

#### 12. `public.products` — Bảng sản phẩm Second Life
* **Ý nghĩa:** Bảng trung tâm của toàn bộ nền tảng trưng bày. Liên kết trực tiếp với phiếu ký gửi đã duyệt thông qua khóa ngoại, giúp lưu vết xuất xứ món đồ mà không làm trùng lặp dữ liệu người gửi.
* **Các trường quan trọng:**
  * `product_code` (VARCHAR, UNIQUE): Mã sản phẩm (VD: `SL-1024-99`).
  * `title`, `slug`: Tên sản phẩm và URL xem chi tiết (`/second-life/[slug]`).
  * `category_id` (UUID, FK -> `categories.id`): Thuộc danh mục nào.
  * `consignment_request_id` (UUID, FK -> `consignment_requests.id`): Liên kết đến phiếu ký gửi nguồn.
  * `consignor_id` (UUID, FK -> `consignors.id`): Liên kết đến chủ nhân ký gửi.
  * `brand`, `size`, `color`, `material`: Thương hiệu, kích cỡ, màu sắc, thành phần chất liệu (100% Linen, Lụa tơ tằm,...).
  * `condition_label`: Tình trạng tuyển chọn (VD: 98% — Hoàn hảo không tì vết).
  * `price` (DECIMAL): Giá bán niêm yết (VNĐ).
  * `curator_note` (TEXT): Lời bình của Giám tuyển viên về nét đẹp của món đồ.
  * `showroom_location` (VARCHAR): Vị trí trưng bày tại Showroom để nhân viên dễ tìm khi khách đến xem trực tiếp.
  * `status` (ENUM 6 bước chuẩn):
    * `draft`: Bản nháp.
    * `pending_review`: Chờ duyệt niêm yết.
    * `displaying`: Đang trưng bày và mở bán tại `/second-life`.
    * `reserved`: Đã có người đặt lịch hẹn xem / giữ chỗ.
    * `completed`: Đã tìm thấy chủ nhân mới (Previously Rehomed).
    * `hidden`: Tạm ngừng hiển thị.
  * `is_featured` (BOOLEAN): Đưa lên mục nổi bật tại Trang chủ.

#### 13. `public.product_images` — Thư viện ảnh sản phẩm
* **Ý nghĩa:** Lưu danh sách ảnh chất lượng cao của sản phẩm được chụp tại studio của Again Store.
* **Các trường quan trọng:**
  * `product_id` (UUID, FK -> `products.id`, ON DELETE CASCADE).
  * `image_url`: Link ảnh.
  * `is_primary` (BOOLEAN): Ảnh đại diện chính (Cover).
  * `sort_order` (INT): Thứ tự ảnh hiển thị trong slider.

---

### NHÓM V: JOURNAL & BIÊN TẬP NỘI DUNG

#### 14. `public.article_categories` — Chuyên mục bài viết Journal
* **Ý nghĩa:** Phân loại các tuyến nội dung biên tập. Khởi tạo sẵn 6 chuyên mục chuẩn:
  1. *Thời trang bền vững*
  2. *Chăm sóc trang phục*
  3. *Phối đồ cùng đồ tái sinh*
  4. *Câu chuyện món đồ*
  5. *Lối sống xanh*
  6. *Hậu trường Again*
* **Các trường quan trọng:**
  * `name`, `slug`, `sort_order`.

#### 15. `public.articles` — Bài viết Journal & Tin tức
* **Ý nghĩa:** Lưu trữ các bài viết truyền cảm hứng, hướng dẫn bảo quản đồ vintage/secondhand và tối ưu SEO cho website.
* **Các trường quan trọng:**
  * `title`, `slug` (UNIQUE): Tiêu đề và URL bài viết (`/journal/[slug]`).
  * `category_id` (UUID, FK -> `article_categories.id`).
  * `excerpt` (TEXT): Đoạn trích dẫn ngắn mở đầu.
  * `content` (TEXT): Toàn văn bài viết.
  * `thumbnail_url`: Ảnh bìa bài viết.
  * `author_name`: Tác giả / Ban biên tập.
  * `status` (`draft`, `scheduled`, `published`): Nháp, hẹn giờ đăng hoặc đã xuất bản.
  * `is_featured` (BOOLEAN): Ghim bài tiêu điểm.
  * `seo_title`, `meta_description`: Phục vụ SEO.

---

### NHÓM VI: HOẠT ĐỘNG CỘNG ĐỒNG & ĐỐI TÁC

#### 16. `public.partners` — Đối tác đồng hành
* **Ý nghĩa:** Lưu trữ thông tin các thương hiệu bền vững, tổ chức môi trường, xưởng may thủ công đồng hành cùng Again Store.
* **Các trường quan trọng:**
  * `name`, `logo_url`, `website_url`, `description`, `is_active`.

#### 17. `public.events` — Hoạt động, Workshop & Clothing Swap
* **Ý nghĩa:** Quản lý các sự kiện offline tại Showroom (Workshop khâu tay Sashiko, Ngày hội đổi đồ cũ Clothing Swap, Triển lãm thời trang tuần hoàn).
* **Các trường quan trọng:**
  * `title`, `slug`: Tên sự kiện và URL.
  * `event_type`: Loại hình (Workshop, Đổi đồ, Quyên góp, Triển lãm).
  * `event_date`: Thời gian tổ chức.
  * `location`: Địa điểm (VD: Showroom Again Store Thảo Điền).
  * `partner_id` (UUID, FK -> `partners.id`): Đối tác phối hợp tổ chức.
  * `status` (`upcoming`, `ongoing`, `ended`): Sắp diễn ra, đang diễn ra, đã kết thúc.
  * `allow_registration` (BOOLEAN): Mở cổng đăng ký giữ chỗ trực tuyến.
  * `max_participants` (INT): Số lượng người tham gia tối đa.

#### 18. `public.event_registrations` — Danh sách khách đăng ký tham gia sự kiện (RSVP)
* **Ý nghĩa:** Ghi nhận danh sách người đăng ký tham gia từ form trên trang `/cong-dong`.
* **Các trường quan trọng:**
  * `event_id` (UUID, FK -> `events.id`, ON DELETE CASCADE).
  * `full_name`, `phone`, `email`: Thông tin liên lạc của khách.
  * `note`: Ghi chú hoặc câu hỏi gửi cho ban tổ chức.

---

### NHÓM VII: LIÊN HỆ, CẤU HÌNH HỆ THỐNG & NHẬT KÝ

#### 19. `public.contacts` — Hộp thư liên hệ & Đặt lịch hẹn xem đồ
* **Ý nghĩa:** Tiếp nhận tin nhắn từ form trang `/lien-he` và form "Đặt lịch xem món đồ này tại Showroom" từ trang chi tiết sản phẩm `/second-life/[slug]`.
* **Các trường quan trọng:**
  * `full_name`, `phone`, `email`.
  * `subject`, `message`: Tiêu đề và nội dung tin nhắn.
  * `product_id` (UUID, FK -> `products.id` - tùy chọn): Món đồ khách đang quan tâm.
  * `status` (`new`, `processing`, `resolved`): Mới, đang phản hồi, đã xử lý xong.

#### 20. `public.settings` — Cài đặt thông số hệ thống
* **Ý nghĩa:** Lưu trữ dạng Key-Value (JSONB) các cấu hình chung của website (Tên cửa hàng, Hotline, Email liên hệ, Địa chỉ Showroom, Giờ mở cửa, Link mạng xã hội Instagram/Facebook/Zalo).
* **Các trường quan trọng:**
  * `key` (VARCHAR, PK): Mã cấu hình (VD: `site_info`, `consignment_policy`).
  * `value` (JSONB): Dữ liệu cấu hình linh hoạt không cần sửa code.

#### 21. `public.activity_logs` — Nhật ký kiểm toán hệ thống (Audit Logs)
* **Ý nghĩa:** Ghi lại mọi hành vi quan trọng của Admin và Nhân viên (Ai đã sửa giá sản phẩm, ai đã duyệt phiếu ký gửi, ai đã xóa nội dung) phục vụ an ninh và đối soát.
* **Các trường quan trọng:**
  * `user_id` (UUID, FK -> `users.id`).
  * `action` (VARCHAR): Hành động thực hiện (VD: `APPROVE_CONSIGNMENT`, `UPDATE_PRODUCT_PRICE`).
  * `target_table`, `target_id`: Bảng bị tác động và ID bản ghi.
  * `payload` (JSONB): Dữ liệu chi tiết trước và sau khi thay đổi.
  * `created_at`: Thời gian thực hiện.
