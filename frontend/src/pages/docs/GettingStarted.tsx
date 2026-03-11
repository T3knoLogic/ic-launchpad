import { H1, H2, H3, P, Ul, Code, InlineCode, A } from "../../components/DocBlock";

export default function DocGettingStarted() {
  return (
    <>
      <H1>Getting started</H1>
      <P>Run the Launchpad locally (WSL2 / Ubuntu) and open the web app.</P>

      <H2>1. Deploy the Launchpad</H2>
      <Code>{`cd ic-launchpad
dfx start --background --clean
dfx deploy`}</Code>
      <P>Copy the canister IDs from the output (or from the project <InlineCode>.env</InlineCode>) into <InlineCode>frontend/.env</InlineCode>:</P>
      <Code>{`# frontend/.env
VITE_LAUNCHPAD_WALLET_CANISTER_ID=<launchpad_wallet id>
VITE_LAUNCHPAD_REGISTRY_CANISTER_ID=<launchpad_registry id>`}</Code>

      <H2>2. Run the frontend</H2>
      <Code>{`cd frontend
npm install
npm run build
npm run dev`}</Code>
      <P>Open the app in the browser and log in with Internet Identity. For local development, use the II canister URL that dfx prints when you start the replica.</P>

      <H2>3. Get cycles</H2>
      <H3>Local</H3>
      <P>The replica gives free cycles. You can check <InlineCode>dfx wallet balance</InlineCode> and send cycles to the Launchpad Wallet canister (e.g. via wallet_send to <InlineCode>wallet_receive</InlineCode>).</P>
      <H3>Mainnet</H3>
      <P>Convert ICP to cycles with <InlineCode>dfx cycles convert --amount &lt;ICP&gt; --network ic</InlineCode>. Then send cycles to the Launchpad Wallet’s <InlineCode>wallet_receive</InlineCode> (from your dfx wallet or another canister).</P>
      <P>See <A href="https://internetcomputer.org/docs/current/developer-docs/developer-tools/dfx/dfx-ledger/#dfx-cycles-convert">Cycles conversion</A> in the IC docs.</P>

      <H2>4. Use from Cursor (optional)</H2>
      <P>Build the MCP server and add it to Cursor’s MCP config. Details in <a href="/docs/cursor-mcp" className="text-ic-green hover:underline">Cursor & MCP</a>.</P>
    </>
  );
}
