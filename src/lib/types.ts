export type ProfileRole = 'client' | 'coach' | 'admin';

export type Food = {
  id: string;
  owner_id: string | null;
  is_public: boolean;
  food_name: string;
  unit: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  fiber: number;
  type: 'mixed' | 'protein' | 'carb' | 'fat';
  created_at?: string;
  updated_at?: string;
};

export type MacroTarget = {
  id: string;
  client_id: string;
  date: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  fiber: number;
  notes?: string | null;
};

export type MacroSplitTemplate = {
  id: string;
  name: string;
  goal?: string | null;
  meals_count: number;
  split: Record<string, { kcal?: number; p?: number; c?: number; f?: number; fiber?: number }>;
  created_by?: string | null;
  is_public: boolean;
};

export type ClientMacroSplit = {
  client_id: string;
  template_id: string;
  active: boolean;
};

export type FoodLog = {
  id: string;
  client_id: string;
  date: string;
  meal_key: string;
  food_id: string;
  qty: number;
  unit: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  fiber: number;
  created_at?: string;
};

export type TrainingPlan = {
  id: string;
  client_id: string;
  coach_id?: string | null;
  name: string;
  status: 'draft' | 'active' | 'paused';
  notes?: string | null;
  created_at?: string;
};

export type TrainingBlock = {
  id: string;
  plan_id: string;
  client_id: string;
  title: string;
  order: number;
  weeks: number;
  goal?: string | null;
  notes?: string | null;
};

export type TrainingSession = {
  id: string;
  plan_id: string;
  block_id: string;
  client_id: string;
  block_title?: string | null;
  session_order: number;
  session_label?: string | null;
  focus?: string | null;
  notes?: string | null;
  exercises: Array<{
    exercise_id: string;
    name: string;
    sets: number;
    reps: number;
    rpe?: number;
    rest?: string;
    notes?: string;
  }>;
};

export type Exercise = {
  id: string;
  owner_id: string | null;
  is_public: boolean;
  name: string;
  category: 'pull' | 'push' | 'legs' | 'core' | 'full';
  muscles: string[];
  equipment?: string | null;
};

export type WorkoutLog = {
  id: string;
  client_id: string;
  plan_id?: string | null;
  session_id?: string | null;
  session_order?: number | null;
  exercise_id?: string | null;
  exercise_name?: string | null;
  sets: number;
  reps: number;
  load: number;
  rpe?: number | null;
  notes?: string | null;
  date: string;
  completed_at?: string | null;
};

export type TrainingTemplate = {
  id: string;
  title: string;
  goal?: string | null;
  level?: string | null;
  equipment?: string | null;
  frequency?: number | null;
  description?: string | null;
  created_by?: string | null;
  is_public: boolean;
  payload: Record<string, any>;
};

export type Checkin = {
  id: string;
  client_id: string;
  week_start: string;
  weight?: number | null;
  waist?: number | null;
  sleep?: number | null;
  steps?: number | null;
  stress?: number | null;
  hunger?: number | null;
  energy?: number | null;
  performance?: number | null;
  notes?: string | null;
};
