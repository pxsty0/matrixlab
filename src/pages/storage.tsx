import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import {
  CabinetAPI,
  CompartmentAPI,
} from '../services';
import { Cabinet, Compartment } from '../types';
import { Modal } from '../components/common/Modal';
import { HorizontalDataMatrixLabel, LabelType } from '../components/labels/HorizontalDataMatrixLabel';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

export default function StoragePage() {
  const router = useRouter();
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedCabinetId, setSelectedCabinetId] = useState<string | null>(null);

  const [isCabinetModalOpen, setIsCabinetModalOpen] = useState(false);
  const [editingCabinet, setEditingCabinet] = useState<Cabinet | null>(null);
  const [cabinetForm, setCabinetForm] = useState({
    code: '',
    name: '',
  });

  const [isCompartmentModalOpen, setIsCompartmentModalOpen] = useState(false);
  const [editingCompartment, setEditingCompartment] = useState<Compartment | null>(null);
  const [compCabinetId, setCompCabinetId] = useState<string>('');
  const [compForm, setCompForm] = useState({
    code: '',
    name: '',
  });

  const [cabinetToDelete, setCabinetToDelete] = useState<Cabinet | null>(null);
  const [isDeletingCabinet, setIsDeletingCabinet] = useState(false);
  const [compartmentToDelete, setCompartmentToDelete] = useState<Compartment | null>(null);
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
      const urlCabId = typeof router.query.cabinetId === 'string' ? router.query.cabinetId : null;
      if (urlCabId && data.some((c) => c.id === urlCabId)) {
        setSelectedCabinetId(urlCabId);
      } else if (!selectedCabinetId && data.length > 0) {
        setSelectedCabinetId(data[0].id);
      } else if (selectedCabinetId && !data.some((c) => c.id === selectedCabinetId)) {
        setSelectedCabinetId(data[0]?.id || null);
      }
    } catch (e) {
      toast.error('Dolap verileri yüklenemedi: ' + (e instanceof Error ? e.message : 'Bağlantı hatası'));
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
    if (router.isReady && typeof router.query.cabinetId === 'string') {
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
      toast.warning('Lütfen Dolap ID girin.');
      return;
    }

    const duplicateCode = cabinets.find(
      (c) =>
        (!editingCabinet || c.id !== editingCabinet.id) &&
        c.code.toUpperCase() === cleanCode
    );
    if (duplicateCode) {
      toast.error(`"${cleanCode}" ID'li bir dolap zaten mevcut! Dolap ID benzersiz olmalıdır.`);
      return;
    }

    try {
      const payload = {
        code: cleanCode,
        name: cleanCode,
      };
      if (editingCabinet) {
        await CabinetAPI.update(editingCabinet.id, payload);
        toast.success('Dolap güncellendi.');
      } else {
        const created = await CabinetAPI.create(payload);
        setSelectedCabinetId(created.id);
        toast.success('Yeni dolap oluşturuldu.');
      }
      setIsCabinetModalOpen(false);
      await fetchCabinets();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Dolap kaydedilemedi');
    }
  };

  const handleConfirmDeleteCabinet = async () => {
    if (!cabinetToDelete) return;

    const compCount = cabinetToDelete.compartments?.length ?? 0;
    if (compCount > 0) {
      toast.warning(
        `Bu dolabın içinde ${compCount} adet bölme var. Önce bölmeleri silmelisiniz.`
      );
      setCabinetToDelete(null);
      return;
    }

    setIsDeletingCabinet(true);
    try {
      await CabinetAPI.delete(cabinetToDelete.id);
      setCabinetToDelete(null);
      setIsCabinetModalOpen(false);
      toast.success('Dolap başarıyla silindi.');
      await fetchCabinets();
    } catch (err: unknown) {
      toast.warning(err instanceof Error ? err.message : 'Bu dolabın içinde bölmeler var. Önce bölmeleri silmelisiniz.');
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
    const initialCode = `${targetCab?.code || ''}:RAF${count + 1}`;

    setCompForm({
      code: initialCode,
      name: initialCode,
    });
    setIsCompartmentModalOpen(true);
  };

  const handleOpenEditCompartment = (comp: Compartment, e: React.MouseEvent) => {
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
        toast.success('Bölme güncellendi.');
      } else {
        await CompartmentAPI.create(payload);
        toast.success('Yeni bölme oluşturuldu.');
      }
      setIsCompartmentModalOpen(false);
      await fetchCabinets();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Bölme kaydedilemedi');
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
        `"${compartmentToDelete.code}" rafında ${prodCount} adet ürün var. Raf boşaltılmadan silinemez.`
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
      toast.warning(err instanceof Error ? err.message : 'Bu rafın içinde ürünler bulunuyor. Önce ürünleri boşaltmalısınız.');
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

  const activeCabinet = cabinets.find((c) => c.id === selectedCabinetId) || cabinets[0] || null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-900">
            Dolap & Raflar
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Atölye fiziksel yerleşim hiyerarşisi ve dolap/raf ID yönetimi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/labels?tab=compartments')}
            className="py-1.5 px-3 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Etiketleri Bas</span>
          </button>

          <button
            onClick={handleOpenNewCabinet}
            className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
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
          className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
        />
        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-zinc-500 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-zinc-600" />
          <span>Yükleniyor...</span>
        </div>
      ) : filteredCabinets.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-zinc-200 text-zinc-500 text-xs">
          Dolap bulunamadı.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 space-y-2">
            <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-1">
              Dolaplar ({filteredCabinets.length})
            </h2>

            <div className="space-y-1.5">
              {filteredCabinets.map((cab) => {
                const isSelected = cab.id === selectedCabinetId;
                return (
                  <div
                    key={cab.id}
                    onClick={() => setSelectedCabinetId(cab.id)}
                    className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2 text-xs group ${
                      isSelected
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-white text-zinc-800 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                            isSelected
                              ? 'bg-zinc-800 text-zinc-100'
                              : 'bg-zinc-100 text-zinc-900'
                          }`}
                        >
                          {cab.code}
                        </span>
                        <span
                          className={`text-[10px] ${
                            isSelected ? 'text-zinc-300' : 'text-zinc-500'
                          }`}
                        >
                          {cab.compartments?.length ?? 0} raf ({cab.totalProducts ?? 0} ürün)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleOpenEditCabinet(cab, e)}
                        className={`p-1 rounded hover:bg-black/10 transition ${
                          isSelected ? 'text-zinc-300 hover:text-white' : 'text-zinc-400 hover:text-zinc-700'
                        }`}
                        title="Dolabı Düzenle"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCabinetToDelete(cab);
                        }}
                        className={`p-1 rounded hover:bg-rose-500/20 transition ${
                          isSelected ? 'text-zinc-400 hover:text-rose-300' : 'text-zinc-400 hover:text-rose-600'
                        }`}
                        title="Dolabı Sil"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-zinc-400' : 'text-zinc-300'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-8">
            {activeCabinet ? (
              <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400 font-medium uppercase">Dolap:</span>
                      <span className="bg-zinc-100 text-zinc-900 font-mono text-sm font-bold px-2 py-0.5 rounded border border-zinc-200">
                        {activeCabinet.code}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() =>
                        setSelectedLabel({
                          type: 'CABINET',
                          code: activeCabinet.dataMatrix,
                          title: activeCabinet.name ? `${activeCabinet.name} (${activeCabinet.code})` : `Dolap: ${activeCabinet.code}`,
                          cabinetCode: activeCabinet.code,
                        })
                      }
                      className="py-1 px-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-md text-xs font-medium flex items-center gap-1 transition"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Etiket</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditCabinet(activeCabinet)}
                      className="py-1 px-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-md text-xs font-medium flex items-center gap-1 transition"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Düzenle</span>
                    </button>

                    <button
                      onClick={() => setCabinetToDelete(activeCabinet)}
                      className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-medium flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Dolabı Sil</span>
                    </button>

                    <button
                      onClick={() => handleOpenNewCompartment(activeCabinet.id)}
                      className="py-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-medium flex items-center gap-1 transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Raf Ekle</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Raflar ({activeCabinet.compartments?.length ?? 0})
                  </h4>

                  {activeCabinet.compartments && activeCabinet.compartments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeCabinet.compartments.map((comp) => {
                        const productCount = (comp as any)._count?.products ?? comp.products?.length ?? 0;
                        return (
                          <div
                            key={comp.id}
                            className="bg-zinc-50/70 p-3 rounded-lg border border-zinc-200 hover:border-zinc-300 transition space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="font-mono text-xs font-bold text-zinc-900 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                                  {comp.code}
                                </span>
                              </div>

                              <button
                                onClick={() =>
                                  setSelectedLabel({
                                    type: 'COMPARTMENT',
                                    code: comp.dataMatrix,
                                    title: comp.name ? `${comp.name} (${comp.code})` : `Raf: ${comp.code}`,
                                    cabinetCode: activeCabinet.code,
                                    compartmentCode: comp.code,
                                  })
                                }
                                className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded transition"
                                title="Etiket"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between text-xs">
                              <button
                                onClick={() => router.push(`/products?compartmentCode=${comp.code}`)}
                                className="text-zinc-800 hover:underline font-medium text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <Package className="w-3 h-3 text-zinc-400" />
                                <span>{productCount} Ürün Kayıtlı ➔</span>
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => handleOpenEditCompartment(comp, e)}
                                  className="p-1 text-zinc-400 hover:text-zinc-700"
                                  title="Rafı Düzenle"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteCompartment(comp, e)}
                                  className="p-1 text-zinc-400 hover:text-rose-600"
                                  title="Rafı Sil"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center border border-dashed border-zinc-200 rounded-lg text-zinc-400 text-xs">
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
        title={editingCabinet ? 'Dolabı Düzenle' : 'Yeni Dolap'}
      >
        <form onSubmit={handleSaveCabinet} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
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
              className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg uppercase font-mono"
            />
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
            <div>
              {editingCabinet && (
                <button
                  type="button"
                  onClick={() => {
                    setCabinetToDelete(editingCabinet);
                  }}
                  className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-medium rounded-lg transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Dolabı Sil</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCabinetModalOpen(false)}
                className="px-3 py-1.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-lg"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg"
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
        title={editingCompartment ? 'Rafı Düzenle' : 'Yeni Raf'}
      >
        <form onSubmit={handleSaveCompartment} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
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
                  const newCode = `${targetCab?.code || ''}:RAF${count + 1}`;
                  setCompForm({ code: newCode, name: newCode });
                }
              }}
              className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white font-mono"
            >
              {cabinets.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
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
              className={`w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg uppercase font-mono ${
                editingCompartment
                  ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed'
                  : ''
              }`}
            />
            {editingCompartment && (
              <p className="text-[11px] text-zinc-500 mt-1">
                Raf ID benzersiz kimlik olduğu için değiştirilemez. Rafı başka dolaba taşıyabilir veya boşaltıp silebilirsiniz.
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
            <div>
              {editingCompartment && (
                <button
                  type="button"
                  onClick={(e) => {
                    setIsCompartmentModalOpen(false);
                    handleDeleteCompartment(editingCompartment, e);
                  }}
                  className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-medium rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Rafı Sil</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCompartmentModalOpen(false)}
                className="px-3 py-1.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-lg"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg"
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
        {cabinetToDelete && (() => {
          const compCount = cabinetToDelete.compartments?.length ?? 0;
          const hasCompartments = compCount > 0;

          return (
            <div className="space-y-3">
              {hasCompartments ? (
                <div className="flex items-start gap-2.5 p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-900 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">
                      "{cabinetToDelete.code}" dolabı silinemez!
                    </p>
                    <p className="text-[11px] text-rose-800 mt-1">
                      Bu dolabın içinde <strong>{compCount} adet raf/bölme</strong> bulunmaktadır. Dolabın silinebilmesi için içinde hiçbir raf bulunmaması gerekmektedir.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">
                      "{cabinetToDelete.code}" dolabını silmek üzeresiniz.
                    </p>
                    <p className="text-[11px] text-amber-800 mt-1">
                      Bu işlem geri alınamaz. Dolap kalıcı olarak silinecektir.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs text-zinc-600">
                {hasCompartments
                  ? 'Veri kaybını önlemek için dolu dolaplar silinemez. Lütfen önce bu dolaptaki tüm rafları silin.'
                  : 'Dolap boş olduğu için güvenle silebilirsiniz.'}
              </p>

              <div className="pt-2 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCabinetToDelete(null)}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-lg"
                >
                  {hasCompartments ? 'Kapat' : 'Vazgeç'}
                </button>

                {!hasCompartments && (
                  <button
                    type="button"
                    disabled={isDeletingCabinet}
                    onClick={handleConfirmDeleteCabinet}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isDeletingCabinet ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Siliniyor...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
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
        {compartmentToDelete && (() => {
          const prodCount =
            compartmentToDelete.products?.length ??
            compartmentToDelete._count?.products ??
            0;
          const hasProducts = prodCount > 0;

          return (
            <div className="space-y-3">
              {hasProducts ? (
                <div className="flex items-start gap-2.5 p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-900 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">
                      "{compartmentToDelete.code}" rafı silinemez!
                    </p>
                    <p className="text-[11px] text-rose-800 mt-1">
                      Bu rafın içerisinde <strong>{prodCount} adet kayıtlı ürün</strong> bulunmaktadır. Rafın silinebilmesi için rafın tamamen boş olması gerekmektedir.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">
                      "{compartmentToDelete.code}" rafını silmek üzeresiniz.
                    </p>
                    <p className="text-[11px] text-amber-800 mt-1">
                      Bu işlem geri alınamaz. Raf kalıcı olarak silinecektir.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs text-zinc-600">
                {hasProducts
                  ? 'Ürün kaybını önlemek için dolu raflar silinemez. Lütfen önce bu raftaki ürünleri başka bir rafa taşıyın veya silin.'
                  : 'Raf tamamen boş olduğu için güvenle silebilirsiniz.'}
              </p>

              <div className="pt-2 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompartmentToDelete(null)}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-lg"
                >
                  {hasProducts ? 'Kapat' : 'Vazgeç'}
                </button>

                {!hasProducts && (
                  <button
                    type="button"
                    disabled={isDeletingCompartment}
                    onClick={handleConfirmDeleteCompartment}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isDeletingCompartment ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Siliniyor...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
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
};
