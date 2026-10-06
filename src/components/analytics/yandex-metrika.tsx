"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { YANDEX_METRIKA_ID } from "@/lib/yandex-metrika";

type MetrikaWindow = Window & {
  ym?: (counterId: number, method: string, ...args: unknown[]) => void;
};

const privateRoute = /^\/(admin|auth|cabinet|invitation)(\/|$)/;

const loader = `
  window.dataLayer = window.dataLayer || [];
  (function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {
      if (document.scripts[j].src === r) { return; }
    }
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_ID}', 'ym');
`;

export function YandexMetrika() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const enabled = process.env.NODE_ENV === "production" && !privateRoute.test(pathname);
  const [ready, setReady] = useState(false);
  const initialized = useRef(false);
  const previousUrl = useRef<string | null>(null);

  useEffect(() => {
    const ym = (window as MetrikaWindow).ym;
    if (!ready || !ym) return;

    if (!enabled) {
      if (initialized.current) {
        ym(YANDEX_METRIKA_ID, "destruct");
        initialized.current = false;
        previousUrl.current = null;
      }
      return;
    }

    const url = window.location.href;

    if (!initialized.current) {
      ym(YANDEX_METRIKA_ID, "init", {
        ssr: true,
        webvisor: true,
        clickmap: true,
        ecommerce: "dataLayer",
        referrer: document.referrer,
        url,
        accurateTrackBounce: true,
        trackLinks: true,
        // Every Next.js navigation, including the first view, is sent below.
        defer: true,
      });
      initialized.current = true;
    }

    if (previousUrl.current === url) return;

    const sendPageView = () => {
      if (!document.title.trim()) return false;

      ym(YANDEX_METRIKA_ID, "hit", url, {
        referer: previousUrl.current ?? document.referrer,
        title: document.title,
      });
      previousUrl.current = url;
      return true;
    };

    if (sendPageView()) return;

    // Next.js can commit the route before its streamed title reaches the head.
    const observer = new MutationObserver(() => {
      if (sendPageView()) observer.disconnect();
    });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [enabled, pathname, query, ready]);

  if (!enabled) return null;

  return (
    <Script
      id="yandex-metrika"
      strategy="afterInteractive"
      onReady={() => setReady(true)}
    >
      {loader}
    </Script>
  );
}
