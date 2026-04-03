import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { testIds } from "@/lib/testIds";
import "./globals.css";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  variable: "--font-rubik",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "חוֹבֶרֶת מָתֵמָטִיקָה לִילָדִים",
  description: "תִּרְגּוּל יוֹמִי בְּמָתֵמָטִיקָה לִילָדִים",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-testid="km.autogen.layout.node.idx.0" lang="he" dir="rtl">
      <body
        data-testid="km.autogen.layout.node.idx.1"
        className={`${rubik.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <AppProviders>
          <div data-testid={testIds.layout.mainSlot()} className="w-full min-w-0 grow">
            {children}
          </div>
        </AppProviders>
        {/* Cookie banner before footer in DOM so keyboard/linear SR order hits consent before footer links */}
        <CookieConsentBanner />
        <SiteFooter />
      </body>
    </html>
  );
}
