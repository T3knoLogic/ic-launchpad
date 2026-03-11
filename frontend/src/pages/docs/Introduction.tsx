import { H1, H2, P, Ul, Code, InlineCode, A } from "../../components/DocBlock";

export default function DocIntroduction() {
  return (
    <>
      <H1>Introduction</H1>
      <P>
        <strong>ICP Launchpad</strong> is your single place to deploy apps and agents to the Internet Computer. It gives you a cycles wallet, a canister registry, a web UI, and a Cursor MCP server so you can manage canisters and deploy from chat.
      </P>
      <H2>What’s included</H2>
      <Ul>
        <li><strong>Wallet canister</strong> — Holds cycles; creates canisters and tops them up.</li>
        <li><strong>Registry canister</strong> — Registers and lists your canisters by name.</li>
        <li><strong>Web app</strong> — Log in with Internet Identity; view balance, canisters, and deploy.</li>
        <li><strong>Cursor MCP</strong> — Create canisters, top up, and run <InlineCode>dfx deploy</InlineCode> from Cursor.</li>
      </Ul>
      <H2>Who it’s for</H2>
      <P>
        Anyone who wants to ship to the IC without juggling cycles and canister IDs by hand. You can use the UI for balance and top-ups, or drive everything from Cursor by saying things like “create a canister” or “deploy this project to IC.”
      </P>
      <H2>Quick links</H2>
      <Ul>
        <li><a href="/docs/getting-started" className="text-ic-green hover:underline">Getting started</a> — Deploy the Launchpad and run the frontend.</li>
        <li><a href="/docs/cursor-mcp" className="text-ic-green hover:underline">Cursor & MCP</a> — Set up the MCP server and use it from Cursor.</li>
        <li><a href="/docs/reference" className="text-ic-green hover:underline">Reference</a> — Canister methods and environment variables.</li>
      </Ul>
    </>
  );
}
