import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Printer,
  ShieldCheck,
  Camera,
  Plus,
  LogOut,
  ExternalLink,
  User as UserIcon,
  ChevronRight,
  Layers,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { DataMatrixScannerModal } from "../components/scanner/DataMatrixScannerModal";
import packageJson from "../../package.json";

export default function MorePage() {
  const { user, logout } = useAuthStore();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-6">
      <div className="border-b border-zinc-200 pb-3">
        <h1 className="text-lg font-bold tracking-tight text-zinc-900">
          Diğer İşlemler
        </h1>
        <p className="mt-0.5 text-xs text-zinc-500">
          Etiket basımı, kullanıcı yönetimi ve hızlı işlemler.
        </p>
      </div>

      {user && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
              {user.name ? (
                user.name.charAt(0).toUpperCase()
              ) : (
                <UserIcon className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-zinc-900">
                {user.name || user.username || "Kullanıcı"}
              </p>
              {user.email && (
                <p className="mt-0.5 truncate font-mono text-xs text-zinc-500">
                  {user.email}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Çıkış</span>
          </button>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="px-1 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
          Sayfalar & Araçlar
        </h2>

        <div className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
          <Link
            href="/labels"
            className="group flex items-center justify-between gap-3 p-3.5 transition hover:bg-zinc-50"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800 transition group-hover:bg-zinc-900 group-hover:text-white">
                <Printer className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-zinc-900">
                  DataMatrix Etiket Basımı
                </h3>
                <p className="truncate text-[11px] text-zinc-500">
                  Ürün, dolap ve raf DataMatrix etiketlerini yazdır
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-zinc-700" />
          </Link>

          {user?.role === "admin" && (
            <Link
              href="/users"
              className="group flex items-center justify-between gap-3 p-3.5 transition hover:bg-zinc-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-200/60 bg-amber-50 text-amber-800 transition group-hover:bg-amber-600 group-hover:text-white">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-zinc-900">
                    Kullanıcılar & Yetkiler
                  </h3>
                  <p className="truncate text-[11px] text-zinc-500">
                    Personel hesapları ve yönetici rolleri
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-zinc-700" />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="group flex w-full cursor-pointer items-center justify-between gap-3 p-3.5 text-left transition hover:bg-zinc-50"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800 transition group-hover:bg-zinc-900 group-hover:text-white">
                <Camera className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-zinc-900">
                  Kamera ile DataMatrix Tara
                </h3>
                <p className="truncate text-[11px] text-zinc-500">
                  Fiziksel etiketi okutarak ürün veya dolabı bul
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-zinc-700" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="px-1 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
          Hızlı Kayıt
        </h2>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/products?new=true"
            className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-3 shadow-xs transition hover:bg-zinc-50"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
              <Plus className="h-3.5 w-3.5 text-emerald-600" />
              <span>Yeni Ürün Ekle</span>
            </div>
            <span className="text-[10px] text-zinc-500">Stok kartı aç</span>
          </Link>

          <Link
            href="/storage"
            className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-3 shadow-xs transition hover:bg-zinc-50"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
              <Layers className="h-3.5 w-3.5 text-blue-600" />
              <span>Dolap & Raf Yönetimi</span>
            </div>
            <span className="text-[10px] text-zinc-500">
              Yeni dolap veya raf ekle
            </span>
          </Link>
        </div>
      </div>

      <div className="pt-2">
        <a
          href="https://github.com/pxsty0/matrixlab"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-xs transition hover:bg-zinc-50"
        >
          <div className="min-w-0">
            <span className="text-[10px] font-medium text-zinc-400 uppercase">
              Geliştirici
            </span>
            <p className="truncate text-xs font-bold text-zinc-900 group-hover:text-zinc-700">
              Mustafa KÖK
            </p>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-zinc-600" />
        </a>
        <p className="mt-3 text-center font-mono text-[11px] text-zinc-400">
          v{packageJson.version}
        </p>
      </div>

      <DataMatrixScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
}
