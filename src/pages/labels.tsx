import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import {
  Printer,
  Package,
  Layers,
  Archive,
  Search,
  AlertCircle,
} from "lucide-react";
import { ProductAPI, CabinetAPI, CompartmentAPI } from "../services";
import { Product, Cabinet, Compartment, EntityType } from "../types";
import { HorizontalDataMatrixLabel } from "../components/labels/HorizontalDataMatrixLabel";

export default function LabelHubPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "products" | "compartments" | "cabinets"
  >("products");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (router.isReady && typeof router.query.tab === "string") {
      const tab = router.query.tab;
      if (tab === "compartments" || tab === "cabinets" || tab === "products") {
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
        if (isMounted) setError("Etiket verileri yüklenemedi.");
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTabChange = (tab: "products" | "compartments" | "cabinets") => {
    setActiveTab(tab);
    if (tab === "products") setSelectedIds(new Set(products.map((p) => p.id)));
    else if (tab === "compartments")
      setSelectedIds(new Set(compartments.map((c) => c.id)));
    else setSelectedIds(new Set(cabinets.map((c) => c.id)));

    router.replace({ pathname: "/labels", query: { tab } }, undefined, {
      shallow: true,
    });
  };

  const allItems = useMemo(() => {
    if (activeTab === "products") {
      return products.map((p) => {
        const cabCode = p.compartment?.cabinet?.code || "—";
        const compCode =
          (p as any).compartmentCode || p.compartment?.code || "—";
        return {
          id: p.id,
          type: "product" as EntityType,
          code: p.dataMatrix,
          title: p.name,
          owner: p.owner || null,
          cabinetCode: cabCode,
          compartmentCode: compCode,
          sku: p.sku,
        };
      });
    } else if (activeTab === "compartments") {
      return compartments.map((cp) => ({
        id: cp.id,
        type: "compartment" as EntityType,
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
        type: "cabinet" as EntityType,
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
        (item.owner?.name && item.owner.name.toLowerCase().includes(q)) ||
        (item.cabinetCode && item.cabinetCode.toLowerCase().includes(q)) ||
        (item.compartmentCode &&
          item.compartmentCode.toLowerCase().includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q)),
    );
  };

  const filteredItems = getFilteredItems();
  const selectedCount = allItems.filter((item) =>
    selectedIds.has(item.id),
  ).length;

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
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-500">
        <AlertCircle className="h-6 w-6 text-rose-500" />
        <p className="text-sm text-zinc-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-blue-600 hover:underline"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="print-container space-y-4">
      <div className="no-print space-y-3">
        <div className="flex flex-col justify-between gap-3 border-b border-zinc-200 pb-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900">
              DataMatrix Etiket Basımı
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              Yatay DataMatrix etiket sayfaları. Doğrudan etiketlere tıklayarak
              seçim yapabilirsiniz.
            </p>
          </div>

          <button
            onClick={handleTriggerPrint}
            disabled={selectedCount === 0}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-40"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Yazdır ({selectedCount} Etiket)</span>
          </button>
        </div>

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex w-fit items-center gap-1 rounded-lg bg-zinc-100 p-1">
            <button
              onClick={() => handleTabChange("products")}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeTab === "products"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>Ürünler ({products.length})</span>
            </button>

            <button
              onClick={() => handleTabChange("compartments")}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeTab === "compartments"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Raflar ({compartments.length})</span>
            </button>

            <button
              onClick={() => handleTabChange("cabinets")}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeTab === "cabinets"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Dolaplar ({cabinets.length})</span>
            </button>
          </div>

          <div className="relative max-w-xs flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Etiketler içinde ara..."
              className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pr-3 pl-8 text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
            />
            <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-zinc-400" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-2.5 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-700">
              Basılacak Seçilen:{" "}
              <strong className="text-zinc-900">{selectedCount}</strong> /{" "}
              {allItems.length}
            </span>

            <button
              onClick={handleSelectAll}
              className="ml-2 cursor-pointer text-xs font-medium text-zinc-900 hover:underline"
            >
              Tümünü Seç
            </button>
            <span className="text-zinc-300">|</span>
            <button
              onClick={handleClearSelection}
              className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-900"
            >
              Temizle
            </button>
          </div>

          <span className="hidden text-[11px] text-zinc-400 sm:inline">
            Etiketlere tıklayarak seçim yapabilirsiniz
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="no-print rounded-xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-400">
            Aramanıza uygun etiket bulunamadı.
          </div>
        ) : (
          <div className="print-sheet-grid grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-xs sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 print:grid-cols-2 print:gap-2 print:border-none print:p-0 print:shadow-none">
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
}
