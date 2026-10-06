import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { YandexMetrika } from "@/components/analytics/yandex-metrika";
import { YANDEX_METRIKA_ID } from "@/lib/yandex-metrika";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Ассоциация офтальмологических клиник",
    template: "%s | Ассоциация офтальмологических клиник",
  },
  description:
    "Профессиональное объединение офтальмологических клиник, врачей и отраслевых партнёров. Обмен опытом, развитие профессиональных связей и информационная инфраструктура офтальмологической отрасли.",
  applicationName: "Ассоциация офтальмологических клиник",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased">
        {children}
        <Suspense fallback={null}>
          <YandexMetrika />
        </Suspense>
        {process.env.NODE_ENV === "production" && (
          <noscript>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element -- Metrika's no-JavaScript tracking pixel. */}
              <img
                src={`https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`}
                style={{ position: "absolute", left: "-9999px" }}
                referrerPolicy="origin"
                alt=""
              />
            </div>
          </noscript>
        )}
      </body>
    </html>
  );
}
