import Head from "next/head";
import Link from "next/link";
import { AlertOctagon, ArrowLeft } from "lucide-react";

export default function Custom500() {
  return (
    <>
      <Head>
        <title>500 - Sunucu Hatası - MatrixLab</title>
      </Head>
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
          <AlertOctagon className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          500 - Bir Hata Meydana Geldi
        </h1>
        <p className="mt-1 max-w-sm text-xs text-zinc-500">
          Sistemde geçici bir problem oluştu. Lütfen tekrar deneyin.
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
