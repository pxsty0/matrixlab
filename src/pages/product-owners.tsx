import React from "react";
import { AlertTriangle, Users } from "lucide-react";
import { PRODUCT_OWNERS } from "../config/constants";

export default function ProductOwnersPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
              Ürün Sahipleri (Product Owners)
            </h1>
            <span className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-[10px] text-zinc-600">
              {PRODUCT_OWNERS.length} Kayıt
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            Sistemdeki ürün sahiplerinin listesi.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-xs">
            <p className="mb-1 text-sm font-semibold">Önemli Uyarı</p>
            <p>
              Bu listedeki veriler şu anda <strong>statik olarak</strong> (
              <code>src/config/constants.ts</code> dosyasında) tanımlanmıştır.
              Yeni bir Product Owner eklemek veya mevcut bir kaydı güncellemek
              için bu dosyayı manuel olarak güncellemeniz ve ayrıca Firebase
              konfigürasyonunda gerekli yetkilendirme/rol tanımlamalarını
              yapmanız gerekmektedir.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50/80 font-medium text-zinc-500 select-none">
              <tr>
                <th className="px-3 py-2.5">Logo</th>
                <th className="px-3 py-2.5">İsim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70">
              {PRODUCT_OWNERS.map((owner, idx) => (
                <tr key={idx} className="transition hover:bg-zinc-50/60">
                  <td className="w-16 px-3 py-3">
                    <img
                      src={owner.logo}
                      alt={owner.name}
                      className="h-8 w-8"
                    />
                  </td>
                  <td className="px-3 py-3 font-medium text-zinc-900">
                    {owner.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
