import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Package,
  Plus,
  Search,
  LayoutGrid,
  List,
  Minus,
  RefreshCw,
  Grid,
  Layers,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { ProductAPI, CabinetAPI, CompartmentAPI } from "../../services";
import { Product, Cabinet, Compartment } from "../../types";
import { PRODUCT_OWNERS } from "../../config/constants";
import { Modal } from "../../components/common/Modal";
import { ImagePreview } from "../../components/common/ImagePreview";
import { HorizontalDataMatrixLabel } from "../../components/labels/HorizontalDataMatrixLabel";
import { toast } from "react-toastify";

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [compartments, setCompartments] = useState<Compartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [search, setSearch] = useState("");
  const [selectedCabinetId, setSelectedCabinetId] = useState("");
  const [selectedCompartmentCode, setSelectedCompartmentCode] = useState("");
  const [zimmetFilter, setZimmetFilter] = useState<
    "all" | "assigned" | "unassigned"
  >("all");
  const [selectedOwner, setSelectedOwner] = useState<string>("all");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formOwner, setFormOwner] = useState<string>("");
  const [formDescription, setFormDescription] = useState("");
  const [formQuantity, setFormQuantity] = useState<number>(0);
  const [formCabinetId, setFormCabinetId] = useState("");
  const [formCompartmentCode, setFormCompartmentCode] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [labelModalProduct, setLabelModalProduct] = useState<Product | null>(
    null,
  );

  useEffect(() => {
    if (router.isReady) {
      if (typeof router.query.search === "string")
        setSearch(router.query.search);
      if (typeof router.query.cabinetId === "string")
        setSelectedCabinetId(router.query.cabinetId);
      if (typeof router.query.compartmentCode === "string") {
        setSelectedCompartmentCode(router.query.compartmentCode);
      } else if (typeof router.query.compartmentId === "string") {
        setSelectedCompartmentCode(router.query.compartmentId);
      }
      if (router.query.new === "true") {
        setIsFormModalOpen(true);
      }
    }
  }, [router.isReady, router.query]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodsData, cabsData, compsData] = await Promise.all([
        ProductAPI.getAll({
          search: search || undefined,
          cabinetId: selectedCabinetId || undefined,
          compartmentCode: selectedCompartmentCode || undefined,
        }),
        CabinetAPI.getAll(),
        CompartmentAPI.getAll(),
      ]);

      setProducts(prodsData);
      setCabinets(cabsData);
      setCompartments(compsData);

      if (router.query.new === "true") {
        openNewProductModal();
      }
    } catch (_e) {
      setError("Ürün verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.isReady) {
      fetchInitialData();
    }
  }, [router.isReady, selectedCabinetId, selectedCompartmentCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInitialData();
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    const randomDigits = Math.floor(100 + Math.random() * 900);
    setFormName("");
    setFormSku(`PRD-${timestamp}${randomDigits}`);
    setFormOwner("");
    setFormDescription("");
    setFormQuantity(1);
    setFormCabinetId(cabinets[0]?.id || "");
    setFormCompartmentCode(
      (typeof router.query.compartmentCode === "string" &&
        router.query.compartmentCode) ||
        (typeof router.query.compartmentId === "string" &&
          router.query.compartmentId) ||
        compartments[0]?.code ||
        "",
    );
    setFormImageUrl("");
    setIsFormModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSku.trim() || !formCompartmentCode) {
      toast.warning(
        "Lütfen ürün adı, stok kodu ve yerleştirileceği bölmeyi seçin.",
      );
      return;
    }
    if (!formOwner) {
      toast.warning("Lütfen malzeme sahibini seçin.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", formName.trim());
      formData.append("sku", formSku.trim().toUpperCase());
      formData.append("owner", formOwner);
      formData.append("description", formDescription.trim());
      formData.append("quantity", String(formQuantity));
      formData.append("compartmentCode", formCompartmentCode);
      formData.append("imageUrl", formImageUrl.trim());

      if (editingProduct) {
        await ProductAPI.update(editingProduct.id, formData);
        toast.success("Ürün başarıyla güncellendi.");
      } else {
        await ProductAPI.create(formData);
        toast.success("Yeni ürün başarıyla eklendi.");
      }

      setIsFormModalOpen(false);
      if (router.query.new) {
        const nextQuery = { ...router.query };
        delete nextQuery.new;
        router.replace(
          { pathname: router.pathname, query: nextQuery },
          undefined,
          { shallow: true },
        );
      }
      await fetchInitialData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Ürün kaydedilemedi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdjust = async (
    e: React.MouseEvent,
    product: Product,
    change: number,
  ) => {
    e.stopPropagation();
    try {
      const res = await ProductAPI.adjustStock(product.id, {
        change,
        type: change > 0 ? "IN" : "OUT",
        note: change > 0 ? "1 adet giriş" : "1 adet çıkış",
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? res.product : p)),
      );
      toast.success(
        `${product.name} stoğu güncellendi (${change > 0 ? "+" : ""}${change})`,
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Stok güncellenemedi");
    }
  };

  const formFilteredCompartments = compartments.filter(
    (c) => !formCabinetId || c.cabinetId === formCabinetId,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
            Envanter & Ürünler
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Kayıtlı tüm malzemeler, konumları ve anlık stok adetleri.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openNewProductModal}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Yeni Ürün Ekle</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-xs">
        <div className="flex flex-col items-center gap-2.5 md:flex-row">
          <form
            onSubmit={handleSearchSubmit}
            className="relative w-full flex-1"
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ürün adı veya barkod ara..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pr-16 pl-8 text-xs transition focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none"
            />
            <Search className="absolute top-2 left-2.5 h-3.5 w-3.5 text-zinc-400" />
            <button
              type="submit"
              className="absolute top-1 right-1 rounded bg-zinc-900 px-2.5 py-0.5 text-[10px] font-medium text-white hover:bg-zinc-800"
            >
              Ara
            </button>
          </form>

          <div className="flex w-full items-center gap-2 md:w-auto">
            <select
              value={selectedCabinetId}
              onChange={(e) => {
                setSelectedCabinetId(e.target.value);
                setSelectedCompartmentCode("");
              }}
              className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 font-mono text-xs text-zinc-800 focus:ring-1 focus:ring-zinc-900 md:flex-none"
            >
              <option value="">Tüm Dolaplar</option>
              {cabinets.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>

            <select
              value={selectedCompartmentCode}
              onChange={(e) => setSelectedCompartmentCode(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 font-mono text-xs text-zinc-800 focus:ring-1 focus:ring-zinc-900 md:flex-none"
            >
              <option value="">Tüm Raflar</option>
              {compartments
                .filter(
                  (cp) =>
                    !selectedCabinetId || cp.cabinetId === selectedCabinetId,
                )
                .map((cp) => (
                  <option key={cp.id} value={cp.code}>
                    {cp.code}
                  </option>
                ))}
            </select>

            <select
              value={zimmetFilter}
              onChange={(e) => setZimmetFilter(e.target.value as any)}
              className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-800 focus:ring-1 focus:ring-zinc-900 md:flex-none"
            >
              <option value="all">Zimmet: Tümü</option>
              <option value="assigned">Sadece Zimmetliler</option>
              <option value="unassigned">Sadece Depodakiler</option>
            </select>

            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-800 focus:ring-1 focus:ring-zinc-900 md:flex-none"
            >
              <option value="all">Sahip: Tümü</option>
              <option value="unassigned_owner">Sahipsiz / Belirtilmemiş</option>
              {PRODUCT_OWNERS.map((owner) => (
                <option key={owner.name} value={owner.name}>
                  {owner.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex shrink-0 items-center gap-0.5 self-end rounded-lg bg-zinc-100 p-0.5 md:self-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-1 transition ${
                viewMode === "grid"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md p-1 transition ${
                viewMode === "list"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-xs text-zinc-500">
          <RefreshCw className="h-5 w-5 animate-spin text-zinc-600" />
          <span>Ürünler yükleniyor...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-500">
          <AlertCircle className="h-6 w-6 text-rose-500" />
          <p className="text-sm text-zinc-700">{error}</p>
          <button
            onClick={fetchInitialData}
            className="text-xs text-blue-600 hover:underline"
          >
            Tekrar Dene
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-500">
          Filtrelere uygun ürün bulunamadı.
        </div>
      ) : (
        (() => {
          const filteredProducts = products.filter((prod) => {
            if (zimmetFilter === "assigned") return !!prod.isAssigned;
            if (zimmetFilter === "unassigned") return !prod.isAssigned;
            if (selectedOwner === "unassigned_owner") {
              if (prod.owner) return false;
            } else if (selectedOwner !== "all") {
              if (prod.owner?.name !== selectedOwner) return false;
            }
            return true;
          });

          if (filteredProducts.length === 0) {
            return (
              <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-500">
                Seçilen filtrelere uygun ürün bulunamadı.
              </div>
            );
          }

          return viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => router.push(`/products/detail?id=${prod.id}`)}
                  className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-zinc-300 hover:shadow-xs"
                >
                  <div>
                    <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden border-b border-zinc-100 bg-zinc-100">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-zinc-300" />
                      )}

                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="rounded bg-zinc-900/90 px-1.5 py-0.5 font-mono text-[10px] text-white shadow-2xs">
                          {prod.sku}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLabelModalProduct(prod);
                        }}
                        title="Etiket"
                        className="absolute top-2 right-2 rounded bg-white/90 p-1 text-zinc-700 shadow-xs transition hover:bg-white"
                      >
                        <Grid className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 p-3">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="line-clamp-2 flex-1 text-xs leading-snug font-semibold text-zinc-900">
                          {prod.name}
                        </h4>
                        <div className="shrink-0">
                          <span className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-800">
                            {prod.owner?.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 pt-0.5 text-[11px] text-zinc-500">
                        <Layers className="h-3 w-3 shrink-0 text-zinc-400" />
                        <span className="truncate">
                          {prod.compartment?.cabinet?.code} ➔{" "}
                          {prod.compartment?.name}
                        </span>
                      </div>

                      {prod.description && (
                        <p className="line-clamp-1 text-[11px] text-zinc-500 italic">
                          {prod.description}
                        </p>
                      )}

                      {prod.isAssigned && prod.assignment ? (
                        <div className="pt-1">
                          <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 shadow-2xs">
                            <UserCheck className="h-3 w-3 shrink-0 text-amber-700" />
                            <span className="truncate">
                              Zimmetli: {prod.assignment.assignedToName} (
                              {prod.assignment.assignedQuantity ?? 0} adet)
                            </span>
                          </span>
                        </div>
                      ) : (
                        <div className="pt-1">
                          <span className="text-[10px] font-medium text-zinc-400">
                            Depoda / Zimmetsiz
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-zinc-100 bg-zinc-50/70 px-3 py-2">
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-sm font-bold text-zinc-900">
                        {prod.quantity}
                      </span>
                      <span className="text-[10px] text-zinc-500">adet</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleQuickAdjust(e, prod, -1)}
                        disabled={prod.quantity <= 0}
                        className="flex h-6 w-6 items-center justify-center rounded border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => handleQuickAdjust(e, prod, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-100"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-semibold text-zinc-500 uppercase">
                    <tr>
                      <th className="p-3">Görsel</th>
                      <th className="p-3">Ürün Adı</th>
                      <th className="p-3">Sahip</th>
                      <th className="p-3">Konum</th>
                      <th className="p-3">Zimmet Durumu</th>
                      <th className="p-3 text-right">Stok</th>
                      <th className="p-3 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {filteredProducts.map((prod) => (
                      <tr
                        key={prod.id}
                        onClick={() =>
                          router.push(`/products/detail?id=${prod.id}`)
                        }
                        className="cursor-pointer transition hover:bg-zinc-50/70"
                      >
                        <td className="p-3">
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="h-8 w-8 rounded border border-zinc-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-100 text-zinc-400">
                              <Package className="h-4 w-4" />
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-medium">
                          <div className="font-semibold text-zinc-900">
                            {prod.name}
                          </div>
                          <div className="font-mono text-[10px] text-zinc-400">
                            {prod.sku}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-800">
                            {prod.owner?.name}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] text-zinc-600">
                          {prod.compartment?.cabinet?.code} ➔{" "}
                          {prod.compartment?.name}
                        </td>
                        <td className="p-3">
                          {prod.isAssigned && prod.assignment ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                              <UserCheck className="h-3 w-3 shrink-0 text-amber-700" />
                              <span>
                                {prod.assignment.assignedToName} (
                                {prod.assignment.assignedQuantity ?? 0} adet)
                              </span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-zinc-400">
                              Depoda
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-zinc-900">
                          {prod.quantity} adet
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => handleQuickAdjust(e, prod, -1)}
                              disabled={prod.quantity <= 0}
                              className="rounded bg-zinc-100 p-1 text-zinc-700 hover:bg-zinc-200"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => handleQuickAdjust(e, prod, 1)}
                              className="rounded bg-zinc-100 p-1 text-zinc-700 hover:bg-zinc-200"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()
      )}

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingProduct ? "Ürünü Düzenle" : "Yeni Ürün Kaydet"}
        maxWidth="md"
      >
        <form onSubmit={handleSaveProduct} className="space-y-3">
          <ImagePreview
            value={formImageUrl}
            onChange={(url) => setFormImageUrl(url)}
          />

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Ürün Adı *
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Örn: ESP32 NodeMCU"
              className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Stok / Ürün Kodu *
              </label>
              <input
                type="text"
                required
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                placeholder="Örn: PRD-ESP32"
                className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-mono text-xs uppercase focus:ring-1 focus:ring-zinc-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Malzeme Sahibi *
              </label>
              <select
                required
                value={formOwner}
                onChange={(e) => setFormOwner(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-zinc-900 focus:outline-none"
              >
                <option value="">Seçiniz (Zorunlu)...</option>
                {PRODUCT_OWNERS.map((owner) => (
                  <option key={owner.name} value={owner.name}>
                    {owner.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Mevcut Miktar (Adet)
              </label>
              <input
                type="number"
                min="0"
                value={formQuantity}
                onChange={(e) =>
                  setFormQuantity(parseInt(e.target.value, 10) || 0)
                }
                className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 font-mono text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Dolap Seçimi *
              </label>
              <select
                value={formCabinetId}
                onChange={(e) => {
                  setFormCabinetId(e.target.value);
                  const firstComp = compartments.find(
                    (c) => c.cabinetId === e.target.value,
                  );
                  setFormCompartmentCode(firstComp?.code || "");
                }}
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
                Raf Seçimi *
              </label>
              <select
                required
                value={formCompartmentCode}
                onChange={(e) => setFormCompartmentCode(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 font-mono text-xs"
              >
                <option value="">Raf Seçin...</option>
                {formFilteredCompartments.map((cp) => (
                  <option key={cp.id} value={cp.code}>
                    {cp.code}
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
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Ürün açıklaması, teknik notlar veya özellikler..."
              className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-1.5 text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-2">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!labelModalProduct}
        onClose={() => setLabelModalProduct(null)}
        title="DataMatrix Etiketi"
        maxWidth="md"
      >
        {labelModalProduct && (
          <HorizontalDataMatrixLabel
            type="product"
            title={labelModalProduct.name}
            owner={labelModalProduct.owner}
            cabinetCode={labelModalProduct.compartment?.cabinet?.code || null}
            compartmentCode={
              labelModalProduct.compartmentCode ||
              labelModalProduct.compartment?.code ||
              null
            }
            code={labelModalProduct.dataMatrix}
            sku={labelModalProduct.sku}
            showActions={true}
            size="md"
          />
        )}
      </Modal>
    </div>
  );
}
