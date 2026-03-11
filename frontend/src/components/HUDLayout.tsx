import { Outlet } from "react-router-dom";
import HUDSidebar from "./HUDSidebar";

export default function HUDLayout() {
  return (
    <div className="hud-container">
      <HUDSidebar />
      <main className="hud-main">
        <Outlet />
      </main>
    </div>
  );
}
