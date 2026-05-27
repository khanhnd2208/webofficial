/** Cell coordinate key: "row,col" */
export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function parseCellKey(key: string): [number, number] | null {
  const parts = key.split(',');
  if (parts.length !== 2) return null;
  const row = Number(parts[0]);
  const col = Number(parts[1]);
  if (!Number.isInteger(row) || !Number.isInteger(col)) return null;
  return [row, col];
}
