import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUserForShell, getDemoUsersForShell } from "@/lib/auth";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [currentUser, demoUsers] = await Promise.all([
    getCurrentUserForShell(),
    getDemoUsersForShell(),
  ]);

  return (
    <AppShell currentUser={currentUser} demoUsers={demoUsers}>
      {children}
    </AppShell>
  );
}
