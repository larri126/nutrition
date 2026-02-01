'use client';

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Consultamos la tabla 'profiles' que creamos con SQL
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
    };
    getProfile();
  }, [supabase]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <h1 className="text-3xl font-bold text-white">
        Hola, {profile?.full_name || 'Atleta'} 👋
      </h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-zinc-400">Plan Actual</CardTitle></CardHeader>
          <CardContent>
             <div className="text-2xl font-bold capitalize">{profile?.plan_tier || 'Gratis'}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-zinc-400">Rol</CardTitle></CardHeader>
          <CardContent>
             <div className="text-2xl font-bold capitalize text-emerald-400">{profile?.role === 'trainer' ? 'Entrenador' : 'Alumno'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="p-10 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-500">
        Aquí irán tus gráficas de progreso próximamente...
      </div>
    </div>
  );
}