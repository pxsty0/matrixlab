import React, { useEffect, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  Html5QrcodeCameraScanConfig,
} from "html5-qrcode";
import { Camera as CapCamera } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import {
  X,
  Camera,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Package,
  Plus,
  Minus,
  ArrowRight,
  Copy,
  Check,
  QrCode,
  UserCheck,
} from "lucide-react";
import { ScannerAPI, ProductAPI } from "../../services";
import { EntityType, Product, Compartment, Cabinet } from "../../types";
import { useRouter } from "next/router";

interface DataMatrixScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: Product) => void;
  onSelectCompartment?: (compartment: Compartment) => void;
}

export const DataMatrixScannerModal = ({
  isOpen,
  onClose,
  onSelectProduct,
  onSelectCompartment,
}: DataMatrixScannerModalProps) => {
  const router = useRouter();
  const scannerContainerId = "interactive-datamatrix-reader";
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [isLoadingLookup, setIsLoadingLookup] = useState(false);
  const [rawDetectedText, setRawDetectedText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [scanResult, setScanResult] = useState<{
    type: EntityType;
    data: Product | Compartment | Cabinet;
  } | null>(null);

  const [quickQtyChange, setQuickQtyChange] = useState<number>(1);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [stockSuccessMsg, setStockSuccessMsg] = useState<string | null>(null);

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (_e) {}
      html5QrCodeRef.current = null;
    }

    try {
      const container = document.getElementById(scannerContainerId);
      if (container) {
        const videos = container.querySelectorAll("video");
        videos.forEach((video) => {
          if (video.srcObject) {
            const stream = video.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            video.srcObject = null;
          }
        });
        container.innerHTML = "";
      }
    } catch (_e) {}

    setIsScanning(false);
  };

  const startScanner = async () => {
    try {
      await stopScanner();

      if (Capacitor.isNativePlatform()) {
        const perm = await CapCamera.checkPermissions();
        if (perm.camera !== "granted") {
          const req = await CapCamera.requestPermissions({
            permissions: ["camera"],
          });
          if (req.camera !== "granted") {
            setErrorMessage(
              "Kamera izni verilmedi. Lütfen Ayarlar > MatrixLab üzerinden Kamera iznini açın.",
            );
            setIsScanning(false);
            return;
          }
        }
      }

      await startWebScanner();
    } catch (err: any) {
      setIsScanning(false);
      const errMsg = (err?.message || String(err)).toLowerCase();
      if (
        errMsg.includes("permission") ||
        errMsg.includes("notallowed") ||
        errMsg.includes("denied")
      ) {
        setErrorMessage(
          "Kamera izni verilmedi. Lütfen Ayarlar > MatrixLab üzerinden Kamera iznini açın.",
        );
      } else {
        setErrorMessage(
          "Kamera başlatılamadı. Lütfen kamera izinlerini kontrol edin.",
        );
      }
    }
  };

  const startWebScanner = async () => {
    const element = document.getElementById(scannerContainerId);
    if (!element) return;

    const html5QrCode = new Html5Qrcode(scannerContainerId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.DATA_MATRIX],
      verbose: false,
      useBarCodeDetectorIfSupported: true,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true,
      },
    });

    html5QrCodeRef.current = html5QrCode;

    const cameraScanConfig: Html5QrcodeCameraScanConfig = {
      fps: 10,
      aspectRatio: 1.0,
    };

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          ...cameraScanConfig,
          videoConstraints: {
            facingMode: "environment",
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            advanced: [{ focusMode: "continuous" }] as any,
          },
        },
        (decodedText) => {
          handleCodeDetected(decodedText);
        },
        () => {},
      );
    } catch (_firstStartErr: any) {
      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 0) {
        const backCam =
          cameras.find(
            (c) =>
              c.label.toLowerCase().includes("back") ||
              c.label.toLowerCase().includes("rear") ||
              c.label.toLowerCase().includes("environment"),
          ) || cameras[cameras.length - 1];

        await html5QrCode.start(
          backCam.id,
          {
            ...cameraScanConfig,
            videoConstraints: {
              deviceId: { exact: backCam.id },
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 },
            },
          },
          (decodedText) => {
            handleCodeDetected(decodedText);
          },
          () => {},
        );
      } else {
        await html5QrCode.start(
          { facingMode: "environment" },
          cameraScanConfig,
          (decodedText) => {
            handleCodeDetected(decodedText);
          },
          () => {},
        );
      }
    }

    try {
      const capabilities: any = html5QrCode.getRunningTrackCapabilities?.();
      if (
        capabilities?.focusMode &&
        Array.isArray(capabilities.focusMode) &&
        capabilities.focusMode.includes("continuous")
      ) {
        await html5QrCode.applyVideoConstraints({
          advanced: [{ focusMode: "continuous" } as any],
        });
      }
    } catch (_e) {}

    setIsScanning(true);
    setErrorMessage(null);
  };

  useEffect(() => {
    if (isOpen) {
      setScanResult(null);
      setRawDetectedText(null);
      setCopied(false);
      setErrorMessage(null);
      setStockSuccessMsg(null);
      const timer = setTimeout(() => {
        startScanner();
      }, 200);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  const handleCodeDetected = async (code: string) => {
    if (isLoadingLookup) return;

    stopScanner().catch(() => {});
    await performLookup(code);
  };

  const performLookup = async (code: string) => {
    setRawDetectedText(code);
    setIsLoadingLookup(true);
    setErrorMessage(null);
    setStockSuccessMsg(null);

    try {
      const result = await ScannerAPI.lookup(code);
      setScanResult({
        type: result.type,
        data: result.data,
      });

      if (onSelectProduct && result.type === "product") {
        onSelectProduct(result.data as Product);
      }
      if (onSelectCompartment && result.type === "compartment") {
        onSelectCompartment(result.data as Compartment);
      }
    } catch (err: any) {
      setErrorMessage(err.message || `"${code}" koduna ait kayıt bulunamadı.`);
      setScanResult(null);
    } finally {
      setIsLoadingLookup(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleCodeDetected(manualCode.trim());
    }
  };

  const handleResumeScan = () => {
    setScanResult(null);
    setRawDetectedText(null);
    setCopied(false);
    setErrorMessage(null);
    setStockSuccessMsg(null);
    setManualCode("");
    startScanner();
  };

  const handleQuickStockChange = async (change: number) => {
    if (!scanResult || scanResult.type !== "product") return;
    const prod = scanResult.data as Product;

    setIsUpdatingStock(true);
    setStockSuccessMsg(null);
    try {
      const res = await ProductAPI.adjustStock(prod.id, {
        change,
        type: change > 0 ? "IN" : "OUT",
        note: "Kamera Hızlı İşlem",
      });

      setScanResult({
        type: "product",
        data: res.product,
      });
      setStockSuccessMsg(`Stok güncellendi: ${res.product.quantity} adet`);
    } catch (err: any) {
      setErrorMessage(err.message || "Stok güncellenemedi");
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const handleCloseModal = () => {
    stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] backdrop-blur-xs sm:p-4">
      <div className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-xl">
        <div className="flex items-center justify-between bg-zinc-900 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-zinc-300" />
            <h3 className="text-xs font-semibold text-zinc-100">
              Kamera DataMatrix Okuyucu
            </h3>
          </div>
          <button
            onClick={handleCloseModal}
            className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center overflow-y-auto p-4">
          {!scanResult && (
            <div className="relative flex aspect-square w-full max-w-[320px] flex-col items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-black">
              <div id={scannerContainerId} className="h-full w-full" />

              {isScanning && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-[210px] w-[210px] rounded-lg border border-white/40">
                    <div className="scanner-laser absolute right-2 left-2 h-0.5 bg-red-500/90" />
                  </div>
                </div>
              )}

              {isLoadingLookup && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-xs text-white">
                  <RefreshCw className="h-5 w-5 animate-spin text-zinc-300" />
                  <span>Sorgulanıyor...</span>
                </div>
              )}
            </div>
          )}

          {rawDetectedText && (
            <div className="animate-in fade-in slide-in-from-top-1 mt-3 w-full space-y-1.5 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-white shadow-sm duration-200">
              <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <QrCode className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span className="font-semibold text-zinc-300">
                    Okunan Ham DataMatrix Metni:
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(rawDetectedText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex cursor-pointer items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
                  title="Panoya Kopyala"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="font-medium text-emerald-400">
                        Kopyalandı
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Kopyala</span>
                    </>
                  )}
                </button>
              </div>
              <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-2 font-mono text-xs font-bold tracking-wide break-all text-emerald-400 select-all">
                {rawDetectedText}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mt-3 flex w-full items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {stockSuccessMsg && (
            <div className="mt-3 flex w-full items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <div className="font-medium">{stockSuccessMsg}</div>
            </div>
          )}

          {scanResult && (
            <div className="mt-2 w-full space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
              <div className="flex items-center justify-between">
                <span className="rounded bg-zinc-200 px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-800">
                  {scanResult.type}
                </span>

                <button
                  onClick={handleResumeScan}
                  className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Tekrar Tara</span>
                </button>
              </div>

              {scanResult.type === "product" &&
                (() => {
                  const prod = scanResult.data as Product;
                  return (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="h-14 w-14 rounded-lg border border-zinc-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-200 text-zinc-400">
                            <Package className="h-6 w-6" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="line-clamp-2 text-xs leading-snug font-semibold text-zinc-900">
                              {prod.name}
                            </h4>
                            <div className="shrink-0">
                              <span className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-800">
                                {prod.owner?.name}
                              </span>
                            </div>
                          </div>
                          <p className="mt-0.5 font-mono text-[11px] text-zinc-500">
                            {prod.sku}
                          </p>
                          <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="font-mono text-sm font-bold text-zinc-900">
                              {prod.quantity} adet
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-zinc-200 bg-white p-2 text-[11px] text-zinc-700">
                        <span className="text-zinc-400">Konum: </span>
                        <strong>
                          {prod.compartment?.cabinet?.name} ➔{" "}
                          {prod.compartment?.name}
                        </strong>
                      </div>

                      {prod.isAssigned && prod.assignment && (
                        <div className="space-y-1.5 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs shadow-2xs">
                          <div className="flex items-center gap-1.5 font-bold text-amber-900">
                            <UserCheck className="h-4 w-4 shrink-0 text-amber-700" />
                            <span>ZİMMETLİ ÜRÜN</span>
                          </div>
                          <div className="space-y-0.5 text-[11px] text-amber-950">
                            <p>
                              <span className="font-medium text-amber-800">
                                Zimmetli Kişi:{" "}
                              </span>
                              <strong className="text-zinc-900">
                                {prod.assignment.assignedToName}
                              </strong>
                            </p>
                            <p>
                              <span className="font-medium text-amber-800">
                                Zimmet Adedi:{" "}
                              </span>
                              <strong className="font-mono text-amber-900">
                                {prod.assignment.assignedQuantity || 1} adet
                              </strong>
                            </p>
                            {prod.assignment.assignedToPhone && (
                              <p>
                                <span className="font-medium text-amber-800">
                                  Telefon:{" "}
                                </span>
                                <a
                                  href={`tel:${prod.assignment.assignedToPhone}`}
                                  className="font-semibold text-amber-900 underline"
                                >
                                  {prod.assignment.assignedToPhone}
                                </a>
                              </p>
                            )}
                            <p>
                              <span className="font-medium text-amber-800">
                                Başlangıç Tarihi:{" "}
                              </span>
                              <span>
                                {prod.assignment.assignedStartDate ||
                                  prod.assignment.assignedDate}
                              </span>
                            </p>
                            {prod.assignment.assignedEndDate && (
                              <p>
                                <span className="font-medium text-amber-800">
                                  Bitiş Tarihi:{" "}
                                </span>
                                <span>{prod.assignment.assignedEndDate}</span>
                              </p>
                            )}
                            {prod.assignment.note && (
                              <p className="mt-1 rounded border border-amber-200 bg-white/80 p-1 text-[10px] text-zinc-600">
                                {prod.assignment.note}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={quickQtyChange}
                            onChange={(e) =>
                              setQuickQtyChange(
                                Math.max(1, parseInt(e.target.value, 10) || 1),
                              )
                            }
                            className="w-12 rounded-md border border-zinc-200 bg-white px-1.5 py-1 text-center font-mono text-xs font-bold"
                          />
                        </div>

                        <button
                          onClick={() => handleQuickStockChange(quickQtyChange)}
                          disabled={isUpdatingStock}
                          className="flex flex-1 items-center justify-center gap-1 rounded-md bg-zinc-900 px-2 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>+{quickQtyChange} Ekle</span>
                        </button>

                        <button
                          onClick={() =>
                            handleQuickStockChange(-quickQtyChange)
                          }
                          disabled={
                            isUpdatingStock || prod.quantity < quickQtyChange
                          }
                          className="flex flex-1 items-center justify-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-50"
                        >
                          <Minus className="h-3.5 w-3.5" />
                          <span>-{quickQtyChange} Çık</span>
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          handleCloseModal();
                          router.push(`/products/detail?id=${prod.id}`);
                        }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-100 py-2 text-xs font-medium text-zinc-900 transition hover:bg-zinc-200"
                      >
                        <span>Ürün Sayfasına Git</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })()}

              {scanResult.type === "compartment" &&
                (() => {
                  const comp = scanResult.data as Compartment;
                  return (
                    <div className="space-y-2.5">
                      <div>
                        <h4 className="font-mono text-xs font-semibold text-zinc-900">
                          Raf: {comp.code}
                        </h4>
                        <p className="font-mono text-[11px] text-zinc-500">
                          Dolap: {comp.cabinet?.code || comp.cabinetId}
                        </p>
                      </div>

                      <div className="max-h-36 space-y-1 overflow-y-auto">
                        <span className="text-[10px] font-medium text-zinc-500">
                          İçindeki Ürünler ({comp.products?.length || 0}):
                        </span>
                        {comp.products?.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              handleCloseModal();
                              router.push(`/products/detail?id=${p.id}`);
                            }}
                            className="flex cursor-pointer items-center justify-between rounded border border-zinc-200 bg-white p-1.5 text-[11px] hover:border-zinc-400"
                          >
                            <span className="truncate">{p.name}</span>
                            <span className="ml-2 font-mono font-bold">
                              {p.quantity} adet
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          handleCloseModal();
                          router.push(
                            `/products?new=true&compartmentCode=${comp.code}`,
                          );
                        }}
                        className="w-full rounded-lg bg-zinc-900 py-1.5 text-xs font-medium text-white"
                      >
                        + Bu Rafa Ürün Ekle
                      </button>
                    </div>
                  );
                })()}

              {scanResult.type === "cabinet" &&
                (() => {
                  const cab = scanResult.data as Cabinet;
                  return (
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-mono text-xs font-semibold text-zinc-900">
                          Dolap: {cab.code}
                        </h4>
                      </div>

                      <button
                        onClick={() => {
                          handleCloseModal();
                          router.push(`/storage?cabinetId=${cab.id}`);
                        }}
                        className="w-full rounded-lg bg-zinc-900 py-1.5 text-xs font-medium text-white"
                      >
                        Dolabı Aç
                      </button>
                    </div>
                  );
                })()}
            </div>
          )}

          <form
            onSubmit={handleManualSubmit}
            className="mt-3 flex w-full items-center gap-1.5 border-t border-zinc-100 pt-2.5"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Veya kodu elle girin..."
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pr-2 pl-7 text-xs focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none"
              />
              <Search className="absolute top-2.5 left-2.5 h-3 w-3 text-zinc-400" />
            </div>

            <button
              type="submit"
              disabled={!manualCode.trim() || isLoadingLookup}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
            >
              Ara
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
