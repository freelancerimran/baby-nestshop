"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
}

export default function ImageUploader({
  label,
  value,
  onChange,
  bucket = "products",
}: Props) {
  const [uploading, setUploading] =
    useState(false);

  async function handleUpload(
    file: File
  ) {
    try {
      setUploading(true);

      const fileName =
        `${Date.now()}-${file.name}`;

      const { error } =
        await supabase.storage
          .from(bucket)
          .upload(
            fileName,
            file,
            {
              upsert: true,
            }
          );

      if (error) {
        throw error;
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from(bucket)
        .getPublicUrl(
          fileName
        );

      onChange(
        publicUrlData.publicUrl
      );

    } catch (error: any) {

      console.error(
        "UPLOAD ERROR:",
        error
      );

      alert(
        error?.message ||
        error?.error ||
        JSON.stringify(error) ||
        "Image Upload Failed"
      );

    } finally {

      setUploading(false);

    }
  }

  return (
    <div>

      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <input
        type="file"
        accept="image/*"
        onChange={async (e) => {

          const file =
            e.target.files?.[0];

          if (!file) return;

          await handleUpload(
            file
          );
        }}
        className="w-full rounded-lg border p-3"
      />

      {uploading && (
        <p className="mt-2 text-sm text-blue-600">
          Uploading...
        </p>
      )}

      {value && (
        <img
          src={value}
          alt={label}
          className="mt-3 h-32 w-32 rounded-lg border object-cover"
        />
      )}

    </div>
  );
}