import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Lock, Mail, User as UserIcon, AlertCircle, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();

  const from = typeof router.query.from === 'string' ? router.query.from : '/';

  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePerformLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Lütfen e-posta adresinizi ve şifrenizi girin.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login({ email: email.trim(), password: password.trim() });
      router.replace(from);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handlePerformRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Lütfen adınızı, e-postanızı ve şifrenizi eksiksiz girin.');
      return;
    }

    if (password.length < 6) {
      setError('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
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
      setError(err instanceof Error ? err.message : 'Kayıt işlemi başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mode === 'login') {
      handlePerformLogin();
    } else {
      handlePerformRegister();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] antialiased text-zinc-900 selection:bg-zinc-200">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <img
            src="/favicon.svg"
            alt="MatrixLab"
            className="w-12 h-12 rounded-xl object-contain shadow-xs"
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              MatrixLab
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Atölye ve laboratuvar envanter yönetim sistemi
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 p-1 bg-zinc-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Giriş Yap</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Kayıt Ol</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate={false}>
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
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
                  className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 focus:bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
                />
                <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              E-posta Adresi
            </label>
            <div className="relative">
              <input
                type="email"
                required
                autoFocus={mode === 'login'}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 focus:bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
              />
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Şifre
            </label>
            <div className="relative">
              <input
                type="password"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 focus:bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
              />
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
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
                  className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 focus:bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 shadow-xs cursor-pointer"
          >
            {loading ? (
              <span>İşlem yapılıyor...</span>
            ) : mode === 'login' ? (
              <>
                <span>Sisteme Giriş Yap</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Hesap Oluştur</span>
                <UserPlus className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {mode === 'register' && (
          <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
            Yeni kayıtlar varsayılan olarak yetkisiz oluşturulur. Giriş yaptıktan sonra sistem yöneticinizin rol atamasını beklemeniz gerekir.
          </p>
        )}
      </div>
    </div>
  );
};
