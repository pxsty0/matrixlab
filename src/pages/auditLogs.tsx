import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Search,
  RefreshCw,
  User as UserIcon,
  Package,
  Layers,
  Archive,
  ShieldCheck,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  AlertCircle,
} from 'lucide-react';
import { AuditLogAPI } from '../services';
import { AuditLog } from '../types';

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AuditLogAPI.getAll({
        limit: 200,
      });
      setLogs(res.data);
    } catch (_e) {
      setError('Hareket kayıtları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((m) => {
    if (selectedType !== 'ALL') {
      if (selectedType === 'STOCK') {
        if (!['IN', 'OUT', 'TRANSFER'].includes(m.type) && (!m.change || m.change === 0)) return false;
      } else if (selectedType === 'PRODUCT') {
        if (!m.type.startsWith('PRODUCT_')) return false;
      } else if (selectedType === 'STORAGE') {
        if (!m.type.startsWith('CABINET_') && !m.type.startsWith('COMPARTMENT_')) return false;
      } else if (selectedType === 'USER') {
        if (!m.type.startsWith('USER_')) return false;
      } else if (m.type !== selectedType) {
        return false;
      }
    }

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.details.toLowerCase().includes(q) ||
      m.actorName.toLowerCase().includes(q) ||
      m.actorEmail.toLowerCase().includes(q) ||
      m.type.toLowerCase().includes(q)
    );
  });

  const getLogBadge = (type: string) => {
    switch (type) {
      case 'IN':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ArrowDownRight className="w-3 h-3 text-emerald-600" />
            STOK GİRİŞ (+)
          </span>
        );
      case 'OUT':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
            <ArrowUpRight className="w-3 h-3 text-rose-600" />
            STOK ÇIKIŞ (-)
          </span>
        );
      case 'TRANSFER':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
            <ArrowRightLeft className="w-3 h-3 text-blue-600" />
            RAF TAŞIMA
          </span>
        );
      case 'PRODUCT_CREATE':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Package className="w-3 h-3 text-emerald-600" />
            YENİ ÜRÜN
          </span>
        );
      case 'PRODUCT_UPDATE':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
            <Package className="w-3 h-3 text-sky-600" />
            ÜRÜN GÜNCELLEME
          </span>
        );
      case 'PRODUCT_DELETE':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
            <Package className="w-3 h-3 text-rose-600" />
            ÜRÜN SİLİNDİ
          </span>
        );
      case 'CABINET_CREATE':
      case 'CABINET_UPDATE':
      case 'CABINET_DELETE':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-300">
            <Archive className="w-3 h-3 text-zinc-600" />
            {type === 'CABINET_CREATE' ? 'YENİ DOLAP' : type === 'CABINET_UPDATE' ? 'DOLAP DÜZENLE' : 'DOLAP SİLİNDİ'}
          </span>
        );
      case 'COMPARTMENT_CREATE':
      case 'COMPARTMENT_UPDATE':
      case 'COMPARTMENT_DELETE':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-300">
            <Layers className="w-3 h-3 text-zinc-600" />
            {type === 'COMPARTMENT_CREATE' ? 'YENİ BÖLME' : type === 'COMPARTMENT_UPDATE' ? 'BÖLME DÜZENLE' : 'BÖLME SİLİNDİ'}
          </span>
        );
      case 'USER_ROLE_CHANGE':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
            <ShieldCheck className="w-3 h-3 text-amber-600" />
            YETKİ DEĞİŞİMİ
          </span>
        );
      case 'USER_UPDATE':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
            <ShieldCheck className="w-3 h-3 text-sky-600" />
            KULLANICI GÜNCELLEME
          </span>
        );
      case 'USER_CREATE':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            YENİ KULLANICI
          </span>
        );
      case 'USER_DELETE':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
            <ShieldCheck className="w-3 h-3 text-rose-600" />
            KULLANICI SİLİNDİ
          </span>
        );
      default:
        return (
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">
            Denetim ve İşlem Günlüğü
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Stok giriş-çıkışları, zimmet, transfer ve tüm sistem eylemlerinin merkezi denetim kaydı.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="py-1.5 px-3 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-medium border border-zinc-200 shadow-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </button>
      </div>

      <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İşlem detayı, kullanıcı adı veya e-posta ara..."
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
        </div>

        <div className="flex items-center gap-0.5 bg-zinc-100 p-0.5 rounded-lg w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'Tümü' },
            { id: 'STOCK', label: 'Stok Hareketleri' },
            { id: 'PRODUCT', label: 'Ürün İşlemleri' },
            { id: 'STORAGE', label: 'Dolap / Raf' },
            { id: 'USER', label: 'Kullanıcı & Yetki' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition shrink-0 cursor-pointer ${
                selectedType === tab.id
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-zinc-500 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-zinc-600" />
          <span>Yükleniyor...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500">
          <AlertCircle className="w-6 h-6 text-rose-500" />
          <p className="text-sm text-zinc-700">{error}</p>
          <button onClick={fetchLogs} className="text-xs text-blue-600 hover:underline">Tekrar Dene</button>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-zinc-200 text-zinc-400 text-xs">
          Kriterlere uygun hareket kaydı bulunamadı.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[10px] font-semibold uppercase">
                <tr>
                  <th className="p-3 whitespace-nowrap">Tarih</th>
                  <th className="p-3 whitespace-nowrap">İşlem Türü</th>
                  <th className="p-3 text-right whitespace-nowrap">Değişim</th>
                  <th className="p-3 whitespace-nowrap">İşlemi Yapan</th>
                  <th className="p-3">Detay ve Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {filteredLogs.map((log) => {
                  const hasChange = typeof log.change === 'number' && log.change !== 0;
                  const isPositive = (log.change ?? 0) > 0;
                  const formattedDate = new Date(log.createdAt).toLocaleString(
                    'tr-TR',
                    {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  );

                  return (
                    <tr
                      key={log.id}
                      onClick={() =>
                        log.productId && router.push(`/products/detail?id=${log.productId}`)
                      }
                      className={`hover:bg-zinc-50/80 transition ${
                        log.productId ? 'cursor-pointer' : ''
                      }`}
                    >
                      <td className="p-3 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {getLogBadge(log.type)}
                      </td>

                      <td className="p-3 text-right font-mono font-bold whitespace-nowrap">
                        {hasChange ? (
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs ${
                              isPositive
                                ? 'text-emerald-700 bg-emerald-50'
                                : 'text-rose-700 bg-rose-50'
                            }`}
                          >
                            {isPositive ? `+${log.change}` : log.change} adet
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-normal">—</span>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {log.actorEmail || log.actorName ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-[11px] text-zinc-800">
                            <UserIcon className="w-3 h-3 text-zinc-500 shrink-0" />
                            <span className="font-medium font-mono truncate max-w-[160px]">
                              {log.actorName || log.actorEmail}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-400 font-mono">-</span>
                        )}
                      </td>

                      <td className="p-3 text-zinc-800 text-xs break-words max-w-xl font-normal leading-relaxed">
                        {log.details || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
