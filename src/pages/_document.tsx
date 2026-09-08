import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="tr">
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </Head>
      <body className="bg-zinc-50 text-zinc-900 antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
