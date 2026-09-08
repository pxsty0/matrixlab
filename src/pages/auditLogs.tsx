import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
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
} from "lucide-react";
import { AuditLogAPI } from "../services";
import { AuditLog } from "../types";

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AuditLogAPI.getAll({
        limit: 200,
      });
      setLogs(res.data);
    } catch (_e) {
      setError("Hareket kayıtları yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((m) => {
    if (selectedType !== "ALL") {
      if (selectedType === "STOCK") {
        if (
          !["IN", "OUT", "TRANSFER"].includes(m.type) &&
          (!m.change || m.change === 0)
        )
          return false;
      } else if (selectedType === "PRODUCT") {
        if (!m.type.startsWith("PRODUCT_")) return false;
      } else if (selectedType === "STORAGE") {
        if (
          !m.type.startsWith("CABINET_") &&
          !m.type.startsWith("COMPARTMENT_")
        )
          return false;
      } else if (selectedType === "USER") {
        if (!m.type.startsWith("USER_")) return false;
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
      case "IN":
        return (
          <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
            <ArrowDownRight className="h-3 w-3 text-emerald-600" />
            STOK GİRİŞ (+)
          </span>
        );
      case "OUT":
        return (
          <span className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-800">
            <ArrowUpRight className="h-3 w-3 text-rose-600" />
            STOK ÇIKIŞ (-)
          </span>
        );
      case "TRANSFER":
        return (
          <span className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-800">
            <ArrowRightLeft className="h-3 w-3 text-blue-600" />
            RAF TAŞIMA
          </span>
        );
      case "PRODUCT_CREATE":
        return (
          <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
            <Package className="h-3 w-3 text-emerald-600" />
            YENİ ÜRÜN
          </span>
        );
      case "PRODUCT_UPDATE":
        return (
          <span className="inline-flex items-center gap-1 rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-sky-800">
            <Package className="h-3 w-3 text-sky-600" />
            ÜRÜN GÜNCELLEME
          </span>
        );
      case "PRODUCT_DELETE":
        return (
          <span className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-800">
            <Package className="h-3 w-3 text-rose-600" />
            ÜRÜN SİLİNDİ
          </span>
        );
      case "CABINET_CREATE":
      case "CABINET_UPDATE":
      case "CABINET_DELETE":
        return (
          <span className="inline-flex items-center gap-1 rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-800">
            <Archive className="h-3 w-3 text-zinc-600" />
            {type === "CABINET_CREATE"
              ? "YENİ DOLAP"
              : type === "CABINET_UPDATE"
                ? "DOLAP DÜZENLE"
                : "DOLAP SİLİNDİ"}
          </span>
        );
      case "COMPARTMENT_CREATE":
      case "COMPARTMENT_UPDATE":
      case "COMPARTMENT_DELETE":
        return (
          <span className="inline-flex items-center gap-1 rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-800">
            <Layers className="h-3 w-3 text-zinc-600" />
            {type === "COMPARTMENT_CREATE"
              ? "YENİ BÖLME"
              : type === "COMPARTMENT_UPDATE"
                ? "BÖLME DÜZENLE"
                : "BÖLME SİLİNDİ"}
          </span>
        );
      case "USER_ROLE_CHANGE":
        return (
          <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-800">
            <ShieldCheck className="h-3 w-3 text-amber-600" />
            YETKİ DEĞİŞİMİ
          </span>
        );
      case "USER_UPDATE":
        return (
          <span className="inline-flex items-center gap-1 rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-sky-800">
            <ShieldCheck className="h-3 w-3 text-sky-600" />
            KULLANICI GÜNCELLEME
          </span>
        );
      case "USER_CREATE":
        return (
          <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            YENİ KULLANICI
          </span>
        );
      case "USER_DELETE":
        return (
          <span className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-800">
            <ShieldCheck className="h-3 w-3 text-rose-600" />
            KULLANICI SİLİNDİ
          </span>
        );
      default:
        return (
          <span className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-700">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
            Denetim ve İşlem Günlüğü
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Stok giriş-çıkışları, zimmet, transfer ve tüm sistem eylemlerinin
            merkezi denetim kaydı.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-xs transition hover:bg-zinc-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          <span>Yenile</span>
        </button>
      </div>

      <div className="flex flex-col items-center gap-2.5 rounded-xl border border-zinc-200 bg-white p-3 shadow-xs sm:flex-row">
        <div className="relative w-full flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İşlem detayı, kullanıcı adı veya e-posta ara..."
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pr-3 pl-8 text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
          />
          <Search className="absolute top-2 left-2.5 h-3.5 w-3.5 text-zinc-400" />
        </div>

        <div className="flex w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-zinc-100 p-0.5 sm:w-auto">
          {[
            { id: "ALL", label: "Tümü" },
            { id: "STOCK", label: "Stok Hareketleri" },
            { id: "PRODUCT", label: "Ürün İşlemleri" },
            { id: "STORAGE", label: "Dolap / Raf" },
            { id: "USER", label: "Kullanıcı & Yetki" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`shrink-0 cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition ${
                selectedType === tab.id
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-xs text-zinc-500">
          <RefreshCw className="h-5 w-5 animate-spin text-zinc-600" />
          <span>Yükleniyor...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-500">
          <AlertCircle className="h-6 w-6 text-rose-500" />
          <p className="text-sm text-zinc-700">{error}</p>
          <button
            onClick={fetchLogs}
            className="text-xs text-blue-600 hover:underline"
          >
            Tekrar Dene
          </button>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-400">
          Kriterlere uygun hareket kaydı bulunamadı.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-semibold text-zinc-500 uppercase">
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
                    <tr
                      key={log.id}
                      onClick={() =>
                        log.productId &&
                        router.push(`/products/detail?id=${log.productId}`)
                      }
                      className={`transition hover:bg-zinc-50/80 ${
                        log.productId ? "cursor-pointer" : ""
                      }`}
                    >
                      <td className="p-3 font-mono text-[11px] whitespace-nowrap text-zinc-500">
                        {formattedDate}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {getLogBadge(log.type)}
                      </td>

                      <td className="p-3 text-right font-mono font-bold whitespace-nowrap">
                        {hasChange ? (
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs ${
                              isPositive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {isPositive ? `+${log.change}` : log.change} adet
                          </span>
                        ) : (
                          <span className="font-normal text-zinc-400">—</span>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {log.actorEmail || log.actorName ? (
                          <div className="inline-flex items-center gap-1.5 rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-800">
                            <UserIcon className="h-3 w-3 shrink-0 text-zinc-500" />
                            <span className="max-w-[160px] truncate font-mono font-medium">
                              {log.actorName || log.actorEmail}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-[11px] text-zinc-400">
                            -
                          </span>
                        )}
                      </td>

                      <td className="max-w-xl p-3 text-xs leading-relaxed font-normal break-words text-zinc-800">
                        {log.details || "-"}
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
