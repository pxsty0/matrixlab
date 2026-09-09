import React, { useState } from "react";
import { useRouter } from "next/router";
import {
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  ArrowRight,
  UserPlus,
  LogIn,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuthStore();

  const from = typeof router.query.from === "string" ? router.query.from : "/";

  const [mode, setMode] = useState<"login" | "register">("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePerformLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Lütfen e-posta adresinizi ve şifrenizi girin.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login({ email: email.trim(), password: password.trim() });
      router.replace(from);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Giriş yapılamadı. Bilgilerinizi kontrol edin.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePerformRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Lütfen adınızı, e-postanızı ve şifrenizi eksiksiz girin.");
      return;
    }

    if (password.length < 6) {
      setError("Şifreniz en az 6 karakter olmalıdır.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Girdiğiniz şifreler birbiriyle eşleşmiyor.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
      });
      router.replace(from);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kayıt işlemi başarısız.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mode === "login") {
      handlePerformLogin();
    } else {
      handlePerformRegister();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] text-zinc-900 antialiased selection:bg-zinc-200">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <img
            src="/favicon.svg"
            alt="MatrixLab"
            className="h-12 w-12 rounded-xl object-contain shadow-xs"
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              MatrixLab
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              Atölye ve laboratuvar envanter yönetim sistemi
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 rounded-xl bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition ${
              mode === "login"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Giriş Yap</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition ${
              mode === "register"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Kayıt Ol</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-3.5"
          noValidate={false}
        >
          {mode === "register" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Ad Soyad
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ad Soyad"
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pr-3 pl-9 text-xs transition focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
                <UserIcon className="absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              E-posta Adresi
            </label>
            <div className="relative">
              <input
                type="email"
                required
                autoFocus={mode === "login"}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pr-3 pl-9 text-xs transition focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none"
              />
              <Mail className="absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Şifre
            </label>
            <div className="relative">
              <input
                type="password"
                required
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pr-3 pl-9 text-xs transition focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none"
              />
              <Lock className="absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Şifre Tekrarı
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pr-3 pl-9 text-xs transition focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
                <Lock className="absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-xs font-medium text-white shadow-xs transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span>İşlem yapılıyor...</span>
            ) : mode === "login" ? (
              <>
                <span>Sisteme Giriş Yap</span>
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Hesap Oluştur</span>
                <UserPlus className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {mode === "register" && (
          <p className="text-center text-[11px] leading-relaxed text-zinc-400">
            Yeni kayıtlar varsayılan olarak yetkisiz oluşturulur. Giriş
            yaptıktan sonra sistem yöneticinizin rol atamasını beklemeniz
            gerekir.
          </p>
        )}
      </div>
    </div>
  );
}
