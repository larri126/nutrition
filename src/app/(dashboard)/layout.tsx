'use client';

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, LayoutDashboard, Dumbbell, Utensils, Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // SOLUCIÓN HIDRATACIÓN: Estado para detectar si ya estamos en el cliente
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  // Este componente contiene los enlaces del menú (se usa en Móvil y Desktop)
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
      </nav>

      <div className="pt-4 border-t border-zinc-800 mt-auto">
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/20 gap-2">
            <LogOut size={18} /> Cerrar Sesión
          </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-black text-zinc-100">
      
      {/* 1. SIDEBAR DESKTOP (Oculto en móvil) */}
      <aside className="hidden md:flex w-64 flex-col border-r border-zinc-800 bg-zinc-950 p-4 fixed h-full inset-y-0 z-50">
        <SidebarContent />
      </aside>

      {/* 2. CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        
        {/* HEADER MÓVIL (Visible solo en móvil) */}
        <header className="md:hidden h-16 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/80 backdrop-blur sticky top-0 z-40">
           <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                  <span className="text-black font-bold text-[10px]">PF</span>
              </div>
              <span className="font-bold text-sm">PowerFit</span>
           </div>

           {/* Menú Hamburguesa (Sheet) - Solo renderiza si está montado */}
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

        {/* PÁGINA */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
           {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label, active, onClick }: any) {
  return (
    <Link href={href} onClick={onClick}>
      <div className={cn("flex items-center gap-3 px-3 py-2 rounded-lg transition-colors", active ? "bg-white text-black font-medium" : "text-zinc-400 hover:bg-zinc-900 hover:text-white")}>
        {icon}
        <span>{label}</span>
      </div>
    </Link>
  )
}