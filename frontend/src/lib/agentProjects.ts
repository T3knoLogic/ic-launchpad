/**
 * ElizaOS / agent projects that can be deployed via Docker.
 * Matches scripts/deploy-eliza-agent.sh project IDs.
 */
export type AgentProject = {
  id: string;
  name: string;
  description: string;
  path: string;
  port: number;
  containerName: string;
  deployCmd: string;
};

export const AGENT_PROJECTS: AgentProject[] = [
  {
    id: "eliza-odin-trader",
    name: "Eliza Odin Trader",
    description: "ElizaOS agent for Odin.fun trading on ICP. Discord bot, plugin-odin.",
    path: "eliza-odin-trader/root",
    port: 3000,
    containerName: "eliza-odin-trader",
    deployCmd: "bash scripts/deploy-eliza-agent.sh eliza-odin-trader",
  },
  {
    id: "milady",
    name: "Milady AI",
    description: "Personal AI assistant with 3D avatar. ElizaOS, ICP plugin. Run gateway for cloud mode.",
    path: "milady",
    port: 18792,
    containerName: "milady",
    deployCmd: "bash scripts/deploy-milady.sh",
  },
  {
    id: "income-stack",
    name: "Income Automation Stack",
    description: "Postgres, night-shift agent, batch image gen, income agent, social scheduler.",
    path: "docker-income-automation",
    port: 5432,
    containerName: "income-stack",
    deployCmd: "bash scripts/deploy-docker-stack.sh income",
  },
];
