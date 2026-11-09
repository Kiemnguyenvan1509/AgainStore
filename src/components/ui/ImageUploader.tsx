"use client";

import React, { useRef, useState } from "react";
import { uploadMultipleImagesToSupabase } from "@/lib/storage";

interface ImageUploaderProps {
  bucket?: string;
  folder?: string;
  multiple?: boolean;
  onUploadSuccess: (urls: string[]) => void;
  label?: string;
}

export function ImageUploader({
  bucket = "products",
  folder = "uploads",
  multiple = true,
  onUploadSuccess,
  label = "Tải ảnh từ máy tính",
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const results = await uploadMultipleImagesToSupabase(files, bucket, folder);
      const urls = results.map((r) => r.url);
      onUploadSuccess(urls);
      // Reset input sau khi tải xong
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải ảnh lên.";
      setErrorMessage(
        `${msg} (Hãy đảm bảo bạn đã tạo Bucket '${bucket}' ở chế độ Public trên Supabase Dashboard)`
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        id={`file-upload-${bucket}-${folder}`}
      />
      <label
        htmlFor={`file-upload-${bucket}-${folder}`}
        className={`flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-primary/40 bg-surface-container-low hover:bg-surface-container hover:border-primary cursor-pointer transition-colors text-xs font-semibold uppercase tracking-wider text-primary ${
          isUploading ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span>{isUploading ? "Đang tải ảnh lên Supabase..." : label}</span>
      </label>

      {errorMessage && (
        <p className="mt-1.5 text-[11px] text-error font-medium">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
