import React, { useEffect, useState } from "react";
import {
  Plus,
  Printer,
  Edit2,
  Trash2,
  Package,
  RefreshCw,
  Search,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { CabinetAPI, CompartmentAPI } from "../services";
import { Cabinet, Compartment } from "../types";
import { Modal } from "../components/common/Modal";
import {
  HorizontalDataMatrixLabel,
  LabelType,
} from "../components/labels/HorizontalDataMatrixLabel";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

export default function StoragePage() {
  const router = useRouter();
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedCabinetId, setSelectedCabinetId] = useState<string | null>(
    null,
  );

  const [isCabinetModalOpen, setIsCabinetModalOpen] = useState(false);
  const [editingCabinet, setEditingCabinet] = useState<Cabinet | null>(null);
  const [cabinetForm, setCabinetForm] = useState({
    code: "",
    name: "",
  });

  const [isCompartmentModalOpen, setIsCompartmentModalOpen] = useState(false);
  const [editingCompartment, setEditingCompartment] =
    useState<Compartment | null>(null);
  const [compCabinetId, setCompCabinetId] = useState<string>("");
  const [compForm, setCompForm] = useState({
    code: "",
    name: "",
  });

  const [cabinetToDelete, setCabinetToDelete] = useState<Cabinet | null>(null);
  const [isDeletingCabinet, setIsDeletingCabinet] = useState(false);
  const [compartmentToDelete, setCompartmentToDelete] =
    useState<Compartment | null>(null);
  const [isDeletingCompartment, setIsDeletingCompartment] = useState(false);

  const [selectedLabel, setSelectedLabel] = useState<{
    type: LabelType;
    code: string;
    title: string;
    cabinetCode?: string | null;
    compartmentCode?: string | null;
  } | null>(null);

  const fetchCabinets = async () => {
    setLoading(true);
    try {
      const data = await CabinetAPI.getAll();
      setCabinets(data);
      const urlCabId =
        typeof router.query.cabinetId === "string"
          ? router.query.cabinetId
          : null;
      if (urlCabId && data.some((c) => c.id === urlCabId)) {
        setSelectedCabinetId(urlCabId);
      } else if (!selectedCabinetId && data.length > 0) {
        setSelectedCabinetId(data[0].id);
      } else if (
        selectedCabinetId &&
        !data.some((c) => c.id === selectedCabinetId)
      ) {
        setSelectedCabinetId(data[0]?.id || null);
      }
    } catch (e) {
      toast.error(
        "Dolap verileri yüklenemedi: " +
          (e instanceof Error ? e.message : "Bağlantı hatası"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.isReady) {
      fetchCabinets();
    }
  }, [router.isReady]);

  useEffect(() => {
    if (router.isReady && typeof router.query.cabinetId === "string") {
      setSelectedCabinetId(router.query.cabinetId);
    }
  }, [router.isReady, router.query.cabinetId]);

  const handleOpenNewCabinet = () => {
    setEditingCabinet(null);
    setCabinetForm({
      code: `D-0${cabinets.length + 1}`,
      name: `D-0${cabinets.length + 1}`,
    });
    setIsCabinetModalOpen(true);
  };

  const handleOpenEditCabinet = (cab: Cabinet, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCabinet(cab);
    setCabinetForm({
      code: cab.code,
      name: cab.name || cab.code,
    });
    setIsCabinetModalOpen(true);
  };

  const handleSaveCabinet = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = cabinetForm.code.trim().toUpperCase();
    if (!cleanCode) {
      toast.warning("Lütfen Dolap ID girin.");
      return;
    }

    const duplicateCode = cabinets.find(
      (c) =>
        (!editingCabinet || c.id !== editingCabinet.id) &&
        c.code.toUpperCase() === cleanCode,
    );
    if (duplicateCode) {
      toast.error(
        `"${cleanCode}" ID'li bir dolap zaten mevcut! Dolap ID benzersiz olmalıdır.`,
      );
      return;
    }

    try {
      const payload = {
        code: cleanCode,
        name: cleanCode,
      };
      if (editingCabinet) {
        await CabinetAPI.update(editingCabinet.id, payload);
        toast.success("Dolap güncellendi.");
      } else {
        const created = await CabinetAPI.create(payload);
        setSelectedCabinetId(created.id);
        toast.success("Yeni dolap oluşturuldu.");
      }
      setIsCabinetModalOpen(false);
      await fetchCabinets();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Dolap kaydedilemedi");
    }
  };

  const handleConfirmDeleteCabinet = async () => {
    if (!cabinetToDelete) return;

    const compCount = cabinetToDelete.compartments?.length ?? 0;
    if (compCount > 0) {
      toast.warning(
        `Bu dolabın içinde ${compCount} adet bölme var. Önce bölmeleri silmelisiniz.`,
      );
      setCabinetToDelete(null);
      return;
    }

    setIsDeletingCabinet(true);
    try {
      await CabinetAPI.delete(cabinetToDelete.id);
      setCabinetToDelete(null);
      setIsCabinetModalOpen(false);
      toast.success("Dolap başarıyla silindi.");
      await fetchCabinets();
    } catch (err: unknown) {
      toast.warning(
        err instanceof Error
          ? err.message
          : "Bu dolabın içinde bölmeler var. Önce bölmeleri silmelisiniz.",
      );
    } finally {
      setIsDeletingCabinet(false);
    }
  };

  const handleOpenNewCompartment = (cabId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCompCabinetId(cabId);
    setEditingCompartment(null);
    const targetCab = cabinets.find((c) => c.id === cabId);
    const count = targetCab?.compartments?.length || 0;
    const initialCode = `${targetCab?.code || ""}:RAF${count + 1}`;

    setCompForm({
      code: initialCode,
      name: initialCode,
    });
    setIsCompartmentModalOpen(true);
  };

  const handleOpenEditCompartment = (
    comp: Compartment,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setEditingCompartment(comp);
    setCompCabinetId(comp.cabinetId);
    setCompForm({
      code: comp.code,
      name: comp.code,
    });
    setIsCompartmentModalOpen(true);
  };

  const handleSaveCompartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = compForm.code.trim().toUpperCase();
    if (!cleanCode || !compCabinetId) return;

    try {
      const payload = {
        cabinetId: compCabinetId,
        code: cleanCode,
        name: cleanCode,
      };
      if (editingCompartment) {
        await CompartmentAPI.update(editingCompartment.id, payload);
        toast.success("Bölme güncellendi.");
      } else {
        await CompartmentAPI.create(payload);
        toast.success("Yeni bölme oluşturuldu.");
      }
      setIsCompartmentModalOpen(false);
      await fetchCabinets();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Bölme kaydedilemedi");
    }
  };

  const handleDeleteCompartment = (comp: Compartment, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompartmentToDelete(comp);
  };

  const handleConfirmDeleteCompartment = async () => {
    if (!compartmentToDelete) return;

    const prodCount =
      compartmentToDelete.products?.length ??
      compartmentToDelete._count?.products ??
      0;
    if (prodCount > 0) {
      toast.warning(
        `"${compartmentToDelete.code}" rafında ${prodCount} adet ürün var. Raf boşaltılmadan silinemez.`,
      );
      return;
    }

    setIsDeletingCompartment(true);
    try {
      await CompartmentAPI.delete(compartmentToDelete.id);
      setCompartmentToDelete(null);
      toast.success(`"${compartmentToDelete.code}" rafı başarıyla silindi.`);
      await fetchCabinets();
    } catch (err: unknown) {
      toast.warning(
        err instanceof Error
          ? err.message
          : "Bu rafın içinde ürünler bulunuyor. Önce ürünleri boşaltmalısınız.",
      );
    } finally {
      setIsDeletingCompartment(false);
    }
  };

  const filteredCabinets = cabinets.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      (c.compartments &&
        c.compartments.some((comp) => comp.code.toLowerCase().includes(q)))
    );
  });

  const activeCabinet =
    cabinets.find((c) => c.id === selectedCabinetId) || cabinets[0] || null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-900">
            Dolap & Raflar
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Atölye fiziksel yerleşim hiyerarşisi ve dolap/raf ID yönetimi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/labels?tab=compartments")}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Etiketleri Bas</span>
          </button>

          <button
            onClick={handleOpenNewCabinet}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Dolap Ekle</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Dolap veya raf ID ara..."
          className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pr-3 pl-8 text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
        />
        <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-zinc-400" />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-xs text-zinc-500">
          <RefreshCw className="h-5 w-5 animate-spin text-zinc-600" />
          <span>Yükleniyor...</span>
        </div>
      ) : filteredCabinets.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-500">
          Dolap bulunamadı.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-2 lg:col-span-4">
            <h2 className="px-1 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
              Dolaplar ({filteredCabinets.length})
            </h2>

            <div className="space-y-1.5">
              {filteredCabinets.map((cab) => {
                const isSelected = cab.id === selectedCabinetId;
                return (
                  <div
                    key={cab.id}
                    onClick={() => setSelectedCabinetId(cab.id)}
                    className={`group flex cursor-pointer items-center justify-between gap-2 rounded-lg border p-3 text-xs transition ${
                      isSelected
                        ? "border-zinc-900 bg-zinc-900 text-white shadow-xs"
                        : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${
                            isSelected
                              ? "bg-zinc-800 text-zinc-100"
                              : "bg-zinc-100 text-zinc-900"
                          }`}
                        >
                          {cab.code}
                        </span>
                        <span
                          className={`text-[10px] ${
                            isSelected ? "text-zinc-300" : "text-zinc-500"
                          }`}
                        >
                          {cab.compartments?.length ?? 0} raf (
                          {cab.totalProducts ?? 0} ürün)
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={(e) => handleOpenEditCabinet(cab, e)}
                        className={`rounded p-1 transition hover:bg-black/10 ${
                          isSelected
                            ? "text-zinc-300 hover:text-white"
                            : "text-zinc-400 hover:text-zinc-700"
                        }`}
                        title="Dolabı Düzenle"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCabinetToDelete(cab);
                        }}
                        className={`rounded p-1 transition hover:bg-rose-500/20 ${
                          isSelected
                            ? "text-zinc-400 hover:text-rose-300"
                            : "text-zinc-400 hover:text-rose-600"
                        }`}
                        title="Dolabı Sil"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>

                      <ChevronRight
                        className={`h-3.5 w-3.5 ${isSelected ? "text-zinc-400" : "text-zinc-300"}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-8">
            {activeCabinet ? (
              <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
                <div className="flex flex-col justify-between gap-2 border-b border-zinc-100 pb-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-400 uppercase">
                        Dolap:
                      </span>
                      <span className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-sm font-bold text-zinc-900">
                        {activeCabinet.code}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() =>
                        setSelectedLabel({
                          type: "CABINET",
                          code: activeCabinet.dataMatrix,
                          title: activeCabinet.name
                            ? `${activeCabinet.name} (${activeCabinet.code})`
                            : `Dolap: ${activeCabinet.code}`,
                          cabinetCode: activeCabinet.code,
                        })
                      }
                      className="flex items-center gap-1 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-800 transition hover:bg-zinc-200"
                    >
                      <Printer className="h-3 w-3" />
                      <span>Etiket</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditCabinet(activeCabinet)}
                      className="flex items-center gap-1 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-800 transition hover:bg-zinc-200"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Düzenle</span>
                    </button>

                    <button
                      onClick={() => setCabinetToDelete(activeCabinet)}
                      className="flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Dolabı Sil</span>
                    </button>

                    <button
                      onClick={() => handleOpenNewCompartment(activeCabinet.id)}
                      className="flex items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-zinc-800"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Raf Ekle</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                    Raflar ({activeCabinet.compartments?.length ?? 0})
                  </h4>

                  {activeCabinet.compartments &&
                  activeCabinet.compartments.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {activeCabinet.compartments.map((comp) => {
                        const productCount =
                          (comp as any)._count?.products ??
                          comp.products?.length ??
                          0;
                        return (
                          <div
                            key={comp.id}
                            className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 transition hover:border-zinc-300"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-xs font-bold text-zinc-900">
                                  {comp.code}
                                </span>
                              </div>

                              <button
                                onClick={() =>
                                  setSelectedLabel({
                                    type: "COMPARTMENT",
                                    code: comp.dataMatrix,
                                    title: comp.name
                                      ? `${comp.name} (${comp.code})`
                                      : `Raf: ${comp.code}`,
                                    cabinetCode: activeCabinet.code,
                                    compartmentCode: comp.code,
                                  })
                                }
                                className="rounded p-1 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-900"
                                title="Etiket"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between border-t border-zinc-200/60 pt-2 text-xs">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/products?compartmentCode=${comp.code}`,
                                  )
                                }
                                className="flex cursor-pointer items-center gap-1 text-[11px] font-medium text-zinc-800 hover:underline"
                              >
                                <Package className="h-3 w-3 text-zinc-400" />
                                <span>{productCount} Ürün Kayıtlı ➔</span>
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) =>
                                    handleOpenEditCompartment(comp, e)
                                  }
                                  className="p-1 text-zinc-400 hover:text-zinc-700"
                                  title="Rafı Düzenle"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) =>
                                    handleDeleteCompartment(comp, e)
                                  }
                                  className="p-1 text-zinc-400 hover:text-rose-600"
                                  title="Rafı Sil"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-zinc-200 p-8 text-center text-xs text-zinc-400">
                      Bu dolaba henüz raf eklenmedi.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <Modal
        isOpen={isCabinetModalOpen}
        onClose={() => setIsCabinetModalOpen(false)}
        title={editingCabinet ? "Dolabı Düzenle" : "Yeni Dolap"}
      >
        <form onSubmit={handleSaveCabinet} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Dolap ID *
            </label>
            <input
              type="text"
              required
              placeholder="Örn: D-01"
              value={cabinetForm.code}
              onChange={(e) =>
                setCabinetForm({ code: e.target.value, name: e.target.value })
              }
              className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-mono text-xs uppercase"
            />
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-2">
            <div>
              {editingCabinet && (
                <button
                  type="button"
                  onClick={() => {
                    setCabinetToDelete(editingCabinet);
                  }}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Dolabı Sil</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCabinetModalOpen(false)}
                className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700"
              >
                İptal
              </button>
              <button
                type="submit"
                className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
              >
                Kaydet
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCompartmentModalOpen}
        onClose={() => setIsCompartmentModalOpen(false)}
        title={editingCompartment ? "Rafı Düzenle" : "Yeni Raf"}
      >
        <form onSubmit={handleSaveCompartment} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Bağlı Olduğu Dolap *
            </label>
            <select
              required
              value={compCabinetId}
              onChange={(e) => {
                const newCabId = e.target.value;
                setCompCabinetId(newCabId);
                if (!editingCompartment) {
                  const targetCab = cabinets.find((c) => c.id === newCabId);
                  const count = targetCab?.compartments?.length || 0;
                  const newCode = `${targetCab?.code || ""}:RAF${count + 1}`;
                  setCompForm({ code: newCode, name: newCode });
                }
              }}
              className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 font-mono text-xs"
            >
              {cabinets.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Raf ID / Kodu *
            </label>
            <input
              type="text"
              required
              placeholder="Örn: DOLAP:RAF1"
              value={compForm.code}
              disabled={!!editingCompartment}
              onChange={(e) =>
                setCompForm({ code: e.target.value, name: e.target.value })
              }
              className={`w-full rounded-lg border border-zinc-200 px-3 py-1.5 font-mono text-xs uppercase ${
                editingCompartment
                  ? "cursor-not-allowed bg-zinc-100 text-zinc-500"
                  : ""
              }`}
            />
            {editingCompartment && (
              <p className="mt-1 text-[11px] text-zinc-500">
                Raf ID benzersiz kimlik olduğu için değiştirilemez. Rafı başka
                dolaba taşıyabilir veya boşaltıp silebilirsiniz.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-2">
            <div>
              {editingCompartment && (
                <button
                  type="button"
                  onClick={(e) => {
                    setIsCompartmentModalOpen(false);
                    handleDeleteCompartment(editingCompartment, e);
                  }}
                  className="flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Rafı Sil</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCompartmentModalOpen(false)}
                className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700"
              >
                İptal
              </button>
              <button
                type="submit"
                className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
              >
                Kaydet
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!cabinetToDelete}
        onClose={() => setCabinetToDelete(null)}
        title="Dolabı Sil"
        maxWidth="sm"
      >
        {cabinetToDelete &&
          (() => {
            const compCount = cabinetToDelete.compartments?.length ?? 0;
            const hasCompartments = compCount > 0;

            return (
              <div className="space-y-3">
                {hasCompartments ? (
                  <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <div>
                      <p className="font-semibold">
                        "{cabinetToDelete.code}" dolabı silinemez!
                      </p>
                      <p className="mt-1 text-[11px] text-rose-800">
                        Bu dolabın içinde{" "}
                        <strong>{compCount} adet raf/bölme</strong>{" "}
                        bulunmaktadır. Dolabın silinebilmesi için içinde hiçbir
                        raf bulunmaması gerekmektedir.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="font-semibold">
                        "{cabinetToDelete.code}" dolabını silmek üzeresiniz.
                      </p>
                      <p className="mt-1 text-[11px] text-amber-800">
                        Bu işlem geri alınamaz. Dolap kalıcı olarak
                        silinecektir.
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-zinc-600">
                  {hasCompartments
                    ? "Veri kaybını önlemek için dolu dolaplar silinemez. Lütfen önce bu dolaptaki tüm rafları silin."
                    : "Dolap boş olduğu için güvenle silebilirsiniz."}
                </p>

                <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-2">
                  <button
                    type="button"
                    onClick={() => setCabinetToDelete(null)}
                    className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                  >
                    {hasCompartments ? "Kapat" : "Vazgeç"}
                  </button>

                  {!hasCompartments && (
                    <button
                      type="button"
                      disabled={isDeletingCabinet}
                      onClick={handleConfirmDeleteCabinet}
                      className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
                    >
                      {isDeletingCabinet ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Siliniyor...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Dolabı Sil</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
      </Modal>

      <Modal
        isOpen={!!compartmentToDelete}
        onClose={() => setCompartmentToDelete(null)}
        title="Rafı Sil"
        maxWidth="sm"
      >
        {compartmentToDelete &&
          (() => {
            const prodCount =
              compartmentToDelete.products?.length ??
              compartmentToDelete._count?.products ??
              0;
            const hasProducts = prodCount > 0;

            return (
              <div className="space-y-3">
                {hasProducts ? (
                  <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <div>
                      <p className="font-semibold">
                        "{compartmentToDelete.code}" rafı silinemez!
                      </p>
                      <p className="mt-1 text-[11px] text-rose-800">
                        Bu rafın içerisinde{" "}
                        <strong>{prodCount} adet kayıtlı ürün</strong>{" "}
                        bulunmaktadır. Rafın silinebilmesi için rafın tamamen
                        boş olması gerekmektedir.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="font-semibold">
                        "{compartmentToDelete.code}" rafını silmek üzeresiniz.
                      </p>
                      <p className="mt-1 text-[11px] text-amber-800">
                        Bu işlem geri alınamaz. Raf kalıcı olarak silinecektir.
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-zinc-600">
                  {hasProducts
                    ? "Ürün kaybını önlemek için dolu raflar silinemez. Lütfen önce bu raftaki ürünleri başka bir rafa taşıyın veya silin."
                    : "Raf tamamen boş olduğu için güvenle silebilirsiniz."}
                </p>

                <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-2">
                  <button
                    type="button"
                    onClick={() => setCompartmentToDelete(null)}
                    className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                  >
                    {hasProducts ? "Kapat" : "Vazgeç"}
                  </button>

                  {!hasProducts && (
                    <button
                      type="button"
                      disabled={isDeletingCompartment}
                      onClick={handleConfirmDeleteCompartment}
                      className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
                    >
                      {isDeletingCompartment ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Siliniyor...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Rafı Sil</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
      </Modal>

      <Modal
        isOpen={!!selectedLabel}
        onClose={() => setSelectedLabel(null)}
        title="DataMatrix Etiketi"
        maxWidth="md"
      >
        {selectedLabel && (
          <HorizontalDataMatrixLabel
            type={selectedLabel.type}
            code={selectedLabel.code}
            title={selectedLabel.title}
            cabinetCode={selectedLabel.cabinetCode}
            compartmentCode={selectedLabel.compartmentCode}
            showActions={true}
            size="md"
          />
        )}
      </Modal>
    </div>
  );
}
