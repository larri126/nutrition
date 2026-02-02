'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, LayoutDashboard, Dumbbell, Utensils, Menu, ClipboardList, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useProfile } from "@/features/auth/useProfile";
import { ActiveClientProvider, useActiveClient } from "@/features/coach/ActiveClientContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useProfile();

  return (
    <ActiveClientProvider profile={profile}>
      <DashboardShell profile={profile} loading={loading}>
        {children}
      </DashboardShell>
    </ActiveClientProvider>
  );
}

function DashboardShell({
  children,
  profile,
  loading,
}: {
  children: React.ReactNode;
  profile: ReturnType<typeof useProfile>["profile"];
  loading: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { activeClientId } = useActiveClient();
  const [activeClientName, setActiveClientName] = useState<string | null>(null);

  const isCoach = profile?.role === "coach" || profile?.role === "admin";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const loadActiveClient = async () => {
      if (!isCoach || !activeClientId) {
        setActiveClientName(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("display_name,email")
        .eq("id", activeClientId)
        .maybeSingle();

      if (data) {
        setActiveClientName(data.display_name || data.email || activeClientId);
      } else {
        setActiveClientName(activeClientId);
      }
    };

    loadActiveClient();
  }, [activeClientId, isCoach, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <span className="text-black font-bold text-xs">PF</span>
        </div>
        <span className="font-bold text-lg text-white">PowerFit</span>
      </div>

      <nav className="flex-1 space-y-1">
        <NavItem
          href="/dashboard"
          icon={<LayoutDashboard size={20} />}
          label="Inicio"
          active={pathname === "/dashboard"}
          onClick={() => setIsSheetOpen(false)}
        />
        <NavItem
          href="/dashboard/workout"
          icon={<Dumbbell size={20} />}
          label="Entreno"
          active={pathname.includes("/workout")}
          onClick={() => setIsSheetOpen(false)}
        />
        <NavItem
          href="/dashboard/diet"
          icon={<Utensils size={20} />}
          label="Dieta"
          active={pathname.includes("/diet")}
          onClick={() => setIsSheetOpen(false)}
        />
        <NavItem
          href="/dashboard/checkins"
          icon={<ClipboardList size={20} />}
          label="Check-ins"
          active={pathname.includes("/checkins")}
          onClick={() => setIsSheetOpen(false)}
        />
        {isCoach && (
          <NavItem
            href="/dashboard/coach"
            icon={<UsersRound size={20} />}
            label="Coach"
            active={pathname.includes("/coach")}
            onClick={() => setIsSheetOpen(false)}
          />
        )}
      </nav>

      {isCoach && (
        <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-400">
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">Cliente activo</div>
          <div className="mt-1 text-zinc-100">
            {loading ? "Cargando..." : activeClientName || "Selecciona en Coach"}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-zinc-800 mt-auto">
        <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/20 gap-2">
          <LogOut size={18} /> Cerrar Sesión
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-black text-zinc-100">
      <aside className="hidden md:flex w-64 flex-col border-r border-zinc-800 bg-zinc-950 p-4 fixed h-full inset-y-0 z-50">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <header className="md:hidden h-16 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/80 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
              <span className="text-black font-bold text-[10px]">PF</span>
            </div>
            <span className="font-bold text-sm">PowerFit</span>
          </div>

          {isMounted && (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-zinc-950 border-zinc-800 text-zinc-100 w-[80%] max-w-[300px] p-4">
                <SheetTitle className="sr-only">Menú</SheetTitle>
                <SidebarContent />
              </SheetContent>
            </Sheet>
          )}
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label, active, onClick }: any) {
  return (
    <Link href={href} onClick={onClick}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
          active ? "bg-white text-black font-medium" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
        )}
      >
        {icon}
        <span>{label}</span>
      </div>
    </Link>
  );
}
