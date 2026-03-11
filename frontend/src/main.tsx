import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import { NotificationsProvider } from "./lib/notificationsStore";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <NotificationsProvider>
          <App />
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
