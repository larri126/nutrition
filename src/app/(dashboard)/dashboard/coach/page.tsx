'use client';

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/features/auth/useProfile";
import { useActiveClient } from "@/features/coach/ActiveClientContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type CoachClientRow = {
  client_id: string;
  status: string;
  created_at?: string;
};

type ClientProfile = {
  id: string;
  display_name?: string | null;
  email?: string | null;
};

export default function CoachPage() {
  const supabase = useMemo(() => createClient(), []);
  const { profile } = useProfile();
  const { activeClientId, setActiveClientId } = useActiveClient();

  const [clients, setClients] = useState<Array<CoachClientRow & { profile?: ClientProfile }>>([]);
  const [newClientId, setNewClientId] = useState("");

  const isCoach = profile?.role === "coach" || profile?.role === "admin";

  const loadClients = async () => {
    if (!profile) return;

    const baseQuery = supabase.from("coach_clients").select("client_id,status,created_at");
    const { data: relations, error } = profile.role === "admin"
      ? await baseQuery
      : await baseQuery.eq("coach_id", profile.id);

    if (error) {
      toast.error("No se pudieron cargar los clientes");
      return;
    }

    const rows = (relations ?? []) as CoachClientRow[];
    const ids = rows.map((row) => row.client_id);

    if (ids.length === 0) {
      setClients([]);
      return;
    }

    const { data: profiles } = await supabase.from("profiles").select("id,display_name,email").in("id", ids);
    const profileMap = new Map((profiles ?? []).map((item: any) => [item.id, item]));

    setClients(
      rows.map((row) => ({
        ...row,
        profile: profileMap.get(row.client_id),
      }))
    );
  };

  useEffect(() => {
    if (profile && isCoach) {
      loadClients();
    }
  }, [profile]);

  const addClient = async () => {
    if (!profile) return;
    if (!newClientId.trim()) {
      toast.error("Introduce el UUID del cliente");
      return;
    }
    const { error } = await supabase.from("coach_clients").insert({
      coach_id: profile.id,
      client_id: newClientId.trim(),
      status: "active",
    });
    if (error) {
      toast.error("No se pudo vincular el cliente");
      return;
    }
    toast.success("Cliente vinculado");
    setNewClientId("");
    loadClients();
  };

  if (!isCoach) {
    return (
      <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
        <CardHeader>
          <CardTitle>Panel de coach</CardTitle>
          <CardDescription>Solo disponible para coaches/admins.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Coach panel</h1>
        <p className="text-sm text-zinc-400">Selecciona el cliente activo para diet/workout.</p>
      </div>

      <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>Conexiones activas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              value={newClientId}
              onChange={(event) => setNewClientId(event.target.value)}
              placeholder="UUID del cliente"
              className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
            />
            <Button onClick={addClient} className="bg-white text-black hover:bg-zinc-200">
              Vincular
            </Button>
          </div>
          {clients.length === 0 ? (
            <p className="text-sm text-zinc-500">No hay clientes asignados.</p>
          ) : (
            clients.map((client) => (
              <div key={client.client_id} className="flex items-center justify-between border border-zinc-800 rounded-lg p-3 text-sm">
                <div>
                  <div className="font-medium">{client.profile?.display_name || client.profile?.email || client.client_id}</div>
                  <div className="text-xs text-zinc-500">{client.status}</div>
                </div>
                <Button
                  variant={activeClientId === client.client_id ? "default" : "outline"}
                  onClick={() => setActiveClientId(client.client_id)}
                >
                  {activeClientId === client.client_id ? "Activo" : "Seleccionar"}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
