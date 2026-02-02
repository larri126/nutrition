export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function toIsoDate(value: Date | string) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? todayIso() : parsed.toISOString().slice(0, 10);
}

export function addDaysIso(dateIso: string, days: number) {
  const date = new Date(dateIso + "T00:00:00");
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function startOfWeekIso(dateIso: string) {
  const date = new Date(dateIso + "T00:00:00");
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday as week start
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}
