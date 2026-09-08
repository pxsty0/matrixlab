import React, { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { renderDataMatrixToCanvas } from "../../utils/datamatrix";
import { Printer } from "lucide-react";

export type LabelType = "PRODUCT" | "CABINET" | "COMPARTMENT";

export interface HorizontalLabelProps {
  type: LabelType;
  title: string;
  owner?: string | null;
  cabinetCode?: string | null;
  compartmentCode?: string | null;
  code: string;
  sku?: string | null;
  showActions?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const HorizontalDataMatrixLabel = ({
  type,
  title,
  owner,
  cabinetCode,
  compartmentCode,
  code,
  sku,
  showActions = false,
  isSelected = true,
  onToggleSelect,
  className = "",
  size = "md",
}: HorizontalLabelProps) => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const typeLabelText =
    type === "PRODUCT" ? "Ürün" : type === "CABINET" ? "Dolap" : "Raf";

  useEffect(() => {
    if (canvasRef.current && code) {
      renderDataMatrixToCanvas(canvasRef.current, code);
    }
  }, [code, size]);

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    const tab =
      type === "CABINET"
        ? "cabinets"
        : type === "COMPARTMENT"
          ? "compartments"
          : "products";
    router.push({ pathname: "/labels", query: { tab } });
  };

  return (
    <div
      onClick={onToggleSelect}
      className={`label-card relative bg-white rounded-lg border transition-all text-left select-none overflow-hidden box-border flex flex-col justify-between ${
        isSelected
          ? "border-zinc-900 shadow-xs ring-1 ring-zinc-900 opacity-100"
          : "border-dashed border-zinc-300 opacity-40 hover:opacity-75 hover:border-zinc-400 print:hidden"
      } ${onToggleSelect ? "cursor-pointer" : ""} ${className}`}
    >
      <div className="p-2.5 flex items-center justify-between gap-2.5 min-w-0 w-full">
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <h4 className="font-bold text-zinc-900 text-xs sm:text-[13px] leading-tight line-clamp-2 break-words">
            {title}
          </h4>

          {type === "PRODUCT" && (
            <>
              {sku && (
                <div className="text-[10px] sm:text-[11px] text-zinc-700 flex items-center gap-1 font-mono">
                  <span className="text-zinc-500 font-sans font-medium">
                    SKU:
                  </span>
                  <span className="font-semibold text-zinc-900 bg-zinc-50 px-1 py-0.2 rounded border border-zinc-200/60">
                    {sku}
                  </span>
                </div>
              )}

              {owner && (
                <div className="text-[10px] sm:text-[11px] text-zinc-700 flex items-center gap-1">
                  <span className="text-zinc-500 font-medium">Sahip:</span>
                  <span className="font-semibold text-zinc-900 bg-zinc-50 px-1 py-0.2 rounded border border-zinc-200/60">
                    {owner}
                  </span>
                </div>
              )}

              {cabinetCode && (
                <div className="text-[10px] sm:text-[11px] text-zinc-700 flex items-center gap-1 font-mono">
                  <span className="text-zinc-500 font-sans font-medium">
                    Dolap:
                  </span>
                  <span className="font-bold text-zinc-900 bg-zinc-50 px-1 py-0.2 rounded border border-zinc-200/60">
                    {cabinetCode}
                  </span>
                </div>
              )}

              {compartmentCode && (
                <div className="text-[10px] sm:text-[11px] text-zinc-700 flex items-center gap-1 font-mono">
                  <span className="text-zinc-500 font-sans font-medium">
                    Raf:
                  </span>
                  <span className="font-bold text-zinc-900 bg-zinc-50 px-1 py-0.2 rounded border border-zinc-200/60">
                    {compartmentCode}
                  </span>
                </div>
              )}
            </>
          )}

          {type === "COMPARTMENT" && cabinetCode && (
            <div className="text-[10px] sm:text-[11px] text-zinc-700 flex items-center gap-1 font-mono">
              <span className="text-zinc-500 font-sans font-medium">
                Dolap:
              </span>
              <span className="font-bold text-zinc-900 bg-zinc-50 px-1 py-0.2 rounded border border-zinc-200/60">
                {cabinetCode}
              </span>
            </div>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-center justify-center pl-2.5 border-l border-dashed border-zinc-200 w-24">
          <span className="font-bold text-[8.5px] uppercase tracking-wider text-white bg-zinc-900 px-1.5 py-0.5 rounded mb-1 text-center shadow-2xs">
            {typeLabelText}
          </span>
          <div className="p-0.5 bg-white rounded flex items-center justify-center pointer-events-none">
            <canvas ref={canvasRef} />
          </div>
          <span className="font-mono text-[8px] font-bold text-zinc-900 text-center tracking-tight break-all max-w-[85px] mt-0.5 select-all">
            {code}
          </span>
        </div>
      </div>

      {showActions && (
        <div className="no-print flex items-center justify-end gap-1 px-2.5 py-1.5 bg-zinc-50 border-t border-zinc-100 text-[11px]">
          <button
            type="button"
            onClick={handlePrint}
            title="Yazdır"
            className="px-2 py-0.5 rounded text-white bg-zinc-900 hover:bg-zinc-800 transition flex items-center gap-1 font-medium cursor-pointer"
          >
            <Printer className="w-3 h-3" />
            <span className="text-[10px]">Yazdır</span>
          </button>
        </div>
      )}
    </div>
  );
};
