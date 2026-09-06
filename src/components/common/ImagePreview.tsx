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

      <div className="flex gap-3 items-start">
        <div className="w-20 h-20 shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 overflow-hidden flex flex-col items-center justify-center shadow-2xs">
          {value && !hasError ? (
            <img
              src={value}
              alt="Önizleme"
              onError={() => setHasError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-1 text-zinc-400">
              <ImageIcon className="w-5 h-5 mx-auto mb-0.5" />
              <span className="text-[9px] font-medium block text-zinc-400">
                {value && hasError ? "Yüklenemedi" : "Görsel Yok"}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-1">
          <div className="relative">
            <LinkIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            <input
              type="url"
              value={value || ""}
              onChange={(e) => {
                setHasError(false);
                onChange?.(e.target.value);
              }}
              placeholder={placeholder}
              className="w-full pl-8 pr-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 font-mono text-zinc-800 bg-white"
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
