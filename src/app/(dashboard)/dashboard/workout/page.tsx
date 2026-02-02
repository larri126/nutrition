'use client';

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, RefreshCcw, PlayCircle, Save } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slug";
import { addDaysIso, startOfWeekIso, todayIso } from "@/lib/date";
import { useProfile } from "@/features/auth/useProfile";
import { useActiveClient } from "@/features/coach/ActiveClientContext";
import type {
  Exercise,
  TrainingBlock,
  TrainingPlan,
  TrainingSession,
  TrainingTemplate,
  WorkoutLog,
} from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORY_OPTIONS: Exercise["category"][] = ["pull", "push", "legs", "core", "full"];

type SessionExercise = {
  exercise_id: string;
  name: string;
  sets: number;
  reps: number;
  rpe?: number;
  rest?: string;
  notes?: string;
};

type LogInput = {
  sets: string;
  reps: string;
  load: string;
  rpe: string;
  notes: string;
};

export default function WorkoutPage() {
  const supabase = useMemo(() => createClient(), []);
  const { profile, loading: profileLoading } = useProfile();
  const { activeClientId } = useActiveClient();

  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [blocks, setBlocks] = useState<TrainingBlock[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [analyticsLogs, setAnalyticsLogs] = useState<WorkoutLog[]>([]);

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);

  const [planForm, setPlanForm] = useState({ name: "", status: "draft", notes: "" });
  const [blockForm, setBlockForm] = useState({ title: "", order: "1", weeks: "4", goal: "", notes: "" });
  const [sessionForm, setSessionForm] = useState({ session_order: "1", session_label: "", focus: "", notes: "" });
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([]);

  const [exerciseForm, setExerciseForm] = useState({
    id: "",
    name: "",
    category: "pull" as Exercise["category"],
    muscles: "",
    equipment: "",
    is_public: false,
  });

  const [templateForm, setTemplateForm] = useState({
    title: "",
    goal: "",
    level: "",
    equipment: "",
    frequency: "",
    description: "",
  });

  const [logInputs, setLogInputs] = useState<LogInput[]>([]);

  const clientId = activeClientId ?? profile?.id ?? null;
  const isCoach = profile?.role === "coach" || profile?.role === "admin";

  const parseNumber = (value: string) => {
    if (!value.trim()) return null;
    const normalized = value.replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const loadPlans = async () => {
    if (!clientId) return;
    const { data, error } = await supabase
      .from("training_plans")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("No se pudieron cargar los planes");
      return;
    }
    const list = (data ?? []) as TrainingPlan[];
    setPlans(list);
    if (!selectedPlanId && list.length > 0) {
      const activePlan = list.find((plan) => plan.status === "active") ?? list[0];
      setSelectedPlanId(activePlan.id);
    }
  };

  const loadBlocks = async (planId: string) => {
    const { data, error } = await supabase
      .from("training_blocks")
      .select("*")
      .eq("plan_id", planId)
      .order("order", { ascending: true });
    if (error) {
      toast.error("No se pudieron cargar los bloques");
      return;
    }
    setBlocks((data ?? []) as TrainingBlock[]);
  };

  const loadSessions = async (planId: string) => {
    const { data, error } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("plan_id", planId)
      .order("session_order", { ascending: true });
    if (error) {
      toast.error("No se pudieron cargar las sesiones");
      return;
    }
    const formatted = (data ?? []).map((session) => ({
      ...session,
      exercises: Array.isArray(session.exercises) ? session.exercises : [],
    })) as TrainingSession[];
    setSessions(formatted);
  };

  const loadExercises = async () => {
    const { data, error } = await supabase.from("exercises").select("*").order("name", { ascending: true });
    if (error) {
      toast.error("No se pudieron cargar los ejercicios");
      return;
    }
    setExercises((data ?? []) as Exercise[]);
  };

  const loadTemplates = async () => {
    const { data, error } = await supabase.from("training_templates").select("*").order("created_at", { ascending: false });
    if (error) {
      toast.error("No se pudieron cargar las plantillas");
      return;
    }
    setTemplates((data ?? []) as TrainingTemplate[]);
  };

  const loadLogs = async (planId: string) => {
    if (!clientId) return;
    const { data, error } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("client_id", clientId)
      .eq("plan_id", planId)
      .order("completed_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error("No se pudieron cargar los logs");
      return;
    }
    setLogs((data ?? []) as WorkoutLog[]);
  };

  const loadAnalyticsLogs = async () => {
    if (!clientId) return;
    const { data } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("client_id", clientId)
      .order("completed_at", { ascending: false })
      .limit(200);
    setAnalyticsLogs((data ?? []) as WorkoutLog[]);
  };

  useEffect(() => {
    if (!profileLoading && clientId) {
      loadPlans();
      loadExercises();
      loadTemplates();
      loadAnalyticsLogs();
    }
  }, [profileLoading, clientId]);

  useEffect(() => {
    if (!selectedPlanId) return;
    loadBlocks(selectedPlanId);
    loadSessions(selectedPlanId);
    loadLogs(selectedPlanId);
  }, [selectedPlanId]);

  const resetPlanForm = () => {
    setPlanForm({ name: "", status: "draft", notes: "" });
    setEditingPlanId(null);
  };

  const savePlan = async () => {
    if (!clientId || !profile) return;
    if (!planForm.name.trim()) {
      toast.error("Nombre requerido");
      return;
    }

    const payload = {
      client_id: clientId,
      coach_id: isCoach ? profile.id : null,
      name: planForm.name.trim(),
      status: planForm.status as TrainingPlan["status"],
      notes: planForm.notes,
    };

    if (editingPlanId) {
      const { error } = await supabase.from("training_plans").update(payload).eq("id", editingPlanId);
      if (error) {
        toast.error("No se pudo actualizar el plan");
        return;
      }
      toast.success("Plan actualizado");
    } else {
      const { data, error } = await supabase.from("training_plans").insert(payload).select().single();
      if (error) {
        toast.error("No se pudo crear el plan");
        return;
      }
      if (data) setSelectedPlanId(data.id);
      toast.success("Plan creado");
    }

    resetPlanForm();
    loadPlans();
  };

  const editPlan = (plan: TrainingPlan) => {
    setEditingPlanId(plan.id);
    setPlanForm({ name: plan.name, status: plan.status, notes: plan.notes ?? "" });
  };

  const deletePlan = async (planId: string) => {
    const { error } = await supabase.from("training_plans").delete().eq("id", planId);
    if (error) {
      toast.error("No se pudo eliminar el plan");
      return;
    }
    toast.success("Plan eliminado");
    if (selectedPlanId === planId) setSelectedPlanId(null);
    loadPlans();
  };

  const resetBlockForm = () => {
    setBlockForm({ title: "", order: "1", weeks: "4", goal: "", notes: "" });
    setEditingBlockId(null);
  };

  const saveBlock = async () => {
    if (!clientId || !selectedPlanId) return;
    if (!blockForm.title.trim()) {
      toast.error("Título requerido");
      return;
    }

    const order = parseNumber(blockForm.order);
    const weeks = parseNumber(blockForm.weeks);
    if (!order || order <= 0 || !weeks || weeks <= 0) {
      toast.error("Orden y semanas inválidos");
      return;
    }

    const payload = {
      plan_id: selectedPlanId,
      client_id: clientId,
      title: blockForm.title.trim(),
      order: Math.round(order),
      weeks: Math.round(weeks),
      goal: blockForm.goal,
      notes: blockForm.notes,
    };

    if (editingBlockId) {
      const { error } = await supabase.from("training_blocks").update(payload).eq("id", editingBlockId);
      if (error) {
        toast.error("No se pudo actualizar el bloque");
        return;
      }
      toast.success("Bloque actualizado");
    } else {
      const { data, error } = await supabase.from("training_blocks").insert(payload).select().single();
      if (error) {
        toast.error("No se pudo crear el bloque");
        return;
      }
      if (data) setSelectedBlockId(data.id);
      toast.success("Bloque creado");
    }

    resetBlockForm();
    loadBlocks(selectedPlanId);
  };

  const editBlock = (block: TrainingBlock) => {
    setEditingBlockId(block.id);
    setBlockForm({
      title: block.title,
      order: String(block.order),
      weeks: String(block.weeks),
      goal: block.goal ?? "",
      notes: block.notes ?? "",
    });
  };

  const deleteBlock = async (blockId: string) => {
    const { error } = await supabase.from("training_blocks").delete().eq("id", blockId);
    if (error) {
      toast.error("No se pudo eliminar el bloque");
      return;
    }
    toast.success("Bloque eliminado");
    if (selectedBlockId === blockId) setSelectedBlockId(null);
    if (selectedPlanId) loadBlocks(selectedPlanId);
  };

  const resetSessionForm = () => {
    setSessionForm({ session_order: "1", session_label: "", focus: "", notes: "" });
    setSessionExercises([]);
    setEditingSessionId(null);
  };

  const addExerciseToSession = (exerciseId: string) => {
    const exercise = exercises.find((item) => item.id === exerciseId);
    if (!exercise) return;
    setSessionExercises((prev) => [
      ...prev,
      {
        exercise_id: exercise.id,
        name: exercise.name,
        sets: 3,
        reps: 10,
        rpe: 8,
        rest: "90s",
      },
    ]);
  };

  const saveSession = async () => {
    if (!clientId || !selectedPlanId || !selectedBlockId) return;
    const order = parseNumber(sessionForm.session_order);
    if (!order || order <= 0) {
      toast.error("Orden inválido");
      return;
    }

    const block = blocks.find((item) => item.id === selectedBlockId);

    const payload = {
      plan_id: selectedPlanId,
      block_id: selectedBlockId,
      client_id: clientId,
      block_title: block?.title ?? "",
      session_order: Math.round(order),
      session_label: sessionForm.session_label,
      focus: sessionForm.focus,
      notes: sessionForm.notes,
      exercises: sessionExercises,
    };

    if (editingSessionId) {
      const { error } = await supabase.from("training_sessions").update(payload).eq("id", editingSessionId);
      if (error) {
        toast.error("No se pudo actualizar la sesión");
        return;
      }
      toast.success("Sesión actualizada");
    } else {
      const { error } = await supabase.from("training_sessions").insert(payload);
      if (error) {
        toast.error("No se pudo crear la sesión");
        return;
      }
      toast.success("Sesión creada");
    }

    resetSessionForm();
    loadSessions(selectedPlanId);
  };

  const editSession = (session: TrainingSession) => {
    setEditingSessionId(session.id);
    setSessionForm({
      session_order: String(session.session_order),
      session_label: session.session_label ?? "",
      focus: session.focus ?? "",
      notes: session.notes ?? "",
    });
    setSessionExercises(session.exercises ?? []);
  };

  const deleteSession = async (sessionId: string) => {
    const { error } = await supabase.from("training_sessions").delete().eq("id", sessionId);
    if (error) {
      toast.error("No se pudo eliminar la sesión");
      return;
    }
    toast.success("Sesión eliminada");
    if (selectedPlanId) loadSessions(selectedPlanId);
  };

  const resetExerciseForm = () => {
    setExerciseForm({ id: "", name: "", category: "pull", muscles: "", equipment: "", is_public: false });
    setEditingExerciseId(null);
  };

  const saveExercise = async () => {
    if (!profile) return;
    if (!exerciseForm.name.trim()) {
      toast.error("Nombre requerido");
      return;
    }

    const exerciseId = slugify(exerciseForm.id || exerciseForm.name);
    const payload = {
      id: exerciseId,
      owner_id: isCoach && activeClientId ? activeClientId : profile.id,
      is_public: exerciseForm.is_public,
      name: exerciseForm.name.trim(),
      category: exerciseForm.category,
      muscles: exerciseForm.muscles
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      equipment: exerciseForm.equipment,
    };

    if (editingExerciseId) {
      const { error } = await supabase.from("exercises").update(payload).eq("id", editingExerciseId);
      if (error) {
        toast.error("No se pudo actualizar el ejercicio");
        return;
      }
      toast.success("Ejercicio actualizado");
    } else {
      const { error } = await supabase.from("exercises").insert(payload);
      if (error) {
        toast.error("No se pudo crear el ejercicio");
        return;
      }
      toast.success("Ejercicio creado");
    }

    resetExerciseForm();
    loadExercises();
  };

  const editExercise = (exercise: Exercise) => {
    setEditingExerciseId(exercise.id);
    setExerciseForm({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      muscles: (exercise.muscles ?? []).join(", "),
      equipment: exercise.equipment ?? "",
      is_public: exercise.is_public,
    });
  };

  const deleteExercise = async (exerciseId: string) => {
    const { error } = await supabase.from("exercises").delete().eq("id", exerciseId);
    if (error) {
      toast.error("No se pudo eliminar el ejercicio");
      return;
    }
    toast.success("Ejercicio eliminado");
    loadExercises();
  };

  const createTemplate = async () => {
    if (!profile || !isCoach) {
      toast.error("Solo coaches pueden crear plantillas");
      return;
    }
    if (!selectedPlanId) {
      toast.error("Selecciona un plan");
      return;
    }

    const plan = plans.find((item) => item.id === selectedPlanId);
    if (!plan) return;

    const payload = {
      plan: {
        name: plan.name,
        notes: plan.notes,
        status: plan.status,
      },
      blocks,
      sessions,
    };

    const { error } = await supabase.from("training_templates").insert({
      title: templateForm.title || plan.name,
      goal: templateForm.goal,
      level: templateForm.level,
      equipment: templateForm.equipment,
      frequency: templateForm.frequency ? Number(templateForm.frequency) : null,
      description: templateForm.description,
      created_by: profile.id,
      is_public: true,
      payload,
    });

    if (error) {
      toast.error("No se pudo crear la plantilla");
      return;
    }

    toast.success("Plantilla creada");
    setTemplateForm({ title: "", goal: "", level: "", equipment: "", frequency: "", description: "" });
    loadTemplates();
  };

  const applyTemplate = async (templateId: string) => {
    if (!clientId || !profile) return;
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;

    const { data: planData, error: planError } = await supabase
      .from("training_plans")
      .insert({
        client_id: clientId,
        coach_id: isCoach ? profile.id : null,
        name: template.title,
        status: "draft",
        notes: template.description,
      })
      .select()
      .single();

    if (planError || !planData) {
      toast.error("No se pudo crear el plan desde plantilla");
      return;
    }

    const blockMap = new Map<string, string>();
    const templateBlocks = (template.payload?.blocks ?? []) as TrainingBlock[];

    for (const block of templateBlocks) {
      const { data, error } = await supabase
        .from("training_blocks")
        .insert({
          plan_id: planData.id,
          client_id: clientId,
          title: block.title,
          order: block.order,
          weeks: block.weeks,
          goal: block.goal,
          notes: block.notes,
        })
        .select()
        .single();

      if (error || !data) {
        toast.error("Error creando bloques de plantilla");
        return;
      }

      blockMap.set(block.id, data.id);
    }

    const templateSessions = (template.payload?.sessions ?? []) as TrainingSession[];
    for (const session of templateSessions) {
      const newBlockId = blockMap.get(session.block_id) ?? session.block_id;
      const { error } = await supabase.from("training_sessions").insert({
        plan_id: planData.id,
        block_id: newBlockId,
        client_id: clientId,
        block_title: session.block_title,
        session_order: session.session_order,
        session_label: session.session_label,
        focus: session.focus,
        notes: session.notes,
        exercises: session.exercises,
      });

      if (error) {
        toast.error("Error creando sesiones de plantilla");
        return;
      }
    }

    toast.success("Plantilla aplicada");
    setSelectedPlanId(planData.id);
    loadPlans();
  };

  const sessionsSorted = useMemo(
    () => [...sessions].sort((a, b) => a.session_order - b.session_order),
    [sessions]
  );

  const lastLog = logs[0];

  const nextSession = useMemo(() => {
    if (sessionsSorted.length === 0) return null;
    if (!lastLog?.session_order) return sessionsSorted[0];
    const next = sessionsSorted.find((session) => session.session_order > (lastLog.session_order ?? 0));
    return next ?? sessionsSorted[0];
  }, [sessionsSorted, lastLog]);

  useEffect(() => {
    if (!nextSession) {
      setLogInputs([]);
      return;
    }
    setLogInputs(
      nextSession.exercises.map((exercise) => ({
        sets: String(exercise.sets ?? ""),
        reps: String(exercise.reps ?? ""),
        load: "",
        rpe: exercise.rpe ? String(exercise.rpe) : "",
        notes: "",
      }))
    );
  }, [nextSession?.id]);

  const saveWorkoutLog = async () => {
    if (!clientId || !selectedPlanId || !nextSession) return;

    const rows = nextSession.exercises.map((exercise, index) => {
      const input = logInputs[index] ?? { sets: "", reps: "", load: "", rpe: "", notes: "" };
      const sets = parseNumber(input.sets);
      const reps = parseNumber(input.reps);
      const load = parseNumber(input.load) ?? 0;
      const rpe = parseNumber(input.rpe);

      if (!sets || !reps || sets <= 0 || reps <= 0) {
        return null;
      }

      return {
        client_id: clientId,
        plan_id: selectedPlanId,
        session_id: nextSession.id,
        session_order: nextSession.session_order,
        exercise_id: exercise.exercise_id,
        exercise_name: exercise.name,
        sets: Math.round(sets),
        reps: Math.round(reps),
        load,
        rpe,
        notes: input.notes,
        date: todayIso(),
        completed_at: new Date().toISOString(),
      };
    });

    const filtered = rows.filter(Boolean) as any[];
    if (filtered.length === 0) {
      toast.error("Completa al menos un ejercicio");
      return;
    }

    const { error } = await supabase.from("workout_logs").insert(filtered);
    if (error) {
      toast.error("No se pudo guardar el log");
      return;
    }

    toast.success("Sesión registrada");
    loadLogs(selectedPlanId);
    loadAnalyticsLogs();
  };

  const canEditExercise = (exercise: Exercise) => {
    if (!profile) return false;
    if (profile.role === "admin") return true;
    if (exercise.owner_id === profile.id) return true;
    if (isCoach && activeClientId && exercise.owner_id === activeClientId) return true;
    return false;
  };

  const prByExercise = useMemo(() => {
    const map = new Map<string, number>();
    analyticsLogs.forEach((log) => {
      const key = log.exercise_name || log.exercise_id || "";
      if (!key) return;
      const current = map.get(key) ?? 0;
      const load = Number(log.load ?? 0);
      if (load > current) map.set(key, load);
    });
    return Array.from(map.entries())
      .map(([name, load]) => ({ name, load }))
      .sort((a, b) => b.load - a.load)
      .slice(0, 6);
  }, [analyticsLogs]);

  const rpeTrend = useMemo(() => {
    const today = todayIso();
    const currentWeek = startOfWeekIso(today);
    const weekStarts = [0, 1, 2, 3].map((offset) => addDaysIso(currentWeek, -7 * offset)).reverse();

    return weekStarts.map((weekStart) => {
      const weekEnd = addDaysIso(weekStart, 6);
      const weekLogs = analyticsLogs.filter((log) => log.date >= weekStart && log.date <= weekEnd && log.rpe);
      const avg = weekLogs.reduce((sum, log) => sum + Number(log.rpe ?? 0), 0) / (weekLogs.length || 1);
      return { weekStart, avg: Number.isFinite(avg) ? Number(avg.toFixed(1)) : 0, count: weekLogs.length };
    });
  }, [analyticsLogs]);

  const volumeByMuscle = useMemo(() => {
    const exerciseMap = new Map(exercises.map((exercise) => [exercise.id, exercise]));
    const volume = new Map<string, number>();

    analyticsLogs.forEach((log) => {
      const exercise = exerciseMap.get(log.exercise_id ?? "");
      if (!exercise) return;
      const sets = Number(log.sets ?? 0);
      if (!sets) return;
      (exercise.muscles ?? []).forEach((muscle) => {
        volume.set(muscle, (volume.get(muscle) ?? 0) + sets);
      });
    });

    return Array.from(volume.entries())
      .map(([muscle, sets]) => ({ muscle, sets }))
      .sort((a, b) => b.sets - a.sets)
      .slice(0, 8);
  }, [analyticsLogs, exercises]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Entrenamiento</h1>
          <p className="text-sm text-zinc-400">Planes, sesiones, logs y analíticas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPlanId ?? ""} onValueChange={setSelectedPlanId}>
            <SelectTrigger className="bg-zinc-900 border-zinc-800 min-w-[220px]">
              <SelectValue placeholder="Selecciona un plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { if (selectedPlanId) { loadSessions(selectedPlanId); loadLogs(selectedPlanId); } }} className="border-zinc-800 bg-zinc-900">
            <RefreshCcw className="w-4 h-4 mr-2" />Refrescar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="builder">Plan builder</TabsTrigger>
          <TabsTrigger value="runner">Runner</TabsTrigger>
          <TabsTrigger value="exercises">Ejercicios</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
              <CardHeader>
                <CardTitle>Plan</CardTitle>
                <CardDescription>Crea o edita el plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Nombre</Label>
                  <Input value={planForm.name} onChange={(event) => setPlanForm((prev) => ({ ...prev, name: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
                </div>
                <div className="space-y-1">
                  <Label>Estado</Label>
                  <Select value={planForm.status} onValueChange={(value) => setPlanForm((prev) => ({ ...prev, status: value }))}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Notas</Label>
                  <Textarea value={planForm.notes} onChange={(event) => setPlanForm((prev) => ({ ...prev, notes: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={savePlan} className="bg-white text-black hover:bg-zinc-200">
                    <Save className="w-4 h-4 mr-2" />Guardar plan
                  </Button>
                  {editingPlanId && (
                    <Button variant="ghost" onClick={resetPlanForm}>Cancelar</Button>
                  )}
                </div>
                <div className="space-y-2">
                  {plans.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between border border-zinc-800 rounded-lg p-3 text-sm">
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-xs text-zinc-500">{plan.status}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => editPlan(plan)} className="text-zinc-400 hover:text-white">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deletePlan(plan.id)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
              <CardHeader>
                <CardTitle>Bloques</CardTitle>
                <CardDescription>Microciclos dentro del plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Título</Label>
                    <Input value={blockForm.title} onChange={(event) => setBlockForm((prev) => ({ ...prev, title: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
                  </div>
                  <div className="space-y-1">
                    <Label>Orden</Label>
                    <Input value={blockForm.order} onChange={(event) => setBlockForm((prev) => ({ ...prev, order: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
                  </div>
                  <div className="space-y-1">
                    <Label>Semanas</Label>
                    <Input value={blockForm.weeks} onChange={(event) => setBlockForm((prev) => ({ ...prev, weeks: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
                  </div>
                  <div className="space-y-1">
                    <Label>Objetivo</Label>
                    <Input value={blockForm.goal} onChange={(event) => setBlockForm((prev) => ({ ...prev, goal: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Notas</Label>
                  <Textarea value={blockForm.notes} onChange={(event) => setBlockForm((prev) => ({ ...prev, notes: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveBlock} className="bg-white text-black hover:bg-zinc-200">
                    <Save className="w-4 h-4 mr-2" />Guardar bloque
                  </Button>
                  {editingBlockId && (
                    <Button variant="ghost" onClick={resetBlockForm}>Cancelar</Button>
                  )}
                </div>
                <div className="space-y-2">
                  {blocks.map((block) => (
                    <div key={block.id} className="flex items-center justify-between border border-zinc-800 rounded-lg p-3 text-sm">
                      <div>
                        <div className="font-medium">{block.title}</div>
                        <div className="text-xs text-zinc-500">Orden {block.order} · {block.weeks} semanas</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => editBlock(block)} className="text-zinc-400 hover:text-white">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteBlock(block.id)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
            <CardHeader>
              <CardTitle>Sesiones</CardTitle>
              <CardDescription>Orden y ejercicios por sesión</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label>Bloque</Label>
                  <Select value={selectedBlockId ?? ""} onValueChange={setSelectedBlockId}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {blocks.map((block) => (
                        <SelectItem key={block.id} value={block.id}>{block.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Orden</Label>
                  <Input value={sessionForm.session_order} onChange={(event) => setSessionForm((prev) => ({ ...prev, session_order: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
                </div>
                <div className="space-y-1">
                  <Label>Etiqueta</Label>
                  <Input value={sessionForm.session_label} onChange={(event) => setSessionForm((prev) => ({ ...prev, session_label: event.target.value }))} className="bg-zinc-900 border-zinc-700" placeholder="Día A" />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Focus</Label>
                  <Input value={sessionForm.focus} onChange={(event) => setSessionForm((prev) => ({ ...prev, focus: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
                </div>
                <div className="space-y-1">
                  <Label>Notas</Label>
                  <Input value={sessionForm.notes} onChange={(event) => setSessionForm((prev) => ({ ...prev, notes: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Añadir ejercicio</Label>
                <div className="flex flex-wrap gap-2">
                  {exercises.slice(0, 8).map((exercise) => (
                    <Button key={exercise.id} variant="outline" onClick={() => addExerciseToSession(exercise.id)} className="border-zinc-800 bg-zinc-900 text-xs">
                      <Plus className="w-3 h-3 mr-1" /> {exercise.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {sessionExercises.map((exercise, index) => (
                  <div key={`${exercise.exercise_id}-${index}`} className="grid gap-2 md:grid-cols-5 border border-zinc-800 rounded-lg p-3 text-sm">
                    <div className="md:col-span-2">
                      <div className="font-medium">{exercise.name}</div>
                      <div className="text-xs text-zinc-500">{exercise.exercise_id}</div>
                    </div>
                    <Input value={exercise.sets} onChange={(event) => {
                      const value = Number(event.target.value) || 0;
                      setSessionExercises((prev) => prev.map((item, idx) => idx === index ? { ...item, sets: value } : item));
                    }} className="bg-zinc-900 border-zinc-700" placeholder="Sets" />
                    <Input value={exercise.reps} onChange={(event) => {
                      const value = Number(event.target.value) || 0;
                      setSessionExercises((prev) => prev.map((item, idx) => idx === index ? { ...item, reps: value } : item));
                    }} className="bg-zinc-900 border-zinc-700" placeholder="Reps" />
                    <Button variant="ghost" size="icon" onClick={() => setSessionExercises((prev) => prev.filter((_, idx) => idx !== index))} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={saveSession} className="bg-white text-black hover:bg-zinc-200">
                  <Save className="w-4 h-4 mr-2" />Guardar sesión
                </Button>
                {editingSessionId && (
                  <Button variant="ghost" onClick={resetSessionForm}>Cancelar</Button>
                )}
              </div>

              <div className="space-y-2">
                {sessionsSorted.map((session) => (
                  <div key={session.id} className="flex items-center justify-between border border-zinc-800 rounded-lg p-3 text-sm">
                    <div>
                      <div className="font-medium">{session.session_label || "Sesión"} · Orden {session.session_order}</div>
                      <div className="text-xs text-zinc-500">{session.focus} · {session.exercises?.length ?? 0} ejercicios</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => editSession(session)} className="text-zinc-400 hover:text-white">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteSession(session.id)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="runner" className="space-y-4">
          <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
            <CardHeader>
              <CardTitle>Próxima sesión</CardTitle>
              <CardDescription>El orden manda: siguiente session_order tras el último log</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!nextSession ? (
                <p className="text-sm text-zinc-500">No hay sesiones configuradas.</p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="text-lg font-semibold">{nextSession.session_label || "Sesión"}</div>
                    <div className="text-xs text-zinc-500">Orden {nextSession.session_order} · {nextSession.focus}</div>
                  </div>

                  <div className="space-y-2">
                    {nextSession.exercises.map((exercise, index) => (
                      <div key={`${exercise.exercise_id}-${index}`} className="grid gap-2 md:grid-cols-7 border border-zinc-800 rounded-lg p-3 text-sm">
                        <div className="md:col-span-2">
                          <div className="font-medium">{exercise.name}</div>
                          <div className="text-xs text-zinc-500">{exercise.sets}x{exercise.reps}</div>
                        </div>
                        <Input
                          value={logInputs[index]?.sets ?? ""}
                          onChange={(event) => setLogInputs((prev) => prev.map((item, idx) => idx === index ? { ...item, sets: event.target.value } : item))}
                          className="bg-zinc-900 border-zinc-700"
                          placeholder="Sets"
                        />
                        <Input
                          value={logInputs[index]?.reps ?? ""}
                          onChange={(event) => setLogInputs((prev) => prev.map((item, idx) => idx === index ? { ...item, reps: event.target.value } : item))}
                          className="bg-zinc-900 border-zinc-700"
                          placeholder="Reps"
                        />
                        <Input
                          value={logInputs[index]?.load ?? ""}
                          onChange={(event) => setLogInputs((prev) => prev.map((item, idx) => idx === index ? { ...item, load: event.target.value } : item))}
                          className="bg-zinc-900 border-zinc-700"
                          placeholder="Carga"
                        />
                        <Input
                          value={logInputs[index]?.rpe ?? ""}
                          onChange={(event) => setLogInputs((prev) => prev.map((item, idx) => idx === index ? { ...item, rpe: event.target.value } : item))}
                          className="bg-zinc-900 border-zinc-700"
                          placeholder="RPE"
                        />
                        <Input
                          value={logInputs[index]?.notes ?? ""}
                          onChange={(event) => setLogInputs((prev) => prev.map((item, idx) => idx === index ? { ...item, notes: event.target.value } : item))}
                          className="bg-zinc-900 border-zinc-700"
                          placeholder="Notas"
                        />
                      </div>
                    ))}
                  </div>

                  <Button onClick={saveWorkoutLog} className="bg-white text-black hover:bg-zinc-200">
                    <PlayCircle className="w-4 h-4 mr-2" /> Registrar sesión
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
            <CardHeader>
              <CardTitle>Historial reciente</CardTitle>
              <CardDescription>Últimos registros de este plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {logs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex justify-between border border-zinc-800 rounded-lg p-3 text-sm">
                  <div>
                    <div className="font-medium">{log.exercise_name}</div>
                    <div className="text-xs text-zinc-500">{log.date} · {log.sets}x{log.reps} · {log.load}kg</div>
                  </div>
                  <div className="text-xs text-zinc-400">RPE {log.rpe ?? "-"}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exercises" className="space-y-4">
          <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
            <CardHeader>
              <CardTitle>Biblioteca de ejercicios</CardTitle>
              <CardDescription>Crea tu catálogo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Nombre</Label>
                  <Input value={exerciseForm.name} onChange={(event) => setExerciseForm((prev) => ({ ...prev, name: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
                </div>
                <div className="space-y-1">
                  <Label>Categoría</Label>
                  <Select value={exerciseForm.category} onValueChange={(value) => setExerciseForm((prev) => ({ ...prev, category: value as Exercise["category"] }))}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Músculos (coma)</Label>
                  <Input value={exerciseForm.muscles} onChange={(event) => setExerciseForm((prev) => ({ ...prev, muscles: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
                </div>
                <div className="space-y-1">
                  <Label>Equipo</Label>
                  <Input value={exerciseForm.equipment} onChange={(event) => setExerciseForm((prev) => ({ ...prev, equipment: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input type="checkbox" checked={exerciseForm.is_public} onChange={(event) => setExerciseForm((prev) => ({ ...prev, is_public: event.target.checked }))} />
                Hacer público
              </label>
              <div className="flex gap-2">
                <Button onClick={saveExercise} className="bg-white text-black hover:bg-zinc-200">
                  <Save className="w-4 h-4 mr-2" />Guardar ejercicio
                </Button>
                {editingExerciseId && (
                  <Button variant="ghost" onClick={resetExerciseForm}>Cancelar</Button>
                )}
              </div>
              <div className="space-y-2">
                {exercises.map((exercise) => (
                  <div key={exercise.id} className="flex items-center justify-between border border-zinc-800 rounded-lg p-3 text-sm">
                    <div>
                      <div className="font-medium">{exercise.name}</div>
                      <div className="text-xs text-zinc-500">{exercise.category} · {(exercise.muscles ?? []).join(", ")}</div>
                    </div>
                    <div className="flex gap-2">
                      {canEditExercise(exercise) && (
                        <Button variant="ghost" size="icon" onClick={() => editExercise(exercise)} className="text-zinc-400 hover:text-white">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {canEditExercise(exercise) && (
                        <Button variant="ghost" size="icon" onClick={() => deleteExercise(exercise.id)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
            <CardHeader>
              <CardTitle>Plantillas</CardTitle>
              <CardDescription>Guarda y aplica planes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Título</Label>
                  <Input value={templateForm.title} onChange={(event) => setTemplateForm((prev) => ({ ...prev, title: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
                </div>
                <div className="space-y-1">
                  <Label>Objetivo</Label>
                  <Input value={templateForm.goal} onChange={(event) => setTemplateForm((prev) => ({ ...prev, goal: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
                </div>
                <div className="space-y-1">
                  <Label>Nivel</Label>
                  <Input value={templateForm.level} onChange={(event) => setTemplateForm((prev) => ({ ...prev, level: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
                </div>
                <div className="space-y-1">
                  <Label>Equipo</Label>
                  <Input value={templateForm.equipment} onChange={(event) => setTemplateForm((prev) => ({ ...prev, equipment: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
                </div>
                <div className="space-y-1">
                  <Label>Frecuencia</Label>
                  <Input value={templateForm.frequency} onChange={(event) => setTemplateForm((prev) => ({ ...prev, frequency: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Descripción</Label>
                <Textarea value={templateForm.description} onChange={(event) => setTemplateForm((prev) => ({ ...prev, description: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
              </div>
              <Button onClick={createTemplate} className="bg-white text-black hover:bg-zinc-200">
                <Save className="w-4 h-4 mr-2" />Guardar plantilla
              </Button>

              <div className="space-y-2">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between border border-zinc-800 rounded-lg p-3 text-sm">
                    <div>
                      <div className="font-medium">{template.title}</div>
                      <div className="text-xs text-zinc-500">{template.goal || ""} · {template.frequency ?? "-"} días</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => applyTemplate(template.id)} className="border-zinc-800 bg-zinc-900">
                        Aplicar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
              <CardHeader>
                <CardTitle>PRs</CardTitle>
                <CardDescription>Máxima carga por ejercicio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {prByExercise.length === 0 ? (
                  <p className="text-zinc-500">Sin datos</p>
                ) : (
                  prByExercise.map((pr) => (
                    <div key={pr.name} className="flex justify-between">
                      <span>{pr.name}</span>
                      <span>{pr.load} kg</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
              <CardHeader>
                <CardTitle>RPE 4 semanas</CardTitle>
                <CardDescription>Tendencia promedio semanal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {rpeTrend.map((week) => (
                  <div key={week.weekStart} className="flex justify-between">
                    <span>{week.weekStart}</span>
                    <span>{week.avg} ({week.count})</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
              <CardHeader>
                <CardTitle>Volumen por músculo</CardTitle>
                <CardDescription>Sets acumulados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {volumeByMuscle.length === 0 ? (
                  <p className="text-zinc-500">Sin datos</p>
                ) : (
                  volumeByMuscle.map((item) => (
                    <div key={item.muscle} className="flex justify-between">
                      <span>{item.muscle}</span>
                      <span>{item.sets} sets</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
