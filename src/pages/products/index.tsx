import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
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
} from 'lucide-react';
import {
  ProductAPI,
  CabinetAPI,
  CompartmentAPI,
} from '../../services';
import { Product, Cabinet, Compartment } from '../../types';
import { PRODUCT_OWNERS } from '../../config/constants';
import { Modal } from '../../components/common/Modal';
import { ImagePreview } from '../../components/common/ImagePreview';
import { HorizontalDataMatrixLabel } from '../../components/labels/HorizontalDataMatrixLabel';
import { toast } from 'react-toastify';

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [compartments, setCompartments] = useState<Compartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [search, setSearch] = useState('');
  const [selectedCabinetId, setSelectedCabinetId] = useState('');
  const [selectedCompartmentCode, setSelectedCompartmentCode] = useState('');
  const [zimmetFilter, setZimmetFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formOwner, setFormOwner] = useState<string>('');
  const [formDescription, setFormDescription] = useState('');
  const [formQuantity, setFormQuantity] = useState<number>(0);
  const [formCabinetId, setFormCabinetId] = useState('');
  const [formCompartmentCode, setFormCompartmentCode] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [labelModalProduct, setLabelModalProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (router.isReady) {
      if (typeof router.query.search === 'string') setSearch(router.query.search);
      if (typeof router.query.cabinetId === 'string') setSelectedCabinetId(router.query.cabinetId);
      if (typeof router.query.compartmentCode === 'string') {
        setSelectedCompartmentCode(router.query.compartmentCode);
      } else if (typeof router.query.compartmentId === 'string') {
        setSelectedCompartmentCode(router.query.compartmentId);
      }
      if (router.query.new === 'true') {
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

      if (router.query.new === 'true') {
        openNewProductModal();
      }
    } catch (_e) {
      setError('Ürün verileri yüklenemedi.');
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
    setFormName('');
    setFormSku(`PRD-${timestamp}${randomDigits}`);
    setFormOwner('');
    setFormDescription('');
    setFormQuantity(1);
    setFormCabinetId(cabinets[0]?.id || '');
    setFormCompartmentCode(
      (typeof router.query.compartmentCode === 'string' && router.query.compartmentCode) ||
        (typeof router.query.compartmentId === 'string' && router.query.compartmentId) ||
        compartments[0]?.code ||
        ''
    );
    setFormImageUrl('');
    setIsFormModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSku.trim() || !formCompartmentCode) {
      toast.warning('Lütfen ürün adı, stok kodu ve yerleştirileceği bölmeyi seçin.');
      return;
    }
    if (!formOwner) {
      toast.warning('Lütfen malzeme sahibini seçin.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', formName.trim());
      formData.append('sku', formSku.trim().toUpperCase());
      formData.append('owner', formOwner);
      formData.append('description', formDescription.trim());
      formData.append('quantity', String(formQuantity));
      formData.append('compartmentCode', formCompartmentCode);
      formData.append('imageUrl', formImageUrl.trim());

      if (editingProduct) {
        await ProductAPI.update(editingProduct.id, formData);
        toast.success('Ürün başarıyla güncellendi.');
      } else {
        await ProductAPI.create(formData);
        toast.success('Yeni ürün başarıyla eklendi.');
      }

      setIsFormModalOpen(false);
      if (router.query.new) {
        const nextQuery = { ...router.query };
        delete nextQuery.new;
        router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
      }
      await fetchInitialData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ürün kaydedilemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdjust = async (
    e: React.MouseEvent,
    product: Product,
    change: number
  ) => {
    e.stopPropagation();
    try {
      const res = await ProductAPI.adjustStock(product.id, {
        change,
        type: change > 0 ? 'IN' : 'OUT',
        note: change > 0 ? '1 adet giriş' : '1 adet çıkış',
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? res.product : p))
      );
      toast.success(
        `${product.name} stoğu güncellendi (${change > 0 ? '+' : ''}${change})`
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Stok güncellenemedi');
    }
  };

  const formFilteredCompartments = compartments.filter(
    (c) => !formCabinetId || c.cabinetId === formCabinetId
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">
            Envanter & Ürünler
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Kayıtlı tüm malzemeler, konumları ve anlık stok adetleri.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openNewProductModal}
            className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Ürün Ekle</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs">
        <div className="flex flex-col md:flex-row items-center gap-2.5">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ürün adı veya barkod ara..."
              className="w-full pl-8 pr-16 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white transition"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
            <button
              type="submit"
              className="absolute right-1 top-1 px-2.5 py-0.5 bg-zinc-900 text-white rounded text-[10px] font-medium hover:bg-zinc-800"
            >
              Ara
            </button>
          </form>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedCabinetId}
              onChange={(e) => {
                setSelectedCabinetId(e.target.value);
                setSelectedCompartmentCode('');
              }}
              className="px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-800 focus:ring-1 focus:ring-zinc-900 flex-1 md:flex-none font-mono"
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
              className="px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-800 focus:ring-1 focus:ring-zinc-900 flex-1 md:flex-none font-mono"
            >
              <option value="">Tüm Raflar</option>
              {compartments
                .filter((cp) => !selectedCabinetId || cp.cabinetId === selectedCabinetId)
                .map((cp) => (
                  <option key={cp.id} value={cp.code}>
                    {cp.code}
                  </option>
                ))}
            </select>

            <select
              value={zimmetFilter}
              onChange={(e) => setZimmetFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-800 focus:ring-1 focus:ring-zinc-900 flex-1 md:flex-none"
            >
              <option value="all">Zimmet: Tümü</option>
              <option value="assigned">Sadece Zimmetliler</option>
              <option value="unassigned">Sadece Depodakiler</option>
            </select>

            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-800 focus:ring-1 focus:ring-zinc-900 flex-1 md:flex-none font-medium"
            >
              <option value="all">Sahip: Tümü</option>
              <option value="unassigned_owner">Sahipsiz / Belirtilmemiş</option>
              {PRODUCT_OWNERS.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-0.5 bg-zinc-100 p-0.5 rounded-lg shrink-0 self-end md:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-md transition ${
                viewMode === 'grid'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded-md transition ${
                viewMode === 'list'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-zinc-500 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-zinc-600" />
          <span>Ürünler yükleniyor...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500">
          <AlertCircle className="w-6 h-6 text-rose-500" />
          <p className="text-sm text-zinc-700">{error}</p>
          <button onClick={fetchInitialData} className="text-xs text-blue-600 hover:underline">Tekrar Dene</button>
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-zinc-200 text-zinc-500 text-xs">
          Filtrelere uygun ürün bulunamadı.
        </div>
      ) : (() => {
        const filteredProducts = products.filter((prod) => {
          if (zimmetFilter === 'assigned') return !!prod.isAssigned;
          if (zimmetFilter === 'unassigned') return !prod.isAssigned;
          if (selectedOwner === 'unassigned_owner') {
            if (prod.owner) return false;
          } else if (selectedOwner !== 'all') {
            if (prod.owner !== selectedOwner) return false;
          }
          return true;
        });

        if (filteredProducts.length === 0) {
          return (
            <div className="p-12 text-center bg-white rounded-xl border border-zinc-200 text-zinc-500 text-xs">
              Seçilen filtrelere uygun ürün bulunamadı.
            </div>
          );
        }

        return viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => router.push(`/products/detail?id=${prod.id}`)}
                className="group relative bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 hover:shadow-xs transition flex flex-col justify-between cursor-pointer overflow-hidden"
              >
                <div>
                  <div className="relative aspect-[16/10] w-full bg-zinc-100 overflow-hidden flex items-center justify-center border-b border-zinc-100">
                    {prod.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-zinc-300" />
                    )}

                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="bg-zinc-900/90 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow-2xs">
                        {prod.sku}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLabelModalProduct(prod);
                      }}
                      title="Etiket"
                      className="absolute top-2 right-2 p-1 bg-white/90 hover:bg-white text-zinc-700 rounded shadow-xs transition"
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-1.5">
                      <h4 className="font-semibold text-zinc-900 text-xs line-clamp-2 leading-snug flex-1">
                        {prod.name}
                      </h4>
                      <div className="shrink-0">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {prod.owner}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-zinc-500 pt-0.5">
                      <Layers className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="truncate">
                        {prod.compartment?.cabinet?.code} ➔ {prod.compartment?.name}
                      </span>
                    </div>

                    {prod.description && (
                      <p className="text-[11px] text-zinc-500 line-clamp-1 italic">
                        {prod.description}
                      </p>
                    )}

                    {prod.isAssigned && prod.assignment ? (
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs max-w-full">
                          <UserCheck className="w-3 h-3 text-amber-700 shrink-0" />
                          <span className="truncate">
                            Zimmetli: {prod.assignment.assignedToName} ({prod.assignment.assignedQuantity ?? 0} adet)
                          </span>
                        </span>
                      </div>
                    ) : (
                      <div className="pt-1">
                        <span className="text-[10px] text-zinc-400 font-medium">
                          Depoda / Zimmetsiz
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-3 py-2 bg-zinc-50/70 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-sm font-bold text-zinc-900">
                      {prod.quantity}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      adet
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleQuickAdjust(e, prod, -1)}
                      disabled={prod.quantity <= 0}
                      className="w-6 h-6 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded flex items-center justify-center transition disabled:opacity-40"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleQuickAdjust(e, prod, 1)}
                      className="w-6 h-6 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded flex items-center justify-center transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[10px] font-semibold uppercase">
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
                        onClick={() => router.push(`/products/detail?id=${prod.id}`)}
                        className="hover:bg-zinc-50/70 cursor-pointer transition"
                      >
                      <td className="p-3">
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-8 h-8 rounded object-cover border border-zinc-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center text-zinc-400">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-medium">
                        <div className="font-semibold text-zinc-900">
                          {prod.name}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-400">
                          {prod.sku}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {prod.owner}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-zinc-600">
                        {prod.compartment?.cabinet?.code} ➔ {prod.compartment?.name}
                      </td>
                      <td className="p-3">
                        {prod.isAssigned && prod.assignment ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                            <UserCheck className="w-3 h-3 text-amber-700 shrink-0" />
                            <span>
                              {prod.assignment.assignedToName} ({prod.assignment.assignedQuantity ?? 0} adet)
                            </span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-400">Depoda</span>
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
                            className="p-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleQuickAdjust(e, prod, 1)}
                            className="p-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded"
                          >
                            <Plus className="w-3 h-3" />
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
      })()}

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Kaydet'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveProduct} className="space-y-3">
          <ImagePreview
            value={formImageUrl}
            onChange={(url) => setFormImageUrl(url)}
          />

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Ürün Adı *
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Örn: ESP32 NodeMCU"
              className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Stok / Ürün Kodu *
              </label>
              <input
                type="text"
                required
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                placeholder="Örn: PRD-ESP32"
                className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-900 focus:outline-none uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Malzeme Sahibi *
              </label>
              <select
                required
                value={formOwner}
                onChange={(e) => setFormOwner(e.target.value)}
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

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Mevcut Miktar (Adet)
              </label>
              <input
                type="number"
                min="0"
                value={formQuantity}
                onChange={(e) => setFormQuantity(parseInt(e.target.value, 10) || 0)}
                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-zinc-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Dolap Seçimi *
              </label>
              <select
                value={formCabinetId}
                onChange={(e) => {
                  setFormCabinetId(e.target.value);
                  const firstComp = compartments.find((c) => c.cabinetId === e.target.value);
                  setFormCompartmentCode(firstComp?.code || '');
                }}
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
                Raf Seçimi *
              </label>
              <select
                required
                value={formCompartmentCode}
                onChange={(e) => setFormCompartmentCode(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white font-mono"
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
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Açıklama (Opsiyonel)
            </label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Ürün açıklaması, teknik notlar veya özellikler..."
              className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-900 focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-lg"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
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
            type="PRODUCT"
            title={labelModalProduct.name}
            owner={labelModalProduct.owner}
            cabinetCode={labelModalProduct.compartment?.cabinet?.code || null}
            compartmentCode={labelModalProduct.compartmentCode || labelModalProduct.compartment?.code || null}
            code={labelModalProduct.dataMatrix}
            sku={labelModalProduct.sku}
            showActions={true}
            size="md"
          />
        )}
      </Modal>
    </div>
  );
};
