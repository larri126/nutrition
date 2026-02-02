'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/features/auth/useProfile";

export default function DashboardPage() {
  const { profile, loading } = useProfile();

  const roleLabel = profile?.role === "coach" ? "Entrenador" : profile?.role === "admin" ? "Admin" : "Alumno";

  return (
    <div className="space-y-6 animate-in fade-in">
      <h1 className="text-3xl font-bold text-white">
        Hola, {profile?.display_name || "Atleta"} 👋
      </h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{loading ? "Cargando..." : "Activo"}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Rol</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize text-emerald-400">{roleLabel}</div>
          </CardContent>
        </Card>
      </div>

      <div className="p-10 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-500">
        Aquí irán tus gráficas de progreso próximamente...
      </div>
    </div>
  );
}
