import type { Metadata } from "next";
import { Rubik } from "next/font/google";
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
      <body data-testid="km.autogen.layout.node.idx.1" className={`${rubik.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
