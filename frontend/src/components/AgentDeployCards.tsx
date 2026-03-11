import { useState, useEffect, useCallback } from "react";
import { useNotifications } from "../lib/notificationsStore";
import { AGENT_PROJECTS } from "../lib/agentProjects";

const LOCAL_AGENT_URL = "http://127.0.0.1:3847";

export default function AgentDeployCards() {
  const { add: addNotification } = useNotifications();
  const [localAgentAvailable, setLocalAgentAvailable] = useState<boolean | null>(null);
  const [deploying, setDeploying] = useState<string | null>(null);
  const [stopping, setStopping] = useState<string | null>(null);

  const checkLocalAgent = useCallback(async () => {
    try {
      const r = await fetch(`${LOCAL_AGENT_URL}/health`, { method: "GET" });
      setLocalAgentAvailable(r.ok);
    } catch {
      setLocalAgentAvailable(false);
    }
  }, []);

  useEffect(() => {
    checkLocalAgent();
  }, [checkLocalAgent]);

  const deploy = async (project: (typeof AGENT_PROJECTS)[0]) => {
    if (localAgentAvailable) {
      setDeploying(project.id);
      try {
        const r = await fetch(`${LOCAL_AGENT_URL}/deploy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project: project.id }),
        });
        const data = await r.json();
        if (data.ok) {
          addNotification({ type: "success", title: "Deployed", message: `${project.name} started` });
        } else {
          addNotification({ type: "error", title: "Deploy failed", message: data.error });
        }
      } catch (e) {
        addNotification({ type: "error", title: "Deploy failed", message: String(e) });
      } finally {
        setDeploying(null);
      }
      return;
    }
    const cmd = `${project.deployCmd}`;
    try {
      await navigator.clipboard.writeText(cmd);
      addNotification({ type: "success", title: "Command copied", message: "Paste in WSL from REPOSITORIES root" });
    } catch {
      addNotification({ type: "info", title: "Run in WSL", message: project.deployCmd });
    }
  };

  const stop = async (project: (typeof AGENT_PROJECTS)[0]) => {
    if (!localAgentAvailable) return;
    setStopping(project.id);
    try {
      const r = await fetch(`${LOCAL_AGENT_URL}/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: project.id }),
      });
      const data = await r.json();
      if (data.ok) {
        addNotification({ type: "success", title: "Stopped", message: `${project.name} stopped` });
      } else {
        addNotification({ type: "error", title: "Stop failed", message: data.error });
      }
    } catch (e) {
      addNotification({ type: "error", title: "Stop failed", message: String(e) });
    } finally {
      setStopping(null);
    }
  };

  return (
    <>
      {localAgentAvailable === false && (
        <div className="card border-amber-500/50 bg-amber-500/10 mb-6 max-w-2xl">
          <p className="text-amber-400 font-medium mb-1">Local deploy agent not running</p>
          <p className="text-gray-400 text-sm mb-2">
            For one-click deploy, run: <code className="text-ic-green">node scripts/launchpad-local-agent.js</code> from REPOSITORIES root.
          </p>
          <p className="text-gray-500 text-xs">Otherwise, the Deploy button will copy the command for WSL.</p>
        </div>
      )}
      {localAgentAvailable === true && (
        <div className="card border-ic-green/50 bg-ic-green/5 mb-6 max-w-2xl">
          <p className="text-ic-green font-medium">Local deploy agent connected</p>
          <p className="text-gray-400 text-sm">Deploy and Stop run Docker on your machine.</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {AGENT_PROJECTS.map((p) => (
          <div key={p.id} className="card group hover:border-ic-green/30 transition">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-white">{p.name}</h3>
              <span className="text-xs text-gray-500 font-mono">{p.containerName}</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">{p.description}</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => deploy(p)}
                disabled={deploying !== null}
                className="btn-primary text-sm"
              >
                {deploying === p.id ? "Deploying…" : localAgentAvailable ? "Deploy" : "Copy deploy command"}
              </button>
              {localAgentAvailable && (
                <button
                  onClick={() => stop(p)}
                  disabled={stopping !== null}
                  className="btn-secondary text-sm"
                >
                  {stopping === p.id ? "Stopping…" : "Stop"}
                </button>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-ic-border">
              <p className="text-gray-500 text-xs font-mono break-all">{p.deployCmd}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
