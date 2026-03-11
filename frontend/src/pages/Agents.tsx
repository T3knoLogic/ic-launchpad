import AgentDeployCards from "../components/AgentDeployCards";
import { AGENT_PROJECTS } from "../lib/agentProjects";

export default function Agents() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white mb-8">Agents</h1>
      <p className="text-gray-400 mb-6 max-w-2xl">
        Deploy ElizaOS agents via Docker. Agents run off-IC and connect to ICP canisters (Odin, DSCVR, etc.).
      </p>

      <AgentDeployCards />

      {AGENT_PROJECTS.length > 0 && (
        <div className="card mt-8 max-w-2xl">
          <h2 className="text-lg font-semibold text-white mb-3">Registered projects</h2>
          <ul className="space-y-2 text-sm">
            {AGENT_PROJECTS.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="font-mono text-ic-green">{p.id}</span>
                <span className="text-gray-500">—</span>
                <span className="text-gray-400">{p.path}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
