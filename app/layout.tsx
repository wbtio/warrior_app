import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/StoreProvider";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "المحارب | Warrior App",
  description: "نظام إنتاجية gamified - أنجز مهامك واكتسب XP وارتقِ في الرتب",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${ibmPlexArabic.className} antialiased bg-slate-900 text-white`}
      >
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
