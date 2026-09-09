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
import { ProductAPI, CabinetAPI, CompartmentAPI } from "../../services";
import { Product, Cabinet, Compartment } from "../../types";
import { PRODUCT_OWNERS } from "../../config/constants";
import { HorizontalDataMatrixLabel } from "../../components/labels/HorizontalDataMatrixLabel";
import { Modal } from "../../components/common/Modal";
import { ImagePreview } from "../../components/common/ImagePreview";
import { toast } from "react-toastify";

export default function ProductDetailPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";

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
      setError("Ürün detayları yüklenemedi.");
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
      toast.error(
        err instanceof Error ? err.message : "Zimmetleme işlemi başarısız",
      );
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  const handleUnassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setIsSubmittingUnassign(true);
    try {
      await ProductAPI.unassign(
        product.id,
        unassignReturnNote.trim() || undefined,
      );
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
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-xs text-zinc-500">
        <RefreshCw className="h-5 w-5 animate-spin text-zinc-600" />
        <span>Yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-500">
        <AlertCircle className="h-6 w-6 text-rose-500" />
        <p className="text-sm text-zinc-700">{error}</p>
        <button
          onClick={fetchProduct}
          className="text-xs text-blue-600 hover:underline"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <button
          onClick={() => router.back()}
          className="flex cursor-pointer items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Geri</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenEdit}
            className="flex cursor-pointer items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Düzenle</span>
          </button>

          <button
            onClick={handleDelete}
            className="flex cursor-pointer items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Sil</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs md:grid-cols-12">
        <div className="flex flex-col items-center md:col-span-4">
          <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Package className="h-16 w-16 text-zinc-300" />
            )}
          </div>
        </div>

        <div className="space-y-4 md:col-span-8">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-bold text-zinc-800">
                {product.sku}
              </span>
              <span className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-800">
                {product.owner}
              </span>
            </div>

            <h1 className="text-lg leading-snug font-bold text-zinc-900">
              {product.name}
            </h1>
          </div>

          <div
            onClick={() =>
              router.push(
                `/storage?cabinetId=${product.compartment?.cabinetId}`,
              )
            }
            className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 transition hover:bg-zinc-100/70"
          >
            <div className="flex items-center gap-2.5">
              <Layers className="h-4 w-4 text-zinc-500" />
              <div>
                <span className="text-[10px] font-medium text-zinc-400 uppercase">
                  Konum
                </span>
                <p className="font-mono text-xs font-semibold text-zinc-800">
                  {product.compartment?.cabinet?.code || "—"} ➔{" "}
                  {product.compartmentCode || product.compartment?.code}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-medium text-zinc-500">
              Dolabı Aç ➔
            </span>
          </div>

          {product.isAssigned && product.assignment ? (
            <div className="space-y-3 rounded-xl border-2 border-amber-300 bg-amber-50/90 p-3.5 shadow-xs">
              <div className="flex flex-col justify-between gap-2 border-b border-amber-200/80 pb-2.5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs">
                    <UserCheck className="h-4 w-4" />
                    <span>BU ÜRÜN ZİMMETLİDİR</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleOpenAssign}
                    className="flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-2xs transition hover:bg-amber-100/80"
                  >
                    <Edit2 className="h-3 w-3 text-amber-700" />
                    <span>Düzenle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUnassignReturnNote("");
                      setIsUnassignModalOpen(true);
                    }}
                    className="flex items-center gap-1 rounded-md bg-amber-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-800"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    <span>Zimmeti Teslim Al</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-amber-200/70 bg-white/80 p-2.5">
                  <span className="block text-[10px] font-bold tracking-wider text-amber-800 uppercase">
                    Zimmetlenen Kişi
                  </span>
                  <p className="mt-0.5 truncate text-sm font-bold text-zinc-900">
                    {product.assignment.assignedToName}
                  </p>
                </div>

                <div className="rounded-lg border border-amber-200/70 bg-white/80 p-2.5">
                  <span className="block text-[10px] font-bold tracking-wider text-amber-800 uppercase">
                    Zimmet Adedi
                  </span>
                  <p className="mt-0.5 font-mono text-sm font-bold text-amber-950">
                    {product.assignment.assignedQuantity ?? 0} adet
                  </p>
                </div>

                <div className="rounded-lg border border-amber-200/70 bg-white/80 p-2.5">
                  <span className="block text-[10px] font-bold tracking-wider text-amber-800 uppercase">
                    Başlangıç Tarihi
                  </span>
                  <p className="mt-0.5 flex items-center gap-1.5 font-semibold text-zinc-800">
                    <Calendar className="h-3.5 w-3.5 text-amber-700" />
                    <span>
                      {product.assignment.assignedStartDate ||
                        product.assignment.assignedDate}
                    </span>
                  </p>
                </div>

                <div className="rounded-lg border border-amber-200/70 bg-white/80 p-2.5">
                  <span className="block text-[10px] font-bold tracking-wider text-amber-800 uppercase">
                    Bitiş / Teslim Tarihi
                  </span>
                  <p className="mt-0.5 flex items-center gap-1.5 font-semibold text-zinc-800">
                    <Calendar className="h-3.5 w-3.5 text-amber-700" />
                    <span>
                      {product.assignment.assignedEndDate || "Belirtilmedi"}
                    </span>
                  </p>
                </div>

                {product.assignment.assignedToPhone && (
                  <div className="rounded-lg border border-amber-200/70 bg-white/80 p-2.5 sm:col-span-1 lg:col-span-2">
                    <span className="block text-[10px] font-bold tracking-wider text-amber-800 uppercase">
                      Telefon
                    </span>
                    <a
                      href={`tel:${product.assignment.assignedToPhone}`}
                      className="mt-0.5 flex items-center gap-1.5 font-semibold text-amber-900 hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5 text-amber-700" />
                      <span>{product.assignment.assignedToPhone}</span>
                    </a>
                  </div>
                )}

                {product.assignment.assignedToEmail && (
                  <div className="rounded-lg border border-amber-200/70 bg-white/80 p-2.5 sm:col-span-1 lg:col-span-2">
                    <span className="block text-[10px] font-bold tracking-wider text-amber-800 uppercase">
                      E-posta
                    </span>
                    <a
                      href={`mailto:${product.assignment.assignedToEmail}`}
                      className="mt-0.5 flex items-center gap-1.5 truncate font-semibold text-amber-900 hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                      <span className="truncate">
                        {product.assignment.assignedToEmail}
                      </span>
                    </a>
                  </div>
                )}
              </div>

              {product.assignment.note && (
                <div className="rounded-lg border border-amber-200 bg-white/90 p-2.5 text-xs text-zinc-800">
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
            <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Depoda / Zimmetsiz</span>
                </span>
                <span className="hidden text-[11px] text-zinc-500 sm:inline">
                  Bu ürün şu an herhangi bir personele zimmetli değildir.
                </span>
              </div>

              <button
                type="button"
                onClick={handleOpenAssign}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-2xs transition hover:bg-zinc-800 active:scale-[0.98]"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Ürünü Zimmetle</span>
              </button>
            </div>
          )}

          {product.description && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <span className="mb-1 block text-[10px] font-semibold text-zinc-400 uppercase">
                Açıklama / Not
              </span>
              <p className="text-xs leading-relaxed whitespace-pre-wrap text-zinc-700">
                {product.description}
              </p>
            </div>
          )}

          <div className="flex flex-col justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3.5 sm:flex-row sm:items-center">
            <div>
              <span className="text-[11px] text-zinc-500">Mevcut Stok</span>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-zinc-900">
                  {product.quantity}
                </span>
                <span className="font-mono text-xs text-zinc-500">adet</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setAdjustType("IN");
                  setAdjustAmount(1);
                  setIsAdjustModalOpen(true);
                }}
                className="flex items-center gap-1 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Giriş</span>
              </button>

              <button
                onClick={() => {
                  setAdjustType("OUT");
                  setAdjustAmount(1);
                  setIsAdjustModalOpen(true);
                }}
                className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                <Minus className="h-3.5 w-3.5" />
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
                className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                <span>Taşı</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3 text-[11px] text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>Oluşturulma:</span>
              <span className="font-medium text-zinc-700">
                {product.createdAt
                  ? new Date(product.createdAt).toLocaleString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              <span>Son Güncelleme:</span>
              <span className="font-medium text-zinc-700">
                {product.updatedAt
                  ? new Date(product.updatedAt).toLocaleString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-xs">
            <h4 className="border-b border-zinc-100 pb-1.5 text-xs font-semibold text-zinc-900">
              DataMatrix Ürün Etiketi
            </h4>
            <HorizontalDataMatrixLabel
              type="product"
              title={product.name}
              owner={product.owner}
              cabinetCode={product.compartment?.cabinet?.code || null}
              compartmentCode={
                product.compartmentCode || product.compartment?.code || null
              }
              code={product.dataMatrix}
              sku={product.sku}
              showActions={true}
              size="md"
            />
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs md:col-span-7">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-zinc-500" />
              <h3 className="text-xs font-semibold text-zinc-900">
                İşlem ve Stok Geçmişi (
                {(product.auditLogs || product.stockMovements)?.length ?? 0})
              </h3>
            </div>
          </div>

          {(product.auditLogs || product.stockMovements) &&
          (product.auditLogs || product.stockMovements)!.length > 0 ? (
            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
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
                    className="flex flex-col gap-1.5 rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                            log.type === "IN"
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                              : log.type === "OUT"
                                ? "border border-rose-200 bg-rose-50 text-rose-800"
                                : log.type === "TRANSFER"
                                  ? "border border-blue-200 bg-blue-50 text-blue-800"
                                  : "border border-zinc-200 bg-zinc-100 text-zinc-800"
                          }`}
                        >
                          {log.type}
                        </span>
                        <span className="font-mono text-[11px] text-zinc-400">
                          {formattedDate}
                        </span>
                        {(log.actorEmail || log.actorName) && (
                          <span className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-700">
                            {log.actorName || log.actorEmail}
                          </span>
                        )}
                      </div>

                      {hasChange && (
                        <div className="shrink-0 text-right font-mono">
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                              isPositive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {isPositive ? `+${log.change}` : log.change} adet
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs leading-relaxed font-normal break-words text-zinc-700">
                      {log.details || "-"}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-zinc-400">
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
              className={`flex-1 rounded-md py-1 text-xs font-medium transition ${
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
              className={`flex-1 rounded-md py-1 text-xs font-medium transition ${
                adjustType === "OUT"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              - Çıkış Yap
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
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
              className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-center font-mono text-sm font-bold"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              İşlem Notu (Opsiyonel)
            </label>
            <input
              type="text"
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              placeholder="Örn: Sipariş teslim alındı..."
              className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-2">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmittingAdjust}
              className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
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
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Hedef Dolap *
            </label>
            <select
              value={transferTargetCabinetId}
              onChange={(e) => setTransferTargetCabinetId(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 font-mono text-xs"
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
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Hedef Raf *
            </label>
            <select
              required
              value={transferTargetCompartmentCode}
              onChange={(e) => setTransferTargetCompartmentCode(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 font-mono text-xs"
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
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Taşıma Notu
            </label>
            <input
              type="text"
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              placeholder="Örn: Yeni kutuya aktarıldı"
              className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-2">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmittingTransfer || !transferTargetCompartmentCode}
              className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
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
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Ürün Adı *
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Stok / Ürün Kodu *
              </label>
              <input
                type="text"
                required
                value={editSku}
                onChange={(e) => setEditSku(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-mono text-xs uppercase"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Malzeme Sahibi *
              </label>
              <select
                required
                value={editOwner}
                onChange={(e) => setEditOwner(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-zinc-900 focus:outline-none"
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
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Açıklama (Opsiyonel)
            </label>
            <textarea
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Ürün hakkında teknik özellikler, notlar veya detaylar..."
              className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-1.5 text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmittingEdit}
              className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
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
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
            <UserCheck className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Bu ürün için zimmetlenen personel iletişim ve tarih bilgilerini
              giriniz.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-800">
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
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-800">
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
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-xs font-bold focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
              <span className="mt-0.5 block text-[10px] text-zinc-500">
                Mevcut Depo Stoğu: <strong>{product.quantity} adet</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-800">
                Telefon Numarası
              </label>
              <div className="relative">
                <Phone className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-zinc-400" />
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
                  className="w-full rounded-lg border border-zinc-200 py-2 pr-3 pl-8 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-800">
                E-posta Adresi
              </label>
              <div className="relative">
                <Mail className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-zinc-400" />
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
                  className="w-full rounded-lg border border-zinc-200 py-2 pr-3 pl-8 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-800">
                Zimmet Başlangıç Tarihi *
              </label>
              <div className="relative">
                <Calendar className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-zinc-400" />
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
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2 pr-3 pl-8 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-800">
                Zimmet Bitiş Tarihi *
              </label>
              <div className="relative">
                <Calendar className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-zinc-400" />
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
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2 pr-3 pl-8 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-800">
              Açıklama / Not
            </label>
            <textarea
              rows={2}
              value={assignForm.note}
              onChange={(e) =>
                setAssignForm({ ...assignForm, note: e.target.value })
              }
              placeholder="Örn: Proje süresince kullanılmak üzere teslim edildi..."
              className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-2.5">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="rounded-lg bg-zinc-100 px-3.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmittingAssign || !assignForm.assignedToName.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-amber-700 disabled:opacity-50"
            >
              <UserCheck className="h-3.5 w-3.5" />
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
          <div className="space-y-1.5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
            <p className="font-semibold text-zinc-900">
              Bu ürünün zimmetini kaldırmak istediğinize emin misiniz?
            </p>
            <div className="space-y-0.5 border-t border-zinc-200/70 pt-1 text-[11px] text-zinc-600">
              <p>
                Zimmetli Kişi:{" "}
                <strong className="text-zinc-800">
                  {product.assignment?.assignedToName}
                </strong>
              </p>
              <p>
                İade Edilecek Adet:{" "}
                <strong className="font-mono text-emerald-700">
                  +{product.assignment?.assignedQuantity ?? 0} adet
                </strong>
              </p>
              <p className="pt-0.5 text-[10px] text-zinc-500">
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
            <label className="mb-1 block text-xs font-semibold text-zinc-800">
              Teslim Alma Notu (İsteğe Bağlı)
            </label>
            <input
              type="text"
              value={unassignReturnNote}
              onChange={(e) => setUnassignReturnNote(e.target.value)}
              placeholder="Örn: Sağlam ve eksiksiz teslim alındı."
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-1 focus:ring-zinc-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-2">
            <button
              type="button"
              onClick={() => setIsUnassignModalOpen(false)}
              className="rounded-lg bg-zinc-100 px-3.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmittingUnassign}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-rose-700 disabled:opacity-50"
            >
              <UserX className="h-3.5 w-3.5" />
              <span>
                {isSubmittingUnassign ? "İşleniyor..." : "Zimmeti Teslim Al"}
              </span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
