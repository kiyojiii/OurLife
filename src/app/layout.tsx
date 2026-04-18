import type { Metadata } from "next";
import { Poppins, Fraunces, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

import { TopNav } from "@/components/top-nav";
import { ThemeProvider } from "@/components/theme-provider";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "opsz"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OurLife",
  description: "Personal tracker for two.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${fraunces.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TopNav />
          <main className="flex-1">{children}</main>
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
