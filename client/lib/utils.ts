import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function swap<T>(arr: T[], index1: number, index2: number) {
  [arr[index1], arr[index2]] = [arr[index2], arr[index1]];
  return arr;
}

export function findIndexOfValue(map: Map<any, any>, key: any): number {
  return Array.from(map.values()).indexOf(key);
}
export function findIndexOfKey(map: Map<any, any>, key: any): number {
  return Array.from(map.keys()).indexOf(key);
}

export function swapInMap<T, U>(
  map: Map<T, U>,
  index1: number,
  index2: number
): Map<T, U> {
  const keys = Array.from(map.keys());
  if (index1 < keys.length && index2 < keys.length) {
    const [key1, key2] = [keys[index1], keys[index2]];
    const value1 = map.get(key1);
    const value2 = map.get(key2);
    if (value1 !== undefined && value2 !== undefined) {
      map.set(key1, value2);
      map.set(key2, value1);
    }
  }
  return new Map(map);
}

export function reorderMap<T, U>(
  map: Map<T, U>,
  index1: number,
  index2: number
): Map<T, U> {
  const entries = Array.from(map.entries()); // Convert Map to an array of [key, value] pairs

  if (index1 < entries.length && index2 < entries.length) {
    // Swap the entries
    [entries[index1], entries[index2]] = [entries[index2], entries[index1]];
  }

  return new Map(entries); // Return a new Map with the reordered entries
}

export function getKeyFromValue<V, K>(map: Map<K, V>, value: V): K | undefined {
  const entries = map.entries();
  let entry = entries.next();

  while (!entry.done) {
    const [key, val] = entry.value;
    if (val === value) {
      return key;
    }
    entry = entries.next();
  }

  return undefined; // Return undefined if the value is not found
}
