import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "../context/AuthContext";
import { AppLayout } from "../components/layout/AppLayout";
import { ProtectedRoute } from "../components/common/ProtectedRoute";
import "../index.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isPublicPage =
    router.pathname === "/login" ||
    router.pathname === "/404" ||
    router.pathname === "/500";

  return (
    <>
      <Head>
        <title>
          MatrixLab - Atölye ve laboratuvar envanter yönetim sistemi
        </title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </Head>
      <AuthProvider>
        {isPublicPage ? (
          <Component {...pageProps} />
        ) : (
          <ProtectedRoute adminOnly={router.pathname === "/users"}>
            <AppLayout>
              <Component {...pageProps} />
            </AppLayout>
          </ProtectedRoute>
        )}
      </AuthProvider>
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        style={{ top: "calc(1rem + env(safe-area-inset-top, 0px))" }}
      />
    </>
  );
}
