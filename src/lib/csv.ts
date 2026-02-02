function parseCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result.map((value) => value.trim());
}

export function parseCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [] as Record<string, string>[];
  }

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

export function stringifyCsv(rows: Array<Record<string, string | number | null | undefined>>, columns?: string[]) {
  const headers = columns && columns.length > 0 ? columns : Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  );

  const escapeCell = (value: string | number | null | undefined) => {
    const stringValue = value === null || value === undefined ? "" : String(value);
    if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
      return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    return stringValue;
  };

  const headerLine = headers.join(",");
  const lines = rows.map((row) => headers.map((header) => escapeCell(row[header])).join(","));
  return [headerLine, ...lines].join("\n");
}
