import { H1, H2, H3, P, Ul, Code, InlineCode, Table, Th, Td } from "../../components/DocBlock";

export default function DocCursorMCP() {
  return (
    <>
      <H1>Cursor & MCP</H1>
      <P>The Launchpad MCP server lets Cursor manage canisters and run deploys for you. You talk in natural language; the assistant calls the Launchpad tools (balance, create canister, top up, list, deploy).</P>

      <H2>Setup</H2>
      <H3>1. Deploy the Launchpad and get canister IDs</H3>
      <Code>{`cd ic-launchpad
dfx deploy
# Copy CANISTER_ID_LAUNCHPAD_WALLET and CANISTER_ID_LAUNCHPAD_REGISTRY from .env`}</Code>
      <H3>2. Build the MCP server</H3>
      <Code>{`cd mcp
npm install
npm run build`}</Code>
      <H3>3. Add to Cursor MCP config</H3>
      <P>In Cursor: <strong>Settings → MCP → Edit config</strong>. Add:</P>
      <Code>{`{
  "mcpServers": {
    "ic-launchpad": {
      "command": "node",
      "args": ["/absolute/path/to/ic-launchpad/mcp/dist/index.js"],
      "env": {
        "LAUNCHPAD_WALLET_CANISTER_ID": "<paste wallet canister id>",
        "LAUNCHPAD_REGISTRY_CANISTER_ID": "<paste registry canister id>",
        "DFX_NETWORK": "ic"
      }
    }
  }
}`}</Code>
      <P>Use the <strong>absolute path</strong> to <InlineCode>mcp/dist/index.js</InlineCode> on your machine.</P>
      <H3>4. Restart Cursor</H3>
      <P>Restart Cursor so it loads the new MCP server.</P>

      <H2>Tools</H2>
      <table className="w-full text-sm text-left border border-ic-border rounded-lg overflow-hidden">
        <thead>
          <tr>
            <Th>Tool</Th>
            <Th>Description</Th>
          </tr>
        </thead>
        <tbody>
          <tr><Td><InlineCode>launchpad_balance</InlineCode></Td><Td>Get Launchpad Wallet cycles balance.</Td></tr>
          <tr><Td><InlineCode>launchpad_create_canister</InlineCode></Td><Td>Create empty canister with given cycles (returns canister ID).</Td></tr>
          <tr><Td><InlineCode>launchpad_top_up</InlineCode></Td><Td>Top up a canister (canister_id, cycles).</Td></tr>
          <tr><Td><InlineCode>launchpad_list_canisters</InlineCode></Td><Td>List your registered canisters.</Td></tr>
          <tr><Td><InlineCode>launchpad_register_canister</InlineCode></Td><Td>Register a canister (id, name, network).</Td></tr>
          <tr><Td><InlineCode>launchpad_deploy</InlineCode></Td><Td>Run <InlineCode>dfx deploy</InlineCode> (optional project_path, network, canister_name, mode).</Td></tr>
        </tbody>
      </table>

      <H2>Example prompts</H2>
      <Ul>
        <li>“What’s my launchpad cycles balance?”</li>
        <li>“Create a new canister with 0.5T cycles.”</li>
        <li>“Top up canister rrkah-fqaaa-aaaaa-aaaaq-cai with 1T cycles.”</li>
        <li>“List my canisters.”</li>
        <li>“Deploy this project to IC.”</li>
      </Ul>
      <P>All canister calls use your <strong>dfx identity</strong>. Make sure the Launchpad Wallet has enough cycles for create and top-up.</P>
    </>
  );
}
