import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ignis — Сервис энергоаудита",
  description:
    "Интеллектуальный сервис энергоаудита и декомпозиции счетов за электричество",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
