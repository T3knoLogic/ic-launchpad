import { useState, useEffect, useCallback } from "react";
import type { HttpAgent } from "@dfinity/agent";
import { getCanisterStatus, type CanisterStatusResult } from "./managementCanister";

export type CanisterWithStatus = {
  id: string;
  name: string;
  network: string;
  cycles: bigint | null;
  controllers: string[];
  status: CanisterStatusResult["status"] | null;
  memory_size: bigint | null;
};

import { getLowCyclesThreshold } from "./cycleAlertsStore";

export function useCanisterStatuses(
  agent: HttpAgent | null,
  canisters: Array<{ id: string; name: string; network: string }>
) {
  const [statuses, setStatuses] = useState<Record<string, CanisterWithStatus>>({});
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!agent || canisters.length === 0) return;
    setLoading(true);
    const results: Record<string, CanisterWithStatus> = {};
    await Promise.all(
      canisters.map(async (c) => {
        const s = await getCanisterStatus(agent, c.id);
        results[c.id] = {
          id: c.id,
          name: c.name,
          network: c.network,
          cycles: s?.cycles ?? null,
          controllers: s?.controllers.map((p) => p.toText()) ?? [],
          status: s?.status ?? null,
          memory_size: s?.memory_size ?? null,
        };
      })
    );
    setStatuses(results);
    setLoading(false);
  }, [agent, canisters]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const threshold = getLowCyclesThreshold();
  const lowBalanceIds = canisters.filter((c) => {
    const s = statuses[c.id];
    return s?.cycles != null && s.cycles < threshold;
  });

  return {
    statuses: Object.values(statuses),
    statusMap: statuses,
    loading,
    refresh: fetchAll,
    lowBalanceIds: lowBalanceIds.map((c) => c.id),
    lowCyclesThreshold: threshold,
  };
}
