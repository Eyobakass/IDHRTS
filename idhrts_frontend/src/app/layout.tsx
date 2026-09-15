import type { Metadata } from "next";
import "./globals.css";

export const metadata = {
  title: "Rental Registry System",
  description: "Addis Ababa Rental Registry and Management System",
};

type LayoutProps<T extends string> = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
