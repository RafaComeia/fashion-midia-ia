'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useWorkspace } from '@/hooks/useWorkspace';

interface DashboardShellProps {
  children: React.ReactNode;
  userEmail: string;
}

export function DashboardShell({ children, userEmail }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { workspace } = useWorkspace();

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar — desktop */}
      <div className="hidden lg:flex">
        <Sidebar collapsed={false} />
      </div>

      {/* Sidebar — tablet (collapsed) */}
      <div className="hidden md:flex lg:hidden">
        <Sidebar collapsed={true} />
      </div>

      {/* Sidebar — mobile (drawer) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-60">
          <Sidebar collapsed={false} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          userEmail={userEmail}
          workspaceName={workspace?.name}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
