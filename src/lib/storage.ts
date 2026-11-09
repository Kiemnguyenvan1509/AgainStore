import { supabase } from "@/lib/supabase";

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload một file ảnh từ máy tính lên Supabase Storage Bucket
 * @param file Đối tượng File lấy từ thẻ <input type="file" />
 * @param bucket Tên bucket trên Supabase (mặc định: 'products')
 * @param folder Thư mục con bên trong bucket (VD: 'items', 'consignments')
 */
export async function uploadImageToSupabase(
  file: File,
  bucket: string = "products",
  folder: string = "uploads"
): Promise<UploadResult> {
  // Tạo tên file ngẫu nhiên và an toàn URL
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const randomName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const filePath = `${folder}/${randomName}.${fileExt}`;

  // Tải file lên Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Lỗi tải ảnh lên Supabase Storage: ${error.message}`);
  }

  // Lấy URL công khai (Public URL) để lưu vào database
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    url: publicUrlData.publicUrl,
    path: data.path,
  };
}

/**
 * Upload đồng thời nhiều ảnh từ máy tính
 */
export async function uploadMultipleImagesToSupabase(
  files: FileList | File[],
  bucket: string = "products",
  folder: string = "uploads"
): Promise<UploadResult[]> {
  const fileArray = Array.from(files);
  const uploadPromises = fileArray.map((file) =>
    uploadImageToSupabase(file, bucket, folder)
  );
  return Promise.all(uploadPromises);
}
