import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Printer,
  Package,
  Layers,
  Archive,
  Search,
  AlertCircle,
} from 'lucide-react';
import { ProductAPI, CabinetAPI, CompartmentAPI } from '../services';
import { Product, Cabinet, Compartment } from '../types';
import { HorizontalDataMatrixLabel } from '../components/labels/HorizontalDataMatrixLabel';

export default function LabelHubPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'products' | 'compartments' | 'cabinets'>('products');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (router.isReady && typeof router.query.tab === 'string') {
      const tab = router.query.tab;
      if (tab === 'compartments' || tab === 'cabinets' || tab === 'products') {
        setActiveTab(tab);
      }
    }
  }, [router.isReady, router.query.tab]);

  const [products, setProducts] = useState<Product[]>([]);
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [compartments, setCompartments] = useState<Compartment[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setError(null);
      try {
        const [p, c, cp] = await Promise.all([
          ProductAPI.getAll(),
          CabinetAPI.getAll(),
          CompartmentAPI.getAll(),
        ]);
        if (!isMounted) return;
        setProducts(p);
        setCabinets(c);
        setCompartments(cp);

        if (p.length > 0) {
          setSelectedIds(new Set(p.map((item) => item.id)));
        }
      } catch (_e) {
        if (isMounted) setError('Etiket verileri yüklenemedi.');
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTabChange = (tab: 'products' | 'compartments' | 'cabinets') => {
    setActiveTab(tab);
    if (tab === 'products') setSelectedIds(new Set(products.map((p) => p.id)));
    else if (tab === 'compartments') setSelectedIds(new Set(compartments.map((c) => c.id)));
    else setSelectedIds(new Set(cabinets.map((c) => c.id)));

    router.replace({ pathname: '/labels', query: { tab } }, undefined, { shallow: true });
  };

  const allItems = useMemo(() => {
    if (activeTab === 'products') {
      return products.map((p) => {
        const cabCode = p.compartment?.cabinet?.code || '—';
        const compCode = (p as any).compartmentCode || p.compartment?.code || '—';
        return {
          id: p.id,
          type: 'PRODUCT' as const,
          code: p.dataMatrix,
          title: p.name,
          owner: p.owner || null,
          cabinetCode: cabCode,
          compartmentCode: compCode,
          sku: p.sku,
        };
      });
    } else if (activeTab === 'compartments') {
      return compartments.map((cp) => ({
        id: cp.id,
        type: 'COMPARTMENT' as const,
        code: cp.dataMatrix,
        title: cp.code,
        owner: null,
        cabinetCode: cp.cabinet?.code || cp.cabinetId,
        compartmentCode: cp.code,
        sku: cp.code,
      }));
    } else {
      return cabinets.map((c) => ({
        id: c.id,
        type: 'CABINET' as const,
        code: c.dataMatrix,
        title: c.code,
        owner: null,
        cabinetCode: c.code,
        compartmentCode: null,
        sku: c.code,
      }));
    }
  }, [activeTab, products, compartments, cabinets]);

  const getFilteredItems = () => {
    if (!searchQuery.trim()) return allItems;
    const q = searchQuery.toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.owner && item.owner.toLowerCase().includes(q)) ||
        (item.cabinetCode && item.cabinetCode.toLowerCase().includes(q)) ||
        (item.compartmentCode && item.compartmentCode.toLowerCase().includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q))
    );
  };

  const filteredItems = getFilteredItems();
  const selectedCount = allItems.filter((item) => selectedIds.has(item.id)).length;

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredItems.map((item) => item.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500">
        <AlertCircle className="w-6 h-6 text-rose-500" />
        <p className="text-sm text-zinc-700">{error}</p>
        <button onClick={() => window.location.reload()} className="text-xs text-blue-600 hover:underline">Tekrar Dene</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 print-container">
      <div className="no-print space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
          <div>
            <h1 className="text-lg font-bold text-zinc-900 tracking-tight">
              DataMatrix Etiket Basımı
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Yatay DataMatrix etiket sayfaları. Doğrudan etiketlere tıklayarak seçim yapabilirsiniz.
            </p>
          </div>

          <button
            onClick={handleTriggerPrint}
            disabled={selectedCount === 0}
            className="py-1.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition active:scale-[0.98] disabled:opacity-40 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Yazdır ({selectedCount} Etiket)</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => handleTabChange('products')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Ürünler ({products.length})</span>
            </button>

            <button
              onClick={() => handleTabChange('compartments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'compartments'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Raflar ({compartments.length})</span>
            </button>

            <button
              onClick={() => handleTabChange('cabinets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'cabinets'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Dolaplar ({cabinets.length})</span>
            </button>
          </div>

          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Etiketler içinde ara..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-700">
              Basılacak Seçilen:{' '}
              <strong className="text-zinc-900">{selectedCount}</strong> / {allItems.length}
            </span>

            <button
              onClick={handleSelectAll}
              className="text-xs text-zinc-900 hover:underline font-medium ml-2 cursor-pointer"
            >
              Tümünü Seç
            </button>
            <span className="text-zinc-300">|</span>
            <button
              onClick={handleClearSelection}
              className="text-xs text-zinc-500 hover:text-zinc-900 cursor-pointer"
            >
              Temizle
            </button>
          </div>

          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            Etiketlere tıklayarak seçim yapabilirsiniz
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="no-print p-12 text-center bg-white rounded-xl border border-zinc-200 text-zinc-400 text-xs">
            Aramanıza uygun etiket bulunamadı.
          </div>
        ) : (
          <div className="print-sheet-grid grid gap-3 print:gap-2 p-3 bg-white rounded-xl border border-zinc-200 shadow-xs print:border-none print:shadow-none print:p-0 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 print:grid-cols-2">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.has(item.id);

              return (
                <HorizontalDataMatrixLabel
                  key={item.id}
                  type={item.type}
                  title={item.title}
                  owner={item.owner}
                  cabinetCode={item.cabinetCode}
                  compartmentCode={item.compartmentCode}
                  code={item.code}
                  sku={item.sku}
                  isSelected={isSelected}
                  onToggleSelect={() => handleToggleSelect(item.id)}
                  showActions={false}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
