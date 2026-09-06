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
import { ScanEntityType, Product, Compartment, Cabinet } from "../../types";
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
    type: ScanEntityType;
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

      if (onSelectProduct && result.type === "PRODUCT") {
        onSelectProduct(result.data as Product);
      }
      if (onSelectCompartment && result.type === "COMPARTMENT") {
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
    if (!scanResult || scanResult.type !== "PRODUCT") return;
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
        type: "PRODUCT",
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
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 flex flex-col max-h-[88vh] text-zinc-900">
        <div className="px-4 py-3 bg-zinc-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-zinc-300" />
            <h3 className="font-semibold text-xs text-zinc-100">
              Kamera DataMatrix Okuyucu
            </h3>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center">
          {!scanResult && (
            <div className="relative w-full max-w-[320px] aspect-square rounded-xl overflow-hidden bg-black border border-zinc-800 flex flex-col items-center justify-center">
              <div id={scannerContainerId} className="w-full h-full" />

              {isScanning && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative w-[210px] h-[210px] border border-white/40 rounded-lg">
                    <div className="absolute left-2 right-2 h-0.5 bg-red-500/90 scanner-laser" />
                  </div>
                </div>
              )}

              {isLoadingLookup && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white gap-2 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin text-zinc-300" />
                  <span>Sorgulanıyor...</span>
                </div>
              )}
            </div>
          )}

          {rawDetectedText && (
            <div className="w-full mt-3 p-3 bg-zinc-900 text-white rounded-xl border border-zinc-800 space-y-1.5 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-zinc-300 font-semibold">
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
                  className="flex items-center gap-1 text-[10px] text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded transition cursor-pointer"
                  title="Panoya Kopyala"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">
                        Kopyalandı
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Kopyala</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800/80 font-mono text-xs text-emerald-400 break-all select-all tracking-wide font-bold">
                {rawDetectedText}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mt-3 w-full p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {stockSuccessMsg && (
            <div className="mt-3 w-full p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="font-medium">{stockSuccessMsg}</div>
            </div>
          )}

          {scanResult && (
            <div className="w-full mt-2 bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 text-zinc-800">
                  {scanResult.type}
                </span>

                <button
                  onClick={handleResumeScan}
                  className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-md text-xs font-medium flex items-center gap-1 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Tekrar Tara</span>
                </button>
              </div>

              {scanResult.type === "PRODUCT" &&
                (() => {
                  const prod = scanResult.data as Product;
                  return (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-14 h-14 rounded-lg object-cover border border-zinc-200"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-400">
                            <Package className="w-6 h-6" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-semibold text-zinc-900 text-xs leading-snug line-clamp-2">
                              {prod.name}
                            </h4>
                            <div className="shrink-0">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                                {prod.owner}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                            {prod.sku}
                          </p>
                          <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="font-mono text-sm font-bold text-zinc-900">
                              {prod.quantity} adet
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-2 rounded-lg border border-zinc-200 text-[11px] text-zinc-700">
                        <span className="text-zinc-400">Konum: </span>
                        <strong>
                          {prod.compartment?.cabinet?.name} ➔{" "}
                          {prod.compartment?.name}
                        </strong>
                      </div>

                      {prod.isAssigned && prod.assignment && (
                        <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs space-y-1.5 shadow-2xs">
                          <div className="flex items-center gap-1.5 font-bold text-amber-900">
                            <UserCheck className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>ZİMMETLİ ÜRÜN</span>
                          </div>
                          <div className="text-[11px] text-amber-950 space-y-0.5">
                            <p>
                              <span className="text-amber-800 font-medium">
                                Zimmetli Kişi:{" "}
                              </span>
                              <strong className="text-zinc-900">
                                {prod.assignment.assignedToName}
                              </strong>
                            </p>
                            <p>
                              <span className="text-amber-800 font-medium">
                                Zimmet Adedi:{" "}
                              </span>
                              <strong className="text-amber-900 font-mono">
                                {prod.assignment.assignedQuantity || 1} adet
                              </strong>
                            </p>
                            {prod.assignment.assignedToPhone && (
                              <p>
                                <span className="text-amber-800 font-medium">
                                  Telefon:{" "}
                                </span>
                                <a
                                  href={`tel:${prod.assignment.assignedToPhone}`}
                                  className="underline font-semibold text-amber-900"
                                >
                                  {prod.assignment.assignedToPhone}
                                </a>
                              </p>
                            )}
                            <p>
                              <span className="text-amber-800 font-medium">
                                Başlangıç Tarihi:{" "}
                              </span>
                              <span>
                                {prod.assignment.assignedStartDate ||
                                  prod.assignment.assignedDate}
                              </span>
                            </p>
                            {prod.assignment.assignedEndDate && (
                              <p>
                                <span className="text-amber-800 font-medium">
                                  Bitiş Tarihi:{" "}
                                </span>
                                <span>{prod.assignment.assignedEndDate}</span>
                              </p>
                            )}
                            {prod.assignment.note && (
                              <p className="text-[10px] text-zinc-600 bg-white/80 p-1 rounded border border-amber-200 mt-1">
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
                            className="w-12 px-1.5 py-1 text-center text-xs font-mono font-bold border border-zinc-200 rounded-md bg-white"
                          />
                        </div>

                        <button
                          onClick={() => handleQuickStockChange(quickQtyChange)}
                          disabled={isUpdatingStock}
                          className="flex-1 py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-medium flex items-center justify-center gap-1 transition disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+{quickQtyChange} Ekle</span>
                        </button>

                        <button
                          onClick={() =>
                            handleQuickStockChange(-quickQtyChange)
                          }
                          disabled={
                            isUpdatingStock || prod.quantity < quickQtyChange
                          }
                          className="flex-1 py-1.5 px-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 rounded-md text-xs font-medium flex items-center justify-center gap-1 transition disabled:opacity-50"
                        >
                          <Minus className="w-3.5 h-3.5" />
                          <span>-{quickQtyChange} Çık</span>
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          handleCloseModal();
                          router.push(`/products/detail?id=${prod.id}`);
                        }}
                        className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition"
                      >
                        <span>Ürün Sayfasına Git</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })()}

              {scanResult.type === "COMPARTMENT" &&
                (() => {
                  const comp = scanResult.data as Compartment;
                  return (
                    <div className="space-y-2.5">
                      <div>
                        <h4 className="font-semibold text-zinc-900 text-xs font-mono">
                          Raf: {comp.code}
                        </h4>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          Dolap: {comp.cabinet?.code || comp.cabinetId}
                        </p>
                      </div>

                      <div className="max-h-36 overflow-y-auto space-y-1">
                        <span className="text-[10px] text-zinc-500 font-medium">
                          İçindeki Ürünler ({comp.products?.length || 0}):
                        </span>
                        {comp.products?.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              handleCloseModal();
                              router.push(`/products/detail?id=${p.id}`);
                            }}
                            className="p-1.5 bg-white rounded border border-zinc-200 flex items-center justify-between text-[11px] cursor-pointer hover:border-zinc-400"
                          >
                            <span className="truncate">{p.name}</span>
                            <span className="font-mono font-bold ml-2">
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
                        className="w-full py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg"
                      >
                        + Bu Rafa Ürün Ekle
                      </button>
                    </div>
                  );
                })()}

              {scanResult.type === "CABINET" &&
                (() => {
                  const cab = scanResult.data as Cabinet;
                  return (
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-semibold text-zinc-900 text-xs font-mono">
                          Dolap: {cab.code}
                        </h4>
                      </div>

                      <button
                        onClick={() => {
                          handleCloseModal();
                          router.push(`/storage?cabinetId=${cab.id}`);
                        }}
                        className="w-full py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg"
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
            className="w-full mt-3 pt-2.5 border-t border-zinc-100 flex items-center gap-1.5"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Veya kodu elle girin..."
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <Search className="w-3 h-3 text-zinc-400 absolute left-2.5 top-2.5" />
            </div>

            <button
              type="submit"
              disabled={!manualCode.trim() || isLoadingLookup}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg disabled:opacity-40"
            >
              Ara
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
