'use client';

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { addDaysIso, startOfWeekIso, todayIso } from "@/lib/date";
import { useProfile } from "@/features/auth/useProfile";
import { useActiveClient } from "@/features/coach/ActiveClientContext";
import type { Checkin, WorkoutLog } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function CheckinsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { profile } = useProfile();
  const { activeClientId } = useActiveClient();

  const clientId = activeClientId ?? profile?.id ?? null;

  const [weekStart, setWeekStart] = useState(startOfWeekIso(todayIso()));
  const [form, setForm] = useState({
    weight: "",
    waist: "",
    sleep: "",
    steps: "",
    stress: "",
    hunger: "",
    energy: "",
    performance: "",
    notes: "",
  });
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [sessionsCount, setSessionsCount] = useState(0);

  const parseNumber = (value: string) => {
    if (!value.trim()) return null;
    const normalized = value.replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const loadCheckins = async () => {
    if (!clientId) return;
    const { data, error } = await supabase
      .from("checkins")
      .select("*")
      .eq("client_id", clientId)
      .order("week_start", { ascending: false });
    if (error) {
      toast.error("No se pudieron cargar los check-ins");
      return;
    }
    setCheckins((data ?? []) as Checkin[]);
  };

  const loadLogs = async () => {
    if (!clientId) return;
    const startRange = addDaysIso(weekStart, -56);
    const { data } = await supabase
      .from("workout_logs")
      .select("date")
      .eq("client_id", clientId)
      .gte("date", startRange)
      .order("date", { ascending: false });
    setLogs((data ?? []) as WorkoutLog[]);
  };

  const loadSessionsCount = async () => {
    if (!clientId) return;
    const { data: plans } = await supabase
      .from("training_plans")
      .select("id,status")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    const activePlan = plans?.find((plan: any) => plan.status === "active") ?? plans?.[0];
    if (!activePlan) {
      setSessionsCount(0);
      return;
    }

    const { data: sessions } = await supabase
      .from("training_sessions")
      .select("id")
      .eq("plan_id", activePlan.id);
    setSessionsCount(sessions?.length ?? 0);
  };

  useEffect(() => {
    if (clientId) {
      loadCheckins();
      loadLogs();
      loadSessionsCount();
    }
  }, [clientId, weekStart]);

  const saveCheckin = async () => {
    if (!clientId) return;

    const values = {
      weight: parseNumber(form.weight),
      waist: parseNumber(form.waist),
      sleep: parseNumber(form.sleep),
      steps: parseNumber(form.steps),
      stress: parseNumber(form.stress),
      hunger: parseNumber(form.hunger),
      energy: parseNumber(form.energy),
      performance: parseNumber(form.performance),
    };

    const { error } = await supabase.from("checkins").upsert(
      {
        client_id: clientId,
        week_start: weekStart,
        weight: values.weight,
        waist: values.waist,
        sleep: values.sleep,
        steps: values.steps ? Math.round(values.steps) : null,
        stress: values.stress,
        hunger: values.hunger,
        energy: values.energy,
        performance: values.performance,
        notes: form.notes,
      },
      { onConflict: "client_id,week_start" }
    );

    if (error) {
      toast.error("No se pudo guardar el check-in");
      return;
    }

    toast.success("Check-in guardado");
    setForm({ weight: "", waist: "", sleep: "", steps: "", stress: "", hunger: "", energy: "", performance: "", notes: "" });
    loadCheckins();
  };

  const getAdherence = (weekStartIso: string) => {
    if (!sessionsCount) return "-";
    const weekEnd = addDaysIso(weekStartIso, 6);
    const completed = logs.filter((log) => log.date >= weekStartIso && log.date <= weekEnd).length;
    const percent = Math.min(100, Math.round((completed / sessionsCount) * 100));
    return `${completed}/${sessionsCount} (${percent}%)`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Check-ins</h1>
        <p className="text-sm text-zinc-400">Seguimiento semanal y adherencia.</p>
      </div>

      <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
        <CardHeader>
          <CardTitle>Nuevo check-in</CardTitle>
          <CardDescription>Semana de {weekStart}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Semana</Label>
            <Input type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} className="bg-zinc-900 border-zinc-700" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label>Peso</Label>
              <Input value={form.weight} onChange={(event) => setForm((prev) => ({ ...prev, weight: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
            </div>
            <div className="space-y-1">
              <Label>Cintura</Label>
              <Input value={form.waist} onChange={(event) => setForm((prev) => ({ ...prev, waist: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
            </div>
            <div className="space-y-1">
              <Label>Sueño (h)</Label>
              <Input value={form.sleep} onChange={(event) => setForm((prev) => ({ ...prev, sleep: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
            </div>
            <div className="space-y-1">
              <Label>Pasos</Label>
              <Input value={form.steps} onChange={(event) => setForm((prev) => ({ ...prev, steps: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
            </div>
            <div className="space-y-1">
              <Label>Estrés</Label>
              <Input value={form.stress} onChange={(event) => setForm((prev) => ({ ...prev, stress: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
            </div>
            <div className="space-y-1">
              <Label>Hambre</Label>
              <Input value={form.hunger} onChange={(event) => setForm((prev) => ({ ...prev, hunger: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
            </div>
            <div className="space-y-1">
              <Label>Energía</Label>
              <Input value={form.energy} onChange={(event) => setForm((prev) => ({ ...prev, energy: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
            </div>
            <div className="space-y-1">
              <Label>Rendimiento</Label>
              <Input value={form.performance} onChange={(event) => setForm((prev) => ({ ...prev, performance: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Notas</Label>
            <Textarea value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
          </div>
          <Button onClick={saveCheckin} className="bg-white text-black hover:bg-zinc-200">Guardar</Button>
        </CardContent>
      </Card>

      <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
        <CardHeader>
          <CardTitle>Historial</CardTitle>
          <CardDescription>Adherencia semanal básica</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {checkins.length === 0 ? (
            <p className="text-sm text-zinc-500">Sin check-ins todavía.</p>
          ) : (
            checkins.map((checkin) => (
              <div key={checkin.id} className="flex justify-between border border-zinc-800 rounded-lg p-3 text-sm">
                <div>
                  <div className="font-medium">Semana {checkin.week_start}</div>
                  <div className="text-xs text-zinc-500">Peso {checkin.weight ?? "-"} · Cintura {checkin.waist ?? "-"}</div>
                </div>
                <div className="text-xs text-zinc-400">Adherencia {getAdherence(checkin.week_start)}</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
