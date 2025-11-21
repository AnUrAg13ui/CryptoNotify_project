import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { ClientSessionProvider } from "@/components/ClientSessionProvider";
const inter = Inter({ subsets: ["latin"] });
import logo from "@/app/images/logo.png";

export const metadata: Metadata = {
  title: "CryptoNotify",
  description: "Smarter Alerts for Smarter Investors",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* <link rel="icon" href={logo.src} /> */}
        <link rel="icon" type="image/png" href="/logo.png"></link>
      </head>
      <body className={inter.className}>
        <ClientSessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </ClientSessionProvider>
      </body>
    </html>
  );
}
