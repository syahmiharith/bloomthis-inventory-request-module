import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
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
        <div className="app-shell" data-testid="app-shell">
          <AppSidebar currentUser={currentUser} />
          <div className="center-region" data-testid="center-region">
            <AppHeader currentUser={currentUser} demoUsers={demoUsers} />
            <div className="content-region">{children}</div>
          </div>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
