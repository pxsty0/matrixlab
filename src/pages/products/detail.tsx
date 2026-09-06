import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import {
  Package,
  Layers,
  ArrowLeft,
  Plus,
  Minus,
  ArrowRightLeft,
  Edit2,
  Trash2,
  History,
  RefreshCw,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  ProductAPI,
  CabinetAPI,
  CompartmentAPI,
} from "../../services";
import { Product, Cabinet, Compartment } from "../../types";
import { PRODUCT_OWNERS } from "../../config/constants";
import { HorizontalDataMatrixLabel } from "../../components/labels/HorizontalDataMatrixLabel";
import { Modal } from "../../components/common/Modal";
import { ImagePreview } from "../../components/common/ImagePreview";
import { toast } from "react-toastify";

export default function ProductDetailPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';

  const [product, setProduct] = useState<Product | null>(null);
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [compartments, setCompartments] = useState<Compartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<"IN" | "OUT">("IN");
  const [adjustNote, setAdjustNote] = useState("");
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetCabinetId, setTransferTargetCabinetId] = useState("");
  const [transferTargetCompartmentCode, setTransferTargetCompartmentCode] =
    useState("");
  const [transferNote, setTransferNote] = useState("");
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editOwner, setEditOwner] = useState<string>("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    assignedToName: "",
    assignedQuantity: 1,
    assignedToPhone: "",
    assignedToEmail: "",
    assignedStartDate: new Date().toISOString().split("T")[0],
    assignedEndDate: "",
    note: "",
  });
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);
  const [unassignReturnNote, setUnassignReturnNote] = useState("");
  const [isSubmittingUnassign, setIsSubmittingUnassign] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [prodData, cabsData, compsData] = await Promise.all([
        ProductAPI.getById(id),
        CabinetAPI.getAll(),
        CompartmentAPI.getAll(),
      ]);
      setProduct(prodData);
      setCabinets(cabsData);
      setCompartments(compsData);
    } catch (_e) {
      setError('Ürün detayları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || adjustAmount <= 0) return;

    setIsSubmittingAdjust(true);
    const delta = adjustType === "IN" ? adjustAmount : -adjustAmount;

    try {
      await ProductAPI.adjustStock(product.id, {
        change: delta,
        type: adjustType,
        note: adjustNote.trim() || undefined,
      });
      setIsAdjustModalOpen(false);
      setAdjustNote("");
      toast.success(
        `Stok başarıyla güncellendi (${delta > 0 ? "+" : ""}${delta})`,
      );
      await fetchProduct();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Stok güncellenemedi");
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !transferTargetCompartmentCode) return;

    setIsSubmittingTransfer(true);
    try {
      await ProductAPI.transfer(product.id, {
        targetCompartmentCode: transferTargetCompartmentCode,
        note: transferNote.trim() || undefined,
      });
      setIsTransferModalOpen(false);
      setTransferNote("");
      toast.success("Ürün başarıyla yeni bölmeye taşındı.");
      await fetchProduct();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Transfer edilemedi");
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const handleOpenEdit = () => {
    if (!product) return;
    setEditName(product.name);
    setEditSku(product.sku);
    setEditOwner(product.owner || "");
    setEditDescription(product.description || "");
    setEditImageUrl(product.imageUrl || "");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!editOwner) {
      toast.warning("Lütfen malzeme sahibini seçin.");
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const formData = new FormData();
      formData.append("name", editName.trim());
      formData.append("sku", editSku.trim().toUpperCase());
      formData.append("owner", editOwner);
      formData.append("description", editDescription.trim());
      formData.append("imageUrl", editImageUrl.trim());

      await ProductAPI.update(product.id, formData);
      setIsEditModalOpen(false);
      toast.success("Ürün bilgileri güncellendi.");
      await fetchProduct();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Güncellenemedi");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleOpenAssign = () => {
    if (!product) return;
    if (product.isAssigned && product.assignment) {
      setAssignForm({
        assignedToName: product.assignment.assignedToName || "",
        assignedQuantity: product.assignment.assignedQuantity ?? 0,
        assignedToPhone: product.assignment.assignedToPhone || "",
        assignedToEmail: product.assignment.assignedToEmail || "",
        assignedStartDate:
          product.assignment.assignedStartDate ||
          product.assignment.assignedDate ||
          "",
        assignedEndDate: product.assignment.assignedEndDate || "",
        note: product.assignment.note || "",
      });
    } else {
      const today = new Date().toISOString().split("T")[0];
      setAssignForm({
        assignedToName: "",
        assignedQuantity: Math.min(1, Math.max(1, product.quantity)),
        assignedToPhone: "",
        assignedToEmail: "",
        assignedStartDate: today,
        assignedEndDate: today,
        note: "",
      });
    }
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !product ||
      !assignForm.assignedToName.trim() ||
      !assignForm.assignedEndDate.trim()
    )
      return;

    setIsSubmittingAssign(true);
    try {
      await ProductAPI.assign(product.id, assignForm);
      setIsAssignModalOpen(false);
      toast.success(
        `Ürün başarıyla ${assignForm.assignedToName} adına zimmetlendi.`,
      );
      await fetchProduct();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Zimmetleme işlemi başarısız");
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  const handleUnassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setIsSubmittingUnassign(true);
    try {
      await ProductAPI.unassign(product.id, unassignReturnNote.trim() || undefined);
      setIsUnassignModalOpen(false);
      setUnassignReturnNote("");
      toast.success("Zimmet başarıyla teslim alındı / kaldırıldı.");
      await fetchProduct();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Zimmet kaldırılamadı");
    } finally {
      setIsSubmittingUnassign(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (
      window.confirm(
        `"${product.name}" ürününü silmek istediğinize emin misiniz?`,
      )
    ) {
      try {
        await ProductAPI.delete(product.id);
        toast.success("Ürün başarıyla silindi.");
        router.push("/products");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Silinemedi");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2 text-zinc-500 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin text-zinc-600" />
        <span>Yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500">
        <AlertCircle className="w-6 h-6 text-rose-500" />
        <p className="text-sm text-zinc-700">{error}</p>
        <button onClick={fetchProduct} className="text-xs text-blue-600 hover:underline">Tekrar Dene</button>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <button
          onClick={() => router.back()}
          className="px-2.5 py-1 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium rounded-md border border-zinc-200 flex items-center gap-1 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Geri</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenEdit}
            className="px-2.5 py-1 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium rounded-md border border-zinc-200 flex items-center gap-1 transition cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Düzenle</span>
          </button>

          <button
            onClick={handleDelete}
            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium rounded-md border border-rose-200 flex items-center gap-1 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Sil</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-5 grid grid-cols-1 md:grid-cols-12 gap-5 shadow-xs">
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="w-full aspect-square bg-zinc-100 rounded-lg border border-zinc-200 overflow-hidden flex items-center justify-center relative">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-16 h-16 text-zinc-300" />
            )}
          </div>
        </div>

        <div className="md:col-span-8 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-zinc-100 text-zinc-800 rounded border border-zinc-200">
                {product.sku}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                {product.owner}
              </span>
            </div>

            <h1 className="text-lg font-bold text-zinc-900 leading-snug">
              {product.name}
            </h1>
          </div>

          <div
            onClick={() =>
              router.push(`/storage?cabinetId=${product.compartment?.cabinetId}`)
            }
            className="p-3 bg-zinc-50 hover:bg-zinc-100/70 rounded-lg border border-zinc-200 flex items-center justify-between cursor-pointer transition"
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-zinc-500" />
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-medium">
                  Konum
                </span>
                <p className="text-xs font-semibold text-zinc-800 font-mono">
                  {product.compartment?.cabinet?.code || "—"} ➔ {product.compartmentCode || product.compartment?.code}
                </p>
              </div>
            </div>
            <span className="text-[11px] text-zinc-500 font-medium">
              Dolabı Aç ➔
            </span>
          </div>

          {product.isAssigned && product.assignment ? (
            <div className="p-3.5 bg-amber-50/90 border-2 border-amber-300 rounded-xl space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 font-bold text-xs px-2.5 py-1 rounded-md bg-amber-600 text-white shadow-xs">
                    <UserCheck className="w-4 h-4" />
                    <span>BU ÜRÜN ZİMMETLİDİR</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleOpenAssign}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100/80 border border-amber-300 text-amber-900 rounded-md text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
                  >
                    <Edit2 className="w-3 h-3 text-amber-700" />
                    <span>Düzenle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUnassignReturnNote("");
                      setIsUnassignModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition shadow-xs"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Zimmeti Teslim Al</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/70">
                  <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                    Zimmetlenen Kişi
                  </span>
                  <p className="font-bold text-sm text-zinc-900 mt-0.5 truncate">
                    {product.assignment.assignedToName}
                  </p>
                </div>

                <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/70">
                  <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                    Zimmet Adedi
                  </span>
                  <p className="font-mono font-bold text-sm text-amber-950 mt-0.5">
                    {product.assignment.assignedQuantity ?? 0} adet
                  </p>
                </div>

                <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/70">
                  <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                    Başlangıç Tarihi
                  </span>
                  <p className="font-semibold text-zinc-800 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    <span>{product.assignment.assignedStartDate || product.assignment.assignedDate}</span>
                  </p>
                </div>

                <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/70">
                  <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                    Bitiş / Teslim Tarihi
                  </span>
                  <p className="font-semibold text-zinc-800 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    <span>{product.assignment.assignedEndDate || 'Belirtilmedi'}</span>
                  </p>
                </div>

                {product.assignment.assignedToPhone && (
                  <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/70 sm:col-span-1 lg:col-span-2">
                    <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                      Telefon
                    </span>
                    <a
                      href={`tel:${product.assignment.assignedToPhone}`}
                      className="font-semibold text-amber-900 hover:underline flex items-center gap-1.5 mt-0.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-amber-700" />
                      <span>{product.assignment.assignedToPhone}</span>
                    </a>
                  </div>
                )}

                {product.assignment.assignedToEmail && (
                  <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/70 sm:col-span-1 lg:col-span-2">
                    <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                      E-posta
                    </span>
                    <a
                      href={`mailto:${product.assignment.assignedToEmail}`}
                      className="font-semibold text-amber-900 hover:underline flex items-center gap-1.5 mt-0.5 truncate"
                    >
                      <Mail className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span className="truncate">{product.assignment.assignedToEmail}</span>
                    </a>
                  </div>
                )}
              </div>

              {product.assignment.note && (
                <div className="p-2.5 bg-white/90 rounded-lg border border-amber-200 text-xs text-zinc-800">
                  <span className="font-bold text-amber-900">
                    Açıklama / Not:{" "}
                  </span>
                  <span>{product.assignment.note}</span>
                </div>
              )}

              {product.assignment.assignedByEmail && (
                <p className="text-[10px] text-amber-800">
                  Zimmeti Veren Yetkili:{" "}
                  <span className="font-mono font-semibold">
                    {product.assignment.assignedByEmail}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Depoda / Zimmetsiz</span>
                </span>
                <span className="text-[11px] text-zinc-500 hidden sm:inline">
                  Bu ürün şu an herhangi bir personele zimmetli değildir.
                </span>
              </div>

              <button
                type="button"
                onClick={handleOpenAssign}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition active:scale-[0.98] shadow-2xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Ürünü Zimmetle</span>
              </button>
            </div>
          )}

          {product.description && (
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                Açıklama / Not
              </span>
              <p className="text-xs text-zinc-700 whitespace-pre-wrap leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-zinc-500">Mevcut Stok</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-mono text-2xl font-bold text-zinc-900">
                  {product.quantity}
                </span>
                <span className="text-xs text-zinc-500 font-mono">adet</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setAdjustType("IN");
                  setAdjustAmount(1);
                  setIsAdjustModalOpen(true);
                }}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-medium flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Giriş</span>
              </button>

              <button
                onClick={() => {
                  setAdjustType("OUT");
                  setAdjustAmount(1);
                  setIsAdjustModalOpen(true);
                }}
                className="px-3 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-md text-xs font-medium flex items-center gap-1 transition"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Çıkış</span>
              </button>

              <button
                onClick={() => {
                  setTransferTargetCabinetId(
                    product.compartment?.cabinetId || "",
                  );
                  setTransferTargetCompartmentCode("");
                  setIsTransferModalOpen(true);
                }}
                className="px-3 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-md text-xs font-medium flex items-center gap-1 transition"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Taşı</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Oluşturulma:</span>
              <span className="font-medium text-zinc-700">
                {product.createdAt ? new Date(product.createdAt).toLocaleString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }) : "—"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Son Güncelleme:</span>
              <span className="font-medium text-zinc-700">
                {product.updatedAt ? new Date(product.updatedAt).toLocaleString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }) : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-5">
          <div className="bg-white rounded-xl border border-zinc-200 p-3 shadow-xs space-y-2">
            <h4 className="font-semibold text-xs text-zinc-900 border-b border-zinc-100 pb-1.5">
              DataMatrix Ürün Etiketi
            </h4>
            <HorizontalDataMatrixLabel
              type="PRODUCT"
              title={product.name}
              owner={product.owner}
              cabinetCode={product.compartment?.cabinet?.code || null}
              compartmentCode={product.compartmentCode || product.compartment?.code || null}
              code={product.dataMatrix}
              sku={product.sku}
              showActions={true}
              size="md"
            />
          </div>
        </div>

        <div className="md:col-span-7 bg-white rounded-xl border border-zinc-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-zinc-500" />
              <h3 className="font-semibold text-xs text-zinc-900">
                İşlem ve Stok Geçmişi ({(product.auditLogs || product.stockMovements)?.length ?? 0})
              </h3>
            </div>
          </div>

          {(product.auditLogs || product.stockMovements) &&
          (product.auditLogs || product.stockMovements)!.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {(product.auditLogs || product.stockMovements)!.map((log) => {
                const hasChange =
                  typeof log.change === "number" && log.change !== 0;
                const isPositive = (log.change ?? 0) > 0;
                const formattedDate = new Date(log.createdAt).toLocaleString(
                  "tr-TR",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                );

                return (
                  <div
                    key={log.id}
                    className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 flex flex-col gap-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            log.type === "IN"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : log.type === "OUT"
                              ? "bg-rose-50 text-rose-800 border border-rose-200"
                              : log.type === "TRANSFER"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : "bg-zinc-100 text-zinc-800 border border-zinc-200"
                          }`}
                        >
                          {log.type}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {formattedDate}
                        </span>
                        {(log.actorEmail || log.actorName) && (
                          <span className="text-[10px] bg-zinc-100 border border-zinc-200 text-zinc-700 font-medium font-mono px-1.5 py-0.5 rounded">
                            {log.actorName || log.actorEmail}
                          </span>
                        )}
                      </div>

                      {hasChange && (
                        <div className="text-right shrink-0 font-mono">
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded text-xs ${
                              isPositive
                                ? "text-emerald-700 bg-emerald-50"
                                : "text-rose-700 bg-rose-50"
                            }`}
                          >
                            {isPositive ? `+${log.change}` : log.change} adet
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-zinc-700 text-xs leading-relaxed font-normal break-words">
                      {log.details || "-"}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 text-center py-6">
              Geçmiş kaydı bulunmuyor.
            </p>
          )}
        </div>
      </div>

      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={adjustType === "IN" ? "Stok Girişi" : "Stok Çıkışı"}
        maxWidth="sm"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-3">
          <div className="flex rounded-lg bg-zinc-100 p-0.5">
            <button
              type="button"
              onClick={() => setAdjustType("IN")}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition ${
                adjustType === "IN"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              + Giriş Ekle
            </button>
            <button
              type="button"
              onClick={() => setAdjustType("OUT")}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition ${
                adjustType === "OUT"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              - Çıkış Yap
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Miktar (Adet)
            </label>
            <input
              type="number"
              min="1"
              required
              value={adjustAmount}
              onChange={(e) =>
                setAdjustAmount(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              className="w-full px-3 py-1.5 font-mono text-sm font-bold border border-zinc-200 rounded-lg text-center"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              İşlem Notu (Opsiyonel)
            </label>
            <input
              type="text"
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              placeholder="Örn: Sipariş teslim alındı..."
              className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg"
            />
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-3 py-1.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-lg"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmittingAdjust}
              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg"
            >
              {isSubmittingAdjust ? "İşleniyor..." : "Güncelle"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Rafa / Bölmeye Taşı"
        maxWidth="sm"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Hedef Dolap *
            </label>
            <select
              value={transferTargetCabinetId}
              onChange={(e) => setTransferTargetCabinetId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white font-mono"
            >
              <option value="">Dolap Seçin...</option>
              {cabinets.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Hedef Raf *
            </label>
            <select
              required
              value={transferTargetCompartmentCode}
              onChange={(e) => setTransferTargetCompartmentCode(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white font-mono"
            >
              <option value="">Raf Seçin...</option>
              {compartments
                .filter(
                  (c) =>
                    !transferTargetCabinetId ||
                    c.cabinetId === transferTargetCabinetId,
                )
                .map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Taşıma Notu
            </label>
            <input
              type="text"
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              placeholder="Örn: Yeni kutuya aktarıldı"
              className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg"
            />
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="px-3 py-1.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-lg"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmittingTransfer || !transferTargetCompartmentCode}
              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg disabled:opacity-50"
            >
              {isSubmittingTransfer ? "Taşınıyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Ürünü Düzenle"
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-3">
          <ImagePreview
            value={editImageUrl}
            onChange={(url) => setEditImageUrl(url)}
          />

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Ürün Adı *
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Stok / Ürün Kodu *
              </label>
              <input
                type="text"
                required
                value={editSku}
                onChange={(e) => setEditSku(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Malzeme Sahibi *
              </label>
              <select
                required
                value={editOwner}
                onChange={(e) => setEditOwner(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white font-medium focus:ring-1 focus:ring-zinc-900 focus:outline-none"
              >
                <option value="">Seçiniz (Zorunlu)...</option>
                {PRODUCT_OWNERS.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Açıklama (Opsiyonel)
            </label>
            <textarea
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Ürün hakkında teknik özellikler, notlar veya detaylar..."
              className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-900 focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-3 py-1.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-lg"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmittingEdit}
              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg"
            >
              {isSubmittingEdit ? "Güncelleniyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={
          product.isAssigned ? "Zimmet Bilgilerini Düzenle" : "Ürünü Zimmetle"
        }
        maxWidth="md"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-3.5">
          <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Bu ürün için zimmetlenen personel iletişim ve tarih bilgilerini
              giriniz.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Zimmetlenen Kişi (Ad Soyad) *
              </label>
              <input
                type="text"
                required
                value={assignForm.assignedToName}
                onChange={(e) =>
                  setAssignForm({
                    ...assignForm,
                    assignedToName: e.target.value,
                  })
                }
                placeholder="Örn: Ad Soyad"
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Zimmet Adedi *
              </label>
              <input
                type="number"
                required
                min="1"
                max={
                  product.quantity +
                  (product.isAssigned && product.assignment
                    ? product.assignment.assignedQuantity
                    : 0)
                }
                value={assignForm.assignedQuantity}
                onChange={(e) =>
                  setAssignForm({
                    ...assignForm,
                    assignedQuantity: Math.max(
                      1,
                      parseInt(e.target.value, 10) || 1,
                    ),
                  })
                }
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">
                Mevcut Depo Stoğu: <strong>{product.quantity} adet</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Telefon Numarası
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                <input
                  type="tel"
                  value={assignForm.assignedToPhone}
                  onChange={(e) =>
                    setAssignForm({
                      ...assignForm,
                      assignedToPhone: e.target.value,
                    })
                  }
                  placeholder="05XX XXX XX XX"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                E-posta Adresi
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                <input
                  type="email"
                  value={assignForm.assignedToEmail}
                  onChange={(e) =>
                    setAssignForm({
                      ...assignForm,
                      assignedToEmail: e.target.value,
                    })
                  }
                  placeholder="ornek@eposta.com"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Zimmet Başlangıç Tarihi *
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                <input
                  type="date"
                  required
                  value={assignForm.assignedStartDate}
                  onChange={(e) =>
                    setAssignForm({
                      ...assignForm,
                      assignedStartDate: e.target.value,
                    })
                  }
                  className="w-full pl-8 pr-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Zimmet Bitiş Tarihi *
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                <input
                  type="date"
                  required
                  value={assignForm.assignedEndDate}
                  min={assignForm.assignedStartDate}
                  onChange={(e) =>
                    setAssignForm({
                      ...assignForm,
                      assignedEndDate: e.target.value,
                    })
                  }
                  className="w-full pl-8 pr-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Açıklama / Not
            </label>
            <textarea
              rows={2}
              value={assignForm.note}
              onChange={(e) =>
                setAssignForm({ ...assignForm, note: e.target.value })
              }
              placeholder="Örn: Proje süresince kullanılmak üzere teslim edildi..."
              className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>

          <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-3.5 py-1.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-lg hover:bg-zinc-200 transition"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmittingAssign || !assignForm.assignedToName.trim()}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition flex items-center gap-1.5 shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>
                {isSubmittingAssign ? "Kaydediliyor..." : "Zimmeti Kaydet"}
              </span>
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isUnassignModalOpen}
        onClose={() => setIsUnassignModalOpen(false)}
        title="Zimmeti Teslim Al"
        maxWidth="sm"
      >
        <form onSubmit={handleUnassignSubmit} className="space-y-3.5">
          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs text-zinc-700 space-y-1.5">
            <p className="font-semibold text-zinc-900">
              Bu ürünün zimmetini kaldırmak istediğinize emin misiniz?
            </p>
            <div className="text-[11px] text-zinc-600 space-y-0.5 pt-1 border-t border-zinc-200/70">
              <p>
                Zimmetli Kişi:{" "}
                <strong className="text-zinc-800">
                  {product.assignment?.assignedToName}
                </strong>
              </p>
              <p>
                İade Edilecek Adet:{" "}
                <strong className="text-emerald-700 font-mono">
                  +{product.assignment?.assignedQuantity ?? 0} adet
                </strong>
              </p>
              <p className="text-[10px] text-zinc-500 pt-0.5">
                (İşlem sonrasında mevcut {product.quantity} adet olan depo stoğu{" "}
                <strong>
                  {product.quantity +
                    (product.assignment?.assignedQuantity ?? 0)}{" "}
                  adet
                </strong>{" "}
                olacaktır.)
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Teslim Alma Notu (İsteğe Bağlı)
            </label>
            <input
              type="text"
              value={unassignReturnNote}
              onChange={(e) => setUnassignReturnNote(e.target.value)}
              placeholder="Örn: Sağlam ve eksiksiz teslim alındı."
              className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsUnassignModalOpen(false)}
              className="px-3.5 py-1.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-lg hover:bg-zinc-200 transition"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmittingUnassign}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition flex items-center gap-1.5 shadow-xs"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>
                {isSubmittingUnassign ? "İşleniyor..." : "Zimmeti Teslim Al"}
              </span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
