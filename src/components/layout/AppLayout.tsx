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
    <div className="h-screen w-screen overflow-hidden bg-zinc-50 text-zinc-900 flex flex-col md:flex-row antialiased selection:bg-zinc-200">
      <aside className="no-print hidden md:flex flex-col w-60 h-screen bg-white border-r border-zinc-200 shrink-0 select-none z-30">
        <div className="h-14 px-4 flex items-center gap-2.5 border-b border-zinc-200 shrink-0">
          <img
            src="/favicon.svg"
            alt="MatrixLab"
            className="w-7 h-7 rounded-lg object-contain shrink-0"
          />
          <span className="font-semibold text-sm tracking-tight text-zinc-900">
            MatrixLab
          </span>
        </div>

        <div className="p-3 shrink-0">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-xs cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Kamera ile Tara</span>
          </button>
        </div>

        <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.to);
            return (
              <Link
                key={item.to}
                href={item.to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  active
                    ? "bg-zinc-100 text-zinc-900 font-semibold"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <Icon className="w-4 h-4 text-zinc-500" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-2.5 border-t border-zinc-200 space-y-2 shrink-0 bg-white">
          {user && (
            <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-200/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center shrink-0 text-xs font-medium">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 truncate leading-tight">
                    {user.name}
                  </p>
                  {user.email && (
                    <p
                      className="text-[10px] text-zinc-500 truncate leading-tight mt-0.5"
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
                className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="pt-1">
            <span className="text-[9px] text-zinc-400 font-medium px-1 uppercase tracking-wider block mb-1">
              Geliştirici
            </span>
            <a
              href="https://github.com/pxsty0/matrixlab"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/80 transition group text-xs"
            >
              <p className="font-semibold text-zinc-900 group-hover:text-zinc-600 leading-tight truncate">
                Mustafa KÖK
              </p>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 shrink-0 ml-1 transition" />
            </a>
            <p className="text-[10px] font-mono text-zinc-400 text-center mt-2">
              v{packageJson.version}
            </p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-y-auto pb-16 md:pb-0">
        <header
          className={`no-print bg-white border-b border-zinc-200 px-4 flex items-center justify-between gap-4 sticky top-0 z-20 shrink-0 transition-all ${
            isIOS ? "pt-7 h-[calc(3.5rem+1.75rem)] md:pt-0 md:h-14" : "h-14"
          }`}
        >
          <div className="md:hidden flex items-center gap-2">
            <img
              src="/favicon.svg"
              alt="MatrixLab"
              className="w-7 h-7 rounded-lg object-contain shrink-0"
            />
            <span className="font-bold text-sm tracking-tight text-zinc-900">
              MatrixLab
            </span>
          </div>

          <div className="flex-1 flex items-center justify-end gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsScannerOpen(true)}
                className="md:hidden p-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-xs font-medium flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span>Tara</span>
              </button>

              <button
                onClick={() => router.push("/products?new=true")}
                className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ürün Ekle</span>
              </button>

              <button
                onClick={handleLogout}
                title="Çıkış Yap"
                className="md:hidden p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      <div className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-sm">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.to);
          return (
            <Link
              key={item.to}
              href={item.to}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] transition ${
                active
                  ? "text-zinc-900 font-bold"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Icon className="w-4 h-4" />
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
