import { parseCell } from "./cell-parser";

export const getFusionSize = (fusion: string | undefined, startCell?: string) => {
  if (!fusion) return { colSpan: 1, rowSpan: 1 };
  
  const clean = fusion.replace(/[{}]/g, "").trim();

  // CASO 1: RANGO (Ej: "1A 2A")
  if (clean.includes(" ") && startCell) {
    const parts = clean.split(" ");
    const targetCode = parts.length === 2 ? parts[1] : parts[0]; 
    
    const start = parseCell(startCell);
    const end = parseCell(targetCode);

    if (start && end) {
      const colSpan = Math.abs(end.col - start.col) + 1;
      const rowSpan = Math.abs(end.row - start.row) + 1;
      return { colSpan, rowSpan };
    }
  }

  // CASO 2: DIRECCIONAL (Ej: "2wr")
  const match = clean.match(/^(\d*)([wh])([lrud])$/i);
  if (match) {
    const num = match[1] ? parseInt(match[1], 10) : 1;
    const dim = match[2].toLowerCase();
    
    if (dim === 'w') return { colSpan: num, rowSpan: 1 };
    if (dim === 'h') return { colSpan: 1, rowSpan: num };
  }
  
  return { colSpan: 1, rowSpan: 1 };
};
