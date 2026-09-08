import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { RefreshCw, Clock, LogOut } from "lucide-react";

export const ProtectedRoute = ({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) => {
  const { user, isAuthenticated, loading, logout, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    } else if (
      !loading &&
      isAuthenticated &&
      adminOnly &&
      user?.role !== "admin"
    ) {
      router.replace("/");
    }
  }, [loading, isAuthenticated, adminOnly, user?.role, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-zinc-50 text-xs text-zinc-500">
        <RefreshCw className="h-5 w-5 animate-spin text-zinc-600" />
        <span>Oturum kontrol ediliyor...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user?.role !== "admin" && user?.role !== "staff") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 p-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600">
            <Clock className="h-7 w-7" />
          </div>

          <h2 className="text-base font-semibold tracking-tight text-zinc-900">
            Hesabınız Yetkilendirme Bekliyor
          </h2>

          <p className="mt-2 text-xs leading-relaxed text-zinc-600">
            Merhaba <strong>{user?.name || user?.email}</strong>, hesabınız
            başarıyla oluşturuldu. Ancak envanter verilerine erişebilmeniz için
            sistem yöneticinizin hesabınıza <strong>Personel (Staff)</strong>{" "}
            veya <strong>Yönetici (Admin)</strong> rolü ataması gerekmektedir.
          </p>

          <div className="my-5 rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-[11px] text-zinc-500">
            E-posta: {user?.email} <br />
            Mevcut Rol:{" "}
            <span className="font-semibold text-amber-700">
              user (Yetkisiz)
            </span>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
            <button
              onClick={() => refreshUser()}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-zinc-800 active:scale-[0.98] sm:w-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Yetkiyi Yenile</span>
            </button>

            <button
              onClick={() => logout()}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 sm:w-auto"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (adminOnly && user?.role !== "admin") {
    return null;
  }

  return <>{children}</>;
};
