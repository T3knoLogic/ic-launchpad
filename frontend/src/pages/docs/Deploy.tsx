import { H1, H2, H3, P, Ul, Code, InlineCode } from "../../components/DocBlock";

export default function DocDeploy() {
  return (
    <>
      <H1>Deploy</H1>
      <P>You can create empty canisters from the web app or from Cursor (via MCP). Installing code is done with <InlineCode>dfx deploy</InlineCode> (from the CLI or via the <InlineCode>launchpad_deploy</InlineCode> MCP tool).</P>

      <H2>From the web app</H2>
      <Ul>
        <li>Open <strong>Deploy</strong>.</li>
        <li>Enter the number of cycles to attach (e.g. <InlineCode>500_000_000_000</InlineCode> for 0.5T).</li>
        <li>Optionally enter a name and choose network (for the registry).</li>
        <li>Click <strong>Create canister</strong>. The new canister ID is shown; if you set a name, it’s registered.</li>
      </Ul>
      <P>After creation, install your code from the project directory:</P>
      <Code>{`dfx deploy <canister_name> --network ic`}</Code>
      <P>Or use the MCP tool <InlineCode>launchpad_deploy</InlineCode> from Cursor with the project path and network.</P>

      <H2>From Cursor (MCP)</H2>
      <P>Use the <InlineCode>launchpad_create_canister</InlineCode> tool with a cycles amount to create an empty canister. Then use <InlineCode>launchpad_deploy</InlineCode> with your project path to run <InlineCode>dfx deploy</InlineCode>. You can also <InlineCode>launchpad_register_canister</InlineCode> to add it to the registry with a name.</P>

      <H2>Typical workflow</H2>
      <Ol>
        <li>Ensure the Launchpad Wallet has enough cycles (check balance in the app or with <InlineCode>launchpad_balance</InlineCode>).</li>
        <li>Create a canister (UI or <InlineCode>launchpad_create_canister</InlineCode>).</li>
        <li>From your project: <InlineCode>dfx deploy --network ic</InlineCode> (or <InlineCode>launchpad_deploy</InlineCode> with project_path).</li>
        <li>Optionally register the canister with a name for easier management.</li>
      </Ol>
    </>
  );
}

function Ol({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal list-inside text-gray-300 space-y-1 mb-4">{children}</ol>;
}
