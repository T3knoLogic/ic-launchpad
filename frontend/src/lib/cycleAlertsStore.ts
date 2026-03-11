/**
 * Cycle alerts & auto top-up preferences (localStorage).
 */
const KEY = "launchpad-cycle-alerts";

export type CycleAlertsSettings = {
  thresholdG: number;
  autoTopUpEnabled: boolean;
  autoTopUpAmountT: number;
};

const DEFAULT: CycleAlertsSettings = {
  thresholdG: 500,
  autoTopUpEnabled: false,
  autoTopUpAmountT: 1,
};

export function loadCycleAlerts(): CycleAlertsSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw);
    return {
      thresholdG: typeof parsed.thresholdG === "number" ? parsed.thresholdG : DEFAULT.thresholdG,
      autoTopUpEnabled: Boolean(parsed.autoTopUpEnabled),
      autoTopUpAmountT: typeof parsed.autoTopUpAmountT === "number" ? parsed.autoTopUpAmountT : DEFAULT.autoTopUpAmountT,
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveCycleAlerts(s: Partial<CycleAlertsSettings>) {
  const current = loadCycleAlerts();
  const next = { ...current, ...s };
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function getLowCyclesThreshold(): bigint {
  const { thresholdG } = loadCycleAlerts();
  return BigInt(thresholdG) * BigInt(1e9); // G = 1e9 cycles
}
