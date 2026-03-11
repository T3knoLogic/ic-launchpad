import { useEffect, useCallback } from "react";

export type Shortcut = {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  handler: () => void;
};

export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled = true) {
  const run = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      for (const s of shortcuts) {
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase();
        const modifierMatch = s.ctrl || s.meta
          ? e.ctrlKey || e.metaKey
          : !e.ctrlKey && !e.metaKey;
        const shiftMatch = s.shift ? e.shiftKey : true;
        if (keyMatch && modifierMatch && shiftMatch) {
          e.preventDefault();
          s.handler();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", run);
    return () => window.removeEventListener("keydown", run);
  }, [run]);
}
