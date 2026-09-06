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
      router.replace('/login');
    } else if (!loading && isAuthenticated && adminOnly && user?.role !== 'admin') {
      router.replace('/');
    }
  }, [loading, isAuthenticated, adminOnly, user?.role, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin text-zinc-600" />
        <span>Oturum kontrol ediliyor...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user?.role !== 'admin' && user?.role !== 'staff') {
    return (
      <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 max-w-md w-full shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7" />
          </div>

          <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
            Hesabınız Yetkilendirme Bekliyor
          </h2>

          <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
            Merhaba <strong>{user?.name || user?.email}</strong>, hesabınız başarıyla oluşturuldu. Ancak envanter verilerine erişebilmeniz için sistem yöneticinizin hesabınıza <strong>Personel (Staff)</strong> veya <strong>Yönetici (Admin)</strong> rolü ataması gerekmektedir.
          </p>

          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl my-5 text-[11px] text-zinc-500 font-mono">
            E-posta: {user?.email} <br />
            Mevcut Rol: <span className="font-semibold text-amber-700">user (Yetkisiz)</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              onClick={() => refreshUser()}
              className="w-full sm:w-auto px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Yetkiyi Yenile</span>
            </button>

            <button
              onClick={() => logout()}
              className="w-full sm:w-auto px-4 py-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-600 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (adminOnly && user?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
};
