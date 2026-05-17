import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser, getDemoUsers } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Inventory Request Module",
  description: "Internal inventory request module",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [currentUser, demoUsers] = await Promise.all([
    getCurrentUser(),
    getDemoUsers(),
  ]);

  return (
    <html lang="en">
      <body>
        <AppShell currentUser={currentUser} demoUsers={demoUsers}>
          {children}
        </AppShell>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
