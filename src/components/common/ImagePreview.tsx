import React, { useState } from "react";
import { Image as ImageIcon, Link as LinkIcon } from "lucide-react";

interface ImagePreviewProps {
  value?: string | null;
  onChange?: (url: string) => void;
  label?: string;
  placeholder?: string;
}

export const ImagePreview = ({
  value = "",
  onChange,
  label = "Ürün Görseli (URL)",
  placeholder = "https://ornek.com/resim.jpg",
}: ImagePreviewProps) => {
  const [hasError, setHasError] = useState<boolean>(false);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-zinc-800">
        {label}
      </label>

      <div className="flex items-start gap-3">
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 shadow-2xs">
          {value && !hasError ? (
            <img
              src={value}
              alt="Önizleme"
              onError={() => setHasError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="p-1 text-center text-zinc-400">
              <ImageIcon className="mx-auto mb-0.5 h-5 w-5" />
              <span className="block text-[9px] font-medium text-zinc-400">
                {value && hasError ? "Yüklenemedi" : "Görsel Yok"}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-1">
          <div className="relative">
            <LinkIcon className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="url"
              value={value || ""}
              onChange={(e) => {
                setHasError(false);
                onChange?.(e.target.value);
              }}
              placeholder={placeholder}
              className="w-full rounded-lg border border-zinc-200 bg-white py-2 pr-3 pl-8 font-mono text-xs text-zinc-800 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
            />
          </div>
          <p className="text-[10px] text-zinc-500">
            Harici görsel linki giriniz (örn: Web CDN, Unsplash, Imgur doğrudan
            resim URL'si).
          </p>
        </div>
      </div>
    </div>
  );
};
