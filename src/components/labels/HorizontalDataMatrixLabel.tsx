import React, { useEffect, useRef } from "react";
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const typeLabelText =
    type === "PRODUCT" ? "Ürün" : type === "CABINET" ? "Dolap" : "Raf";

  useEffect(() => {
    if (canvasRef.current && code) {
      renderDataMatrixToCanvas(canvasRef.current, code);
    }
  }, [code, size]);

  const handlePrintSingle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const printWindow = window.open("", "_blank", "width=450,height=300");
    if (!printWindow || !canvasRef.current) return;

    function escapeHtml(unsafeString: string) {
      if (typeof unsafeString !== "string") return unsafeString;

      return unsafeString
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    const dataUrl = canvasRef.current.toDataURL("image/png");

    let fieldsHtml = `
      <div class="field-row">
        <span class="field-label">Tip:</span>
        <span class="field-val">${escapeHtml(typeLabelText)}</span>
      </div>
    `;

    if (type === "PRODUCT") {
      if (sku) {
        fieldsHtml += `
          <div class="field-row">
            <span class="field-label">SKU:</span>
            <span class="field-val">${escapeHtml(sku)}</span>
          </div>
        `;
      }
      if (owner) {
        fieldsHtml += `
          <div class="field-row">
            <span class="field-label">Sahip:</span>
            <span class="field-val">${escapeHtml(owner)}</span>
          </div>
        `;
      }
      if (cabinetCode) {
        fieldsHtml += `
          <div class="field-row">
            <span class="field-label">Dolap:</span>
            <span class="field-val">${escapeHtml(cabinetCode)}</span>
          </div>
        `;
      }
      if (compartmentCode) {
        fieldsHtml += `
          <div class="field-row">
            <span class="field-label">Raf:</span>
            <span class="field-val">${escapeHtml(compartmentCode)}</span>
          </div>
        `;
      }
    } else if (type === "COMPARTMENT") {
      if (cabinetCode) {
        fieldsHtml += `
          <div class="field-row">
            <span class="field-label">Dolap:</span>
            <span class="field-val">${escapeHtml(cabinetCode)}</span>
          </div>
        `;
      }
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiket - ${escapeHtml(title)}</title>
          <style>
            @page { margin: 2mm; size: auto; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
            }
            .horizontal-label {
              width: 320px;
              height: 120px;
              border: 1.5px solid #000;
              border-radius: 6px;
              padding: 8px 10px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              box-sizing: border-box;
              background: #fff;
              gap: 8px;
            }
            .info-col {
              flex: 1;
              min-width: 0;
              display: flex;
              flex-direction: column;
              justify-content: center;
              gap: 3px;
            }
            .title {
              font-size: 11.5px;
              font-weight: 800;
              line-height: 1.2;
              color: #000;
              margin-bottom: 3px;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .field-row {
              font-size: 9.5px;
              line-height: 1.25;
              color: #111;
              display: flex;
              gap: 4px;
            }
            .field-label {
              font-weight: 600;
              color: #444;
            }
            .field-val {
              font-weight: 700;
              font-family: monospace;
              color: #000;
            }
            .matrix-col {
              width: 85px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border-left: 1px dashed #444;
              padding-left: 6px;
              flex-shrink: 0;
            }
            .type-badge {
              font-size: 8px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              background: #000;
              color: #fff;
              padding: 1.5px 5px;
              border-radius: 3px;
              margin-bottom: 2px;
              text-align: center;
              line-height: 1;
            }
            .matrix-col img {
              width: 60px;
              height: 60px;
              display: block;
            }
            .code-text {
              font-family: monospace;
              font-size: 7.5px;
              font-weight: 700;
              margin-top: 2px;
              text-align: center;
              word-break: break-all;
              line-height: 1;
            }
          </style>
        </head>
        <body>
          <div class="horizontal-label">
            <div class="info-col">
              <div class="title">${escapeHtml(title)}</div>
              ${fieldsHtml}
            </div>
            <div class="matrix-col">
              <div class="type-badge">${escapeHtml(typeLabelText)}</div>
              <img src="${escapeHtml(dataUrl)}" alt="${escapeHtml(code)}" />
              <div class="code-text">${escapeHtml(code)}</div>
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
            onClick={handlePrintSingle}
            title="Yazdır"
            className="px-2 py-0.5 rounded text-white bg-zinc-900 hover:bg-zinc-800 transition flex items-center gap-1 font-medium cursor-pointer"
          >
            <Printer className="w-3 h-3" />
            <span className="text-[10px]">Tekli Yazdır</span>
          </button>
        </div>
      )}
    </div>
  );
};
