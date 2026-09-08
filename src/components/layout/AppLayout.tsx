import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Capacitor } from "@capacitor/core";
import {
  LayoutGrid,
  Package,
  Layers,
  Camera,
  Printer,
  History,
  Plus,
  ExternalLink,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Menu,
} from "lucide-react";
import { DataMatrixScannerModal } from "../scanner/DataMatrixScannerModal";
import { useAuth } from "../../context/AuthContext";
import packageJson from "../../../package.json";

export const AppLayout = ({ children }: { children?: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (Capacitor.getPlatform() === "ios") {
      setIsIOS(true);
      return;
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const desktopNavItems = [
    {
      to: "/",
      label: "Genel Bakış",
      icon: LayoutGrid,
    },
    {
      to: "/products",
      label: "Envanter & Ürünler",
      icon: Package,
    },
    {
      to: "/storage",
      label: "Dolap & Raflar",
      icon: Layers,
    },
    {
      to: "/labels",
      label: "Etiket Basımı",
      icon: Printer,
    },
    {
      to: "/auditLogs",
      label: "Denetim Günlüğü",
      icon: History,
    },
    ...(user?.role === "admin"
      ? [
          {
            to: "/users",
            label: "Kullanıcılar",
            icon: ShieldCheck,
          },
        ]
      : []),
  ];

  const mobileNavItems = [
    {
      to: "/",
      label: "Genel Bakış",
      icon: LayoutGrid,
    },
    {
      to: "/products",
      label: "Ürünler",
      icon: Package,
    },
    {
      to: "/storage",
      label: "Dolaplar",
      icon: Layers,
    },
    {
      to: "/auditLogs",
      label: "Denetim",
      icon: History,
    },
    {
      to: "/more",
      label: "Diğer",
      icon: Menu,
    },
  ];

  const isItemActive = (to: string) => {
    if (to === "/") return router.pathname === "/";
    return router.pathname === to || router.pathname.startsWith(`${to}/`);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-50 text-zinc-900 antialiased selection:bg-zinc-200 md:flex-row">
      <aside className="no-print z-30 hidden h-screen w-60 shrink-0 flex-col border-r border-zinc-200 bg-white select-none md:flex">
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-zinc-200 px-4">
          <img
            src="/favicon.svg"
            alt="MatrixLab"
            className="h-7 w-7 shrink-0 rounded-lg object-contain"
          />
          <span className="text-sm font-semibold tracking-tight text-zinc-900">
            MatrixLab
          </span>
        </div>

        <div className="shrink-0 p-3">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-zinc-800 active:scale-[0.98]"
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Kamera ile Tara</span>
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-1">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.to);
            return (
              <Link
                key={item.to}
                href={item.to}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  active
                    ? "bg-zinc-100 font-semibold text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <Icon className="h-4 w-4 text-zinc-500" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-2 border-t border-zinc-200 bg-white p-2.5">
          {user && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50 p-2">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-700">
                  <UserIcon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs leading-tight font-semibold text-zinc-900">
                    {user.name}
                  </p>
                  {user.email && (
                    <p
                      className="mt-0.5 truncate text-[10px] leading-tight text-zinc-500"
                      title={user.email}
                    >
                      {user.email}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Çıkış Yap"
                className="shrink-0 cursor-pointer rounded p-1 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="pt-1">
            <span className="mb-1 block px-1 text-[9px] font-medium tracking-wider text-zinc-400 uppercase">
              Geliştirici
            </span>
            <a
              href="https://github.com/pxsty0/matrixlab"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-lg border border-zinc-200/80 bg-zinc-50 px-2.5 py-2 text-xs transition hover:bg-zinc-100/80"
            >
              <p className="truncate leading-tight font-semibold text-zinc-900 group-hover:text-zinc-600">
                Mustafa KÖK
              </p>
              <ExternalLink className="ml-1 h-3.5 w-3.5 shrink-0 text-zinc-400 transition group-hover:text-zinc-600" />
            </a>
            <p className="mt-2 text-center font-mono text-[10px] text-zinc-400">
              v{packageJson.version}
            </p>
          </div>
        </div>
      </aside>

      <div className="flex h-screen flex-1 flex-col overflow-y-auto pb-16 md:pb-0">
        <header
          className={`no-print sticky top-0 z-20 flex shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 transition-all ${
            isIOS ? "h-[calc(3.5rem+1.75rem)] pt-7 md:h-14 md:pt-0" : "h-14"
          }`}
        >
          <div className="flex items-center gap-2 md:hidden">
            <img
              src="/favicon.svg"
              alt="MatrixLab"
              className="h-7 w-7 shrink-0 rounded-lg object-contain"
            />
            <span className="text-sm font-bold tracking-tight text-zinc-900">
              MatrixLab
            </span>
          </div>

          <div className="flex flex-1 items-center justify-end gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 p-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 md:hidden"
              >
                <Camera className="h-4 w-4" />
                <span>Tara</span>
              </button>

              <button
                onClick={() => router.push("/products?new=true")}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ürün Ekle</span>
              </button>

              <button
                onClick={handleLogout}
                title="Çıkış Yap"
                className="rounded-lg border border-zinc-200 p-1.5 text-zinc-600 transition hover:bg-rose-50 hover:text-rose-600 md:hidden"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>

      <div className="no-print fixed right-0 bottom-0 left-0 z-40 flex items-center justify-around border-t border-zinc-200 bg-white/95 px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] shadow-sm backdrop-blur-md md:hidden">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.to);
          return (
            <Link
              key={item.to}
              href={item.to}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] transition ${
                active
                  ? "font-bold text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <DataMatrixScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
};
