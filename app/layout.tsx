import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Ignis — Интеллектуальный энергоаудит",
  description:
    "Декомпозиция счетов за электричество, распознавание приборов и квитанций с AI, симулятор экономии",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className="flex min-h-screen flex-col bg-slate-950 text-slate-100 antialiased selection:bg-orange-500 selection:text-slate-950">
        <ToastProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
