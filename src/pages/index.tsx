import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Package,
  Layers,
  Archive,
  Boxes,
  RefreshCw,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { AuditLogAPI, ProductAPI } from '../services';
import { DashboardStats, Product } from '../types';

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
      setError('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2 text-zinc-500 text-xs">
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
        <button onClick={fetchStats} className="text-xs text-blue-600 hover:underline">Tekrar Dene</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200 pb-3">
        <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">
          Genel Bakış
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Atölye envanter seviyeleri, dolap yerleşimleri ve son stok hareketleri.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => router.push('/products')}
          className="bg-white p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 transition cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Toplam Çeşit</span>
            <Package className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-zinc-900">
              {stats?.totalProducts ?? '—'}
            </span>
            <span className="text-[11px] text-zinc-500">ürün</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Envanteri listele ➔
          </p>
        </div>

        <div
          onClick={() => router.push('/products')}
          className="bg-white p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 transition cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Toplam Stok</span>
            <Boxes className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-zinc-900">
              {stats?.totalStockQuantity ?? '—'}
            </span>
            <span className="text-[11px] text-zinc-500">adet</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Mevcut malzeme adedi
          </p>
        </div>

        <div
          onClick={() => router.push('/storage')}
          className="bg-white p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 transition cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Toplam Dolap</span>
            <Archive className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-zinc-900">
              {stats?.totalCabinets ?? '—'}
            </span>
            <span className="text-[11px] text-zinc-500">dolap</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Dolapları yönet ➔
          </p>
        </div>

        <div
          onClick={() => router.push('/storage')}
          className="bg-white p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 transition cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Toplam Bölme / Raf</span>
            <Layers className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-zinc-900">
              {stats?.totalCompartments ?? '—'}
            </span>
            <span className="text-[11px] text-zinc-500">bölme</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Raf düzenini incele ➔
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs flex flex-col">
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-900" />
              <h2 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                Kayıtlı Malzemeler
              </h2>
            </div>
            <button
              onClick={() => router.push('/products')}
              className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-0.5 transition cursor-pointer"
            >
              <span>Tümü ({products.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 divide-y divide-zinc-100 overflow-y-auto max-h-80">
            {products && products.length > 0 ? (
              products.slice(0, 6).map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => router.push(`/products/detail?id=${prod.id}`)}
                  className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-zinc-50/70 cursor-pointer transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {prod.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-8 h-8 rounded-md object-cover border border-zinc-200 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-900 truncate">
                        {prod.name}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-400 truncate">
                        {prod.compartment?.cabinet?.code ? `${prod.compartment.cabinet.code} / ` : ''}{prod.compartmentCode || prod.compartment?.code || ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold font-mono text-zinc-900">
                      {prod.quantity} adet
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400">
                      {prod.sku}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-zinc-400 text-xs">
                Kayıtlı ürün bulunmuyor.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs flex flex-col">
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              <h2 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                Son Stok Hareketleri
              </h2>
            </div>
            <button
              onClick={() => router.push('/auditLogs')}
              className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-0.5 transition"
            >
              <span>Geçmiş</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 divide-y divide-zinc-100 overflow-y-auto max-h-80">
            {stats?.recentMovements && stats.recentMovements.length > 0 ? (
              stats.recentMovements.slice(0, 6).map((log) => {
                const hasChange = typeof log.change === 'number' && log.change !== 0;
                const isPositive = (log.change ?? 0) > 0;
                return (
                  <div
                    key={log.id}
                    onClick={() =>
                      log.productId &&
                      router.push(`/products/detail?id=${log.productId}`)
                    }
                    className={`px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-zinc-50/70 transition ${
                      log.productId ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-900 truncate">
                        {log.details}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                        {log.actorName || log.actorEmail || 'Sistem'} • {new Date(log.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {hasChange ? (
                        <span
                          className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                            isPositive
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-rose-700 bg-rose-50'
                          }`}
                        >
                          {isPositive ? `+${log.change}` : log.change}
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                          {log.type}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-zinc-400 text-xs">
                Kayıtlı stok hareketi bulunmuyor.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
