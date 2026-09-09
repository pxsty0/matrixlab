import React, { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { renderDataMatrixToCanvas } from "../../utils/datamatrix";
import { Printer } from "lucide-react";
import { EntityType } from "../../types";

export interface HorizontalLabelProps {
  type: EntityType;
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
    type === "product" ? "Ürün" : type === "cabinet" ? "Dolap" : "Raf";

  useEffect(() => {
    if (canvasRef.current && code) {
      renderDataMatrixToCanvas(canvasRef.current, code);
    }
  }, [code, size]);

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    const tab =
      type === "cabinet"
        ? "cabinets"
        : type === "compartment"
          ? "compartments"
          : "products";
    router.push({ pathname: "/labels", query: { tab } });
  };

  return (
    <div
      onClick={onToggleSelect}
      className={`label-card relative box-border flex flex-col justify-between overflow-hidden rounded-lg border bg-white text-left transition-all select-none ${
        isSelected
          ? "border-zinc-900 opacity-100 shadow-xs ring-1 ring-zinc-900"
          : "border-dashed border-zinc-300 opacity-40 hover:border-zinc-400 hover:opacity-75 print:hidden"
      } ${onToggleSelect ? "cursor-pointer" : ""} ${className}`}
    >
      <div className="flex w-full min-w-0 items-center justify-between gap-2.5 p-2.5">
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <h4 className="line-clamp-2 text-xs leading-tight font-bold break-words text-zinc-900 sm:text-[13px]">
            {title}
          </h4>

          {type === "product" && (
            <>
              {sku && (
                <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-700 sm:text-[11px]">
                  <span className="font-sans font-medium text-zinc-500">
                    SKU:
                  </span>
                  <span className="py-0.2 rounded border border-zinc-200/60 bg-zinc-50 px-1 font-semibold text-zinc-900">
                    {sku}
                  </span>
                </div>
              )}

              {owner && (
                <div className="flex items-center gap-1 text-[10px] text-zinc-700 sm:text-[11px]">
                  <span className="font-medium text-zinc-500">Sahip:</span>
                  <span className="py-0.2 rounded border border-zinc-200/60 bg-zinc-50 px-1 font-semibold text-zinc-900">
                    {owner}
                  </span>
                </div>
              )}

              {cabinetCode && (
                <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-700 sm:text-[11px]">
                  <span className="font-sans font-medium text-zinc-500">
                    Dolap:
                  </span>
                  <span className="py-0.2 rounded border border-zinc-200/60 bg-zinc-50 px-1 font-bold text-zinc-900">
                    {cabinetCode}
                  </span>
                </div>
              )}

              {compartmentCode && (
                <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-700 sm:text-[11px]">
                  <span className="font-sans font-medium text-zinc-500">
                    Raf:
                  </span>
                  <span className="py-0.2 rounded border border-zinc-200/60 bg-zinc-50 px-1 font-bold text-zinc-900">
                    {compartmentCode}
                  </span>
                </div>
              )}
            </>
          )}

          {type === "compartment" && cabinetCode && (
            <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-700 sm:text-[11px]">
              <span className="font-sans font-medium text-zinc-500">
                Dolap:
              </span>
              <span className="py-0.2 rounded border border-zinc-200/60 bg-zinc-50 px-1 font-bold text-zinc-900">
                {cabinetCode}
              </span>
            </div>
          )}
        </div>

        <div className="flex w-24 shrink-0 flex-col items-center justify-center border-l border-dashed border-zinc-200 pl-2.5">
          <span className="mb-1 rounded bg-zinc-900 px-1.5 py-0.5 text-center text-[8.5px] font-bold tracking-wider text-white uppercase shadow-2xs">
            {typeLabelText}
          </span>
          <div className="pointer-events-none flex items-center justify-center rounded bg-white p-0.5">
            <canvas ref={canvasRef} />
          </div>
          <span className="mt-0.5 max-w-[85px] text-center font-mono text-[8px] font-bold tracking-tight break-all text-zinc-900 select-all">
            {code}
          </span>
        </div>
      </div>

      {showActions && (
        <div className="no-print flex items-center justify-end gap-1 border-t border-zinc-100 bg-zinc-50 px-2.5 py-1.5 text-[11px]">
          <button
            type="button"
            onClick={handlePrint}
            title="Yazdır"
            className="flex cursor-pointer items-center gap-1 rounded bg-zinc-900 px-2 py-0.5 font-medium text-white transition hover:bg-zinc-800"
          >
            <Printer className="h-3 w-3" />
            <span className="text-[10px]">Yazdır</span>
          </button>
        </div>
      )}
    </div>
  );
};
