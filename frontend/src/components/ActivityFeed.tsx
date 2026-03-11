import { useState, useEffect } from "react";
import { getActivity, clearActivity, type ActivityItem } from "../lib/activityStore";

const TYPE_LABELS: Record<ActivityItem["type"], string> = {
  topup: "Top-up",
  create: "Create",
  transfer: "Transfer",
  deploy: "Deploy",
  call: "Call",
  other: "Other",
};

export default function ActivityFeed({ maxItems = 10 }: { maxItems?: number }) {
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    setItems(getActivity().slice(0, maxItems));
  }, [maxItems]);

  const refresh = () => setItems(getActivity().slice(0, maxItems));
  const clear = () => {
    clearActivity();
    setItems([]);
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Recent activity</h3>
        <div className="flex gap-2">
          <button type="button" onClick={refresh} className="text-xs text-gray-500 hover:text-ic-green">Refresh</button>
          {items.length > 0 && (
            <button type="button" onClick={clear} className="text-xs text-gray-500 hover:text-red-400">Clear</button>
          )}
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">No recent activity</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-0.5 py-2 border-b border-ic-border last:border-0">
              <span className="text-white text-sm">{TYPE_LABELS[item.type]}: {item.title}</span>
              {item.detail && <span className="text-gray-500 text-xs">{item.detail}</span>}
              <span className="text-gray-600 text-xs">{new Date(item.ts).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
