import Head from 'next/head';
import Link from 'next/link';
import { AlertOctagon, ArrowLeft } from 'lucide-react';

export default function Custom500() {
  return (
    <>
      <Head>
        <title>500 - Sunucu Hatası - MatrixLab</title>
      </Head>
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 border border-rose-200">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
          500 - Bir Hata Meydana Geldi
        </h1>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
          Sistemde geçici bir problem oluştu. Lütfen tekrar deneyin.
        </p>
        <Link
          href="/"
          className="mt-5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition active:scale-[0.98]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Ana Sayfaya Dön</span>
        </Link>
      </div>
    </>
  );
}
