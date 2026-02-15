/* src/ubs/utils/cell-parser.ts */
export const parseCell = (cellCode: string | undefined) => {
  if (!cellCode) return null; // Si no hay celda, devolvemos null

  const match = cellCode.match(/^(\d+)([A-Z]+)$/);
  if (!match) return null;

  const row = parseInt(match[1], 10);
  const colLetters = match[2];

  let col = 0;
  for (let i = 0; i < colLetters.length; i++) {
    col = col * 26 + (colLetters.charCodeAt(i) - 64);
  }

  return { row, col };
};
