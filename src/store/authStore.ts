import { create } from "zustand";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../lib/firebase";
import { UserAPI } from "../services";
import { User } from "../types";
import { toast } from "react-toastify";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: {
    email: string;
    name: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  initializeAuth: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  refreshUser: async () => {
    if (!auth.currentUser) return;
    try {
      const profile = await UserAPI.getProfile(
        auth.currentUser.uid,
        auth.currentUser.email,
      );
      if (profile) {
        set((state) => ({
          user: state.user ? { ...state.user, ...profile } : null,
          isAuthenticated: true,
        }));
        toast.success("Yetki bilgileri güncellendi.");
      } else {
        set({ user: null, isAuthenticated: false });
        toast.error("Kullanıcı profili bulunamadı.");
      }
    } catch (err: any) {
      set({ user: null, isAuthenticated: false });
      toast.error("Yetki yenileme hatası: " + (err?.message || ""));
    }
  },

  initializeAuth: () => {
    if (!isFirebaseConfigured()) {
      toast.error(
        "Firebase yapılandırması eksik (.env dosyasını kontrol edin).",
      );
      set({ loading: false });
      return () => {};
    }

    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const profile = await UserAPI.getProfile(
                firebaseUser.uid,
                firebaseUser.email,
              );

              if (profile) {
                set({ user: profile, isAuthenticated: true });
              } else {
                set({ user: null, isAuthenticated: false });
                toast.error(
                  "Kullanıcı profili ve yetkilendirme bilgisi bulunamadı.",
                );
              }
            } catch (profileErr: any) {
              set({ user: null, isAuthenticated: false });
              toast.error(
                "Yetkilendirme profili yüklenemedi: " +
                  (profileErr?.message || "Hata oluştu"),
              );
            } finally {
              set({ loading: false });
            }
          } else {
            set({ user: null, isAuthenticated: false, loading: false });
          }
        },
        (error) => {
          set({ user: null, isAuthenticated: false, loading: false });
          toast.error(
            "Oturum kontrol hatası: " +
              (error?.message || "Bağlantı kurulamadı"),
          );
        },
      );

      return () => {
        unsubscribe();
      };
    } catch (err: any) {
      toast.error("Oturum servisi başlatılamadı: " + (err?.message || "Hata"));
      set({ loading: false });
      return () => {};
    }
  },

  login: async (credentials) => {
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password.trim();

    if (!email || !password) {
      throw new Error("Lütfen e-posta adresinizi ve şifrenizi girin.");
    }

    if (!isFirebaseConfigured()) {
      throw new Error(
        "Firebase yapılandırması bulunamadı. Lütfen .env dosyasını doldurun.",
      );
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const fbUser = userCredential.user;

      const profile = await UserAPI.getProfile(fbUser.uid, fbUser.email);
      if (!profile) {
        throw new Error(
          "Kullanıcı profili ve yetkilendirme bilgisi veritabanında bulunamadı.",
        );
      }

      set({ user: profile, isAuthenticated: true });
    } catch (fbErr: any) {
      if (
        fbErr.code === "auth/invalid-credential" ||
        fbErr.code === "auth/user-not-found" ||
        fbErr.code === "auth/wrong-password" ||
        fbErr.code === "auth/invalid-email"
      ) {
        throw new Error("E-posta veya şifre hatalı.");
      }
      throw new Error(fbErr.message || "Giriş yapılamadı.");
    }
  },

  register: async (userData) => {
    if (!isFirebaseConfigured()) {
      throw new Error(
        "Firebase yapılandırması bulunamadı. Lütfen .env dosyasını doldurun.",
      );
    }

    const email = userData.email.trim().toLowerCase();
    const password = userData.password.trim();
    const name = userData.name.trim();

    if (!name || !email || !password) {
      throw new Error(
        "Lütfen adınızı, e-postanızı ve şifrenizi eksiksiz girin.",
      );
    }

    if (password.length < 6) {
      throw new Error("Şifre en az 6 karakter olmalıdır.");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const fbUser = userCredential.user;

      try {
        await updateProfile(fbUser, { displayName: name });
      } catch (_e) {}

      const createdUser = await UserAPI.createProfile(fbUser.uid, {
        name,
        email,
        role: "user",
      });

      set({ user: createdUser, isAuthenticated: true });
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        throw new Error("Bu e-posta adresi zaten kullanımda.");
      }
      if (err.code === "auth/invalid-email") {
        throw new Error("Geçersiz e-posta formatı.");
      }
      if (err.code === "auth/weak-password") {
        throw new Error("Şifre çok zayıf. En az 6 karakter olmalıdır.");
      }
      throw new Error(err.message || "Kayıt işlemi gerçekleştirilemedi.");
    }
  },

  logout: async () => {
    if (isFirebaseConfigured()) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        toast.error(
          "Çıkış yapılırken bir hata oluştu: " +
            (e instanceof Error ? e.message : ""),
        );
      }
    }
    set({ user: null, isAuthenticated: false });
  },
}));
