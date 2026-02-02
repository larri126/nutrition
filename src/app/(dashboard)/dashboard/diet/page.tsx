'use client';

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, RefreshCcw, Trash2, Pencil, Download, Calculator } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slug";
import { todayIso } from "@/lib/date";
import { parseCsv, stringifyCsv } from "@/lib/csv";
import { downloadText } from "@/lib/download";
import { useProfile } from "@/features/auth/useProfile";
import { useActiveClient } from "@/features/coach/ActiveClientContext";
import type { Food, FoodLog, MacroSplitTemplate, MacroTarget } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MEAL_KEYS = [
  { key: "breakfast", label: "Desayuno" },
  { key: "lunch", label: "Comida" },
  { key: "dinner", label: "Cena" },
  { key: "snack", label: "Merienda" },
  { key: "extra", label: "Extra" },
];

const MACRO_KEYS = [
  { key: "kcal", label: "Kcal" },
  { key: "p", label: "Proteínas" },
  { key: "c", label: "Carbohidratos" },
  { key: "f", label: "Grasas" },
  { key: "fiber", label: "Fibra" },
] as const;

type MacroKey = (typeof MACRO_KEYS)[number]["key"];

type FoodFormState = {
  id: string;
  food_name: string;
  unit: string;
  kcal: string;
  p: string;
  c: string;
  f: string;
  fiber: string;
  type: Food["type"];
  is_public: boolean;
};

const emptyFoodForm: FoodFormState = {
  id: "",
  food_name: "",
  unit: "",
  kcal: "",
  p: "",
  c: "",
  f: "",
  fiber: "",
  type: "mixed",
  is_public: false,
};

export default function DietPage() {
  const supabase = useMemo(() => createClient(), []);
  const { profile, loading: profileLoading } = useProfile();
  const { activeClientId } = useActiveClient();

  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [foods, setFoods] = useState<Food[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [macroTarget, setMacroTarget] = useState<MacroTarget | null>(null);
  const [templates, setTemplates] = useState<MacroSplitTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const [foodForm, setFoodForm] = useState<FoodFormState>(emptyFoodForm);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);

  const [logMealKey, setLogMealKey] = useState(MEAL_KEYS[0].key);
  const [logFoodId, setLogFoodId] = useState("");
  const [logQty, setLogQty] = useState("");
  const [inverseMode, setInverseMode] = useState(false);
  const [inverseMacroKey, setInverseMacroKey] = useState<MacroKey>("c");
  const [inverseMacroValue, setInverseMacroValue] = useState("");

  const [targetForm, setTargetForm] = useState({
    kcal: "",
    p: "",
    c: "",
    f: "",
    fiber: "",
    notes: "",
  });

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    goal: "maint",
    meals_count: 4,
    split: {
      breakfast: { kcal: 25, p: 25, c: 25, f: 25, fiber: 25 },
      lunch: { kcal: 30, p: 30, c: 30, f: 30, fiber: 30 },
      dinner: { kcal: 30, p: 30, c: 30, f: 30, fiber: 30 },
      snack: { kcal: 15, p: 15, c: 15, f: 15, fiber: 15 },
    } as Record<string, Record<MacroKey, number>>,
  });

  const clientId = activeClientId ?? profile?.id ?? null;
  const isCoach = profile?.role === "coach" || profile?.role === "admin";

  const parseNumber = (value: string) => {
    if (!value.trim()) return null;
    const normalized = value.replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const loadFoods = async () => {
    const { data, error } = await supabase.from("foods").select("*").order("food_name");
    if (error) {
      toast.error("No se pudieron cargar los alimentos");
      return;
    }
    setFoods((data ?? []) as Food[]);
  };

  const loadLogs = async () => {
    if (!clientId) return;
    const { data, error } = await supabase
      .from("food_logs")
      .select("*")
      .eq("client_id", clientId)
      .eq("date", selectedDate)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("No se pudieron cargar los registros");
      return;
    }

    setFoodLogs((data ?? []) as FoodLog[]);
  };

  const loadTarget = async () => {
    if (!clientId) return;
    const { data } = await supabase
      .from("macro_targets")
      .select("*")
      .eq("client_id", clientId)
      .eq("date", selectedDate)
      .maybeSingle();

    if (data) {
      setMacroTarget(data as MacroTarget);
      setTargetForm({
        kcal: String(data.kcal ?? ""),
        p: String(data.p ?? ""),
        c: String(data.c ?? ""),
        f: String(data.f ?? ""),
        fiber: String(data.fiber ?? ""),
        notes: data.notes ?? "",
      });
    } else {
      setMacroTarget(null);
      setTargetForm({ kcal: "", p: "", c: "", f: "", fiber: "", notes: "" });
    }
  };

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from("macro_split_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("No se pudieron cargar las plantillas");
      return;
    }
    setTemplates((data ?? []) as MacroSplitTemplate[]);
  };

  const loadActiveTemplate = async () => {
    if (!clientId) return;
    const { data } = await supabase
      .from("client_macro_splits")
      .select("template_id,active")
      .eq("client_id", clientId)
      .eq("active", true)
      .maybeSingle();
    setActiveTemplateId(data?.template_id ?? null);
  };

  useEffect(() => {
    if (!profileLoading) {
      loadFoods();
    }
  }, [profileLoading]);

  useEffect(() => {
    if (!clientId) return;
    loadLogs();
    loadTarget();
    loadTemplates();
    loadActiveTemplate();
  }, [clientId, selectedDate]);

  const totals = foodLogs.reduce(
    (acc, log) => {
      acc.kcal += Number(log.kcal ?? 0);
      acc.p += Number(log.p ?? 0);
      acc.c += Number(log.c ?? 0);
      acc.f += Number(log.f ?? 0);
      acc.fiber += Number(log.fiber ?? 0);
      return acc;
    },
    { kcal: 0, p: 0, c: 0, f: 0, fiber: 0 }
  );

  const remaining = {
    kcal: (macroTarget?.kcal ?? 0) - totals.kcal,
    p: (macroTarget?.p ?? 0) - totals.p,
    c: (macroTarget?.c ?? 0) - totals.c,
    f: (macroTarget?.f ?? 0) - totals.f,
    fiber: (macroTarget?.fiber ?? 0) - totals.fiber,
  };

  const handleFoodSubmit = async () => {
    if (!profile) {
      toast.error("Necesitas iniciar sesión");
      return;
    }

    const name = foodForm.food_name.trim();
    const unit = foodForm.unit.trim();
    if (!name || !unit) {
      toast.error("Nombre y unidad son obligatorios");
      return;
    }

    const kcal = parseNumber(foodForm.kcal);
    const p = parseNumber(foodForm.p);
    const c = parseNumber(foodForm.c);
    const f = parseNumber(foodForm.f);
    const fiber = parseNumber(foodForm.fiber);

    if ([kcal, p, c, f, fiber].some((value) => value === null || value < 0)) {
      toast.error("Macros inválidos");
      return;
    }

    const foodId = slugify(foodForm.id || name);

    const payload = {
      id: foodId,
      owner_id: isCoach && activeClientId ? activeClientId : profile.id,
      is_public: foodForm.is_public,
      food_name: name,
      unit,
      kcal,
      p,
      c,
      f,
      fiber,
      type: foodForm.type,
    };

    if (editingFoodId) {
      const { error } = await supabase.from("foods").update(payload).eq("id", editingFoodId);
      if (error) {
        toast.error("No se pudo actualizar el alimento");
        return;
      }
      toast.success("Alimento actualizado");
    } else {
      const { error } = await supabase.from("foods").insert(payload);
      if (error) {
        toast.error("No se pudo crear el alimento");
        return;
      }
      toast.success("Alimento creado");
    }

    setFoodForm(emptyFoodForm);
    setEditingFoodId(null);
    await loadFoods();
  };

  const startEditFood = (food: Food) => {
    setEditingFoodId(food.id);
    setFoodForm({
      id: food.id,
      food_name: food.food_name,
      unit: food.unit,
      kcal: String(food.kcal ?? ""),
      p: String(food.p ?? ""),
      c: String(food.c ?? ""),
      f: String(food.f ?? ""),
      fiber: String(food.fiber ?? ""),
      type: food.type,
      is_public: food.is_public,
    });
  };

  const deleteFood = async (food: Food) => {
    const { error } = await supabase.from("foods").delete().eq("id", food.id);
    if (error) {
      toast.error("No se pudo eliminar");
      return;
    }
    toast.success("Alimento eliminado");
    loadFoods();
  };

  const addFoodLog = async () => {
    if (!clientId) {
      toast.error("Selecciona un cliente");
      return;
    }
    const selectedFood = foods.find((food) => food.id === logFoodId);
    if (!selectedFood) {
      toast.error("Selecciona un alimento");
      return;
    }

    let qtyValue = parseNumber(logQty);
    if (inverseMode) {
      const target = parseNumber(inverseMacroValue);
      if (!target || target <= 0) {
        toast.error("Introduce la meta del macro");
        return;
      }
      const macroBase = Number(selectedFood[inverseMacroKey]);
      if (!macroBase || macroBase <= 0) {
        toast.error("Ese alimento no tiene ese macro");
        return;
      }
      qtyValue = target / macroBase;
    }

    if (!qtyValue || qtyValue <= 0) {
      toast.error("Cantidad inválida");
      return;
    }

    const toFixed = (value: number) => Number(value.toFixed(2));
    const macros = {
      kcal: toFixed(Number(selectedFood.kcal) * qtyValue),
      p: toFixed(Number(selectedFood.p) * qtyValue),
      c: toFixed(Number(selectedFood.c) * qtyValue),
      f: toFixed(Number(selectedFood.f) * qtyValue),
      fiber: toFixed(Number(selectedFood.fiber) * qtyValue),
    };

    const { error } = await supabase.from("food_logs").insert({
      client_id: clientId,
      date: selectedDate,
      meal_key: logMealKey,
      food_id: selectedFood.id,
      qty: qtyValue,
      unit: selectedFood.unit,
      ...macros,
    });

    if (error) {
      toast.error("No se pudo guardar el registro");
      return;
    }

    toast.success("Registro guardado");
    setLogQty("");
    setInverseMacroValue("");
    loadLogs();
  };

  const deleteLog = async (logId: string) => {
    const { error } = await supabase.from("food_logs").delete().eq("id", logId);
    if (error) {
      toast.error("No se pudo eliminar");
      return;
    }
    loadLogs();
  };

  const saveTarget = async () => {
    if (!clientId) {
      toast.error("Selecciona un cliente");
      return;
    }

    const values = {
      kcal: parseNumber(targetForm.kcal),
      p: parseNumber(targetForm.p),
      c: parseNumber(targetForm.c),
      f: parseNumber(targetForm.f),
      fiber: parseNumber(targetForm.fiber),
    };

    if (Object.values(values).some((value) => value === null || value < 0)) {
      toast.error("Macros inválidos");
      return;
    }

    const { error } = await supabase.from("macro_targets").upsert(
      {
        client_id: clientId,
        date: selectedDate,
        kcal: values.kcal ?? 0,
        p: values.p ?? 0,
        c: values.c ?? 0,
        f: values.f ?? 0,
        fiber: values.fiber ?? 0,
        notes: targetForm.notes,
      },
      { onConflict: "client_id,date" }
    );

    if (error) {
      toast.error("No se pudo guardar el objetivo");
      return;
    }

    toast.success("Objetivo actualizado");
    loadTarget();
  };

  const createTemplate = async () => {
    if (!profile || !isCoach) {
      toast.error("Solo coaches pueden crear plantillas");
      return;
    }
    if (!newTemplate.name.trim()) {
      toast.error("Nombre requerido");
      return;
    }

    const { error } = await supabase.from("macro_split_templates").insert({
      name: newTemplate.name.trim(),
      goal: newTemplate.goal,
      meals_count: newTemplate.meals_count,
      split: newTemplate.split,
      created_by: profile.id,
      is_public: true,
    });

    if (error) {
      toast.error("No se pudo crear la plantilla");
      return;
    }

    toast.success("Plantilla creada");
    setNewTemplate((prev) => ({ ...prev, name: "" }));
    loadTemplates();
  };

  const activateTemplate = async (templateId: string) => {
    if (!clientId) return;
    await supabase.from("client_macro_splits").update({ active: false }).eq("client_id", clientId);
    const { error } = await supabase.from("client_macro_splits").upsert({
      client_id: clientId,
      template_id: templateId,
      active: true,
    });
    if (error) {
      toast.error("No se pudo activar");
      return;
    }
    setActiveTemplateId(templateId);
  };

  const exportData = (type: "foods" | "targets" | "logs", format: "json" | "csv") => {
    let data: any[] = [];
    if (type === "foods") data = foods;
    if (type === "targets" && macroTarget) data = [macroTarget];
    if (type === "logs") data = foodLogs;

    if (format === "json") {
      downloadText(`${type}-${selectedDate}.json`, JSON.stringify(data, null, 2), "application/json");
      return;
    }

    downloadText(`${type}-${selectedDate}.csv`, stringifyCsv(data), "text/csv;charset=utf-8");
  };

  const importData = async (type: "foods" | "targets" | "logs", file: File) => {
    const text = await file.text();
    let rows: any[] = [];

    try {
      if (file.name.endsWith(".json")) {
        rows = JSON.parse(text);
      } else {
        rows = parseCsv(text);
      }
    } catch (error) {
      toast.error("Archivo inválido");
      return;
    }

    if (type === "foods") {
      if (!profile) return;
      const payload = rows.map((row) => ({
        id: slugify(row.id || row.food_name || row.name || "food"),
        owner_id: isCoach && activeClientId ? activeClientId : profile.id,
        is_public: row.is_public === true || row.is_public === "true" || row.is_public === 1,
        food_name: row.food_name || row.name || "",
        unit: row.unit || "",
        kcal: Number(row.kcal ?? 0),
        p: Number(row.p ?? 0),
        c: Number(row.c ?? 0),
        f: Number(row.f ?? 0),
        fiber: Number(row.fiber ?? 0),
        type: row.type || "mixed",
      }));

      const { error } = await supabase.from("foods").upsert(payload, { onConflict: "id" });
      if (error) {
        toast.error("No se pudo importar alimentos");
        return;
      }
      toast.success("Alimentos importados");
      loadFoods();
      return;
    }

    if (!clientId) return;

    if (type === "targets") {
      const payload = rows.map((row) => ({
        client_id: clientId,
        date: row.date || selectedDate,
        kcal: Number(row.kcal ?? 0),
        p: Number(row.p ?? 0),
        c: Number(row.c ?? 0),
        f: Number(row.f ?? 0),
        fiber: Number(row.fiber ?? 0),
        notes: row.notes ?? null,
      }));

      const { error } = await supabase.from("macro_targets").upsert(payload, { onConflict: "client_id,date" });
      if (error) {
        toast.error("No se pudo importar objetivos");
        return;
      }
      toast.success("Objetivos importados");
      loadTarget();
      return;
    }

    if (type === "logs") {
      const payload = rows.map((row) => ({
        client_id: clientId,
        date: row.date || selectedDate,
        meal_key: row.meal_key || "meal",
        food_id: row.food_id || row.food || "",
        qty: Number(row.qty ?? 0),
        unit: row.unit || "",
        kcal: Number(row.kcal ?? 0),
        p: Number(row.p ?? 0),
        c: Number(row.c ?? 0),
        f: Number(row.f ?? 0),
        fiber: Number(row.fiber ?? 0),
      }));

      const { error } = await supabase.from("food_logs").insert(payload);
      if (error) {
        toast.error("No se pudo importar registros");
        return;
      }
      toast.success("Registros importados");
      loadLogs();
    }
  };

  const activeTemplate = templates.find((template) => template.id === activeTemplateId) ?? null;

  const macroSplitView = activeTemplate && macroTarget
    ? Object.entries(activeTemplate.split).map(([mealKey, values]) => ({
        mealKey,
        label: MEAL_KEYS.find((meal) => meal.key === mealKey)?.label ?? mealKey,
        macros: values,
        computed: {
          kcal: Math.round((macroTarget.kcal || 0) * ((values.kcal ?? 0) / 100)),
          p: Math.round((macroTarget.p || 0) * ((values.p ?? 0) / 100)),
          c: Math.round((macroTarget.c || 0) * ((values.c ?? 0) / 100)),
          f: Math.round((macroTarget.f || 0) * ((values.f ?? 0) / 100)),
          fiber: Math.round((macroTarget.fiber || 0) * ((values.fiber ?? 0) / 100)),
        },
      }))
    : [];

  const canEditFood = (food: Food) => {
    if (!profile) return false;
    if (profile.role === "admin") return true;
    if (food.owner_id === profile.id) return true;
    if (isCoach && activeClientId && food.owner_id === activeClientId) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dieta</h1>
          <p className="text-sm text-zinc-400">Controla objetivos, comidas y plantillas de macros.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="bg-zinc-900 border-zinc-800" />
          <Button variant="outline" onClick={() => { loadLogs(); loadTarget(); }} className="border-zinc-800 bg-zinc-900">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refrescar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <CardHeader>
            <CardTitle className="text-lg">Resumen diario</CardTitle>
            <CardDescription>Objetivo vs consumido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {MACRO_KEYS.map((macro) => (
              <div key={macro.key} className="flex items-center justify-between">
                <span className="text-zinc-400">{macro.label}</span>
                <span>
                  {Math.round(totals[macro.key])} / {Math.round(macroTarget?.[macro.key] ?? 0)}
                  <span className="text-zinc-500 ml-2">(restan {Math.round(remaining[macro.key])})</span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800 text-zinc-100 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Registrar comida</CardTitle>
            <CardDescription>Selecciona un alimento y registra la cantidad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Comida</Label>
                <Select value={logMealKey} onValueChange={setLogMealKey}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700">
                    <SelectValue placeholder="Comida" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEAL_KEYS.map((meal) => (
                      <SelectItem key={meal.key} value={meal.key}>
                        {meal.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alimento</Label>
                <Select value={logFoodId} onValueChange={setLogFoodId}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {foods.map((food) => (
                      <SelectItem key={food.id} value={food.id}>
                        {food.food_name} ({food.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input
                  value={logQty}
                  onChange={(event) => setLogQty(event.target.value)}
                  placeholder="Ej: 1"
                  className="bg-zinc-900 border-zinc-700"
                  disabled={inverseMode}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input type="checkbox" checked={inverseMode} onChange={(event) => setInverseMode(event.target.checked)} />
                Modo inverso (quiero X macros)
              </label>
              <Button onClick={addFoodLog} className="bg-white text-black hover:bg-zinc-200">
                <Plus className="w-4 h-4 mr-2" /> Agregar
              </Button>
            </div>

            {inverseMode && (
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Macro</Label>
                  <Select value={inverseMacroKey} onValueChange={(value) => setInverseMacroKey(value as MacroKey)}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700">
                      <SelectValue placeholder="Macro" />
                    </SelectTrigger>
                    <SelectContent>
                      {MACRO_KEYS.map((macro) => (
                        <SelectItem key={macro.key} value={macro.key}>
                          {macro.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Meta del macro</Label>
                  <Input
                    value={inverseMacroValue}
                    onChange={(event) => setInverseMacroValue(event.target.value)}
                    placeholder="Ej: 50"
                    className="bg-zinc-900 border-zinc-700"
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-xs text-zinc-500 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Se calcula la cantidad automáticamente
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="logs">Registros</TabsTrigger>
          <TabsTrigger value="foods">Alimentos</TabsTrigger>
          <TabsTrigger value="targets">Objetivos</TabsTrigger>
          <TabsTrigger value="splits">Plantillas</TabsTrigger>
          <TabsTrigger value="import">Import/Export</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <CardHeader>
            <CardTitle>Registros del día</CardTitle>
            <CardDescription>{selectedDate}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {foodLogs.length === 0 ? (
              <p className="text-sm text-zinc-500">No hay registros todavía.</p>
            ) : (
              foodLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between border border-zinc-800 rounded-lg p-3 text-sm">
                  <div>
                    <div className="font-medium">{foods.find((food) => food.id === log.food_id)?.food_name || log.food_id}</div>
                    <div className="text-xs text-zinc-500">{log.meal_key} · {log.qty} {log.unit}</div>
                    <div className="text-xs text-zinc-400">{Math.round(log.kcal)} kcal · P{Math.round(log.p)} C{Math.round(log.c)} F{Math.round(log.f)}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteLog(log.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <CardHeader>
            <CardTitle>Objetivo del día</CardTitle>
            <CardDescription>Macros para {selectedDate}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label>Kcal</Label>
                <Input value={targetForm.kcal} onChange={(event) => setTargetForm((prev) => ({ ...prev, kcal: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
              </div>
              <div className="space-y-1">
                <Label>Proteínas</Label>
                <Input value={targetForm.p} onChange={(event) => setTargetForm((prev) => ({ ...prev, p: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
              </div>
              <div className="space-y-1">
                <Label>Carbohidratos</Label>
                <Input value={targetForm.c} onChange={(event) => setTargetForm((prev) => ({ ...prev, c: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
              </div>
              <div className="space-y-1">
                <Label>Grasas</Label>
                <Input value={targetForm.f} onChange={(event) => setTargetForm((prev) => ({ ...prev, f: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
              </div>
              <div className="space-y-1">
                <Label>Fibra</Label>
                <Input value={targetForm.fiber} onChange={(event) => setTargetForm((prev) => ({ ...prev, fiber: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notas</Label>
              <Textarea value={targetForm.notes} onChange={(event) => setTargetForm((prev) => ({ ...prev, notes: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
            </div>
            <Button onClick={saveTarget} className="bg-white text-black hover:bg-zinc-200">Guardar objetivo</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <CardHeader>
            <CardTitle>Gestión de alimentos</CardTitle>
            <CardDescription>Publica o gestiona tus alimentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Nombre</Label>
                <Input value={foodForm.food_name} onChange={(event) => setFoodForm((prev) => ({ ...prev, food_name: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
              </div>
              <div className="space-y-1">
                <Label>Unidad</Label>
                <Input value={foodForm.unit} onChange={(event) => setFoodForm((prev) => ({ ...prev, unit: event.target.value }))} className="bg-zinc-900 border-zinc-700" placeholder="100g" />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label>Kcal</Label>
                <Input value={foodForm.kcal} onChange={(event) => setFoodForm((prev) => ({ ...prev, kcal: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
              </div>
              <div className="space-y-1">
                <Label>P</Label>
                <Input value={foodForm.p} onChange={(event) => setFoodForm((prev) => ({ ...prev, p: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
              </div>
              <div className="space-y-1">
                <Label>C</Label>
                <Input value={foodForm.c} onChange={(event) => setFoodForm((prev) => ({ ...prev, c: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
              </div>
              <div className="space-y-1">
                <Label>F</Label>
                <Input value={foodForm.f} onChange={(event) => setFoodForm((prev) => ({ ...prev, f: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
              </div>
              <div className="space-y-1">
                <Label>Fibra</Label>
                <Input value={foodForm.fiber} onChange={(event) => setFoodForm((prev) => ({ ...prev, fiber: event.target.value }))} className="bg-zinc-900 border-zinc-700" />
              </div>
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={foodForm.type} onValueChange={(value) => setFoodForm((prev) => ({ ...prev, type: value as Food["type"] }))}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">Mixto</SelectItem>
                    <SelectItem value="protein">Proteína</SelectItem>
                    <SelectItem value="carb">Carbo</SelectItem>
                    <SelectItem value="fat">Grasa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input type="checkbox" checked={foodForm.is_public} onChange={(event) => setFoodForm((prev) => ({ ...prev, is_public: event.target.checked }))} />
              Hacer público
            </label>

            <div className="flex gap-2">
              <Button onClick={handleFoodSubmit} className="bg-white text-black hover:bg-zinc-200">
                {editingFoodId ? "Guardar cambios" : "Añadir alimento"}
              </Button>
              {editingFoodId && (
                <Button variant="ghost" onClick={() => { setEditingFoodId(null); setFoodForm(emptyFoodForm); }}>
                  Cancelar
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {foods.map((food) => (
                <div key={food.id} className="flex items-center justify-between border border-zinc-800 rounded-lg p-3 text-sm">
                  <div>
                    <div className="font-medium">{food.food_name}</div>
                    <div className="text-xs text-zinc-500">{food.kcal} kcal · P{food.p} C{food.c} F{food.f} · {food.unit}</div>
                  </div>
                  <div className="flex gap-2">
                    {canEditFood(food) && (
                      <Button variant="ghost" size="icon" onClick={() => startEditFood(food)} className="text-zinc-400 hover:text-white">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {canEditFood(food) && (
                      <Button variant="ghost" size="icon" onClick={() => deleteFood(food)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <CardHeader>
            <CardTitle>Plantillas de macros</CardTitle>
            <CardDescription>Distribuye tus macros por comida</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between border border-zinc-800 rounded-lg p-3 text-sm">
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-zinc-500">{template.goal || ""} · {template.meals_count} comidas</div>
                  </div>
                  <Button
                    variant={activeTemplateId === template.id ? "default" : "outline"}
                    onClick={() => activateTemplate(template.id)}
                  >
                    {activeTemplateId === template.id ? "Activa" : "Activar"}
                  </Button>
                </div>
              ))}
            </div>

            {activeTemplate && macroTarget && (
              <div className="border border-zinc-800 rounded-lg p-3 text-xs text-zinc-400">
                <div className="font-semibold text-zinc-200 mb-2">Reparto para {activeTemplate.name}</div>
                {macroSplitView.map((row) => (
                  <div key={row.mealKey} className="flex justify-between">
                    <span>{row.label}</span>
                    <span>
                      {row.computed.kcal} kcal · P{row.computed.p} C{row.computed.c} F{row.computed.f}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {isCoach && (
              <div className="space-y-2 border-t border-zinc-800 pt-3">
                <Label>Nueva plantilla</Label>
                <Input
                  value={newTemplate.name}
                  onChange={(event) => setNewTemplate((prev) => ({ ...prev, name: event.target.value }))}
                  className="bg-zinc-900 border-zinc-700"
                  placeholder="Corte 4 comidas"
                />
                <Button onClick={createTemplate} className="bg-white text-black hover:bg-zinc-200">Crear plantilla</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
        <CardHeader>
          <CardTitle>Importar / Exportar</CardTitle>
          <CardDescription>CSV o JSON para foods, targets y logs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exportData("foods", "json")} className="border-zinc-800 bg-zinc-900"><Download className="w-4 h-4 mr-2" />Foods JSON</Button>
            <Button variant="outline" onClick={() => exportData("foods", "csv")} className="border-zinc-800 bg-zinc-900"><Download className="w-4 h-4 mr-2" />Foods CSV</Button>
            <Button variant="outline" onClick={() => exportData("targets", "json")} className="border-zinc-800 bg-zinc-900"><Download className="w-4 h-4 mr-2" />Targets JSON</Button>
            <Button variant="outline" onClick={() => exportData("targets", "csv")} className="border-zinc-800 bg-zinc-900"><Download className="w-4 h-4 mr-2" />Targets CSV</Button>
            <Button variant="outline" onClick={() => exportData("logs", "json")} className="border-zinc-800 bg-zinc-900"><Download className="w-4 h-4 mr-2" />Logs JSON</Button>
            <Button variant="outline" onClick={() => exportData("logs", "csv")} className="border-zinc-800 bg-zinc-900"><Download className="w-4 h-4 mr-2" />Logs CSV</Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Importar foods</Label>
              <Input type="file" accept=".json,.csv" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) importData("foods", file);
              }} className="bg-zinc-900 border-zinc-700" />
            </div>
            <div className="space-y-2">
              <Label>Importar targets</Label>
              <Input type="file" accept=".json,.csv" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) importData("targets", file);
              }} className="bg-zinc-900 border-zinc-700" />
            </div>
            <div className="space-y-2">
              <Label>Importar logs</Label>
              <Input type="file" accept=".json,.csv" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) importData("logs", file);
              }} className="bg-zinc-900 border-zinc-700" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
