import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser, getDemoUsers } from "@/lib/auth";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [currentUser, demoUsers] = await Promise.all([
    getCurrentUser(),
    getDemoUsers(),
  ]);

  return (
    <AppShell currentUser={currentUser} demoUsers={demoUsers}>
      {children}
    </AppShell>
  );
}
