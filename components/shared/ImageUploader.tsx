"use client";

import { useCallback, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UploadedImage {
  url: string;
  display_url: string;
  thumbnail_url: string;
}

interface ImageUploaderProps {
  value?: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxFiles?: number;
  className?: string;
  label?: string;
}

export function ImageUploader({
  value = [],
  onChange,
  maxFiles = 5,
  className,
  label = "Upload Images",
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File): Promise<UploadedImage | null> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Upload failed");
    }

    const data = await res.json();
    return {
      url: data.url,
      display_url: data.display_url,
      thumbnail_url: data.thumbnail_url,
    };
  };

  const handleFiles = useCallback(
    async (files: File[]) => {
      const imageFiles = files
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, maxFiles - value.length);

      if (imageFiles.length === 0) return;

      setIsUploading(true);
      const uploaded: UploadedImage[] = [];

      for (const file of imageFiles) {
        try {
          const result = await uploadFile(file);
          if (result) uploaded.push(result);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Upload failed";
          toast.error(`Failed to upload ${file.name}: ${msg}`);
        }
      }

      if (uploaded.length > 0) {
        onChange([...value, ...uploaded]);
        toast.success(
          `${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`
        );
      }
      setIsUploading(false);
    },
    [value, onChange, maxFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [handleFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      handleFiles(files);
      e.target.value = "";
    },
    [handleFiles]
  );

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const inputId = `image-upload-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className={className}>
      <label className="text-sm font-medium mb-2 block">{label}</label>

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {value.map((img, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-lg overflow-hidden border border-border group"
            >
              <img
                src={img.thumbnail_url || img.display_url}
                alt={`Upload ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length < maxFiles && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
            isUploading && "pointer-events-none opacity-60"
          )}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id={inputId}
            disabled={isUploading}
          />
          <label htmlFor={inputId} className="cursor-pointer text-center">
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 text-primary mx-auto mb-2 animate-spin" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop or click to upload
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {maxFiles - value.length} remaining
                </p>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  );
}
