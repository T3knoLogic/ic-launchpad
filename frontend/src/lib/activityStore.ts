/**
 * Client-side activity feed (localStorage). Tracks recent actions for the HUD.
 */
const ACTIVITY_KEY = "launchpad-activity";
const MAX_ITEMS = 50;

export type ActivityItem = {
  id: string;
  ts: number;
  type: "topup" | "create" | "transfer" | "deploy" | "call" | "other";
  title: string;
  detail?: string;
};

function load(): ActivityItem[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: ActivityItem[]) {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(items.slice(-MAX_ITEMS)));
}

export function addActivity(item: Omit<ActivityItem, "id" | "ts">) {
  const items = load();
  items.push({
    ...item,
    id: crypto.randomUUID(),
    ts: Date.now(),
  });
  save(items);
  return items;
}

export function getActivity(): ActivityItem[] {
  return load().sort((a, b) => b.ts - a.ts);
}

export function clearActivity() {
  localStorage.removeItem(ACTIVITY_KEY);
}
