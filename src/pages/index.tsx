import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import {
  Package,
  Layers,
  Archive,
  Boxes,
  RefreshCw,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { AuditLogAPI, ProductAPI } from "../services";
import { DashboardStats, Product } from "../types";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const prodsData = await ProductAPI.getAll();
      const statsData = await AuditLogAPI.getStats(prodsData);
      setStats(statsData);
      setProducts(prodsData);
    } catch (_e) {
      setError("Veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-xs text-zinc-500">
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
          onClick={fetchStats}
          className="text-xs text-blue-600 hover:underline"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200 pb-3">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
          Genel Bakış
        </h1>
        <p className="mt-0.5 text-xs text-zinc-500">
          Atölye envanter seviyeleri, dolap yerleşimleri ve son stok
          hareketleri.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div
          onClick={() => router.push("/products")}
          className="cursor-pointer rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition hover:border-zinc-300"
        >
          <div className="mb-2 flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Toplam Çeşit</span>
            <Package className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-zinc-900">
              {stats?.totalProducts ?? "—"}
            </span>
            <span className="text-[11px] text-zinc-500">ürün</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">Envanteri listele ➔</p>
        </div>

        <div
          onClick={() => router.push("/products")}
          className="cursor-pointer rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition hover:border-zinc-300"
        >
          <div className="mb-2 flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Toplam Stok</span>
            <Boxes className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-zinc-900">
              {stats?.totalStockQuantity ?? "—"}
            </span>
            <span className="text-[11px] text-zinc-500">adet</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">Mevcut malzeme adedi</p>
        </div>

        <div
          onClick={() => router.push("/storage")}
          className="cursor-pointer rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition hover:border-zinc-300"
        >
          <div className="mb-2 flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Toplam Dolap</span>
            <Archive className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-zinc-900">
              {stats?.totalCabinets ?? "—"}
            </span>
            <span className="text-[11px] text-zinc-500">dolap</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">Dolapları yönet ➔</p>
        </div>

        <div
          onClick={() => router.push("/storage")}
          className="cursor-pointer rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition hover:border-zinc-300"
        >
          <div className="mb-2 flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium">Toplam Bölme / Raf</span>
            <Layers className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-zinc-900">
              {stats?.totalCompartments ?? "—"}
            </span>
            <span className="text-[11px] text-zinc-500">bölme</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            Raf düzenini incele ➔
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-zinc-200 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-zinc-900" />
              <h2 className="text-xs font-semibold tracking-wider text-zinc-900 uppercase">
                Kayıtlı Malzemeler
              </h2>
            </div>
            <button
              onClick={() => router.push("/products")}
              className="flex cursor-pointer items-center gap-0.5 text-xs text-zinc-500 transition hover:text-zinc-900"
            >
              <span>Tümü ({products.length})</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="max-h-80 flex-1 divide-y divide-zinc-100 overflow-y-auto">
            {products && products.length > 0 ? (
              products.slice(0, 6).map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => router.push(`/products/detail?id=${prod.id}`)}
                  className="flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 transition hover:bg-zinc-50/70"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    {prod.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="h-8 w-8 shrink-0 rounded-md border border-zinc-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-400">
                        <Package className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-zinc-900">
                        {prod.name}
                      </p>
                      <p className="truncate font-mono text-[10px] text-zinc-400">
                        {prod.compartment?.cabinet?.code
                          ? `${prod.compartment.cabinet.code} / `
                          : ""}
                        {prod.compartmentCode || prod.compartment?.code || ""}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="font-mono text-xs font-bold text-zinc-900">
                      {prod.quantity} adet
                    </div>
                    <div className="font-mono text-[10px] text-zinc-400">
                      {prod.sku}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-zinc-400">
                Kayıtlı ürün bulunmuyor.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-xl border border-zinc-200 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-zinc-400" />
              <h2 className="text-xs font-semibold tracking-wider text-zinc-900 uppercase">
                Son Stok Hareketleri
              </h2>
            </div>
            <button
              onClick={() => router.push("/auditLogs")}
              className="flex items-center gap-0.5 text-xs text-zinc-500 transition hover:text-zinc-900"
            >
              <span>Geçmiş</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="max-h-80 flex-1 divide-y divide-zinc-100 overflow-y-auto">
            {stats?.recentMovements && stats.recentMovements.length > 0 ? (
              stats.recentMovements.slice(0, 6).map((log) => {
                const hasChange =
                  typeof log.change === "number" && log.change !== 0;
                const isPositive = (log.change ?? 0) > 0;
                return (
                  <div
                    key={log.id}
                    onClick={() =>
                      log.productId &&
                      router.push(`/products/detail?id=${log.productId}`)
                    }
                    className={`flex items-center justify-between gap-2 px-4 py-2.5 transition hover:bg-zinc-50/70 ${
                      log.productId ? "cursor-pointer" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-zinc-900">
                        {log.details}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-zinc-400">
                        {log.actorName || log.actorEmail || "Sistem"} •{" "}
                        {new Date(log.createdAt).toLocaleDateString("tr-TR")}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {hasChange ? (
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-xs font-semibold ${
                            isPositive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {isPositive ? `+${log.change}` : log.change}
                        </span>
                      ) : (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-zinc-700">
                          {log.type}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-zinc-400">
                Kayıtlı stok hareketi bulunmuyor.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
