import {
  EIP712PathSegment,
  IEIP712DisplayRow,
  keyToLabel
} from 'casper-wallet-core';

export interface Eip712RowItem {
  row: IEIP712DisplayRow;
  label: string;
}

export type Eip712RowEntry =
  | { kind: 'row'; item: Eip712RowItem }
  | { kind: 'group'; label: string; items: Eip712RowItem[] };

/** Mirrors core's `pathToLabel`: `['details', 0, 'token']` → `'Details #1 › Token'`. */
function pathToLabel(path: EIP712PathSegment[]): string {
  const labels: string[] = [];
  for (const segment of path) {
    if (typeof segment === 'number') {
      labels[labels.length - 1] += ` #${segment + 1}`;
    } else {
      labels.push(keyToLabel(segment));
    }
  }
  return labels.join(' › ');
}

/** Splits a path at its last field name: the struct holding the value, and the value's own path. */
function splitPath(path: EIP712PathSegment[]) {
  let lastKey = path.length - 1;
  while (lastKey >= 0 && typeof path[lastKey] !== 'string') {
    lastKey--;
  }
  return { parent: path.slice(0, lastKey), own: path.slice(lastKey) };
}

/**
 * Groups rows by parent struct under that struct's label. Ungrouped rows come first and groups
 * after, so a group ends only at the next header or the list's end; a top-level row never reads
 * as part of the group above it. A struct with one shown field stays a single ungrouped row.
 */
export function groupEip712Rows(rows: IEIP712DisplayRow[]): Eip712RowEntry[] {
  const plain: Eip712RowEntry[] = [];
  const groups = new Map<string, { label: string; items: Eip712RowItem[] }>();

  for (const row of rows) {
    const { parent, own } = row.path
      ? splitPath(row.path)
      : { parent: [], own: [] };

    if (parent.length === 0) {
      plain.push({ kind: 'row', item: { row, label: row.label } });
      continue;
    }

    const key = JSON.stringify(parent);
    const group = groups.get(key) ?? { label: pathToLabel(parent), items: [] };
    group.items.push({ row, label: pathToLabel(own) });
    groups.set(key, group);
  }

  const grouped: Eip712RowEntry[] = [];
  for (const { label, items } of groups.values()) {
    if (items.length === 1) {
      const [{ row }] = items;
      plain.push({ kind: 'row', item: { row, label: row.label } });
    } else {
      grouped.push({ kind: 'group', label, items });
    }
  }

  return [...plain, ...grouped];
}
