import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
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

interface AuthContextType {
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);



  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const profile = await UserAPI.getProfile(
        auth.currentUser.uid,
        auth.currentUser.email,
      );
      if (profile) {
        setUser((prev) => (prev ? { ...prev, ...profile } : null));
        toast.success("Yetki bilgileri güncellendi.");
      } else {
        setUser(null);
        toast.error("Kullanıcı profili bulunamadı.");
      }
    } catch (err: any) {
      setUser(null);
      toast.error("Yetki yenileme hatası: " + (err?.message || ""));
    }
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;

    if (isFirebaseConfigured()) {
      try {
        unsubscribe = onAuthStateChanged(
          auth,
          async (firebaseUser) => {
            if (!isMounted) return;

            if (firebaseUser) {
              try {
                const profile = await UserAPI.getProfile(
                  firebaseUser.uid,
                  firebaseUser.email,
                );
                if (!isMounted) return;

                if (profile) {
                  setUser(profile);
                } else {
                  setUser(null);
                  toast.error(
                    "Kullanıcı profili ve yetkilendirme bilgisi bulunamadı.",
                  );
                }
              } catch (profileErr: any) {
                setUser(null);
                toast.error(
                  "Yetkilendirme profili yüklenemedi: " +
                    (profileErr?.message || "Hata oluştu"),
                );
              } finally {
                if (isMounted) {
                  setLoading(false);
                }
              }
            } else {
              setUser(null);
              setLoading(false);
            }
          },
          (error) => {
            if (isMounted) {
              setUser(null);
              setLoading(false);
              toast.error(
                "Oturum kontrol hatası: " +
                  (error?.message || "Bağlantı kurulamadı"),
              );
            }
          },
        );
      } catch (err: any) {
        toast.error("Oturum servisi başlatılamadı: " + (err?.message || "Hata"));
        if (isMounted) {
          setLoading(false);
        }
      }
    } else {
      toast.error("Firebase yapılandırması eksik (.env dosyasını kontrol edin).");
      if (isMounted) {
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
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

      setUser(profile);
      return;
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
  };

  const register = async (userData: {
    email: string;
    name: string;
    password: string;
  }) => {
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

      setUser(createdUser);
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
  };

  const logout = async () => {
    if (isFirebaseConfigured()) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        toast.error("Çıkış yapılırken bir hata oluştu: " + (e instanceof Error ? e.message : ""));
      }
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth, bir AuthProvider içerisinde kullanılmalıdır.");
  }
  return context;
};
