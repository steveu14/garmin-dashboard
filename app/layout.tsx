import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Garmin Fitness Dashboard",
  description: "Personal fitness dashboard powered by Garmin Connect",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
