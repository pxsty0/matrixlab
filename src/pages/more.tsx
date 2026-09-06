import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataMatrixScannerModal } from '../components/scanner/DataMatrixScannerModal';
import packageJson from '../../package.json';

export default function MorePage() {
  const { user, logout } = useAuth();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-6">
      <div className="border-b border-zinc-200 pb-3">
        <h1 className="text-lg font-bold tracking-tight text-zinc-900">
          Diğer İşlemler
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Etiket basımı, kullanıcı yönetimi ve hızlı işlemler.
        </p>
      </div>

      {user && (
        <div className="p-3.5 bg-white rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-900 truncate">
                {user.name || user.username || 'Kullanıcı'}
              </p>
              {user.email && (
                <p className="text-xs text-zinc-500 truncate font-mono mt-0.5">
                  {user.email}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Çıkış</span>
          </button>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-1">
          Sayfalar & Araçlar
        </h2>

        <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100 shadow-xs overflow-hidden">
          <Link
            href="/labels"
            className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50 transition group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-zinc-900 group-hover:text-white transition">
                <Printer className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-zinc-900">
                  DataMatrix Etiket Basımı
                </h3>
                <p className="text-[11px] text-zinc-500 truncate">
                  Ürün, dolap ve raf DataMatrix etiketlerini yazdır
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 shrink-0" />
          </Link>

          {user?.role === 'admin' && (
            <Link
              href="/users"
              className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50 transition group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-zinc-900">
                    Kullanıcılar & Yetkiler
                  </h3>
                  <p className="text-[11px] text-zinc-500 truncate">
                    Personel hesapları ve yönetici rolleri
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 shrink-0" />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="w-full text-left p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-zinc-900 group-hover:text-white transition">
                <Camera className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-zinc-900">
                  Kamera ile DataMatrix Tara
                </h3>
                <p className="text-[11px] text-zinc-500 truncate">
                  Fiziksel etiketi okutarak ürün veya dolabı bul
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 shrink-0" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-1">
          Hızlı Kayıt
        </h2>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/products?new=true"
            className="p-3 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col gap-1 transition shadow-xs"
          >
            <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-xs">
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Yeni Ürün Ekle</span>
            </div>
            <span className="text-[10px] text-zinc-500">Stok kartı aç</span>
          </Link>

          <Link
            href="/storage"
            className="p-3 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col gap-1 transition shadow-xs"
          >
            <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-xs">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Dolap & Raf Yönetimi</span>
            </div>
            <span className="text-[10px] text-zinc-500">Yeni dolap veya raf ekle</span>
          </Link>
        </div>
      </div>

      <div className="pt-2">
        <a
          href="https://github.com/pxsty0/matrixlab"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between gap-2 transition group shadow-xs"
        >
          <div className="min-w-0">
            <span className="text-[10px] text-zinc-400 font-medium uppercase">
              Geliştirici
            </span>
            <p className="font-bold text-xs text-zinc-900 group-hover:text-zinc-700 truncate">
              Mustafa KÖK
            </p>
          </div>
          <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 shrink-0" />
        </a>
        <p className="text-center text-[11px] text-zinc-400 font-mono mt-3">
          v{packageJson.version}
        </p>
      </div>

      <DataMatrixScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
};
