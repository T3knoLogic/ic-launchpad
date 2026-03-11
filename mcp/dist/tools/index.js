import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
const WALLET_ID = process.env.LAUNCHPAD_WALLET_CANISTER_ID || process.env.CANISTER_ID_LAUNCHPAD_WALLET;
const REGISTRY_ID = process.env.LAUNCHPAD_REGISTRY_CANISTER_ID || process.env.CANISTER_ID_LAUNCHPAD_REGISTRY;
const NETWORK = process.env.DFX_NETWORK || "ic";
async function dfxCall(canister, method, args, network = NETWORK) {
    const net = network ? `--network ${network}` : "";
    const { stdout, stderr } = await execAsync(`dfx canister call ${canister} ${method} ${args} ${net}`.trim(), {
        timeout: 60000,
        maxBuffer: 2 * 1024 * 1024,
    });
    if (stderr && !stdout)
        throw new Error(stderr);
    return stdout.trim();
}
const balanceSchema = z.object({ network: z.string().optional() });
const createCanisterSchema = z.object({
    cycles: z.string().describe("e.g. 500_000_000_000 for 0.5T"),
    network: z.string().optional(),
});
const topUpSchema = z.object({
    canister_id: z.string().describe("Principal of the canister"),
    cycles: z.string().describe("e.g. 1000000000000"),
    network: z.string().optional(),
});
const listCanistersSchema = z.object({ network: z.string().optional() });
const registerCanisterSchema = z.object({
    canister_id: z.string(),
    name: z.string(),
    network: z.string().optional(),
});
const deploySchema = z.object({
    project_path: z.string().optional(),
    canister_name: z.string().optional().describe("Deploy only this canister"),
    network: z.string().optional(),
    mode: z.enum(["install", "reinstall", "upgrade"]).optional(),
});
export const tools = [
    {
        name: "launchpad_balance",
        description: "Get cycles balance of the Launchpad Wallet canister.",
        schema: balanceSchema,
        handler: async (args) => {
            if (!WALLET_ID)
                return "Set LAUNCHPAD_WALLET_CANISTER_ID (or run from dfx project with .env).";
            const out = await dfxCall(WALLET_ID, "get_balance", "", args.network);
            return `Balance: ${out} cycles`;
        },
    },
    {
        name: "launchpad_create_canister",
        description: "Create a new empty canister with the given cycles. Returns canister ID.",
        schema: createCanisterSchema,
        handler: async (args) => {
            if (!WALLET_ID)
                return "Set LAUNCHPAD_WALLET_CANISTER_ID.";
            const cycles = args.cycles || "500_000_000_000";
            const out = await dfxCall(WALLET_ID, "create_canister_with_cycles", `'(${cycles}, null)'`, args.network);
            return out;
        },
    },
    {
        name: "launchpad_top_up",
        description: "Top up a canister with cycles from the Launchpad Wallet.",
        schema: topUpSchema,
        handler: async (args) => {
            if (!WALLET_ID)
                return "Set LAUNCHPAD_WALLET_CANISTER_ID.";
            const cid = args.canister_id;
            const cycles = args.cycles || "1000000000000";
            const out = await dfxCall(WALLET_ID, "top_up", `'(principal "${cid}", ${cycles})'`, args.network);
            return out || "Topped up.";
        },
    },
    {
        name: "launchpad_list_canisters",
        description: "List canisters registered in the Launchpad Registry for the current identity.",
        schema: listCanistersSchema,
        handler: async (args) => {
            if (!REGISTRY_ID)
                return "Set LAUNCHPAD_REGISTRY_CANISTER_ID.";
            const out = await dfxCall(REGISTRY_ID, "list_mine", "", args.network);
            return out;
        },
    },
    {
        name: "launchpad_register_canister",
        description: "Register a canister in the Launchpad Registry (id, name, network).",
        schema: registerCanisterSchema,
        handler: async (args) => {
            if (!REGISTRY_ID)
                return "Set LAUNCHPAD_REGISTRY_CANISTER_ID.";
            const cid = args.canister_id;
            const name = args.name || "unnamed";
            const net = args.network || NETWORK;
            const out = await dfxCall(REGISTRY_ID, "register", `'(principal "${cid}", "${name}", "${net}")'`, net);
            return out || "Registered.";
        },
    },
    {
        name: "launchpad_deploy",
        description: "Run dfx deploy for a project (build and deploy canisters). Use from project directory or pass project_path.",
        schema: deploySchema,
        handler: async (args) => {
            const cwd = args.project_path || process.cwd();
            const canister = args.canister_name;
            const network = args.network || "ic";
            const mode = args.mode || "upgrade";
            const netFlag = network ? `--network ${network}` : "";
            const modeFlag = mode && mode !== "install" ? `--mode ${mode}` : "";
            const target = canister ? canister : "";
            const cmd = `dfx deploy ${target} ${modeFlag} ${netFlag}`.trim();
            const { stdout, stderr } = await execAsync(cmd, { cwd, timeout: 300000, maxBuffer: 10 * 1024 * 1024 });
            return (stdout + (stderr ? "\n" + stderr : "")).trim();
        },
    },
];
