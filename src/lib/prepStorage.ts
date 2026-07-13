import { PREP_CHECKS_KEY } from "@/lib/storage";

export type StoredPrepChecks = {
  checked: string[];
};

const EMPTY_PREP_CHECKS: StoredPrepChecks = { checked: [] };
const PREP_STORAGE_EVENT = "fukuoka-prep-checks-change";

export function parsePrepChecksSnapshot(value: string): StoredPrepChecks {
  try {
    const parsed = JSON.parse(value);
    return {
      checked: Array.isArray(parsed.checked) ? parsed.checked.filter((id: unknown) => typeof id === "string") : [],
    };
  } catch {
    return EMPTY_PREP_CHECKS;
  }
}

export function readPrepChecks(): StoredPrepChecks {
  if (typeof window === "undefined") return EMPTY_PREP_CHECKS;
  return parsePrepChecksSnapshot(localStorage.getItem(PREP_CHECKS_KEY) ?? "");
}

export function writePrepChecks(value: StoredPrepChecks) {
  localStorage.setItem(PREP_CHECKS_KEY, JSON.stringify({ checked: Array.from(new Set(value.checked)) }));
  window.dispatchEvent(new Event(PREP_STORAGE_EVENT));
}

export function togglePrepCheck(id: string) {
  const current = readPrepChecks();
  const checked = new Set(current.checked);
  if (checked.has(id)) checked.delete(id);
  else checked.add(id);
  writePrepChecks({ checked: Array.from(checked) });
}

export function clearPrepChecks() {
  localStorage.removeItem(PREP_CHECKS_KEY);
  window.dispatchEvent(new Event(PREP_STORAGE_EVENT));
}

export function subscribeToPrepChecks(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(PREP_STORAGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PREP_STORAGE_EVENT, callback);
  };
}

export function getPrepChecksSnapshot() {
  return localStorage.getItem(PREP_CHECKS_KEY) ?? "";
}

export function getServerPrepChecksSnapshot() {
  return "";
}
