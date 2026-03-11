/**
 * In-memory notifications for HUD. Low-balance alerts, call results, etc.
 */
import React, { createContext, useContext, useCallback, useState } from "react";

export type Notification = {
  id: string;
  ts: number;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message?: string;
};

type NotificationsContextType = {
  notifications: Notification[];
  add: (n: Omit<Notification, "id" | "ts">) => void;
  dismiss: (id: string) => void;
  clear: () => void;
};

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const add = useCallback((n: Omit<Notification, "id" | "ts">) => {
    setNotifications((s) =>
      [
        ...s,
        { ...n, id: crypto.randomUUID(), ts: Date.now() },
      ].slice(-20)
    );
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((s) => s.filter((x) => x.id !== id));
  }, []);

  const clear = useCallback(() => setNotifications([]), []);

  return (
    <NotificationsContext.Provider value={{ notifications, add, dismiss, clear }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
