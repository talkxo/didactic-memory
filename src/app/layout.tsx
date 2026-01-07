import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const bodySans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const headingSerif = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Handshake CRM",
  description: "Mobile-first calling CRM for fast outreach",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bodySans.variable} ${headingSerif.variable} antialiased bg-zinc-50`}
      >
        {children}
      </body>
    </html>
  );
}
