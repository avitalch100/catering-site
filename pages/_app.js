import "../styles/globals.css";
import Script from "next/script";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isAdmin = router.pathname.startsWith("/admin");

  return (
    <>
      <Component {...pageProps} />
      {!isAdmin && (
        <Script
          src="https://console.thecloud.chat/js/widget/qjcy1vvov8uxvcpj/float.js"
          strategy="afterInteractive"
        />
      )}
    </>
  );
}
