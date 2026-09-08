import Head from "next/head";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Sayfa Bulunamadı - MatrixLab</title>
      </Head>
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <img
          src="/favicon.svg"
          alt="MatrixLab"
          className="mb-3 h-12 w-12 rounded-2xl object-contain shadow-xs"
        />
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          Sayfa Bulunamadı
        </h1>
        <p className="mt-1 max-w-sm text-xs text-zinc-500">
          Aradığınız sayfa taşınmış veya silinmiş olabilir.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Ana Sayfaya Dön</span>
        </Link>
      </div>
    </>
  );
}
