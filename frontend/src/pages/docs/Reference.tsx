import { H1, H2, H3, P, Ul, Code, InlineCode, Table, Th, Td } from "../../components/DocBlock";

export default function DocReference() {
  return (
    <>
      <H1>Reference</H1>

      <H2>Canisters</H2>
      <table className="w-full text-sm text-left border border-ic-border rounded-lg overflow-hidden mb-8">
        <thead>
          <tr>
            <Th>Canister</Th>
            <Th>Role</Th>
          </tr>
        </thead>
        <tbody>
          <tr><Td><InlineCode>launchpad_wallet</InlineCode></Td><Td>Holds cycles; <InlineCode>create_canister_with_cycles</InlineCode>, <InlineCode>top_up</InlineCode>, <InlineCode>wallet_receive</InlineCode>.</Td></tr>
          <tr><Td><InlineCode>launchpad_registry</InlineCode></Td><Td>Register and list canisters; <InlineCode>list_mine</InlineCode>, <InlineCode>register</InlineCode>.</Td></tr>
          <tr><Td><InlineCode>launchpad_frontend</InlineCode></Td><Td>Static assets (this web app).</Td></tr>
        </tbody>
      </table>

      <H2>Environment variables</H2>
      <H3>Frontend (Vite)</H3>
      <Ul>
        <li><InlineCode>VITE_LAUNCHPAD_WALLET_CANISTER_ID</InlineCode> — Wallet canister ID.</li>
        <li><InlineCode>VITE_LAUNCHPAD_REGISTRY_CANISTER_ID</InlineCode> — Registry canister ID.</li>
      </Ul>
      <P>Set these in <InlineCode>frontend/.env</InlineCode>. After <InlineCode>dfx deploy</InlineCode>, copy from the project <InlineCode>.env</InlineCode> (keys <InlineCode>CANISTER_ID_LAUNCHPAD_WALLET</InlineCode> and <InlineCode>CANISTER_ID_LAUNCHPAD_REGISTRY</InlineCode>).</P>
      <H3>MCP server</H3>
      <Ul>
        <li><InlineCode>LAUNCHPAD_WALLET_CANISTER_ID</InlineCode> — Wallet canister ID (or <InlineCode>CANISTER_ID_LAUNCHPAD_WALLET</InlineCode>).</li>
        <li><InlineCode>LAUNCHPAD_REGISTRY_CANISTER_ID</InlineCode> — Registry canister ID (or <InlineCode>CANISTER_ID_LAUNCHPAD_REGISTRY</InlineCode>).</li>
        <li><InlineCode>DFX_NETWORK</InlineCode> — Optional; default <InlineCode>ic</InlineCode>.</li>
      </Ul>

      <H2>Convert ICP to cycles</H2>
      <Code>{`dfx cycles convert --amount <ICP> --network ic`}</Code>
      <P>Then send cycles to the Launchpad Wallet’s <InlineCode>wallet_receive</InlineCode> (e.g. from your dfx wallet). Official guide: <a href="https://internetcomputer.org/docs/current/developer-docs/developer-tools/dfx/dfx-ledger/#dfx-cycles-convert" className="text-ic-green hover:underline">Cycles conversion</a>.</P>
    </>
  );
}
