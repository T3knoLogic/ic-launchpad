import { H1, H2, P, Ul, Code, InlineCode, Table, Th, Td } from "../../components/DocBlock";

export default function DocRegistry() {
  return (
    <>
      <H1>Registry</H1>
      <P>The Launchpad Registry canister stores a list of your canisters with optional names and network labels. It’s used by the web UI and by the MCP so you can refer to canisters by name.</P>

      <H2>What it does</H2>
      <Ul>
        <li><strong>Register</strong> — Associate a canister ID with a name and network (e.g. <InlineCode>"my-app"</InlineCode>, <InlineCode>"ic"</InlineCode>).</li>
        <li><strong>List</strong> — <InlineCode>list_mine()</InlineCode> returns all canisters registered by the caller.</li>
        <li><strong>Update / unregister</strong> — Change the name or remove a registration (owner only).</li>
      </Ul>

      <H2>Web UI</H2>
      <P>On the <strong>Deploy</strong> page, when you create a canister you can optionally give it a name; it will be registered automatically. The <strong>Canisters</strong> page lists all registered canisters and lets you top them up or open their URL.</P>

      <H2>Reference</H2>
      <table className="w-full text-sm text-left border border-ic-border rounded-lg overflow-hidden">
        <thead>
          <tr>
            <Th>Method</Th>
            <Th>Description</Th>
          </tr>
        </thead>
        <tbody>
          <tr><Td><InlineCode>register(canister_id, name, network)</InlineCode></Td><Td>Register a canister; caller is owner.</Td></tr>
          <tr><Td><InlineCode>list_mine</InlineCode></Td><Td>Returns all canisters registered by the caller (query).</Td></tr>
          <tr><Td><InlineCode>get(canister_id)</InlineCode></Td><Td>Returns optional CanisterInfo for that ID (query).</Td></tr>
          <tr><Td><InlineCode>update_name(canister_id, name)</InlineCode></Td><Td>Change the name (owner only).</Td></tr>
          <tr><Td><InlineCode>unregister(canister_id)</InlineCode></Td><Td>Remove registration (owner only).</Td></tr>
        </tbody>
      </table>
    </>
  );
}
