# ICP Launchpad MCP Server

Use from **Cursor** to manage canisters and deploy to the Internet Computer.

## Setup

1. From the launchpad project root, deploy canisters and note their IDs:
   ```bash
   dfx deploy
   # Copy CANISTER_ID_LAUNCHPAD_WALLET and CANISTER_ID_LAUNCHPAD_REGISTRY from .env
   ```

2. Build the MCP server:
   ```bash
   cd mcp && npm install && npm run build
   ```

3. Add to Cursor MCP config (e.g. **Cursor Settings → MCP → Edit config**):

   ```json
   {
     "mcpServers": {
       "ic-launchpad": {
         "command": "node",
         "args": ["R:/REPOSITORIES/ic-launchpad/mcp/dist/index.js"],
         "env": {
           "LAUNCHPAD_WALLET_CANISTER_ID": "<paste wallet canister id>",
           "LAUNCHPAD_REGISTRY_CANISTER_ID": "<paste registry canister id>",
           "DFX_NETWORK": "ic"
         }
       }
     }
   }
   ```

   Use the **absolute path** to `mcp/dist/index.js` on your machine.

4. Restart Cursor so it picks up the new MCP server.

## Tools

| Tool | Description |
|------|-------------|
| `launchpad_balance` | Get Launchpad Wallet cycles balance |
| `launchpad_create_canister` | Create empty canister with cycles (returns canister ID) |
| `launchpad_top_up` | Top up a canister with cycles |
| `launchpad_list_canisters` | List your registered canisters |
| `launchpad_register_canister` | Register a canister (id, name, network) |
| `launchpad_deploy` | Run `dfx deploy` (project_path, network, optional canister_name) |

All canister calls use your **dfx identity** (the identity used when you run `dfx` in the same environment). Ensure you have enough cycles in the Launchpad Wallet for create/top-up.
